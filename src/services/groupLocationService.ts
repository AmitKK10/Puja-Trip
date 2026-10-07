import {
  LiveLocationRecord,
  GroupMemberLocation,
  LocationSharingDuration,
  LocationSharingSettings,
  SuggestedMeetingPoint,
  Pandal,
  TripMember,
  UserProfile,
  CityId,
} from '../types';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { getCurrentUserProfile, getTripGroup, saveTrip } from './friendGroupService';
import {
  calculateHaversineDistance,
  calculateDistanceAndDirection,
  latLngToMapCoordinates,
  formatDistance,
  formatTimeAgo,
} from '../utils/geoUtils';
import { ensureValidUuid } from '../utils/userProfileHelper';

// Local storage keys
const LOCAL_STORAGE_LOCATION_SETTINGS_PREFIX = 'pujatrip_loc_settings_v1_';
const LOCAL_STORAGE_LIVE_LOCATIONS_PREFIX = 'pujatrip_live_locations_v1_';

// Realtime sync channels
const groupBroadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('pujatrip_group_sync_channel')
    : null;

// Module-level state for active Geolocation Watcher & Battery-Saving Engine
let activeWatchId: number | null = null;
let activeTripId: string | null = null;
let activeCityId: CityId = 'kolkata';
let lastBroadcastCoords: { lat: number; lng: number; time: number } | null = null;
let expirationCheckTimer: any = null;
let stationaryCheckTimer: any = null;
let lowPowerPollTimer: any = null;

// Stationary tracking anchor
let stationaryAnchor: { lat: number; lng: number; startTime: number } | null = null;
let isGpsSleepingDueToStationary = false;

// Throttling thresholds
const STANDARD_MIN_DISTANCE_DELTA_METERS = 10;
const STANDARD_MIN_TIME_DELTA_MS = 15000; // 15 seconds

const BATTERY_SAVER_MIN_DISTANCE_DELTA_METERS = 20;
const BATTERY_SAVER_MIN_TIME_DELTA_MS = 35000; // 35 seconds (reduced frequency)

const STATIONARY_RADIUS_THRESHOLD_METERS = 15; // Within 15m considered stationary (queue/bhog/rest)
const STATIONARY_DURATION_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

const LOW_POWER_POLL_INTERVAL_MS = 60000; // 60s low-power check when GPS is asleep

// Callback references for dynamic wake-up / restart
let currentOnLocationUpdate: ((loc: LiveLocationRecord) => void) | undefined;
let currentOnError: ((error: { code: string; message: string }) => void) | undefined;

// ----------------------------------------------------------------------------
// 1. LOCATION SHARING SETTINGS MANAGEMENT
// ----------------------------------------------------------------------------

export const getLocationSharingSettings = (tripId: string): LocationSharingSettings => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_LOCATION_SETTINGS_PREFIX}${tripId}`);
    if (raw) {
      const parsed: LocationSharingSettings = JSON.parse(raw);
      // Check if expired
      if (parsed.isSharing && parsed.expiresAt) {
        const isExpired = new Date(parsed.expiresAt).getTime() <= Date.now();
        if (isExpired) {
          parsed.isSharing = false;
          saveLocationSharingSettings(tripId, parsed);
        }
      }
      // Ensure defaults for battery saver
      if (parsed.batterySaverMode === undefined) {
        parsed.batterySaverMode = true; // Default to battery saver ON for optimal mobile longevity
      }
      if (!parsed.gpsState) {
        parsed.gpsState = parsed.isSharing ? 'active_watching' : 'disabled';
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Error reading location settings:', err);
  }

  // Default: Location sharing is OFF by default for privacy, batterySaverMode enabled
  return {
    isSharing: false,
    duration: '3h',
    startedAt: null,
    expiresAt: null,
    lastUpdated: null,
    batterySaverMode: true,
    isStationary: false,
    stationarySince: null,
    stationaryDurationMinutes: 0,
    gpsState: 'disabled',
    updateFrequencySeconds: 35,
    batterySavingsPercent: 45,
  };
};

export const saveLocationSharingSettings = (
  tripId: string,
  settings: LocationSharingSettings
): void => {
  try {
    localStorage.setItem(
      `${LOCAL_STORAGE_LOCATION_SETTINGS_PREFIX}${tripId}`,
      JSON.stringify(settings)
    );
  } catch (err) {
    console.warn('Error saving location settings:', err);
  }
};

/**
 * Toggles Battery Saver Mode ON or OFF.
 */
export const toggleBatterySaverMode = (
  tripId: string,
  enabled: boolean
): LocationSharingSettings => {
  const current = getLocationSharingSettings(tripId);
  current.batterySaverMode = enabled;
  current.updateFrequencySeconds = enabled ? (current.isStationary ? 60 : 35) : 15;
  current.batterySavingsPercent = enabled ? (current.isStationary ? 75 : 45) : 0;
  saveLocationSharingSettings(tripId, current);

  // If sharing is active, re-adjust GPS profile
  if (current.isSharing) {
    if (!enabled && isGpsSleepingDueToStationary) {
      // Force GPS wake-up if battery saver was turned off
      wakeUpGps(tripId);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'LOCATION_SETTINGS_CHANGED',
    tripId,
    settings: current,
  });

  return current;
};

/**
 * Simulates a stationary duration (in minutes) for instant testing and demo purposes.
 * If minutes >= 5, triggers the stationary battery-saver GPS sleep mode immediately.
 */
export const simulateStationaryState = (
  tripId: string,
  stationaryMinutes: number
): LocationSharingSettings => {
  const current = getLocationSharingSettings(tripId);
  const now = Date.now();
  const isStationary = stationaryMinutes >= 5;

  current.isStationary = isStationary;
  current.stationaryDurationMinutes = stationaryMinutes;
  current.stationarySince = isStationary
    ? new Date(now - stationaryMinutes * 60000).toISOString()
    : null;

  if (isStationary && current.batterySaverMode && current.isSharing) {
    current.gpsState = 'sleep_stationary';
    current.updateFrequencySeconds = 60;
    current.batterySavingsPercent = 75;

    // Put hardware GPS to sleep (stop watchPosition)
    if (activeWatchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(activeWatchId);
      activeWatchId = null;
    }
    isGpsSleepingDueToStationary = true;
    startLowPowerPeriodicPoll(tripId, activeCityId);
  } else if (!isStationary && isGpsSleepingDueToStationary) {
    wakeUpGps(tripId);
  }

  saveLocationSharingSettings(tripId, current);

  // Update live location record as well
  const user = getCurrentUserProfile();
  const all = getStoredGroupLocations(tripId);
  const existingIdx = all.findIndex((l) => l.userId === user.id);
  if (existingIdx >= 0) {
    all[existingIdx].isStationary = isStationary;
    all[existingIdx].stationaryDurationMinutes = stationaryMinutes;
    all[existingIdx].gpsState = current.gpsState;
    all[existingIdx].isBatterySaver = current.batterySaverMode;
    all[existingIdx].updatedAt = new Date().toISOString();
    saveStoredGroupLocations(tripId, all);

    groupBroadcastChannel?.postMessage({
      type: 'LOCATION_UPDATED',
      tripId,
      location: all[existingIdx],
    });
  }

  return current;
};

/**
 * Manually wakes up GPS from stationary sleep state.
 */
export const wakeUpGps = async (tripId: string): Promise<void> => {
  isGpsSleepingDueToStationary = false;
  stationaryAnchor = null;

  if (lowPowerPollTimer) {
    clearInterval(lowPowerPollTimer);
    lowPowerPollTimer = null;
  }

  const current = getLocationSharingSettings(tripId);
  current.isStationary = false;
  current.stationarySince = null;
  current.stationaryDurationMinutes = 0;
  current.gpsState = 'active_watching';
  current.updateFrequencySeconds = current.batterySaverMode ? 35 : 15;
  current.batterySavingsPercent = current.batterySaverMode ? 45 : 0;
  saveLocationSharingSettings(tripId, current);

  if (current.isSharing && typeof window !== 'undefined' && navigator.geolocation) {
    // Restart active high-accuracy watch
    startActiveGpsWatcher(tripId, activeCityId);
  }
};

// ----------------------------------------------------------------------------
// 2. LIVE LOCATION STORAGE & FETCHING
// ----------------------------------------------------------------------------

export const getStoredGroupLocations = (tripId: string): LiveLocationRecord[] => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_LIVE_LOCATIONS_PREFIX}${tripId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading live locations:', err);
  }
  return [];
};

export const saveStoredGroupLocations = (
  tripId: string,
  locations: LiveLocationRecord[]
): void => {
  try {
    localStorage.setItem(
      `${LOCAL_STORAGE_LIVE_LOCATIONS_PREFIX}${tripId}`,
      JSON.stringify(locations)
    );
  } catch (err) {
    console.warn('Error writing live locations:', err);
  }
};

/**
 * Updates a member's location record in local store and syncs with Supabase & broadcast channel.
 */
export const updateMemberLocation = async (
  record: LiveLocationRecord
): Promise<void> => {
  const all = getStoredGroupLocations(record.tripId);
  const existingIdx = all.findIndex((l) => l.userId === record.userId);

  if (existingIdx >= 0) {
    all[existingIdx] = record;
  } else {
    all.push(record);
  }

  saveStoredGroupLocations(record.tripId, all);

  // Broadcast to other local browser tabs
  groupBroadcastChannel?.postMessage({
    type: 'LOCATION_UPDATED',
    tripId: record.tripId,
    location: record,
  });

  // Sync to Supabase table if available
  const supabase = getSupabase();
  if (supabase && record.tripId) {
    try {
      const validUid = ensureValidUuid(record.userId);
      await supabase.from('live_locations').upsert(
        {
          trip_id: record.tripId,
          user_id: validUid,
          latitude: record.latitude,
          longitude: record.longitude,
          heading: record.heading || null,
          speed: record.speed || null,
          accuracy: record.accuracy || null,
          is_sharing: record.isSharing,
          last_seen_at: record.updatedAt || new Date().toISOString(),
          updated_at: record.updatedAt,
        },
        { onConflict: 'trip_id,user_id' }
      );
    } catch (err) {
      console.warn('Failed to upsert live location to Supabase:', err);
    }
  }
};

/**
 * Fetches real active squad member locations from Supabase for cross-device visibility.
 */
export const fetchSquadLocationsFromSupabase = async (
  tripId: string,
  city: CityId = 'kolkata'
): Promise<LiveLocationRecord[]> => {
  const supabase = getSupabase();
  if (supabase && tripId) {
    try {
      const { data, error } = await supabase
        .from('live_locations')
        .select('*')
        .eq('trip_id', tripId)
        .eq('is_sharing', true);

      if (!error && data) {
        const stored = getStoredGroupLocations(tripId);
        const map = new Map<string, LiveLocationRecord>();
        stored.forEach((l) => map.set(l.userId, l));

        data.forEach((row: any) => {
          const lat = Number(row.latitude);
          const lng = Number(row.longitude);
          const mapCoords = latLngToMapCoordinates(lat, lng, city);
          const existing = map.get(row.user_id);

          map.set(row.user_id, {
            id: row.id,
            tripId: row.trip_id,
            userId: row.user_id,
            userName: existing?.userName || 'Squad Member',
            userAvatar: existing?.userAvatar || 'dhunuchi_dancer',
            latitude: lat,
            longitude: lng,
            mapX: mapCoords.mapX,
            mapY: mapCoords.mapY,
            heading: row.heading ? Number(row.heading) : undefined,
            speed: row.speed ? Number(row.speed) : undefined,
            accuracy: row.accuracy ? Number(row.accuracy) : undefined,
            isSharing: Boolean(row.is_sharing),
            updatedAt: row.updated_at || new Date().toISOString(),
            lastSeenAt: row.updated_at,
            isBatterySaver: existing?.isBatterySaver ?? true,
            isStationary: existing?.isStationary ?? false,
            gpsState: existing?.gpsState ?? 'active_watching',
          });
        });

        const merged = Array.from(map.values());
        saveStoredGroupLocations(tripId, merged);
        return merged;
      }
    } catch (err) {
      console.warn('Error fetching squad locations from Supabase:', err);
    }
  }

  return getStoredGroupLocations(tripId);
};

// ----------------------------------------------------------------------------
// 3. GEOLOCATION API & SHARING LIFECYCLE
// ----------------------------------------------------------------------------

export interface StartLocationSharingOptions {
  tripId: string;
  duration: LocationSharingDuration;
  city?: CityId;
  onLocationUpdate?: (loc: LiveLocationRecord) => void;
  onError?: (error: { code: string; message: string }) => void;
}

/**
 * Calculates expiration timestamp based on selected duration.
 */
export const calculateExpiresAt = (duration: LocationSharingDuration): string | null => {
  const now = Date.now();
  if (duration === '1h') {
    return new Date(now + 60 * 60 * 1000).toISOString();
  }
  if (duration === '3h') {
    return new Date(now + 3 * 60 * 60 * 1000).toISOString();
  }
  // Until trip ends (or 24 hours max safeguard)
  return new Date(now + 24 * 60 * 60 * 1000).toISOString();
};

/**
 * Starts continuous high-accuracy GPS watcher when active.
 */
const startActiveGpsWatcher = (tripId: string, city: CityId) => {
  if (typeof window === 'undefined' || !navigator.geolocation) return;

  if (activeWatchId !== null) {
    navigator.geolocation.clearWatch(activeWatchId);
    activeWatchId = null;
  }

  const settings = getLocationSharingSettings(tripId);
  const isBatterySaver = settings.batterySaverMode ?? true;

  try {
    activeWatchId = navigator.geolocation.watchPosition(
      (position) => handlePositionUpdate(position, tripId, city),
      (geoError) => handlePositionError(geoError),
      {
        enableHighAccuracy: !isBatterySaver || !isGpsSleepingDueToStationary,
        timeout: isBatterySaver ? 25000 : 20000,
        maximumAge: isBatterySaver ? 20000 : 10000,
      }
    );
  } catch (err) {
    console.warn('Error starting watchPosition:', err);
  }
};

/**
 * Starts a relaxed low-power periodic poll when GPS is asleep due to 5+ mins stationary.
 * Uses coarse network location to check if user starts moving again without draining battery.
 */
const startLowPowerPeriodicPoll = (tripId: string, city: CityId) => {
  if (lowPowerPollTimer) clearInterval(lowPowerPollTimer);

  lowPowerPollTimer = setInterval(() => {
    if (!isGpsSleepingDueToStationary) {
      clearInterval(lowPowerPollTimer);
      lowPowerPollTimer = null;
      return;
    }

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          if (stationaryAnchor) {
            const dist = calculateHaversineDistance(
              stationaryAnchor.lat,
              stationaryAnchor.lng,
              latitude,
              longitude
            );

            if (dist > STATIONARY_RADIUS_THRESHOLD_METERS + 10) {
              // User moved away from stationary area! Wake up GPS!
              console.log('Movement detected in low-power poll. Waking up high-accuracy GPS...');
              wakeUpGps(tripId);
              return;
            }
          }

          // Broadcast stationary pulse with updated timestamp
          handlePositionUpdate(position, tripId, city, true);
        },
        (err) => {
          console.warn('Low-power location poll warning:', err);
        },
        {
          enableHighAccuracy: false, // Low-power / Coarse network fix
          timeout: 15000,
          maximumAge: 60000,
        }
      );
    }
  }, LOW_POWER_POLL_INTERVAL_MS);
};

/**
 * Handles incoming GPS position update, executes stationary detection and battery-saving throttling.
 */
const handlePositionUpdate = (
  position: GeolocationPosition,
  tripId: string,
  city: CityId,
  isLowPowerPoll: boolean = false
) => {
  const { latitude, longitude, accuracy, heading, speed } = position.coords;
  const currentTime = Date.now();
  const settings = getLocationSharingSettings(tripId);
  const user = getCurrentUserProfile();
  const isBatterySaver = settings.batterySaverMode ?? true;

  // 1. Stationary Detection (5-minute rule)
  if (!stationaryAnchor) {
    stationaryAnchor = { lat: latitude, lng: longitude, startTime: currentTime };
  } else {
    const distFromAnchor = calculateHaversineDistance(
      stationaryAnchor.lat,
      stationaryAnchor.lng,
      latitude,
      longitude
    );

    if (distFromAnchor <= STATIONARY_RADIUS_THRESHOLD_METERS) {
      // User is staying within stationary radius (15m)
      const stationaryDurationMs = currentTime - stationaryAnchor.startTime;
      const stationaryMins = Math.floor(stationaryDurationMs / 60000);

      if (stationaryDurationMs >= STATIONARY_DURATION_THRESHOLD_MS && isBatterySaver) {
        // STATIONARY > 5 MINUTES: Trigger Battery Saving GPS Sleep!
        if (!isGpsSleepingDueToStationary) {
          isGpsSleepingDueToStationary = true;
          // Clear active high-power GPS watch
          if (activeWatchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
            navigator.geolocation.clearWatch(activeWatchId);
            activeWatchId = null;
          }

          settings.isStationary = true;
          settings.stationarySince = new Date(stationaryAnchor.startTime).toISOString();
          settings.stationaryDurationMinutes = stationaryMins;
          settings.gpsState = 'sleep_stationary';
          settings.updateFrequencySeconds = 60;
          settings.batterySavingsPercent = 75;
          saveLocationSharingSettings(tripId, settings);

          // Start low-power check
          startLowPowerPeriodicPoll(tripId, city);
        } else {
          settings.stationaryDurationMinutes = stationaryMins;
          saveLocationSharingSettings(tripId, settings);
        }
      } else {
        settings.isStationary = stationaryMins >= 5;
        settings.stationaryDurationMinutes = stationaryMins;
      }
    } else {
      // User moved > 15m! Reset stationary anchor and wake up GPS if sleeping
      stationaryAnchor = { lat: latitude, lng: longitude, startTime: currentTime };
      if (isGpsSleepingDueToStationary) {
        isGpsSleepingDueToStationary = false;
        if (lowPowerPollTimer) {
          clearInterval(lowPowerPollTimer);
          lowPowerPollTimer = null;
        }
        settings.isStationary = false;
        settings.stationarySince = null;
        settings.stationaryDurationMinutes = 0;
        settings.gpsState = 'active_watching';
        settings.updateFrequencySeconds = isBatterySaver ? 35 : 15;
        settings.batterySavingsPercent = isBatterySaver ? 45 : 0;
        saveLocationSharingSettings(tripId, settings);

        startActiveGpsWatcher(tripId, city);
      } else if (settings.isStationary) {
        settings.isStationary = false;
        settings.stationarySince = null;
        settings.stationaryDurationMinutes = 0;
      }
    }
  }

  // 2. Throttling checks based on Battery-Saving Mode
  const minDistance = isBatterySaver
    ? BATTERY_SAVER_MIN_DISTANCE_DELTA_METERS
    : STANDARD_MIN_DISTANCE_DELTA_METERS;
  const minTimeDelta = isBatterySaver
    ? BATTERY_SAVER_MIN_TIME_DELTA_MS
    : STANDARD_MIN_TIME_DELTA_MS;

  if (lastBroadcastCoords && !isLowPowerPoll) {
    const dist = calculateHaversineDistance(
      lastBroadcastCoords.lat,
      lastBroadcastCoords.lng,
      latitude,
      longitude
    );
    const timeElapsed = currentTime - lastBroadcastCoords.time;
    if (dist < minDistance && timeElapsed < minTimeDelta) {
      return; // Throttled to conserve battery
    }
  }

  lastBroadcastCoords = { lat: latitude, lng: longitude, time: currentTime };

  const mapCoords = latLngToMapCoordinates(latitude, longitude, city);

  const record: LiveLocationRecord = {
    id: `loc_${user.id}_${Date.now()}`,
    tripId,
    userId: user.id,
    userName: user.displayName,
    userAvatar: user.avatarUrl,
    latitude,
    longitude,
    mapX: mapCoords.mapX,
    mapY: mapCoords.mapY,
    accuracy: accuracy || undefined,
    heading: heading || undefined,
    speed: speed || undefined,
    isSharing: true,
    duration: settings.duration,
    expiresAt: settings.expiresAt || undefined,
    updatedAt: new Date().toISOString(),
    isBatterySaver: settings.batterySaverMode,
    isStationary: settings.isStationary,
    stationaryDurationMinutes: settings.stationaryDurationMinutes,
    gpsState: settings.gpsState,
  };

  settings.lastUpdated = record.updatedAt;
  saveLocationSharingSettings(tripId, settings);

  updateMemberLocation(record);
  currentOnLocationUpdate?.(record);
};

const handlePositionError = (geoError: GeolocationPositionError) => {
  let code = 'UNKNOWN_ERROR';
  let message = 'Unable to retrieve your location.';

  switch (geoError.code) {
    case geoError.PERMISSION_DENIED:
      code = 'PERMISSION_DENIED';
      message =
        'Location permission was denied. Please allow location access in your browser settings to share your live Puja trip location.';
      break;
    case geoError.POSITION_UNAVAILABLE:
      code = 'POSITION_UNAVAILABLE';
      message =
        'GPS location information is temporarily unavailable. Check your device GPS signal.';
      break;
    case geoError.TIMEOUT:
      code = 'TIMEOUT';
      message = 'Location request timed out. Retrying GPS lock...';
      break;
  }

  console.warn('Geolocation Error:', geoError);
  currentOnError?.({ code, message });
};

/**
 * Starts live location sharing using browser's Geolocation API.
 * Throttles broadcasts and stops immediately when turned off.
 */
export const startLocationSharing = async ({
  tripId,
  duration,
  city = 'kolkata',
  onLocationUpdate,
  onError,
}: StartLocationSharingOptions): Promise<{ success: boolean; error?: string }> => {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    const errMsg = 'Geolocation is not supported by your browser or environment.';
    onError?.({ code: 'UNSUPPORTED', message: errMsg });
    return { success: false, error: errMsg };
  }

  // Clear any existing watch
  stopLocationSharing(tripId);

  const nowIso = new Date().toISOString();
  const expiresAt = calculateExpiresAt(duration);
  const existingSettings = getLocationSharingSettings(tripId);
  const isBatterySaver = existingSettings.batterySaverMode ?? true;

  // Save new active settings
  const settings: LocationSharingSettings = {
    isSharing: true,
    duration,
    startedAt: nowIso,
    expiresAt,
    lastUpdated: nowIso,
    batterySaverMode: isBatterySaver,
    isStationary: false,
    stationarySince: null,
    stationaryDurationMinutes: 0,
    gpsState: 'active_watching',
    updateFrequencySeconds: isBatterySaver ? 35 : 15,
    batterySavingsPercent: isBatterySaver ? 45 : 0,
  };
  saveLocationSharingSettings(tripId, settings);
  activeTripId = tripId;
  activeCityId = city;
  currentOnLocationUpdate = onLocationUpdate;
  currentOnError = onError;
  stationaryAnchor = null;
  isGpsSleepingDueToStationary = false;

  // Setup periodic expiration check
  if (expirationCheckTimer) clearInterval(expirationCheckTimer);
  expirationCheckTimer = setInterval(() => {
    const current = getLocationSharingSettings(tripId);
    if (current.isSharing && current.expiresAt) {
      if (new Date(current.expiresAt).getTime() <= Date.now()) {
        stopLocationSharing(tripId);
        if (expirationCheckTimer) clearInterval(expirationCheckTimer);
      }
    }
  }, 30000);

  // 1. Immediate initial position fix
  navigator.geolocation.getCurrentPosition(
    (pos) => handlePositionUpdate(pos, tripId, city),
    (err) => handlePositionError(err),
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 10000,
    }
  );

  // 2. Start continuous GPS watcher
  startActiveGpsWatcher(tripId, city);

  return { success: true };
};

/**
 * Stops live location sharing immediately and clears all watchers to prevent continuous background tracking.
 */
export const stopLocationSharing = (tripId: string): void => {
  if (activeWatchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(activeWatchId);
    activeWatchId = null;
  }

  if (expirationCheckTimer) {
    clearInterval(expirationCheckTimer);
    expirationCheckTimer = null;
  }

  if (lowPowerPollTimer) {
    clearInterval(lowPowerPollTimer);
    lowPowerPollTimer = null;
  }

  lastBroadcastCoords = null;
  stationaryAnchor = null;
  isGpsSleepingDueToStationary = false;
  activeTripId = null;

  const currentSettings = getLocationSharingSettings(tripId);
  currentSettings.isSharing = false;
  currentSettings.gpsState = 'disabled';
  currentSettings.isStationary = false;
  currentSettings.stationarySince = null;
  currentSettings.stationaryDurationMinutes = 0;
  currentSettings.lastUpdated = new Date().toISOString();
  saveLocationSharingSettings(tripId, currentSettings);

  const user = getCurrentUserProfile();
  const all = getStoredGroupLocations(tripId);
  const existingIdx = all.findIndex((l) => l.userId === user.id);

  if (existingIdx >= 0) {
    all[existingIdx].isSharing = false;
    all[existingIdx].isStationary = false;
    all[existingIdx].gpsState = 'disabled';
    all[existingIdx].updatedAt = new Date().toISOString();
    saveStoredGroupLocations(tripId, all);

    // Broadcast stopped status to group
    groupBroadcastChannel?.postMessage({
      type: 'LOCATION_STOPPED',
      tripId,
      userId: user.id,
    });

    const supabase = getSupabase();
    if (supabase && tripId && !user.id.startsWith('demo_test_')) {
      Promise.resolve(
        supabase
          .from('live_locations')
          .update({ is_sharing: false, updated_at: new Date().toISOString() })
          .eq('trip_id', tripId)
          .eq('user_id', user.id)
      ).catch((err) => console.warn('Supabase stop location err:', err));
    }
  }
};

/**
 * Subscribes to cross-tab and realtime location broadcast events.
 */
export const subscribeToLiveLocationBroadcasts = (
  tripId: string,
  onUpdate: () => void
): (() => void) => {
  const handler = (event: MessageEvent) => {
    if (event.data && event.data.tripId === tripId) {
      onUpdate();
    }
  };

  groupBroadcastChannel?.addEventListener('message', handler);

  const storageHandler = (event: StorageEvent) => {
    if (event.key && event.key.startsWith(LOCAL_STORAGE_LIVE_LOCATIONS_PREFIX)) {
      onUpdate();
    }
  };

  window.addEventListener('storage', storageHandler);

  return () => {
    groupBroadcastChannel?.removeEventListener('message', handler);
    window.removeEventListener('storage', storageHandler);
  };
};

// ----------------------------------------------------------------------------
// 4. GROUP MEMBER LOCATIONS & DISTANCE RESOLUTION
// ----------------------------------------------------------------------------

/**
 * Computes location records for all members of a trip group with relative distance,
 * direction, staleness status, and nearest landmarks.
 */
export const getGroupMemberLocationsWithDetails = (
  tripId: string,
  members: TripMember[],
  currentUserProfile: UserProfile,
  cityPandals: Pandal[] = [],
  city: CityId = 'kolkata'
): {
  myLocation: GroupMemberLocation | null;
  otherMemberLocations: GroupMemberLocation[];
  activeSharingCount: number;
} => {
  const rawLocations = getStoredGroupLocations(tripId);
  const myLocRecord = rawLocations.find((l) => l.userId === currentUserProfile.id);

  // Determine current user's location record
  let myLocation: GroupMemberLocation | null = null;
  if (myLocRecord && myLocRecord.isSharing) {
    const ageMs = Date.now() - new Date(myLocRecord.updatedAt).getTime();
    const myStatus = ageMs <= 60 * 1000 ? 'live' : ageMs <= 10 * 60 * 1000 ? 'recent' : 'offline';
    const mapCoords = latLngToMapCoordinates(myLocRecord.latitude, myLocRecord.longitude, city);

    myLocation = {
      ...myLocRecord,
      mapX: myLocRecord.mapX || mapCoords.mapX,
      mapY: myLocRecord.mapY || mapCoords.mapY,
      profile: currentUserProfile,
      phoneNumber: currentUserProfile.phoneNumber,
      role: 'admin',
      status: myStatus,
      isCurrentUser: true,
    };
  }

  const otherMemberLocations: GroupMemberLocation[] = [];

  for (const member of members) {
    if (member.userId === currentUserProfile.id) continue;

    const record = rawLocations.find((l) => l.userId === member.userId);
    const profile = member.profile || {
      id: member.userId,
      displayName: 'Trip Squad Member',
      avatarUrl: '🪔',
      phoneNumber: undefined,
      isLocationSharingEnabled: false,
      lastSeenAt: member.lastActiveAt,
      isOnline: false,
      createdAt: member.joinedAt,
      updatedAt: member.lastActiveAt,
    };

    if (!record || !record.isSharing) {
      // Location disabled / offline
      otherMemberLocations.push({
        id: `loc_${member.userId}`,
        tripId,
        userId: member.userId,
        userName: profile.displayName,
        userAvatar: profile.avatarUrl,
        latitude: 0,
        longitude: 0,
        isSharing: false,
        updatedAt: member.lastActiveAt,
        profile,
        phoneNumber: member.profile?.phoneNumber || profile.phoneNumber,
        role: member.role || 'member',
        status: 'location_off',
        isCurrentUser: false,
      });
      continue;
    }

    const diffMs = Date.now() - new Date(record.updatedAt).getTime();
    const memberStatus = diffMs <= 60 * 1000 ? 'live' : diffMs <= 10 * 60 * 1000 ? 'recent' : 'offline';

    const mapCoords = latLngToMapCoordinates(record.latitude, record.longitude, city);

    // Calculate relative distance & direction from current user (if current user has coordinates)
    let distanceMeters: number | undefined;
    let formattedDistance: string | undefined;
    let direction: any = undefined;
    let bengaliDirection: string | undefined;
    let arrowIcon: string | undefined;
    let bearingDegrees: number | undefined;
    let estimatedWalkingMinutes: number | undefined;
    let formattedWalkingDistance: string | undefined;

    if (myLocation && myLocation.latitude && myLocation.longitude) {
      const info = calculateDistanceAndDirection(
        myLocation.latitude,
        myLocation.longitude,
        record.latitude,
        record.longitude
      );
      distanceMeters = info.straightDistanceMeters;
      formattedDistance = info.formattedStraightDistance;
      direction = info.direction;
      bengaliDirection = info.bengaliDirection;
      arrowIcon = info.arrowIcon;
      bearingDegrees = info.bearingDegrees;
      estimatedWalkingMinutes = info.estimatedWalkingMinutes;
      formattedWalkingDistance = info.formattedWalkingDistance;
    }

    // Find nearest pandal or landmark
    let nearestLandmarkName: string | undefined;
    let bengaliLandmarkName: string | undefined;
    if (cityPandals.length > 0) {
      let closestDist = Infinity;
      for (const p of cityPandals) {
        const d = calculateHaversineDistance(record.latitude, record.longitude, p.latitude, p.longitude);
        if (d < closestDist) {
          closestDist = d;
          nearestLandmarkName = closestDist <= 300 ? p.name : `Near ${p.area}`;
          bengaliLandmarkName = closestDist <= 300 ? p.bengaliName : `নিকটবর্তী ${p.bengaliArea}`;
        }
      }
    }

    otherMemberLocations.push({
      ...record,
      mapX: record.mapX || mapCoords.mapX,
      mapY: record.mapY || mapCoords.mapY,
      profile,
      phoneNumber: member.profile?.phoneNumber || profile.phoneNumber,
      role: member.role || 'member',
      distanceMeters,
      formattedDistance,
      direction,
      bengaliDirection,
      arrowIcon,
      bearingDegrees,
      estimatedWalkingMinutes,
      formattedWalkingDistance,
      nearestLandmarkName,
      bengaliLandmarkName,
      status: memberStatus,
      isCurrentUser: false,
    });
  }

  const activeSharingCount =
    (myLocation && (myLocation.status === 'live' || myLocation.status === 'recent') ? 1 : 0) +
    otherMemberLocations.filter((m) => m.status === 'live' || m.status === 'recent').length;

  return {
    myLocation,
    otherMemberLocations,
    activeSharingCount,
  };
};

/**
 * Returns a combined flat array of all group member locations (current user + squad friends).
 */
export const getAllGroupMemberLocations = (
  tripId: string,
  members?: TripMember[],
  currentUserProfile?: UserProfile,
  cityPandals: Pandal[] = [],
  city: CityId = 'kolkata'
): GroupMemberLocation[] => {
  const group = getTripGroup(tripId);
  const actualMembers = members || group?.members || [];
  const profile = currentUserProfile || getCurrentUserProfile();
  const res = getGroupMemberLocationsWithDetails(
    tripId,
    actualMembers,
    profile,
    cityPandals,
    city
  );

  const list: GroupMemberLocation[] = [];
  if (res.myLocation) {
    list.push(res.myLocation);
  }
  list.push(...res.otherMemberLocations);
  return list;
};

// ----------------------------------------------------------------------------
// 5. SUGGESTED CENTRAL MEETING POINT ALGORITHM
// ----------------------------------------------------------------------------

/**
 * Calculates a reasonable suggested central meeting point for group members
 * using the centroid of active member coordinates and nearest accessible pandal/landmark.
 */
export const calculateSuggestedMeetingPoint = (
  activeLocations: GroupMemberLocation[],
  cityPandals: Pandal[] = [],
  city: CityId = 'kolkata'
): SuggestedMeetingPoint | null => {
  // Need at least 2 active members to suggest a meeting point
  const sharingLocations = activeLocations.filter(
    (l) => l.isSharing && l.latitude !== 0 && l.longitude !== 0
  );

  if (sharingLocations.length < 2) {
    return null;
  }

  // Calculate geometric centroid (average latitude and longitude)
  const totalLat = sharingLocations.reduce((sum, l) => sum + l.latitude, 0);
  const totalLng = sharingLocations.reduce((sum, l) => sum + l.longitude, 0);
  const centerLat = totalLat / sharingLocations.length;
  const centerLng = totalLng / sharingLocations.length;

  // Find nearest prominent pandal or landmark to this midpoint
  let nearestPandal: Pandal | null = null;
  let minDistance = Infinity;

  for (const pandal of cityPandals) {
    const dist = calculateHaversineDistance(
      centerLat,
      centerLng,
      pandal.latitude,
      pandal.longitude
    );
    if (dist < minDistance) {
      minDistance = dist;
      nearestPandal = pandal;
    }
  }

  // Calculate average distance from each member to this center point
  const avgDistMeters = Math.round(
    sharingLocations.reduce(
      (acc, l) =>
        acc +
        calculateHaversineDistance(
          l.latitude,
          l.longitude,
          nearestPandal ? nearestPandal.latitude : centerLat,
          nearestPandal ? nearestPandal.longitude : centerLng
        ),
      0
    ) / sharingLocations.length
  );

  const finalLat = nearestPandal ? nearestPandal.latitude : centerLat;
  const finalLng = nearestPandal ? nearestPandal.longitude : centerLng;
  const mapCoords = latLngToMapCoordinates(finalLat, finalLng, city);

  const landmarkName = nearestPandal
    ? `${nearestPandal.name} (${nearestPandal.area})`
    : 'Central Group Midpoint';
  const bengaliLandmarkName = nearestPandal
    ? `${nearestPandal.bengaliName} (${nearestPandal.bengaliArea})`
    : 'কেন্দ্রীয় মিলনস্থল';

  return {
    latitude: finalLat,
    longitude: finalLng,
    mapX: mapCoords.mapX,
    mapY: mapCoords.mapY,
    nearestLandmarkName: landmarkName,
    bengaliLandmarkName,
    description: `Suggested central meeting point based on ${sharingLocations.length} active squad members' locations.`,
    bengaliDescription: `${sharingLocations.length} জন সক্রিয় বন্ধুর অবস্থানের ভিত্তিতে প্রস্তাবিত মিলনস্থল।`,
    activeMemberCount: sharingLocations.length,
    averageDistanceMeters: avgDistMeters,
    formattedAverageDistance: formatDistance(avgDistMeters),
  };
};

// ----------------------------------------------------------------------------
// 6. GPS PROXIMITY DETECTION FOR PANDAL DARSHAN CONFIRMATION
// ----------------------------------------------------------------------------

/**
 * Checks if current GPS coordinates are within proximity (e.g. <= 150m) of an unvisited pandal.
 * Returns the nearest pandal if found.
 */
export const detectNearbyPandalForDarshan = (
  userLat: number,
  userLng: number,
  itineraryPandals: Pandal[],
  visitedPandalIds: string[],
  thresholdMeters: number = 160
): { pandal: Pandal; distanceMeters: number } | null => {
  if (!userLat || !userLng || itineraryPandals.length === 0) return null;

  let closestPandal: Pandal | null = null;
  let minDistance = Infinity;

  for (const pandal of itineraryPandals) {
    if (visitedPandalIds.includes(pandal.id)) continue; // Skip already visited

    const dist = calculateHaversineDistance(
      userLat,
      userLng,
      pandal.latitude,
      pandal.longitude
    );

    if (dist <= thresholdMeters && dist < minDistance) {
      minDistance = dist;
      closestPandal = pandal;
    }
  }

  if (closestPandal) {
    return {
      pandal: closestPandal,
      distanceMeters: minDistance,
    };
  }

  return null;
};

// ----------------------------------------------------------------------------
// 7. TESTING / DEV SIMULATION UTILITY
// ----------------------------------------------------------------------------

/**
 * Seeds initial demo positions for other simulated group members (Amit, Rahul, Suman, Raj)
 * in Kolkata or Contai so the user can immediately test live map markers, distance tracking,
 * Meet Friend and Central Meeting Point features.
 */
export const seedDemoSquadLocationsIfEmpty = (
  tripId: string,
  members: TripMember[],
  city: CityId = 'kolkata'
): void => {
  const existing = getStoredGroupLocations(tripId);
  if (existing.length >= members.length) return;

  const now = new Date().toISOString();
  const mockOffsets = city === 'kolkata'
    ? [
        { lat: 22.6042, lng: 88.3758, mapX: 47, mapY: 18 }, // Near Tala Park
        { lat: 22.5985, lng: 88.4012, mapX: 72, mapY: 26 }, // Near Sreebhumi
        { lat: 22.5746, lng: 88.3639, mapX: 44, mapY: 42 }, // Near College Square
        { lat: 22.5186, lng: 88.3656, mapX: 58, mapY: 70 }, // Near Ekdalia Evergreen
      ]
    : [
        { lat: 21.7820, lng: 87.7510, mapX: 48, mapY: 44 },
        { lat: 21.7910, lng: 87.7620, mapX: 62, mapY: 32 },
        { lat: 21.7710, lng: 87.7420, mapX: 38, mapY: 58 },
      ];

  const updated = [...existing];
  const nowMs = Date.now();

  members.forEach((m, idx) => {
    if (updated.some((l) => l.userId === m.userId)) return;

    const offset = mockOffsets[idx % mockOffsets.length];
    const isStationaryInQueue = idx === 1;

    // Realistic timestamp simulation:
    // Member 0: LIVE (12s ago)
    // Member 1: RECENT (2 mins ago)
    // Member 2: OFFLINE (14 mins ago)
    // Member 3: LOCATION OFF (isSharing = false)
    const timestamp =
      idx === 0
        ? new Date(nowMs - 12000).toISOString()
        : idx === 1
        ? new Date(nowMs - 2 * 60000).toISOString()
        : new Date(nowMs - 14 * 60000).toISOString();

    const record: LiveLocationRecord = {
      id: `loc_demo_${m.userId}`,
      tripId,
      userId: m.userId,
      userName: m.profile?.displayName || `Member ${idx + 1}`,
      userAvatar: m.profile?.avatarUrl || '🪔',
      latitude: offset.lat,
      longitude: offset.lng,
      mapX: offset.mapX,
      mapY: offset.mapY,
      isSharing: idx !== 3, // idx 3 has location sharing turned OFF
      duration: '3h',
      updatedAt: timestamp,
      isBatterySaver: true,
      isStationary: isStationaryInQueue,
      stationaryDurationMinutes: isStationaryInQueue ? 12 : 0,
      gpsState: isStationaryInQueue ? 'sleep_stationary' : idx !== 3 ? 'active_watching' : 'disabled',
    };
    updated.push(record);
  });

  saveStoredGroupLocations(tripId, updated);
};
