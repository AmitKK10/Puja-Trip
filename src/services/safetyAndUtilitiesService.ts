import {
  TripSOSAlert,
  TripLostAlert,
  GroupSafetyStatus,
  SuggestedMeetingPoint,
  MemberMeetingDistanceInfo,
  EssentialPlaceRecord,
  EssentialPlaceCategory,
  EmergencyContactNumber,
  CityId,
  TripMember,
  UserProfile,
  Pandal,
} from '../types';
import { getCurrentUserProfile, getTripGroup } from './friendGroupService';
import {
  getStoredGroupLocations,
  getAllGroupMemberLocations,
  getLocationSharingSettings,
} from './groupLocationService';
import {
  calculateHaversineDistance,
  calculateDistanceAndDirection,
  latLngToMapCoordinates,
  formatDistance,
} from '../utils/geoUtils';
import {
  OFFICIAL_EMERGENCY_NUMBERS,
  ESSENTIAL_NEARBY_PLACES,
} from '../data/essentialPlacesData';
import { KOLKATA_METRO_STATIONS, KOLKATA_BUS_STOPS } from '../data/transitNetworkData';
import { getSupabase } from './supabaseClient';

const LOCAL_STORAGE_SOS_PREFIX = 'pujatrip_sos_alerts_v1_';
const LOCAL_STORAGE_LOST_PREFIX = 'pujatrip_lost_alerts_v1_';

const groupBroadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('pujatrip_group_sync_channel')
    : null;

// ----------------------------------------------------------------------------
// 1. GROUP SOS SYSTEM
// ----------------------------------------------------------------------------

export const getStoredSOSAlerts = (tripId: string): TripSOSAlert[] => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_SOS_PREFIX}${tripId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading SOS alerts:', err);
  }
  return [];
};

export const saveStoredSOSAlerts = (tripId: string, alerts: TripSOSAlert[]): void => {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_SOS_PREFIX}${tripId}`, JSON.stringify(alerts));
  } catch (err) {
    console.warn('Error saving SOS alerts:', err);
  }
};

export const getActiveSOSAlerts = (tripId: string): TripSOSAlert[] => {
  const all = getStoredSOSAlerts(tripId);
  return all.filter((a) => a.status === 'active');
};

/**
 * Triggers an emergency SOS for the current user in the active trip squad.
 * Realtime broadcast to all squad members.
 */
export const triggerGroupSOS = async (
  tripId: string,
  city: CityId = 'kolkata',
  customMessage?: string,
  nearbyPandals: Pandal[] = []
): Promise<TripSOSAlert> => {
  const currentUser = getCurrentUserProfile();
  const rawLocations = getStoredGroupLocations(tripId);
  const myLoc = rawLocations.find((l) => l.userId === currentUser.id && l.isSharing);

  const hasCoords = Boolean(myLoc && myLoc.latitude !== 0 && myLoc.longitude !== 0);
  const lat = hasCoords && myLoc ? myLoc.latitude : 0;
  const lng = hasCoords && myLoc ? myLoc.longitude : 0;
  const mapCoords = latLngToMapCoordinates(lat, lng, city);

  // Find nearest landmark if coordinates available
  let nearestLandmark: string | undefined = undefined;
  let bengaliLandmark: string | undefined = undefined;
  if (hasCoords && nearbyPandals.length > 0) {
    let minD = Infinity;
    for (const p of nearbyPandals) {
      const d = calculateHaversineDistance(lat, lng, p.latitude, p.longitude);
      if (d < minD) {
        minD = d;
        nearestLandmark = minD <= 300 ? p.name : `Near ${p.area}`;
        bengaliLandmark = minD <= 300 ? p.bengaliName : `নিকটবর্তী ${p.bengaliArea}`;
      }
    }
  }

  const alert: TripSOSAlert = {
    id: `sos_${Date.now()}_${currentUser.id.slice(0, 6)}`,
    tripId,
    userId: currentUser.id,
    userName: currentUser.displayName,
    userAvatar: currentUser.avatarUrl,
    bengaliName: currentUser.bengaliName,
    latitude: lat,
    longitude: lng,
    mapX: hasCoords ? mapCoords.mapX : undefined,
    mapY: hasCoords ? mapCoords.mapY : undefined,
    nearestLandmark,
    bengaliLandmark,
    isLocationAvailable: hasCoords,
    status: 'active',
    message: customMessage || 'Emergency SOS! I need immediate group assistance.',
    timestamp: new Date().toISOString(),
  };

  const existing = getStoredSOSAlerts(tripId);
  // Deactivate any previous active SOS from the same user
  const updated = existing.map((a) =>
    a.userId === currentUser.id && a.status === 'active'
      ? { ...a, status: 'cancelled' as const, resolvedAt: new Date().toISOString() }
      : a
  );
  updated.unshift(alert);
  saveStoredSOSAlerts(tripId, updated);

  // Broadcast to other tabs
  groupBroadcastChannel?.postMessage({
    type: 'SOS_TRIGGERED',
    tripId,
    alert,
  });

  // Supabase Realtime broadcast/table update if connected
  const supabase = getSupabase();
  if (supabase && tripId && !currentUser.id.startsWith('demo_test_')) {
    try {
      await supabase.from('group_sos_alerts').insert({
        trip_id: tripId,
        user_id: currentUser.id,
        user_name: currentUser.displayName,
        latitude: alert.latitude,
        longitude: alert.longitude,
        status: 'active',
        message: alert.message,
        created_at: alert.timestamp,
      });
    } catch (err) {
      console.warn('Failed to insert SOS into Supabase:', err);
    }
  }

  return alert;
};

/**
 * Cancels active SOS ("I'm Safe / Cancel SOS")
 */
export const cancelGroupSOS = async (tripId: string, alertId?: string): Promise<void> => {
  const currentUser = getCurrentUserProfile();
  const existing = getStoredSOSAlerts(tripId);
  const now = new Date().toISOString();

  let cancelledAlert: TripSOSAlert | undefined;

  const updated = existing.map((a) => {
    if ((alertId && a.id === alertId) || (!alertId && a.userId === currentUser.id && a.status === 'active')) {
      cancelledAlert = { ...a, status: 'cancelled', resolvedAt: now };
      return cancelledAlert;
    }
    return a;
  });

  saveStoredSOSAlerts(tripId, updated);

  groupBroadcastChannel?.postMessage({
    type: 'SOS_CANCELLED',
    tripId,
    alertId: cancelledAlert?.id || alertId,
    userId: currentUser.id,
  });

  const supabase = getSupabase();
  if (supabase && tripId && cancelledAlert) {
    try {
      await supabase
        .from('group_sos_alerts')
        .update({ status: 'cancelled', resolved_at: now })
        .eq('trip_id', tripId)
        .eq('user_id', currentUser.id)
        .eq('status', 'active');
    } catch (err) {
      console.warn('Failed to cancel SOS in Supabase:', err);
    }
  }
};

// ----------------------------------------------------------------------------
// 2. "I'M LOST" / SEPARATED FROM GROUP SYSTEM
// ----------------------------------------------------------------------------

export const getStoredLostAlerts = (tripId: string): TripLostAlert[] => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_LOST_PREFIX}${tripId}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading lost alerts:', err);
  }
  return [];
};

export const saveStoredLostAlerts = (tripId: string, alerts: TripLostAlert[]): void => {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_LOST_PREFIX}${tripId}`, JSON.stringify(alerts));
  } catch (err) {
    console.warn('Error saving lost alerts:', err);
  }
};

export const getActiveLostAlerts = (tripId: string): TripLostAlert[] => {
  const all = getStoredLostAlerts(tripId);
  return all.filter((a) => a.status === 'active');
};

/**
 * Triggers "I'm Lost" alert with distance, direction, and automatic meeting point suggestion.
 */
export const triggerImLostAlert = async (
  tripId: string,
  city: CityId = 'kolkata',
  customMessage?: string,
  nearbyPandals: Pandal[] = []
): Promise<TripLostAlert> => {
  const currentUser = getCurrentUserProfile();
  const rawLocations = getStoredGroupLocations(tripId);
  const myLoc = rawLocations.find((l) => l.userId === currentUser.id && l.isSharing);

  const hasCoords = Boolean(myLoc && myLoc.latitude !== 0 && myLoc.longitude !== 0);
  const lat = hasCoords && myLoc ? myLoc.latitude : 0;
  const lng = hasCoords && myLoc ? myLoc.longitude : 0;
  const mapCoords = latLngToMapCoordinates(lat, lng, city);

  // Calculate distance & direction to the rest of the group
  const otherLocations = rawLocations.filter(
    (l) => l.userId !== currentUser.id && l.isSharing && l.latitude !== 0 && l.longitude !== 0
  );

  let distanceFromGroupMeters: number | undefined;
  let formattedDistanceFromGroup: string | undefined;
  let directionFromGroup: string | undefined;
  let bengaliDirectionFromGroup: string | undefined;
  let arrowIcon: string | undefined;

  if (hasCoords && otherLocations.length > 0) {
    // Average group centroid
    const avgLat = otherLocations.reduce((sum, l) => sum + l.latitude, 0) / otherLocations.length;
    const avgLng = otherLocations.reduce((sum, l) => sum + l.longitude, 0) / otherLocations.length;

    const info = calculateDistanceAndDirection(lat, lng, avgLat, avgLng);
    distanceFromGroupMeters = info.straightDistanceMeters;
    formattedDistanceFromGroup = info.formattedStraightDistance;
    directionFromGroup = info.direction;
    bengaliDirectionFromGroup = info.bengaliDirection;
    arrowIcon = info.arrowIcon;
  }

  // Calculate Suggested Meeting Point
  const meetingPoint = computeEnhancedMeetingPoint(tripId, city, nearbyPandals);

  // Find nearest landmark
  let nearestLandmark: string | undefined;
  let bengaliLandmark: string | undefined;
  if (hasCoords && nearbyPandals.length > 0) {
    let minD = Infinity;
    for (const p of nearbyPandals) {
      const d = calculateHaversineDistance(lat, lng, p.latitude, p.longitude);
      if (d < minD) {
        minD = d;
        nearestLandmark = minD <= 300 ? p.name : `Near ${p.area}`;
        bengaliLandmark = minD <= 300 ? p.bengaliName : `নিকটবর্তী ${p.bengaliArea}`;
      }
    }
  }

  const alert: TripLostAlert = {
    id: `lost_${Date.now()}_${currentUser.id.slice(0, 6)}`,
    tripId,
    userId: currentUser.id,
    userName: currentUser.displayName,
    userAvatar: currentUser.avatarUrl,
    bengaliName: currentUser.bengaliName,
    latitude: lat,
    longitude: lng,
    mapX: hasCoords ? mapCoords.mapX : undefined,
    mapY: hasCoords ? mapCoords.mapY : undefined,
    nearestLandmark,
    bengaliLandmark,
    isLocationAvailable: hasCoords,
    distanceFromGroupMeters,
    formattedDistanceFromGroup,
    directionFromGroup,
    bengaliDirectionFromGroup,
    arrowIcon,
    status: 'active',
    suggestedMeetingPoint: meetingPoint,
    message: customMessage || "I'm separated from the group. Let's regroup at a safe meeting spot.",
    timestamp: new Date().toISOString(),
  };

  const existing = getStoredLostAlerts(tripId);
  const updated = existing.map((a) =>
    a.userId === currentUser.id && a.status === 'active'
      ? { ...a, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
      : a
  );
  updated.unshift(alert);
  saveStoredLostAlerts(tripId, updated);

  groupBroadcastChannel?.postMessage({
    type: 'LOST_TRIGGERED',
    tripId,
    alert,
  });

  return alert;
};

/**
 * Resolves "I'm Lost" alert ("I Found My Squad / Cancel Alert")
 */
export const resolveImLostAlert = async (tripId: string, alertId?: string): Promise<void> => {
  const currentUser = getCurrentUserProfile();
  const existing = getStoredLostAlerts(tripId);
  const now = new Date().toISOString();

  let resolvedAlert: TripLostAlert | undefined;

  const updated = existing.map((a) => {
    if ((alertId && a.id === alertId) || (!alertId && a.userId === currentUser.id && a.status === 'active')) {
      resolvedAlert = { ...a, status: 'resolved', resolvedAt: now };
      return resolvedAlert;
    }
    return a;
  });

  saveStoredLostAlerts(tripId, updated);

  groupBroadcastChannel?.postMessage({
    type: 'LOST_RESOLVED',
    tripId,
    alertId: resolvedAlert?.id || alertId,
    userId: currentUser.id,
  });
};

// ----------------------------------------------------------------------------
// 3. ENHANCED SMART MEETING POINT ENGINE
// ----------------------------------------------------------------------------

/**
 * Calculates a reasonable central point from all available member locations,
 * snaps to prominent known public locations (pandals/landmarks),
 * and computes estimated walking distance & direction for EACH individual member.
 */
export const computeEnhancedMeetingPoint = (
  tripId: string,
  city: CityId = 'kolkata',
  cityPandals: Pandal[] = []
): SuggestedMeetingPoint | null => {
  const allMemberLocations = getAllGroupMemberLocations(tripId, undefined, undefined, cityPandals, city);
  const sharingLocations = allMemberLocations.filter(
    (l) => l.isSharing && l.latitude !== 0 && l.longitude !== 0
  );

  if (sharingLocations.length < 2) {
    return null;
  }

  // Calculate geometric centroid
  const totalLat = sharingLocations.reduce((sum, l) => sum + l.latitude, 0);
  const totalLng = sharingLocations.reduce((sum, l) => sum + l.longitude, 0);
  const centerLat = totalLat / sharingLocations.length;
  const centerLng = totalLng / sharingLocations.length;

  // Snap to nearest prominent public location (pandal or public ground)
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

  const finalLat = nearestPandal ? nearestPandal.latitude : centerLat;
  const finalLng = nearestPandal ? nearestPandal.longitude : centerLng;
  const mapCoords = latLngToMapCoordinates(finalLat, finalLng, city);

  const landmarkName = nearestPandal
    ? `${nearestPandal.name} (${nearestPandal.area})`
    : 'Central Squad Midpoint';
  const bengaliLandmarkName = nearestPandal
    ? `${nearestPandal.bengaliName} (${nearestPandal.bengaliArea})`
    : 'কেন্দ্রীয় মিলনস্থল';

  // Compute per-member distance and direction to this meeting point
  const memberDistances: MemberMeetingDistanceInfo[] = sharingLocations.map((member) => {
    const info = calculateDistanceAndDirection(
      member.latitude,
      member.longitude,
      finalLat,
      finalLng
    );
    return {
      userId: member.userId,
      userName: member.userName,
      userAvatar: member.userAvatar,
      bengaliName: member.profile?.bengaliName,
      distanceMeters: info.straightDistanceMeters,
      formattedDistance: info.formattedStraightDistance,
      estimatedWalkingMinutes: info.estimatedWalkingMinutes,
      direction: info.direction,
      bengaliDirection: info.bengaliDirection,
      arrowIcon: info.arrowIcon,
      isCurrentUser: member.isCurrentUser,
    };
  });

  const avgDistMeters = Math.round(
    memberDistances.reduce((acc, m) => acc + m.distanceMeters, 0) / memberDistances.length
  );

  return {
    latitude: finalLat,
    longitude: finalLng,
    mapX: mapCoords.mapX,
    mapY: mapCoords.mapY,
    nearestLandmarkName: landmarkName,
    bengaliLandmarkName,
    description: `Algorithmic central meeting point calculated from ${sharingLocations.length} active squad members' locations.`,
    bengaliDescription: `${sharingLocations.length} জন সক্রিয় বন্ধুর অবস্থানের ভিত্তিতে স্বয়ংক্রিয় প্রস্তাবিত মিলনস্থল।`,
    activeMemberCount: sharingLocations.length,
    averageDistanceMeters: avgDistMeters,
    formattedAverageDistance: formatDistance(avgDistMeters),
    memberDistances,
    disclaimer: 'Note: This meeting point is calculated geometrically. Please assess crowd barricades, police traffic advisories, and personal comfort when meeting.',
    bengaliDisclaimer: 'বিশেষ দ্রষ্টব্য: এটি জ্যামিতিক অবস্থানের ভিত্তিতে প্রস্তাবিত। ভিড় নিয়ন্ত্রণ ও পুলিশের নির্দেশ মেনে চলুন।',
  };
};

// ----------------------------------------------------------------------------
// 4. GROUP SAFETY STATUS SUMMARY
// ----------------------------------------------------------------------------

export const getGroupSafetyStatus = (
  tripId: string,
  members: TripMember[],
  currentUser: UserProfile,
  cityPandals: Pandal[] = [],
  city: CityId = 'kolkata'
): GroupSafetyStatus => {
  const allLocations = getAllGroupMemberLocations(tripId, members, currentUser, cityPandals, city);
  const activeSOS = getActiveSOSAlerts(tripId);
  const activeLost = getActiveLostAlerts(tripId);

  let activeCount = 0;
  let staleCount = 0;
  let offlineCount = 0;
  let stoppedCount = 0;

  for (const loc of allLocations) {
    if (!loc.isSharing) {
      if (loc.status === 'disabled') {
        offlineCount++;
      } else {
        stoppedCount++;
      }
    } else if (loc.status === 'stale') {
      staleCount++;
    } else if (loc.status === 'active') {
      activeCount++;
    }
  }

  return {
    activeCount,
    staleCount,
    offlineCount,
    stoppedCount,
    activeSOSCount: activeSOS.length,
    activeLostCount: activeLost.length,
    activeSOSAlerts: activeSOS,
    activeLostAlerts: activeLost,
  };
};

// ----------------------------------------------------------------------------
// 5. ESSENTIAL PLACES & EMERGENCY NUMBER UTILITIES
// ----------------------------------------------------------------------------

export const getOfficialEmergencyNumbers = (city: CityId = 'kolkata'): EmergencyContactNumber[] => {
  return OFFICIAL_EMERGENCY_NUMBERS.filter((num) => {
    if (city === 'contai') {
      // Include national, medical, police and contai district numbers
      return num.category !== 'police' || num.id.includes('contai') || num.id.includes('112') || num.id.includes('100');
    }
    return true;
  });
};

/**
 * Returns essential places combining curated records, metro stations and bus stops.
 */
export const getAllEssentialPlaces = (
  city: CityId = 'kolkata',
  activeCategories?: EssentialPlaceCategory[]
): EssentialPlaceRecord[] => {
  const basePlaces = ESSENTIAL_NEARBY_PLACES.filter((p) => p.city === city);

  // Also convert Metro Stations if metro category is active or not filtered
  const metroPlaces: EssentialPlaceRecord[] = [];
  if (city === 'kolkata') {
    KOLKATA_METRO_STATIONS.forEach((m) => {
      const coords = latLngToMapCoordinates(m.latitude, m.longitude, 'kolkata');
      metroPlaces.push({
        id: `metro-place-${m.id}`,
        name: m.name,
        bengaliName: m.bengaliName,
        category: 'metro',
        city: 'kolkata',
        latitude: m.latitude,
        longitude: m.longitude,
        mapX: coords.mapX,
        mapY: coords.mapY,
        address: `${m.lineLabel}, Kolkata`,
        bengaliAddress: `${m.lineLabel}`,
        landmark: m.entrances[0] ? `Gate: ${m.entrances[0].name}` : undefined,
        bengaliLandmark: m.entrances[0] ? `গেট: ${m.entrances[0].bengaliName}` : undefined,
        is24Hours: false,
        details: `${m.lineLabel} with ${m.entrances.length} entrance gates.`,
        bengaliDetails: `${m.entrances.length} টি প্রবেশদ্বার সহ মেট্রো স্টেশন।`,
        isDemoData: true,
      });
    });
  }

  // Also convert Bus Stops
  const busPlaces: EssentialPlaceRecord[] = [];
  if (city === 'kolkata') {
    KOLKATA_BUS_STOPS.slice(0, 10).forEach((b) => {
      const coords = latLngToMapCoordinates(b.latitude, b.longitude, 'kolkata');
      busPlaces.push({
        id: `bus-place-${b.id}`,
        name: b.name,
        bengaliName: b.bengaliName,
        category: 'bus_stop',
        city: 'kolkata',
        latitude: b.latitude,
        longitude: b.longitude,
        mapX: coords.mapX,
        mapY: coords.mapY,
        address: `${b.corridor}, Kolkata`,
        bengaliAddress: b.corridor,
        landmark: `Routes: ${b.routes.join(', ')}`,
        bengaliLandmark: `বাস রুট: ${b.routes.join(', ')}`,
        is24Hours: false,
        details: `Major bus stop connecting routes: ${b.routes.join(', ')}`,
        bengaliDetails: `সংযোগকারী বাস রুট: ${b.routes.join(', ')}`,
        isDemoData: true,
      });
    });
  }

  const combined = [...basePlaces, ...metroPlaces, ...busPlaces];

  if (activeCategories && activeCategories.length > 0) {
    return combined.filter((p) => activeCategories.includes(p.category));
  }

  return combined;
};

/**
 * Finds nearest essential places of a specific category from user or anchor coordinates.
 */
export const findNearestEssentialPlaces = (
  userLat: number,
  userLng: number,
  city: CityId = 'kolkata',
  category?: EssentialPlaceCategory,
  limit: number = 4
): Array<{
  place: EssentialPlaceRecord;
  distanceMeters: number;
  formattedDistance: string;
  estimatedWalkingMinutes: number;
  direction: string;
  arrowIcon: string;
}> => {
  const all = getAllEssentialPlaces(city, category ? [category] : undefined);
  if (!userLat || !userLng || all.length === 0) return [];

  const list = all.map((place) => {
    const info = calculateDistanceAndDirection(userLat, userLng, place.latitude, place.longitude);
    return {
      place,
      distanceMeters: info.straightDistanceMeters,
      formattedDistance: info.formattedStraightDistance,
      estimatedWalkingMinutes: info.estimatedWalkingMinutes,
      direction: info.direction,
      arrowIcon: info.arrowIcon,
    };
  });

  list.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return list.slice(0, limit);
};
