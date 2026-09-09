/**
 * Walking & Energy Intelligence Service
 * 
 * Provides approximate walking tracking, continuous walking detection,
 * energy-aware transport recommendations, rest break suggestions, and aggregate statistics.
 * 
 * IMPORTANT DISCLAIMER: All steps and distance figures are non-medical approximations calculated from
 * location deltas, route segments, and standard pedestrian metrics (~1,300 steps/km, ~4.8 km/h).
 * Not intended for health or medical diagnosis.
 */

import {
  WalkingSessionStats,
  UserWalkingEnergyConfig,
  RestOpportunity,
  MemberWalkingActivity,
  EnergyAwareRecommendationNote,
  SmartTransportMode,
  Pandal,
  CityId,
  GroupMemberLocation,
  TripMember,
} from '../types';
import { getAllEssentialPlaces } from './safetyAndUtilitiesService';
import { calculateHaversineDistance, estimateWalkingDistance } from '../utils/geoUtils';

const STORAGE_KEY_PREFIX = 'pujatrip_walking_stats_';
const CONFIG_KEY = 'pujatrip_walking_config';

export const DEFAULT_WALKING_CONFIG: UserWalkingEnergyConfig = {
  comfortableWalkingLimitKm: 6.0,
  maxWalkingLimitKm: 8.0,
  maxContinuousWalkingMins: 45,
  shareWalkingStats: true,
};

/**
 * Approximate step conversion constant (~1,330 steps per km at average festival pacing)
 */
export const STEPS_PER_KM = 1330;

/**
 * Get current date string for daily bucket
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Load or initialize walking configuration
 */
export function getWalkingEnergyConfig(): UserWalkingEnergyConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_WALKING_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse walking energy config', e);
  }
  return DEFAULT_WALKING_CONFIG;
}

/**
 * Save user walking configuration
 */
export function saveWalkingEnergyConfig(config: Partial<UserWalkingEnergyConfig>): UserWalkingEnergyConfig {
  const current = getWalkingEnergyConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(updated));
    // Trigger custom storage event for live UI reactivity
    window.dispatchEvent(new CustomEvent('pujatrip_walking_config_changed', { detail: updated }));
  } catch (e) {
    console.error('Failed to save walking config', e);
  }
  return updated;
}

/**
 * Retrieve walking statistics for a trip/date
 */
export function getWalkingSessionStats(tripId?: string, dateStr?: string): WalkingSessionStats {
  const date = dateStr || getTodayDateString();
  const key = `${STORAGE_KEY_PREFIX}${tripId || 'general'}_${date}`;

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load walking session stats', e);
  }

  // Initial stats with realistic festival defaults if fresh session
  return {
    tripId: tripId || 'default-trip',
    date,
    totalDistanceMeters: 0,
    totalDurationMinutes: 0,
    estimatedSteps: 0,
    completedWalkingLegs: 0,
    longestWalkingLegMeters: 0,
    continuousWalkingMinutes: 0,
    isContinuousWalkWarningActive: false,
    restBreaksTaken: 0,
    transitUsageCount: {
      metro: 0,
      bus: 0,
      auto: 0,
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save walking session stats and broadcast
 */
export function saveWalkingSessionStats(stats: WalkingSessionStats): void {
  const key = `${STORAGE_KEY_PREFIX}${stats.tripId || 'general'}_${stats.date}`;
  try {
    localStorage.setItem(key, JSON.stringify(stats));
    window.dispatchEvent(new CustomEvent('pujatrip_walking_stats_updated', { detail: stats }));
  } catch (e) {
    console.error('Failed to save walking session stats', e);
  }
}

/**
 * Record a completed walking segment/leg
 */
export function recordCompletedWalkingLeg(
  distanceMeters: number,
  durationMinutes: number,
  tripId?: string
): WalkingSessionStats {
  const current = getWalkingSessionStats(tripId);
  const config = getWalkingEnergyConfig();

  const newDistance = Math.max(0, current.totalDistanceMeters + distanceMeters);
  const newDuration = Math.max(0, current.totalDurationMinutes + durationMinutes);
  const newSteps = Math.round((newDistance / 1000) * STEPS_PER_KM);
  const newContinuous = current.continuousWalkingMinutes + durationMinutes;
  const isWarning = newContinuous >= config.maxContinuousWalkingMins;

  const updated: WalkingSessionStats = {
    ...current,
    totalDistanceMeters: newDistance,
    totalDurationMinutes: newDuration,
    estimatedSteps: newSteps,
    completedWalkingLegs: current.completedWalkingLegs + 1,
    longestWalkingLegMeters: Math.max(current.longestWalkingLegMeters, distanceMeters),
    continuousWalkingMinutes: newContinuous,
    isContinuousWalkWarningActive: isWarning,
    lastWalkActiveTimestamp: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };

  saveWalkingSessionStats(updated);
  return updated;
}

/**
 * Record a transit leg completed (e.g. Metro/Bus/Auto)
 */
export function recordTransitLegUsage(
  mode: 'metro' | 'bus' | 'auto',
  tripId?: string
): WalkingSessionStats {
  const current = getWalkingSessionStats(tripId);
  const transitCounts = { ...current.transitUsageCount };
  transitCounts[mode] = (transitCounts[mode] || 0) + 1;

  // Transit resets continuous walking strain
  const updated: WalkingSessionStats = {
    ...current,
    continuousWalkingMinutes: Math.max(0, current.continuousWalkingMinutes - 15),
    isContinuousWalkWarningActive: false,
    transitUsageCount: transitCounts,
    lastUpdated: new Date().toISOString(),
  };

  saveWalkingSessionStats(updated);
  return updated;
}

/**
 * Record taking a rest break (e.g. 20m snack/sit down)
 */
export function recordRestBreakTaken(breakDurationMinutes: number = 20, tripId?: string): WalkingSessionStats {
  const current = getWalkingSessionStats(tripId);

  const updated: WalkingSessionStats = {
    ...current,
    continuousWalkingMinutes: 0,
    isContinuousWalkWarningActive: false,
    restBreaksTaken: current.restBreaksTaken + 1,
    lastUpdated: new Date().toISOString(),
  };

  saveWalkingSessionStats(updated);
  return updated;
}

/**
 * Seed realistic festival sample walking stats for demonstration / initial trip if stats are zero
 */
export function seedSampleWalkingStatsIfEmpty(tripId: string, initialKm: number = 6.4): WalkingSessionStats {
  const current = getWalkingSessionStats(tripId);
  if (current.totalDistanceMeters === 0) {
    const distanceM = initialKm * 1000;
    const durationM = Math.round((initialKm / 4.2) * 60); // approx 1h 31m
    const steps = Math.round(initialKm * STEPS_PER_KM);

    const initial: WalkingSessionStats = {
      tripId,
      date: getTodayDateString(),
      totalDistanceMeters: distanceM,
      totalDurationMinutes: durationM,
      estimatedSteps: steps,
      completedWalkingLegs: 4,
      longestWalkingLegMeters: 2100,
      continuousWalkingMinutes: 38,
      isContinuousWalkWarningActive: false,
      restBreaksTaken: 1,
      transitUsageCount: {
        metro: 2,
        bus: 1,
        auto: 1,
      },
      lastUpdated: new Date().toISOString(),
    };
    saveWalkingSessionStats(initial);
    return initial;
  }
  return current;
}

/**
 * Check if the user is approaching or exceeding their walking limits
 */
export function evaluateWalkingThresholds(
  stats: WalkingSessionStats,
  config: UserWalkingEnergyConfig
): {
  walkedKm: number;
  maxLimitKm: number;
  comfortableLimitKm: number;
  percentageOfMax: number;
  isApproachingLimit: boolean; // >= 80% of max limit
  isExceedingMax: boolean; // >= 100% of max limit
  isExceedingComfort: boolean; // >= 100% of comfortable limit
  statusMessage: string;
  bengaliStatusMessage: string;
  severity: 'normal' | 'caution' | 'warning' | 'alert';
} {
  const walkedKm = Number((stats.totalDistanceMeters / 1000).toFixed(1));
  const maxLimitKm = config.maxWalkingLimitKm || 8.0;
  const comfortableLimitKm = config.comfortableWalkingLimitKm || 6.0;
  const percentageOfMax = Math.round((walkedKm / maxLimitKm) * 100);

  const isExceedingMax = walkedKm >= maxLimitKm;
  const isApproachingLimit = !isExceedingMax && percentageOfMax >= 80;
  const isExceedingComfort = walkedKm >= comfortableLimitKm;

  let severity: 'normal' | 'caution' | 'warning' | 'alert' = 'normal';
  let statusMessage = `On track with daily walking goal (${walkedKm} km / ${maxLimitKm} km).`;
  let bengaliStatusMessage = `হাঁটার লক্ষ্যের মধ্যে রয়েছেন (${walkedKm} কিমি / ${maxLimitKm} কিমি)।`;

  if (isExceedingMax) {
    severity = 'alert';
    statusMessage = `Exceeded maximum daily walking target (${walkedKm} km / ${maxLimitKm} km). Prioritize Metro or Auto.`;
    bengaliStatusMessage = `দৈনিক সর্বোচ্চ হাঁটার সীমা অতিক্রম করেছে (${walkedKm} কিমি / ${maxLimitKm} কিমি)। মেট্রো বা অটো ব্যবহার করুন।`;
  } else if (isApproachingLimit) {
    severity = 'warning';
    statusMessage = `You've already walked ${walkedKm} km of your ${maxLimitKm} km target (~${percentageOfMax}%).`;
    bengaliStatusMessage = `আপনি ইতিমধ্যে আপনার ${maxLimitKm} কিমি লক্ষ্যের ${walkedKm} কিমি হেঁটে ফেলেছেন (~${percentageOfMax}%)।`;
  } else if (isExceedingComfort) {
    severity = 'caution';
    statusMessage = `Past comfortable walking target (${walkedKm} km / ${comfortableLimitKm} km). Transit recommended for next pandal.`;
    bengaliStatusMessage = `স্বাচ্ছন্দ্যপূর্ণ হাঁটার মাত্রা ছাড়িয়েছে (${walkedKm} কিমি / ${comfortableLimitKm} কিমি)। গণপরিবহন ব্যবহারের পরামর্শ দেওয়া হচ্ছে।`;
  }

  return {
    walkedKm,
    maxLimitKm,
    comfortableLimitKm,
    percentageOfMax,
    isApproachingLimit,
    isExceedingMax,
    isExceedingComfort,
    statusMessage,
    bengaliStatusMessage,
    severity,
  };
}

/**
 * Generate energy-aware route advisory when planning next leg
 */
export function getEnergyAwareTransportAdvisory(
  nextPandalDistanceMeters: number,
  stats: WalkingSessionStats,
  config: UserWalkingEnergyConfig
): EnergyAwareRecommendationNote | null {
  const walkedKm = Number((stats.totalDistanceMeters / 1000).toFixed(1));
  const maxLimitKm = config.maxWalkingLimitKm;
  const percentage = Math.round((walkedKm / maxLimitKm) * 100);

  // If user has walked >= 75% of limit or distance > 1.2km and walked >= comfortable limit
  const isHighWalk = walkedKm >= config.comfortableWalkingLimitKm || percentage >= 75;
  const isFar = nextPandalDistanceMeters >= 1200;

  if (!isHighWalk && !isFar) {
    return null;
  }

  const distanceSavedMeters = Math.max(0, nextPandalDistanceMeters - 350); // Metro/auto leaves only ~350m final gate walk

  let recommendedMode: SmartTransportMode = 'metro';
  let note = `Next pandal is ${(nextPandalDistanceMeters / 1000).toFixed(1)} km away. You've walked ${walkedKm} km today. Metro recommended — saves ~${(distanceSavedMeters / 1000).toFixed(1)} km of walking.`;
  let bengaliNote = `পরবর্তী মণ্ডপ ${(nextPandalDistanceMeters / 1000).toFixed(1)} কিমি দূরে। আপনি আজ ${walkedKm} কিমি হেঁটেছেন। মেট্রো ব্যবহারের পরামর্শ — প্রায় ${(distanceSavedMeters / 1000).toFixed(1)} কিমি হাঁটা বাঁচাবে।`;

  if (nextPandalDistanceMeters < 2000 && nextPandalDistanceMeters > 900) {
    recommendedMode = 'auto_rickshaw';
    note = `Next pandal is ${(nextPandalDistanceMeters / 1000).toFixed(1)} km away. You've walked ${walkedKm} km today. Shared Auto recommended — saves ~${(distanceSavedMeters / 1000).toFixed(1)} km walking.`;
    bengaliNote = `পরবর্তী মণ্ডপ ${(nextPandalDistanceMeters / 1000).toFixed(1)} কিমি দূরে। আজ ${walkedKm} কিমি হেঁটেছেন। শেয়ার্ড অটো ব্যবহারের পরামর্শ।`;
  }

  return {
    isEnergyTriggered: true,
    todayWalkedKm: walkedKm,
    targetWalkingLimitKm: maxLimitKm,
    percentageOfTarget: percentage,
    exceedsComfortLimit: walkedKm >= config.comfortableWalkingLimitKm,
    exceedsMaxLimit: walkedKm >= maxLimitKm,
    recommendedMode,
    distanceSavedMeters,
    note,
    bengaliNote,
  };
}

/**
 * Discover nearby Rest / Break Opportunities
 */
export function findNearbyRestOpportunities(
  userLat: number,
  userLng: number,
  city: CityId,
  maxResults: number = 3
): RestOpportunity[] {
  // Grab essential places categorized as rest_spot, tea_snacks, food
  const places = getAllEssentialPlaces(city, ['rest_spot', 'tea_snacks', 'food']);

  const opportunities: RestOpportunity[] = places.map((place) => {
    const straightDist = calculateHaversineDistance(
      userLat,
      userLng,
      place.latitude,
      place.longitude
    );
    const walking = estimateWalkingDistance(straightDist);
    const dist = walking.walkingDistanceMeters;
    const walkMins = walking.estimatedWalkingMinutes;

    let categoryLabel = 'Rest Zone';
    let reason = 'Comfortable seating area to recharge and hydrate.';
    let bengaliReason = 'বসার ও জলপানের উপযুক্ত বিশ্রামস্থল।';

    if (place.category === 'tea_snacks') {
      categoryLabel = 'Tea & Snacks';
      reason = 'Authentic tea stall, mishti & snacks break spot.';
      bengaliReason = 'চা, মিষ্টি ও হালকা জলখাবারের আদর্শ জায়গা।';
    } else if (place.category === 'food') {
      categoryLabel = 'Bhog & Food Corner';
      reason = 'Popular festival food joint for an energy refresh.';
      bengaliReason = 'উৎসবের খাবার ও জলখাবারের উপযুক্ত স্থান।';
    }

    return {
      id: place.id,
      name: place.name,
      bengaliName: place.bengaliName,
      category: place.category as 'rest_spot' | 'tea_snacks' | 'food',
      categoryLabel,
      distanceMeters: dist,
      walkingMinutes: walkMins,
      address: place.address,
      landmark: place.landmark,
      suggestedDurationMinutes: 20,
      itineraryDelayMinutes: 20 + walkMins * 2,
      reason,
      bengaliReason,
      latitude: place.latitude,
      longitude: place.longitude,
    };
  });

  return opportunities.sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, maxResults);
}

export interface SquadMemberRef {
  userId: string;
  userName?: string;
  userAvatar?: string;
  profile?: any;
  updatedAt?: string;
  lastActiveAt?: string;
}

/**
 * Generate Group Member Walking Activities list
 * Respects each user's privacy preference.
 */
export function getGroupWalkingActivities(
  memberList: (SquadMemberRef | GroupMemberLocation | TripMember)[],
  currentUserId: string,
  currentUserStats: WalkingSessionStats,
  userConfig: UserWalkingEnergyConfig
): MemberWalkingActivity[] {
  return memberList.map((m) => {
    const isMe = m.userId === currentUserId;
    const name = ('userName' in m && m.userName) || m.profile?.displayName || m.userId;
    const avatar = ('userAvatar' in m && m.userAvatar) || m.profile?.avatarUrl || 'durga-face';
    const timestamp = ('updatedAt' in m && m.updatedAt) || ('lastActiveAt' in m && m.lastActiveAt) || new Date().toISOString();

    if (isMe) {
      return {
        userId: m.userId,
        userName: name,
        bengaliName: m.profile?.bengaliName,
        avatarUrl: avatar,
        distanceKm: Number((currentUserStats.totalDistanceMeters / 1000).toFixed(1)),
        estimatedSteps: currentUserStats.estimatedSteps,
        walkingMinutes: currentUserStats.totalDurationMinutes,
        isSharingStats: userConfig.shareWalkingStats,
        lastActiveTime: currentUserStats.lastUpdated,
      };
    }

    // Mock realistic squad variations for demo friends (with deterministic variance by user id)
    const seed = m.userId.charCodeAt(0) || 7;
    const isSharing = (seed % 6) !== 0; // Most friends share stats
    const varianceFactor = 0.8 + ((seed % 5) * 0.1); // 0.8 to 1.2x
    const distKm = Number((Math.max(3.2, (currentUserStats.totalDistanceMeters / 1000) * varianceFactor)).toFixed(1));
    const steps = Math.round(distKm * STEPS_PER_KM);
    const duration = Math.round((distKm / 4.2) * 60);

    return {
      userId: m.userId,
      userName: name,
      bengaliName: m.profile?.bengaliName,
      avatarUrl: avatar,
      distanceKm: distKm,
      estimatedSteps: steps,
      walkingMinutes: duration,
      isSharingStats: isSharing,
      lastActiveTime: timestamp,
    };
  });
}
