import {
  TripPlan,
  Pandal,
  PlannedItinerary,
  DynamicReplanningOption,
  RunningLateStatus,
  LocationWeather,
} from '../types';
import { getPandalCrowdStatus } from './crowdIntelligenceService';
import { calculateDynamicVisitScore } from './dynamicVisitScoreService';
import { getCachedWeatherSync, isRainLikelySoon } from './weatherService';
import { calculateHaversineDistance, formatDistance } from '../utils/geoUtils';
import { parseTimeToMinutes, formatMinutesTo12Hour, formatDurationHoursMins } from './tripPlanningEngine';

/**
 * Evaluates whether an active trip plan should trigger dynamic replanning recommendations.
 *
 * Triggers:
 * 1. Queue Spike at an upcoming pandal (e.g. Sreebhumi queue spiked from 20 -> 55 min)
 *    -> Reorders sequence so heavy-queue pandal is visited later or bypassed
 * 2. Rain approaching in sector during outdoor walking leg
 *    -> Suggests Metro mode switch or moving covered pandals first
 * 3. Inefficient sequence (e.g. backtracking found that saves > 20 mins if swapped)
 */
export function evaluateDynamicReplanning(
  trip: TripPlan,
  allPandals: Pandal[],
  currentItinerary: PlannedItinerary,
  visitedPandalIds: Set<string> = new Set(),
  customWeather?: LocationWeather
): DynamicReplanningOption | null {
  const pandalsMap = new Map<string, Pandal>();
  allPandals.forEach((p) => pandalsMap.set(p.id, p));

  const weather = customWeather || getCachedWeatherSync(trip.city);
  const rainInfo = isRainLikelySoon(weather, 45);

  // Remaining unvisited pandals in current itinerary order
  const remainingPandalIds = trip.selectedPandalIds.filter((id) => !visitedPandalIds.has(id));
  if (remainingPandalIds.length < 2) {
    return null; // Not enough remaining stops to reorder
  }

  const remainingPandals = remainingPandalIds
    .map((id) => pandalsMap.get(id))
    .filter((p): p is Pandal => p !== undefined);

  // -------------------------------------------------------------
  // TRIGGER 1: QUEUE SPIKE DETECTION
  // Check if any intermediate upcoming pandal has an extreme queue spike (>45 min or increasing sharply)
  // while a later pandal has lower queue and high quality.
  // -------------------------------------------------------------
  const crowdStatuses = remainingPandals.map((p) => ({
    pandal: p,
    crowd: getPandalCrowdStatus(p.id, p),
    visitScore: calculateDynamicVisitScore(p, undefined, weather),
  }));

  // Find if early stop has huge queue (>45 mins) and later stop is clear (<25 mins)
  const heavyQueueIndex = crowdStatuses.findIndex(
    (item, idx) => idx < crowdStatuses.length - 1 && item.crowd.queueWaitMinutes >= 45
  );

  if (heavyQueueIndex !== -1) {
    const spikeItem = crowdStatuses[heavyQueueIndex];
    // Find if there is a later stop with lower queue
    const lowerQueueIndex = crowdStatuses.findIndex(
      (item, idx) => idx > heavyQueueIndex && item.crowd.queueWaitMinutes <= 25
    );

    if (lowerQueueIndex !== -1) {
      const betterItem = crowdStatuses[lowerQueueIndex];

      // Formulate suggested sequence: move spikeItem to after betterItem (or towards end)
      const suggestedIds = [...remainingPandalIds];
      const [movedId] = suggestedIds.splice(heavyQueueIndex, 1);
      suggestedIds.push(movedId); // Move heavy queue to end so queue might subside

      const currentNames = remainingPandals.map((p) => p.name);
      const suggestedNames = suggestedIds.map((id) => pandalsMap.get(id)?.name || id);

      const timeSavedMinutes = Math.min(35, spikeItem.crowd.queueWaitMinutes - betterItem.crowd.queueWaitMinutes);

      return {
        id: `replan-queue-${spikeItem.pandal.id}-${Date.now()}`,
        type: 'queue_spike',
        title: '⚠️ Heavy Queue Surge Detected',
        bengaliTitle: '⚠️ দীর্ঘ লাইনের কারণে যাত্রাপথ পরিবর্তনের পরামর্শ',
        severity: 'warning',
        triggerReason: `${spikeItem.pandal.name} queue increased to ~${spikeItem.crowd.queueWaitMinutes} min (${spikeItem.crowd.trend === 'increasing' ? '↗ Increasing' : 'High'}). Visiting ${betterItem.pandal.name} (~${betterItem.crowd.queueWaitMinutes}m queue) first saves time.`,
        bengaliTriggerReason: `${spikeItem.pandal.bengaliName || spikeItem.pandal.name}-এ লাইন বেড়ে ~${spikeItem.crowd.queueWaitMinutes} মিনিট হয়েছে। আগে ${betterItem.pandal.bengaliName || betterItem.pandal.name} দর্শন করলে সময় বাঁচবে।`,
        currentPandalIds: remainingPandalIds,
        suggestedPandalIds: suggestedIds,
        currentPandalNames: currentNames,
        suggestedPandalNames: suggestedNames,
        timeSavedMinutes: Math.max(15, timeSavedMinutes),
        walkingDistanceChangeMeters: -150, // slightly less or optimized
        transportChangeLabel: 'Avoids standing in peak surge queue',
        createdAt: new Date().toISOString(),
      };
    }
  }

  // -------------------------------------------------------------
  // TRIGGER 2: RAIN APPROACHING IN SECTOR
  // If rain is approaching in <45m and there is an outdoor walking sequence or outdoor pandal,
  // suggest switching to Metro or covered pandal sequence.
  // -------------------------------------------------------------
  if (rainInfo.likely) {
    const longWalkingStop = currentItinerary.stops.find(
      (s) => s.transportMode === 'walking' && s.distanceFromPrevMeters >= 1100 && !s.isVisited
    );

    if (longWalkingStop && longWalkingStop.pandal) {
      return {
        id: `replan-rain-${Date.now()}`,
        type: 'rain_approaching',
        title: '🌧️ Rain Approaching Route Corridor',
        bengaliTitle: '🌧️ বৃষ্টিপাতের সম্ভাবনা — মেট্রো ব্যবহারের পরামর্শ',
        severity: 'warning',
        triggerReason: `Rain expected in ~${rainInfo.inMinutes || 35} minutes (${rainInfo.rainProb}% prob). Walking leg (${(
          longWalkingStop.distanceFromPrevMeters / 1000
        ).toFixed(1)} km) to ${longWalkingStop.locationName} is exposed to rain.`,
        bengaliTriggerReason: `প্রায় ${rainInfo.inMinutes || 35} মিনিটে বৃষ্টির সম্ভাবনা (${rainInfo.rainProb}%)। ভিজে যাওয়া এড়াতে মেট্রো রুট ব্যবহার করুন।`,
        currentPandalIds: remainingPandalIds,
        suggestedPandalIds: remainingPandalIds, // same pandals, but transport mode recommendation
        currentPandalNames: remainingPandals.map((p) => p.name),
        suggestedPandalNames: remainingPandals.map((p) => p.name),
        timeSavedMinutes: 8,
        walkingDistanceChangeMeters: -650, // significantly less outdoor walking
        transportChangeLabel: 'Switch walking leg to 🚇 Metro',
        suggestedModeChanges: [
          {
            fromPandalName: 'Previous Stop',
            toPandalName: longWalkingStop.locationName,
            originalMode: '🚶 Walking',
            newMode: '🚇 Metro + Short Walk',
            timeSavedMinutes: 8,
          },
        ],
        createdAt: new Date().toISOString(),
      };
    }
  }

  // -------------------------------------------------------------
  // TRIGGER 3: GEOGRAPHIC BACKTRACKING / SEQUENCE IMPROVEMENT
  // Test if swapping two adjacent stops saves significant distance/time
  // -------------------------------------------------------------
  if (remainingPandals.length >= 3) {
    const p0 = remainingPandals[0];
    const p1 = remainingPandals[1];
    const p2 = remainingPandals[2];

    const currentDist =
      calculateHaversineDistance(p0.latitude, p0.longitude, p1.latitude, p1.longitude) +
      calculateHaversineDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);

    const swappedDist =
      calculateHaversineDistance(p0.latitude, p0.longitude, p2.latitude, p2.longitude) +
      calculateHaversineDistance(p2.latitude, p2.longitude, p1.latitude, p1.longitude);

    if (currentDist - swappedDist > 1200) {
      // Swapping saves > 1.2km of travel!
      const suggestedIds = [...remainingPandalIds];
      const temp = suggestedIds[1];
      suggestedIds[1] = suggestedIds[2];
      suggestedIds[2] = temp;

      const timeSaved = Math.round((currentDist - swappedDist) / 76); // ~15 mins saved

      return {
        id: `replan-backtrack-${Date.now()}`,
        type: 'better_sequence_available',
        title: '💡 More Direct Route Found',
        bengaliTitle: '💡 সহজ ও কম দূরত্বের বিকল্প পথ',
        severity: 'info',
        triggerReason: `Reordering ${p2.name} before ${p1.name} eliminates zig-zag backtracking and saves ~${formatDistance(
          currentDist - swappedDist
        )}.`,
        bengaliTriggerReason: `মণ্ডপের ক্রম পরিবর্তনে অপ্রয়োজনীয় ঘোরাঘুরি কমবে ও পথ বাঁচবে।`,
        currentPandalIds: remainingPandalIds,
        suggestedPandalIds: suggestedIds,
        currentPandalNames: remainingPandals.map((p) => p.name),
        suggestedPandalNames: suggestedIds.map((id) => pandalsMap.get(id)?.name || id),
        timeSavedMinutes: timeSaved,
        walkingDistanceChangeMeters: -(currentDist - swappedDist),
        transportChangeLabel: 'Direct sequential flow',
        createdAt: new Date().toISOString(),
      };
    }
  }

  return null;
}

/**
 * Continuously evaluates Running-Late Status and Trip-End Feasibility
 */
export function evaluateRunningLateAndFeasibility(
  trip: TripPlan,
  allPandals: Pandal[],
  itinerary: PlannedItinerary,
  visitedPandalIds: Set<string> = new Set(),
  simulatedCurrentTimeMinutes?: number // allow simulated time for demo testing
): RunningLateStatus {
  const pandalsMap = new Map<string, Pandal>();
  allPandals.forEach((p) => pandalsMap.set(p.id, p));

  const totalStops = itinerary.stops.filter((s) => s.type === 'pandal');
  const completedStops = totalStops.filter((s) => visitedPandalIds.has(s.pandalId || ''));
  const remainingStops = totalStops.filter((s) => !visitedPandalIds.has(s.pandalId || ''));

  // Get current clock time in minutes from midnight
  let nowMins: number;
  if (simulatedCurrentTimeMinutes !== undefined) {
    nowMins = simulatedCurrentTimeMinutes;
  } else {
    const d = new Date();
    nowMins = d.getHours() * 60 + d.getMinutes();
  }

  // Calculate planned time at current progress
  const plannedStartMins = parseTimeToMinutes(trip.startTime);
  const plannedEndMins = parseTimeToMinutes(trip.endTime);

  // Find expected arrival time of next unvisited stop
  const nextStop = remainingStops[0];
  let minutesBehind = 0;
  let isBehindSchedule = false;

  if (nextStop) {
    const plannedArrivalMins = parseTimeToMinutes(nextStop.plannedArrivalTime);
    if (nowMins > plannedArrivalMins + 10) {
      minutesBehind = nowMins - plannedArrivalMins;
      isBehindSchedule = true;
    }
  }

  // Calculate remaining travel & visit duration from current position
  let remainingTravelMins = 0;
  let remainingVisitMins = 0;

  remainingStops.forEach((stop) => {
    remainingTravelMins += stop.estimatedTravelMinutes;
    remainingVisitMins += stop.estimatedVisitDurationMinutes;
  });

  // Add final return leg travel time
  const endStop = itinerary.stops.find((s) => s.type === 'end');
  if (endStop) {
    remainingTravelMins += endStop.estimatedTravelMinutes;
  }

  const estimatedCompletionMins = nowMins + remainingTravelMins + remainingVisitMins;
  const estimatedCompletionTime = formatMinutesTo12Hour(estimatedCompletionMins);
  const plannedEndTime = formatMinutesTo12Hour(plannedEndMins);

  // Feasibility: does estimated completion exceed planned end time?
  let overScheduleMinutes = 0;
  let isEndFeasible = true;

  if (estimatedCompletionMins > plannedEndMins) {
    overScheduleMinutes = estimatedCompletionMins - plannedEndMins;
    isEndFeasible = false;
  }

  // Find lowest-priority remaining stops for smart removal recommendations
  const suggestedRemovals: Array<{
    pandalId: string;
    pandalName: string;
    worthScore: number;
    timeSavedMinutes: number;
  }> = [];

  if (overScheduleMinutes > 0 && remainingStops.length > 1) {
    const candidatePandals = remainingStops
      .map((s) => s.pandal)
      .filter((p): p is Pandal => p !== undefined)
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          Optional: 1,
          Good: 2,
          'Highly Recommended': 3,
          'Must Visit': 4,
        };
        const pA = priorityOrder[a.recommendationLevel] || 2;
        const pB = priorityOrder[b.recommendationLevel] || 2;
        if (pA !== pB) return pA - pB;
        return a.overallQualityScore - b.overallQualityScore;
      });

    candidatePandals.slice(0, 2).forEach((pandal) => {
      const timeSaved = pandal.estimatedVisitDuration + 20; // visit + avg leg
      suggestedRemovals.push({
        pandalId: pandal.id,
        pandalName: pandal.name,
        worthScore: Math.round(pandal.overallQualityScore * 10),
        timeSavedMinutes: timeSaved,
      });
    });
  }

  return {
    isBehindSchedule,
    minutesBehind,
    completedStopsCount: completedStops.length,
    remainingStopsCount: remainingStops.length,
    estimatedCompletionTime,
    plannedEndTime,
    isEndFeasible,
    overScheduleMinutes,
    suggestedRemovals,
  };
}
