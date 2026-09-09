import {
  CityId,
  Pandal,
  TripPlan,
  TripLocation,
  ItineraryStop,
  ItinerarySummary,
  ItineraryOptimizationSuggestion,
  PlannedItinerary,
  WalkingPreference,
  TransportPreference,
  RecommendationLevel,
  JourneyRouteComparison,
  ModeRouteOption,
} from '../types';
import {
  calculateHaversineDistance,
  calculateDistanceAndDirection,
  formatDistance,
  URBAN_WALKING_CIRCUITY_FACTOR,
} from '../utils/geoUtils';
import { getWorthwhileNearbyPandals } from './pandalRecommendationService';
import { compareAllTransportModes, WALKING_SPEEDS } from './smartTransportEngine';

/**
 * Parses time string 'HH:MM' (24-hour or 12-hour format) into minutes from midnight.
 */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 18 * 60; // default 18:00 (6:00 PM)

  // Handle 12-hour format with AM/PM (e.g., "06:30 PM")
  const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Handle standard 24-hour "HH:MM"
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    return h * 60 + m;
  }

  return 18 * 60;
}

/**
 * Formats minutes from midnight into human-readable 12-hour time (e.g. "6:30 PM").
 */
export function formatMinutesTo12Hour(totalMinutes: number): string {
  // Normalize within 24 hours (or next day)
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours24 = Math.floor(normalized / 60);
  const minutes = normalized % 60;

  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minPadded = minutes.toString().padStart(2, '0');

  const nextDayIndicator = Math.floor(totalMinutes / 1440) > 0 ? ' (+1 day)' : '';
  return `${hours12}:${minPadded} ${period}${nextDayIndicator}`;
}

/**
 * Formats duration in minutes into clean "Xh Ym" string.
 */
export function formatDurationHoursMins(durationMinutes: number): string {
  const mins = Math.max(0, Math.round(durationMinutes));
  const h = Math.floor(mins / 60);
  const m = mins % 60;

  if (h === 0) return `${m} mins`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Calculates total available time window in minutes from start time to end time.
 * Automatically handles cross-midnight durations (e.g., 20:00 to 02:00 = 6 hours).
 */
export function calculateAvailableTimeMinutes(startTimeStr: string, endTimeStr: string): number {
  const startMins = parseTimeToMinutes(startTimeStr);
  const endMins = parseTimeToMinutes(endTimeStr);

  if (endMins >= startMins) {
    return endMins - startMins;
  }
  // Crosses midnight (e.g. 21:00 to 03:00)
  return 1440 - startMins + endMins;
}

/**
 * Estimate leg travel details (transport mode, time, distance) between two geographic points
 * Powered by the Smart Transport & Route Engine
 */
export function calculateLegTravel(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  walkingPref: WalkingPreference,
  transportPref: TransportPreference,
  fromPandal?: Pandal,
  toPandal?: Pandal,
  maxWalkingDistanceMeters?: number | null,
  city: CityId = 'kolkata'
): {
  straightDistanceMeters: number;
  walkingDistanceMeters: number;
  formattedDistance: string;
  travelMinutes: number;
  transportMode: 'walking' | 'metro' | 'bus' | 'auto_mixed';
  transportModeLabel: string;
  transportIcon: string;
  smartRecommendationReason?: string;
  routeComparison?: JourneyRouteComparison;
  smartModeOption?: ModeRouteOption;
} {
  const comparison = compareAllTransportModes({
    originLat: fromLat,
    originLng: fromLng,
    destinationLat: toLat,
    destinationLng: toLng,
    originName: fromPandal ? fromPandal.name : 'Start Location',
    destinationName: toPandal ? toPandal.name : 'Destination',
    fromPandal,
    toPandal,
    walkingPreference: walkingPref,
    transportPreference: transportPref,
    maxWalkingDistanceMeters,
    city,
  });

  const best = comparison.recommendedOption;

  // Map SmartTransportMode to legacy 4-tuple for backward compatibility
  let legacyMode: 'walking' | 'metro' | 'bus' | 'auto_mixed' = 'walking';
  if (best.mode === 'metro' || best.mode === 'mixed_metro_walk') legacyMode = 'metro';
  else if (best.mode === 'bus' || best.mode === 'mixed_bus_walk') legacyMode = 'bus';
  else if (best.mode === 'auto_rickshaw') legacyMode = 'auto_mixed';

  return {
    straightDistanceMeters: comparison.straightDistanceMeters,
    walkingDistanceMeters: best.walkingDistanceMeters,
    formattedDistance: formatDistance(comparison.straightDistanceMeters),
    travelMinutes: best.totalDurationMinutes,
    transportMode: legacyMode,
    transportModeLabel: `${best.modeLabel} (~${best.totalDurationMinutes}m)`,
    transportIcon: best.icon,
    smartRecommendationReason: best.recommendationReason,
    routeComparison: comparison,
    smartModeOption: best,
  };
}

/**
 * Smart Optimizer: Finds an optimal sequential order of pandals starting from
 * Start Location and heading towards End Location.
 *
 * Prefers:
 * 1. High-worth pandals (using Worth Score)
 * 2. Nearby sequential pandals
 * 3. Minimizing unnecessary zig-zag backtracking
 * 4. User's walking/transport preference
 */
export function optimizePandalSequence(
  startLoc: TripLocation,
  endLoc: TripLocation,
  selectedPandals: Pandal[],
  walkingPref: WalkingPreference,
  transportPref: TransportPreference
): Pandal[] {
  if (selectedPandals.length <= 1) {
    return [...selectedPandals];
  }

  // If small count (<= 7), solve optimal path balancing travel distance, backtracking and early high-worth visits
  const remaining = [...selectedPandals];
  const ordered: Pandal[] = [];

  let currentLat = startLoc.latitude;
  let currentLng = startLoc.longitude;

  while (remaining.length > 0) {
    let bestIndex = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const candidate = remaining[i];
      const distFromCurrent = calculateHaversineDistance(
        currentLat,
        currentLng,
        candidate.latitude,
        candidate.longitude
      );

      // Distance to final end location from candidate
      const distToEnd = calculateHaversineDistance(
        candidate.latitude,
        candidate.longitude,
        endLoc.latitude,
        endLoc.longitude
      );

      // Worth Score factor (0-100)
      const worth = candidate.overallQualityScore * 10;

      // Distance penalty (prefer closer stops)
      const distancePenalty = (distFromCurrent / 1000) * 14;

      // Backtracking heuristic: if candidate moves in opposite direction of end location
      const totalDetour = (distFromCurrent + distToEnd) / 1000;
      const detourPenalty = totalDetour * 4;

      // Final composite choice heuristic
      const candidateScore = worth * 0.45 - distancePenalty - detourPenalty;

      if (candidateScore > bestScore) {
        bestScore = candidateScore;
        bestIndex = i;
      }
    }

    const chosen = remaining.splice(bestIndex, 1)[0];
    ordered.push(chosen);
    currentLat = chosen.latitude;
    currentLng = chosen.longitude;
  }

  return ordered;
}

/**
 * Generates a full PlannedItinerary with timed stops, timeline breakdown,
 * feasibility warnings, and 1-click removal/adjustment suggestions.
 */
export function generatePlannedItinerary(
  trip: TripPlan,
  allPandals: Pandal[],
  customPandalSequence?: Pandal[]
): PlannedItinerary {
  const pandalsMap = new Map<string, Pandal>();
  allPandals.forEach((p) => pandalsMap.set(p.id, p));

  // 1. Resolve selected pandals in requested/optimized sequence
  let sequencePandals: Pandal[];
  if (customPandalSequence && customPandalSequence.length > 0) {
    sequencePandals = customPandalSequence;
  } else {
    const rawSelected = trip.selectedPandalIds
      .map((id) => pandalsMap.get(id))
      .filter((p): p is Pandal => p !== undefined);

    sequencePandals = optimizePandalSequence(
      trip.startLocation,
      trip.endLocation,
      rawSelected,
      trip.walkingPreference,
      trip.preferredTransport
    );
  }

  const startMins = parseTimeToMinutes(trip.startTime);
  const availableTimeMinutes = calculateAvailableTimeMinutes(trip.startTime, trip.endTime);

  const stops: ItineraryStop[] = [];
  let currentMinutes = startMins;
  let prevLat = trip.startLocation.latitude;
  let prevLng = trip.startLocation.longitude;
  let prevPandal: Pandal | undefined = undefined;

  let totalWalkingMeters = 0;
  let totalTransportMinutes = 0;
  let totalVisitMinutes = 0;

  // 1. START STOP
  stops.push({
    id: 'stop-start',
    type: 'start',
    stopIndex: 0,
    locationName: trip.startLocation.name,
    bengaliLocationName: trip.startLocation.bengaliName || 'শুরু স্থান',
    distanceFromPrevMeters: 0,
    formattedDistanceFromPrev: '0m',
    bearingDegreesFromPrev: 0,
    directionFromPrev: 'North',
    bengaliDirectionFromPrev: 'উত্তর',
    arrowIconFromPrev: '📍',
    estimatedTravelMinutes: 0,
    estimatedVisitDurationMinutes: 0,
    transportMode: 'walking',
    transportModeLabel: 'Starting Point (যাত্রা সূচনা)',
    transportIcon: '🚩',
    plannedArrivalTime: formatMinutesTo12Hour(currentMinutes),
    plannedDepartureTime: formatMinutesTo12Hour(currentMinutes),
  });

  // 2. PANDAL STOPS
  sequencePandals.forEach((pandal, idx) => {
    const geo = calculateDistanceAndDirection(prevLat, prevLng, pandal.latitude, pandal.longitude);
    const leg = calculateLegTravel(
      prevLat,
      prevLng,
      pandal.latitude,
      pandal.longitude,
      trip.walkingPreference,
      trip.preferredTransport,
      prevPandal,
      pandal,
      trip.maxWalkingDistanceMeters,
      trip.city
    );

    // Update travel time & distance
    currentMinutes += leg.travelMinutes;
    totalTransportMinutes += leg.travelMinutes;
    totalWalkingMeters += leg.walkingDistanceMeters;

    const arrivalTime = formatMinutesTo12Hour(currentMinutes);

    // Visit duration (pandal base + queue wait allowance)
    const visitDuration = pandal.estimatedVisitDuration || 30;
    totalVisitMinutes += visitDuration;

    const departureMinutes = currentMinutes + visitDuration;
    const departureTime = formatMinutesTo12Hour(departureMinutes);
    currentMinutes = departureMinutes;

    // Calculate Worth Score for this pandal
    const worth = Math.round(pandal.overallQualityScore * 10);

    stops.push({
      id: `stop-${pandal.id}`,
      type: 'pandal',
      stopIndex: idx + 1,
      pandalId: pandal.id,
      pandal,
      locationName: pandal.name,
      bengaliLocationName: pandal.bengaliName,
      recommendationLevel: pandal.recommendationLevel,
      worthScore: worth,
      distanceFromPrevMeters: leg.straightDistanceMeters,
      formattedDistanceFromPrev: leg.formattedDistance,
      bearingDegreesFromPrev: geo.bearingDegrees,
      directionFromPrev: geo.direction,
      bengaliDirectionFromPrev: geo.bengaliDirection,
      arrowIconFromPrev: geo.arrowIcon,
      estimatedTravelMinutes: leg.travelMinutes,
      estimatedVisitDurationMinutes: visitDuration,
      transportMode: leg.transportMode,
      transportModeLabel: leg.transportModeLabel,
      transportIcon: leg.transportIcon,
      smartRecommendationReason: leg.smartRecommendationReason,
      routeComparison: leg.routeComparison,
      smartModeOption: leg.smartModeOption,
      plannedArrivalTime: arrivalTime,
      plannedDepartureTime: departureTime,
      isVisited: false,
    });

    prevLat = pandal.latitude;
    prevLng = pandal.longitude;
    prevPandal = pandal;
  });

  // 3. END STOP
  const endGeo = calculateDistanceAndDirection(
    prevLat,
    prevLng,
    trip.endLocation.latitude,
    trip.endLocation.longitude
  );
  const endLeg = calculateLegTravel(
    prevLat,
    prevLng,
    trip.endLocation.latitude,
    trip.endLocation.longitude,
    trip.walkingPreference,
    trip.preferredTransport,
    prevPandal,
    undefined,
    trip.maxWalkingDistanceMeters,
    trip.city
  );

  currentMinutes += endLeg.travelMinutes;
  totalTransportMinutes += endLeg.travelMinutes;
  totalWalkingMeters += endLeg.walkingDistanceMeters;

  stops.push({
    id: 'stop-end',
    type: 'end',
    stopIndex: sequencePandals.length + 1,
    locationName: trip.endLocation.name,
    bengaliLocationName: trip.endLocation.bengaliName || 'সমাপ্তি স্থান',
    distanceFromPrevMeters: endLeg.straightDistanceMeters,
    formattedDistanceFromPrev: endLeg.formattedDistance,
    bearingDegreesFromPrev: endGeo.bearingDegrees,
    directionFromPrev: endGeo.direction,
    bengaliDirectionFromPrev: endGeo.bengaliDirection,
    arrowIconFromPrev: endGeo.arrowIcon,
    estimatedTravelMinutes: endLeg.travelMinutes,
    estimatedVisitDurationMinutes: 0,
    transportMode: endLeg.transportMode,
    transportModeLabel: endLeg.transportModeLabel,
    transportIcon: '🏁',
    smartRecommendationReason: endLeg.smartRecommendationReason,
    routeComparison: endLeg.routeComparison,
    smartModeOption: endLeg.smartModeOption,
    plannedArrivalTime: formatMinutesTo12Hour(currentMinutes),
    plannedDepartureTime: formatMinutesTo12Hour(currentMinutes),
  });

  // 4. SUMMARY & FEASIBILITY ANALYSIS
  const totalTripDurationMinutes = currentMinutes - startMins;
  const timeDifferenceMinutes = totalTripDurationMinutes - availableTimeMinutes;

  let timeFeasibilityStatus: 'fits_well' | 'tight' | 'exceeds_time' = 'fits_well';
  let warningMessage: string | undefined = undefined;
  const suggestions: ItineraryOptimizationSuggestion[] = [];

  if (timeDifferenceMinutes > 0) {
    timeFeasibilityStatus = 'exceeds_time';
    warningMessage = `⚠️ Your current plan is approximately ${formatDurationHoursMins(
      timeDifferenceMinutes
    )} longer than your available time (${formatDurationHoursMins(availableTimeMinutes)}).`;

    // Suggest removing lower-priority / optional pandals
    // Rank pandals by lowest worth / optional level
    const candidatesForRemoval = [...sequencePandals].sort((a, b) => {
      const priorityOrder: Record<RecommendationLevel, number> = {
        Optional: 1,
        Good: 2,
        'Highly Recommended': 3,
        'Must Visit': 4,
      };
      if (priorityOrder[a.recommendationLevel] !== priorityOrder[b.recommendationLevel]) {
        return priorityOrder[a.recommendationLevel] - priorityOrder[b.recommendationLevel];
      }
      return a.overallQualityScore - b.overallQualityScore;
    });

    candidatesForRemoval.slice(0, 2).forEach((pandal) => {
      const timeSaved = pandal.estimatedVisitDuration + 20; // visit + avg leg transit
      suggestions.push({
        id: `sug-remove-${pandal.id}`,
        action: 'remove_pandal',
        pandalId: pandal.id,
        pandalName: pandal.name,
        recommendationLevel: pandal.recommendationLevel,
        timeSavedMinutes: timeSaved,
        explanation: `Remove ${pandal.name} (${pandal.recommendationLevel}) — saves approximately ${timeSaved} minutes.`,
      });
    });

    if (trip.preferredTransport === 'walking' && sequencePandals.length > 3) {
      suggestions.push({
        id: 'sug-switch-transport',
        action: 'change_transport',
        timeSavedMinutes: Math.round(totalTransportMinutes * 0.4),
        explanation: `Switch transport mode from Walking to Mixed/Auto — saves approximately ${Math.round(
          totalTransportMinutes * 0.4
        )} minutes on transit legs.`,
      });
    }
  } else if (Math.abs(timeDifferenceMinutes) <= 20) {
    timeFeasibilityStatus = 'tight';
    warningMessage = `⚡ Tight schedule: You have only ~${Math.abs(
      timeDifferenceMinutes
    )} mins buffer remaining. Consider fast-track queue entry or VIP passes.`;
  }

  const summary: ItinerarySummary = {
    pandalCount: sequencePandals.length,
    totalTripDurationMinutes,
    formattedTotalDuration: formatDurationHoursMins(totalTripDurationMinutes),
    totalWalkingDistanceMeters: totalWalkingMeters,
    formattedTotalWalkingDistance: formatDistance(totalWalkingMeters),
    totalTransportMinutes,
    formattedTransportTime: formatDurationHoursMins(totalTransportMinutes),
    totalVisitDurationMinutes: totalVisitMinutes,
    formattedVisitTime: formatDurationHoursMins(totalVisitMinutes),
    plannedStartTime: formatMinutesTo12Hour(startMins),
    plannedEndTime: formatMinutesTo12Hour(currentMinutes),
    availableTimeMinutes,
    timeFeasibilityStatus,
    timeDifferenceMinutes,
    warningMessage,
    suggestions,
  };

  return {
    trip,
    stops,
    summary,
  };
}
