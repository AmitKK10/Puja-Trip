import {
  CityId,
  Pandal,
  WalkingPreference,
  TransportPreference,
  SmartTransportMode,
  ModeRouteOption,
  RouteStep,
  JourneyRouteComparison,
  RouteCalculationOptions,
  MetroStationRecord,
  BusStopRecord,
} from '../types';
import {
  calculateHaversineDistance,
  calculateDistanceAndDirection,
  formatDistance,
  URBAN_WALKING_CIRCUITY_FACTOR,
} from '../utils/geoUtils';
import {
  KOLKATA_METRO_STATIONS,
  KOLKATA_BUS_STOPS,
  KOLKATA_BUS_ROUTES,
  CONTAI_BUS_STOPS,
} from '../data/transitNetworkData';

/**
 * Speed in meters/minute based on user walking preference
 */
export const WALKING_SPEEDS: Record<WalkingPreference, number> = {
  low: 60, // ~3.6 km/h (leisurely, seniors, kids, family pace)
  normal: 75, // ~4.5 km/h (standard comfortable city pedestrian)
  high: 90, // ~5.4 km/h (brisk pandal-hopping enthusiast)
};

/**
 * Maximum comfortable walking distance (meters) if no explicit limit set
 */
export const DEFAULT_COMFORT_WALK_LIMITS: Record<WalkingPreference, number> = {
  low: 900,
  normal: 2000,
  high: 3500,
};

/**
 * Helper to find the nearest metro station to a given coordinate
 */
export function findNearestMetroStation(
  lat: number,
  lng: number,
  pandal?: Pandal,
  city: CityId = 'kolkata'
): { station: MetroStationRecord; straightDistMeters: number; walkDistMeters: number } | null {
  if (city !== 'kolkata') return null;

  // 1. If pandal has explicit nearest metro record matching our database
  if (pandal?.transit?.nearestMetro?.station) {
    const matched = KOLKATA_METRO_STATIONS.find((s) =>
      pandal.transit.nearestMetro!.station.toLowerCase().includes(s.name.toLowerCase().split(' ')[0]) ||
      s.name.toLowerCase().includes(pandal.transit.nearestMetro!.station.toLowerCase().split(' ')[0])
    );
    if (matched) {
      const straight = calculateHaversineDistance(lat, lng, matched.latitude, matched.longitude);
      const walk = Math.round(straight * URBAN_WALKING_CIRCUITY_FACTOR);
      return { station: matched, straightDistMeters: straight, walkDistMeters: walk };
    }
  }

  // 2. Search all stations for lowest straight distance
  let nearest: MetroStationRecord | null = null;
  let minDistance = Infinity;

  for (const station of KOLKATA_METRO_STATIONS) {
    const dist = calculateHaversineDistance(lat, lng, station.latitude, station.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  }

  if (!nearest) return null;
  const walkDist = Math.round(minDistance * URBAN_WALKING_CIRCUITY_FACTOR);
  return { station: nearest, straightDistMeters: minDistance, walkDistMeters: walkDist };
}

/**
 * Helper to find the nearest bus stop to a given coordinate
 */
export function findNearestBusStop(
  lat: number,
  lng: number,
  pandal?: Pandal,
  city: CityId = 'kolkata'
): { stop: BusStopRecord; straightDistMeters: number; walkDistMeters: number } | null {
  const pool = city === 'kolkata' ? KOLKATA_BUS_STOPS : CONTAI_BUS_STOPS;
  if (pool.length === 0) return null;

  let nearest: BusStopRecord | null = null;
  let minDistance = Infinity;

  for (const stop of pool) {
    const dist = calculateHaversineDistance(lat, lng, stop.latitude, stop.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = stop;
    }
  }

  if (!nearest) return null;
  const walkDist = Math.round(minDistance * URBAN_WALKING_CIRCUITY_FACTOR);
  return { stop: nearest, straightDistMeters: minDistance, walkDistMeters: walkDist };
}

/**
 * Builds pure Walking route option
 */
function buildWalkingOption(
  options: RouteCalculationOptions,
  straightMeters: number,
  walkingSpeed: number,
  maxWalkingLimit: number
): ModeRouteOption {
  const walkMeters = Math.round(straightMeters * URBAN_WALKING_CIRCUITY_FACTOR);
  const walkMinutes = Math.max(2, Math.round(walkMeters / walkingSpeed));
  const exceedsLimit = walkMeters > maxWalkingLimit;

  const originName = options.originName || (options.fromPandal ? options.fromPandal.name : 'Start Location');
  const destName = options.destinationName || (options.toPandal ? options.toPandal.name : 'Destination');

  const steps: RouteStep[] = [
    {
      id: 'step_walk_start',
      type: 'walk_start',
      instruction: `Depart from ${originName} on foot`,
      bengaliInstruction: `${originName} থেকে পায়ে হেঁটে রওনা হন`,
      distanceMeters: 0,
      durationMinutes: 0,
      icon: '🚶',
      metadata: { departureLocation: originName },
    },
    {
      id: 'step_walk_body',
      type: 'walk_end',
      instruction: `Walk ${formatDistance(walkMeters)} along pedestrian streets towards ${destName}`,
      bengaliInstruction: `${destName}-এর দিকে পথচলতি রাস্তা ধরে ${formatDistance(walkMeters)} হাঁটুন`,
      distanceMeters: walkMeters,
      durationMinutes: walkMinutes,
      icon: '🚶',
      metadata: { arrivalLocation: destName },
    },
    {
      id: 'step_walk_arrive',
      type: 'arrive_destination',
      instruction: `Arrive at ${destName}`,
      bengaliInstruction: `${destName}-এ পৌঁছান`,
      distanceMeters: 0,
      durationMinutes: 0,
      icon: '🏮',
      metadata: { arrivalLocation: destName },
    },
  ];

  return {
    mode: 'walking',
    modeLabel: 'Walking',
    bengaliModeLabel: 'পায়ে হেঁটে পরিক্রমা',
    icon: '🚶',
    totalDurationMinutes: walkMinutes,
    totalDistanceMeters: walkMeters,
    walkingDistanceMeters: walkMeters,
    straightDistanceMeters: straightMeters,
    transitDurationMinutes: 0,
    walkingDurationMinutes: walkMinutes,
    transferCount: 0,
    waitingTimeMinutes: 0,
    isRecommended: false,
    recommendationScore: 0,
    recommendationReason: '',
    exceedsMaxWalkingLimit: exceedsLimit,
    comfortTag: walkMeters < 1000 ? 'Direct & Fast' : 'Scenic Walk',
    breakdown: {
      walkToTransitMeters: 0,
      walkToTransitMinutes: 0,
      transitRideMinutes: 0,
      walkFromTransitMeters: 0,
      walkFromTransitMinutes: 0,
      transfersMinutes: 0,
    },
    steps,
  };
}

/**
 * Builds Metro route option
 */
function buildMetroOption(
  options: RouteCalculationOptions,
  straightMeters: number,
  walkingSpeed: number,
  maxWalkingLimit: number
): ModeRouteOption | null {
  const city = options.city || 'kolkata';
  if (city !== 'kolkata') return null;

  const originStation = findNearestMetroStation(options.originLat, options.originLng, options.fromPandal, city);
  const destStation = findNearestMetroStation(options.destinationLat, options.destinationLng, options.toPandal, city);

  if (!originStation || !destStation) return null;

  // If origin and destination are the exact same station, metro is not useful
  if (originStation.station.id === destStation.station.id) return null;

  const walkToStationMeters = originStation.walkDistMeters;
  const walkToStationMinutes = Math.max(1, Math.round(walkToStationMeters / walkingSpeed));

  const walkFromStationMeters = destStation.walkDistMeters;
  const walkFromStationMinutes = Math.max(1, Math.round(walkFromStationMeters / walkingSpeed));

  const isSameLine = originStation.station.line === destStation.station.line;
  const transferCount = isSameLine ? 0 : 1;
  const transferWaitMins = transferCount > 0 ? 5 : 0; // Transfer at Esplanade

  // Stop count calculation on line
  const stopDiff = Math.abs(originStation.station.orderOnLine - destStation.station.orderOnLine);
  const effectiveStops = isSameLine ? Math.max(1, stopDiff) : Math.max(2, stopDiff + 2);
  const metroRideMinutes = Math.max(4, Math.round(effectiveStops * 2.1));
  const platformWaitMinutes = 3; // Average metro headway wait

  const totalTransitMinutes = metroRideMinutes + platformWaitMinutes + transferWaitMins;
  const totalWalkMeters = walkToStationMeters + walkFromStationMeters;
  const totalWalkMinutes = walkToStationMinutes + walkFromStationMinutes;
  const totalDurationMinutes = totalWalkMinutes + totalTransitMinutes;

  const exceedsLimit = totalWalkMeters > maxWalkingLimit;

  const originName = options.originName || (options.fromPandal ? options.fromPandal.name : 'Start');
  const destName = options.destinationName || (options.toPandal ? options.toPandal.name : 'Destination');

  const originGate = originStation.station.entrances[0]?.name || 'Main Entrance';
  const destGate = destStation.station.entrances[0]?.name || 'Main Exit';

  const steps: RouteStep[] = [
    {
      id: 'step_metro_walk_in',
      type: 'walk_start',
      instruction: `Walk ${formatDistance(walkToStationMeters)} to ${originStation.station.name} (${originGate})`,
      bengaliInstruction: `${originStation.station.bengaliName}-এর দিকে ${formatDistance(walkToStationMeters)} হাঁটুন`,
      distanceMeters: walkToStationMeters,
      durationMinutes: walkToStationMinutes,
      icon: '🚶',
      metadata: { stationName: originStation.station.name, gate: originGate },
    },
    {
      id: 'step_metro_board',
      type: 'metro_board',
      instruction: `Enter station, scan ticket & proceed to ${originStation.station.lineLabel} platform`,
      bengaliInstruction: `মেট্রো স্টেশনে প্রবেশ করুন ও প্ল্যাটফর্মে যান (~৩ মিনিট অপেক্ষা)`,
      distanceMeters: 0,
      durationMinutes: platformWaitMinutes,
      icon: '🚇',
      metadata: {
        stationName: originStation.station.name,
        lineName: originStation.station.lineLabel,
        lineColor: originStation.station.lineColor,
      },
    },
    {
      id: 'step_metro_ride',
      type: 'metro_ride',
      instruction: `Ride ${effectiveStops} stops from ${originStation.station.name.split(' ')[0]} to ${
        isSameLine ? destStation.station.name.split(' ')[0] : 'Esplanade Interchange'
      }`,
      bengaliInstruction: `${effectiveStops}টি স্টপ অতিক্রম করুন (${metroRideMinutes} মিনিট)`,
      distanceMeters: Math.round(straightMeters * 0.9),
      durationMinutes: metroRideMinutes,
      icon: '🚇',
      metadata: {
        stopCount: effectiveStops,
        lineName: originStation.station.lineLabel,
        lineColor: originStation.station.lineColor,
      },
    },
  ];

  if (transferCount > 0) {
    steps.push({
      id: 'step_metro_transfer',
      type: 'metro_transfer',
      instruction: `Transfer at Esplanade Station to ${destStation.station.lineLabel}`,
      bengaliInstruction: `এসপ্ল্যানেড স্টেশনে লাইন পরিবর্তন করুন (~৫ মিনিট ইন্টারচেঞ্জ)`,
      distanceMeters: 150,
      durationMinutes: transferWaitMins,
      icon: '🔄',
      metadata: { transferStation: 'Esplanade Metro' },
    });
  }

  steps.push({
    id: 'step_metro_alight',
    type: 'metro_alight',
    instruction: `Alight at ${destStation.station.name} and exit via ${destGate}`,
    bengaliInstruction: `${destStation.station.bengaliName}-এ নেমে বাইরে আসুন`,
    distanceMeters: 0,
    durationMinutes: 1,
    icon: '🚇',
    metadata: { stationName: destStation.station.name, gate: destGate },
  });

  steps.push({
    id: 'step_metro_walk_out',
    type: 'walk_end',
    instruction: `Walk ${formatDistance(walkFromStationMeters)} from station to ${destName}`,
    bengaliInstruction: `মেট্রো থেকে ${destName}-এর দিকে ${formatDistance(walkFromStationMeters)} হাঁটুন`,
    distanceMeters: walkFromStationMeters,
    durationMinutes: walkFromStationMinutes,
    icon: '🚶',
    metadata: { arrivalLocation: destName },
  });

  steps.push({
    id: 'step_metro_arrive',
    type: 'arrive_destination',
    instruction: `Arrive at ${destName}`,
    bengaliInstruction: `${destName}-এ পৌঁছান`,
    distanceMeters: 0,
    durationMinutes: 0,
    icon: '🏮',
    metadata: { arrivalLocation: destName },
  });

  return {
    mode: 'metro',
    modeLabel: 'Metro',
    bengaliModeLabel: 'কলকাতা মেট্রো',
    icon: '🚇',
    totalDurationMinutes,
    totalDistanceMeters: straightMeters + totalWalkMeters,
    walkingDistanceMeters: totalWalkMeters,
    straightDistanceMeters: straightMeters,
    transitDurationMinutes: metroRideMinutes,
    walkingDurationMinutes: totalWalkMinutes,
    transferCount,
    waitingTimeMinutes: platformWaitMinutes + transferWaitMins,
    isRecommended: false,
    recommendationScore: 0,
    recommendationReason: '',
    exceedsMaxWalkingLimit: exceedsLimit,
    comfortTag: transferCount > 0 ? 'AC Line Interchange' : 'Fast AC Transit',
    breakdown: {
      walkToTransitMeters: walkToStationMeters,
      walkToTransitMinutes: walkToStationMinutes,
      transitRideMinutes: metroRideMinutes,
      walkFromTransitMeters: walkFromStationMeters,
      walkFromTransitMinutes: walkFromStationMinutes,
      transfersMinutes: transferWaitMins,
    },
    steps,
  };
}

/**
 * Builds Bus route option
 */
function buildBusOption(
  options: RouteCalculationOptions,
  straightMeters: number,
  walkingSpeed: number,
  maxWalkingLimit: number
): ModeRouteOption | null {
  const city = options.city || 'kolkata';
  const originStop = findNearestBusStop(options.originLat, options.originLng, options.fromPandal, city);
  const destStop = findNearestBusStop(options.destinationLat, options.destinationLng, options.toPandal, city);

  if (!originStop || !destStop) return null;
  if (originStop.stop.id === destStop.stop.id) return null;

  const walkToStopMeters = originStop.walkDistMeters;
  const walkToStopMinutes = Math.max(1, Math.round(walkToStopMeters / walkingSpeed));

  const walkFromStopMeters = destStop.walkDistMeters;
  const walkFromStopMinutes = Math.max(1, Math.round(walkFromStopMeters / walkingSpeed));

  // Find matching route or corridor
  const matchedRoute = KOLKATA_BUS_ROUTES.find((r) =>
    r.stopIds.includes(originStop.stop.id) && r.stopIds.includes(destStop.stop.id)
  );

  const busRouteNumber = matchedRoute ? matchedRoute.routeNumber : originStop.stop.routes[0] || 'Direct Corridor Bus';
  const busWaitMinutes = matchedRoute ? Math.round(matchedRoute.frequencyMinutes / 2) : 5;
  const busRideMinutes = Math.max(6, Math.round((straightMeters / 1000) * 3.8) + 3);

  const totalTransitMinutes = busRideMinutes + busWaitMinutes;
  const totalWalkMeters = walkToStopMeters + walkFromStopMeters;
  const totalWalkMinutes = walkToStopMinutes + walkFromStopMinutes;
  const totalDurationMinutes = totalWalkMinutes + totalTransitMinutes;

  const exceedsLimit = totalWalkMeters > maxWalkingLimit;

  const originName = options.originName || (options.fromPandal ? options.fromPandal.name : 'Start');
  const destName = options.destinationName || (options.toPandal ? options.toPandal.name : 'Destination');

  const steps: RouteStep[] = [
    {
      id: 'step_bus_walk_in',
      type: 'walk_start',
      instruction: `Walk ${formatDistance(walkToStopMeters)} to ${originStop.stop.name}`,
      bengaliInstruction: `${originStop.stop.bengaliName}-এর দিকে ${formatDistance(walkToStopMeters)} হাঁটুন`,
      distanceMeters: walkToStopMeters,
      durationMinutes: walkToStopMinutes,
      icon: '🚶',
      metadata: { departureLocation: originStop.stop.name },
    },
    {
      id: 'step_bus_board',
      type: 'bus_board',
      instruction: `Board Bus Route ${busRouteNumber} at ${originStop.stop.name.split(' ')[0]}`,
      bengaliInstruction: `${busRouteNumber} রুটের বাসে উঠুন (~${busWaitMinutes} মিনিট অপেক্ষা)`,
      distanceMeters: 0,
      durationMinutes: busWaitMinutes,
      icon: '🚌',
      metadata: { routeNumber: busRouteNumber },
    },
    {
      id: 'step_bus_ride',
      type: 'bus_ride',
      instruction: `Ride Bus along ${originStop.stop.corridor.split('(')[0].trim()} (${busRideMinutes} min)`,
      bengaliInstruction: `বাসে ভ্রমণ করুন (${busRideMinutes} মিনিট)`,
      distanceMeters: Math.round(straightMeters * 1.1),
      durationMinutes: busRideMinutes,
      icon: '🚌',
      metadata: { routeNumber: busRouteNumber },
    },
    {
      id: 'step_bus_alight',
      type: 'bus_alight',
      instruction: `Alight at ${destStop.stop.name}`,
      bengaliInstruction: `${destStop.stop.bengaliName}-এ নামুন`,
      distanceMeters: 0,
      durationMinutes: 1,
      icon: '🚌',
      metadata: { arrivalLocation: destStop.stop.name },
    },
    {
      id: 'step_bus_walk_out',
      type: 'walk_end',
      instruction: `Walk ${formatDistance(walkFromStopMeters)} from stop to ${destName}`,
      bengaliInstruction: `বাস স্টপ থেকে ${destName}-এর দিকে ${formatDistance(walkFromStopMeters)} হাঁটুন`,
      distanceMeters: walkFromStopMeters,
      durationMinutes: walkFromStopMinutes,
      icon: '🚶',
      metadata: { arrivalLocation: destName },
    },
    {
      id: 'step_bus_arrive',
      type: 'arrive_destination',
      instruction: `Arrive at ${destName}`,
      bengaliInstruction: `${destName}-এ পৌঁছান`,
      distanceMeters: 0,
      durationMinutes: 0,
      icon: '🏮',
      metadata: { arrivalLocation: destName },
    },
  ];

  return {
    mode: 'bus',
    modeLabel: 'Bus Transit',
    bengaliModeLabel: 'বাস ট্রানজিট',
    icon: '🚌',
    totalDurationMinutes,
    totalDistanceMeters: straightMeters + totalWalkMeters,
    walkingDistanceMeters: totalWalkMeters,
    straightDistanceMeters: straightMeters,
    transitDurationMinutes: busRideMinutes,
    walkingDurationMinutes: totalWalkMinutes,
    transferCount: 0,
    waitingTimeMinutes: busWaitMinutes,
    isRecommended: false,
    recommendationScore: 0,
    recommendationReason: '',
    exceedsMaxWalkingLimit: exceedsLimit,
    comfortTag: 'Frequent Route',
    breakdown: {
      walkToTransitMeters: walkToStopMeters,
      walkToTransitMinutes: walkToStopMinutes,
      transitRideMinutes: busRideMinutes,
      walkFromTransitMeters: walkFromStopMeters,
      walkFromTransitMinutes: walkFromStopMinutes,
      transfersMinutes: 0,
    },
    steps,
  };
}

/**
 * Builds Auto / E-Rickshaw / Toto Route Option
 */
function buildAutoOption(
  options: RouteCalculationOptions,
  straightMeters: number,
  walkingSpeed: number,
  maxWalkingLimit: number
): ModeRouteOption {
  const walkToStandMeters = Math.min(180, Math.round(straightMeters * 0.08));
  const walkToStandMins = Math.max(1, Math.round(walkToStandMeters / walkingSpeed));

  const walkFromStandMeters = Math.min(160, Math.round(straightMeters * 0.07));
  const walkFromStandMins = Math.max(1, Math.round(walkFromStandMeters / walkingSpeed));

  const autoWaitMinutes = 2; // Auto stands fill and depart quickly
  const autoRideMinutes = Math.max(4, Math.round((straightMeters / 1000) * 3.2) + 2);

  const totalTransitMinutes = autoRideMinutes + autoWaitMinutes;
  const totalWalkMeters = walkToStandMeters + walkFromStandMeters;
  const totalWalkMinutes = walkToStandMins + walkFromStandMins;
  const totalDurationMinutes = totalWalkMinutes + totalTransitMinutes;

  const exceedsLimit = totalWalkMeters > maxWalkingLimit;

  const originName = options.originName || (options.fromPandal ? options.fromPandal.name : 'Start');
  const destName = options.destinationName || (options.toPandal ? options.toPandal.name : 'Destination');
  const vehicleLabel = options.city === 'contai' ? 'Toto / E-Rickshaw' : 'Shared Auto / E-Rickshaw';

  const steps: RouteStep[] = [
    {
      id: 'step_auto_walk_in',
      type: 'walk_start',
      instruction: `Walk ${formatDistance(walkToStandMeters)} to nearby ${vehicleLabel} Stand`,
      bengaliInstruction: `নিকটস্থ অটো/টোটো স্ট্যান্ডে ${formatDistance(walkToStandMeters)} যান`,
      distanceMeters: walkToStandMeters,
      durationMinutes: walkToStandMins,
      icon: '🚶',
    },
    {
      id: 'step_auto_board',
      type: 'auto_board',
      instruction: `Board ${vehicleLabel} towards ${destName}`,
      bengaliInstruction: `${vehicleLabel}-তে উঠুন`,
      distanceMeters: 0,
      durationMinutes: autoWaitMinutes,
      icon: '🛺',
    },
    {
      id: 'step_auto_ride',
      type: 'auto_ride',
      instruction: `Direct road transit through pandal corridor (${autoRideMinutes} mins)`,
      bengaliInstruction: `রাস্তা দিয়ে সরাসরি পৌঁছান (${autoRideMinutes} মিনিট)`,
      distanceMeters: Math.round(straightMeters * 1.1),
      durationMinutes: autoRideMinutes,
      icon: '🛺',
    },
    {
      id: 'step_auto_walk_out',
      type: 'walk_end',
      instruction: `Walk ${formatDistance(walkFromStandMeters)} from drop point to ${destName}`,
      bengaliInstruction: `ড্রপ পয়েন্ট থেকে ${destName}-এর দিকে ${formatDistance(walkFromStandMeters)} হাঁটুন`,
      distanceMeters: walkFromStandMeters,
      durationMinutes: walkFromStandMins,
      icon: '🚶',
      metadata: { arrivalLocation: destName },
    },
    {
      id: 'step_auto_arrive',
      type: 'arrive_destination',
      instruction: `Arrive at ${destName}`,
      bengaliInstruction: `${destName}-এ পৌঁছান`,
      distanceMeters: 0,
      durationMinutes: 0,
      icon: '🏮',
      metadata: { arrivalLocation: destName },
    },
  ];

  return {
    mode: 'auto_rickshaw',
    modeLabel: options.city === 'contai' ? 'Toto / E-Rickshaw' : 'Auto / E-Rickshaw',
    bengaliModeLabel: options.city === 'contai' ? 'টোটো / ই-রিকশা' : 'অটো / ই-রিকশা',
    icon: '🛺',
    totalDurationMinutes,
    totalDistanceMeters: straightMeters + totalWalkMeters,
    walkingDistanceMeters: totalWalkMeters,
    straightDistanceMeters: straightMeters,
    transitDurationMinutes: autoRideMinutes,
    walkingDurationMinutes: totalWalkMinutes,
    transferCount: 0,
    waitingTimeMinutes: autoWaitMinutes,
    isRecommended: false,
    recommendationScore: 0,
    recommendationReason: '',
    exceedsMaxWalkingLimit: exceedsLimit,
    comfortTag: 'Direct & Convenient',
    breakdown: {
      walkToTransitMeters: walkToStandMeters,
      walkToTransitMinutes: walkToStandMins,
      transitRideMinutes: autoRideMinutes,
      walkFromTransitMeters: walkFromStandMeters,
      walkFromTransitMinutes: walkFromStandMins,
      transfersMinutes: 0,
    },
    steps,
  };
}

/**
 * --------------------------------------------------------------------------
 * Recommendation Scoring & Trade-off Optimization Algorithm
 * --------------------------------------------------------------------------
 */
export function scoreAndRankTransportOptions(
  options: ModeRouteOption[],
  walkingOption: ModeRouteOption,
  walkingPref: WalkingPreference,
  maxWalkingLimit: number,
  transportPref?: TransportPreference,
  todayWalkedDistanceMeters?: number,
  energyAwareMode: boolean = true
): ModeRouteOption[] {
  const walkTime = walkingOption.totalDurationMinutes;
  const walkDistance = walkingOption.walkingDistanceMeters;
  const walkedKm = todayWalkedDistanceMeters ? todayWalkedDistanceMeters / 1000 : 0;
  const isFatiguedOrHighWalk = energyAwareMode && walkedKm >= 5.5;

  // Find minimum travel time among all valid modes
  const minTravelTime = Math.min(...options.map((o) => o.totalDurationMinutes));

  const scoredOptions = options.map((opt) => {
    let score = 70; // baseline

    // 1. Time Efficiency (up to +35 pts for fastest, penalized for slower)
    const timeDelta = opt.totalDurationMinutes - minTravelTime;
    score -= timeDelta * 4;

    // 2. Walking Preference & Fatigue Evaluation
    const walkKm = opt.walkingDistanceMeters / 1000;
    if (walkingPref === 'low') {
      // User dislikes or cannot walk far: heavily penalize walking
      score -= walkKm * 28;
      if (opt.walkingDistanceMeters > 750) {
        score -= 20;
      }
    } else if (walkingPref === 'normal') {
      score -= walkKm * 10;
      if (opt.walkingDistanceMeters > 1800) {
        score -= 15;
      }
    } else {
      // High walking preference: happy walking up to 3km
      score -= walkKm * 4;
      if (opt.mode === 'walking' && opt.totalDurationMinutes <= minTravelTime + 6) {
        score += 15; // Bonus for healthy pedestrian exploration if time is close
      }
    }

    // Energy-Aware Dynamic Fatigue Adjustment
    if (isFatiguedOrHighWalk) {
      if (opt.mode === 'walking' && walkDistance > 850) {
        // High penalty on long walk when user already walked 5.5+ km
        score -= Math.round((walkedKm - 4.5) * 12 + (walkDistance / 1000) * 15);
      } else if (opt.mode === 'metro' || opt.mode === 'auto_rickshaw' || opt.mode === 'bus') {
        // Energy saving bonus for motorized/transit options
        score += 24;
      }
    }

    // 3. Max Walking Distance Violation Penalty
    if (opt.exceedsMaxWalkingLimit) {
      score -= 50;
    }

    // 4. Mode-specific practicalities
    if (opt.mode === 'walking') {
      // If journey is short (< 850m), walking is almost always superior (no ticket/queue overhead)
      if (walkDistance <= 850 && !isFatiguedOrHighWalk) {
        score += 25;
      } else if (walkDistance > 2500) {
        score -= 30; // 2.5km+ in Puja crowd is exhausting
      }
    } else if (opt.mode === 'metro') {
      // Metro is best for longer hops (> 1.2km)
      if (opt.straightDistanceMeters >= 1200) {
        score += 12;
      } else {
        // Metro overhead for tiny journeys is counterproductive
        score -= 15;
      }
      if (opt.transferCount > 0) {
        score -= 6; // transfer overhead
      }
    } else if (opt.mode === 'auto_rickshaw') {
      // Auto is great for mid-distances (900m - 3.5km)
      if (opt.straightDistanceMeters >= 800 && opt.straightDistanceMeters <= 3500) {
        score += 10;
      }
    }

    // 5. User Explicit Transport Preference boost
    if (transportPref && transportPref !== 'mixed') {
      if (transportPref === 'walking' && opt.mode === 'walking') score += 18;
      if (transportPref === 'metro' && opt.mode === 'metro') score += 18;
      if (transportPref === 'bus' && opt.mode === 'bus') score += 18;
    }

    // Time difference vs pure walking
    const timeSavedVsWalk = walkTime - opt.totalDurationMinutes;
    opt.timeSavedVersusWalkMinutes = timeSavedVsWalk;

    // Generate descriptive reason (with Energy awareness)
    let reason = '';
    const distanceSaved = Math.max(0, walkDistance - opt.walkingDistanceMeters);

    if (opt.mode === 'walking') {
      if (timeSavedVsWalk >= 0) {
        reason = `🚶 Direct walk is the fastest option (saves ~${Math.abs(
          (options.find((o) => o.mode === 'metro')?.totalDurationMinutes || walkTime + 8) - walkTime
        )} mins vs transit overhead).`;
      } else {
        reason = `🚶 Scenic pedestrian route (${formatDistance(opt.walkingDistanceMeters)}).`;
      }
    } else if (opt.mode === 'metro') {
      if (isFatiguedOrHighWalk && distanceSaved > 600) {
        reason = `🚇 Metro recommended • Saves ~${formatDistance(distanceSaved)} of walking after your ${walkedKm.toFixed(1)} km walked today.`;
      } else if (timeSavedVsWalk > 0) {
        reason = `🚇 Metro saves approximately ${timeSavedVsWalk} mins & avoids ${formatDistance(
          distanceSaved
        )} of heavy street walking.`;
      } else {
        reason = `🚇 AC Metro comfort (${opt.totalDurationMinutes} min total travel time).`;
      }
    } else if (opt.mode === 'bus') {
      if (isFatiguedOrHighWalk && distanceSaved > 600) {
        reason = `🚌 Bus recommended • Saves ~${formatDistance(distanceSaved)} walking.`;
      } else {
        reason = `🚌 Direct corridor bus connection with minimal walking (${formatDistance(
          opt.walkingDistanceMeters
        )} walk).`;
      }
    } else if (opt.mode === 'auto_rickshaw') {
      if (isFatiguedOrHighWalk && distanceSaved > 600) {
        reason = `🛺 Auto recommended • Direct leg saving ~${formatDistance(distanceSaved)} walking.`;
      } else {
        reason = `🛺 Fast road connection directly between pandal stands (~${opt.totalDurationMinutes} min).`;
      }
    }

    opt.recommendationScore = Math.max(5, Math.min(100, Math.round(score)));
    opt.recommendationReason = reason;

    return opt;
  });

  // Sort descending by recommendationScore
  scoredOptions.sort((a, b) => b.recommendationScore - a.recommendationScore);

  // Mark top as recommended
  if (scoredOptions.length > 0) {
    scoredOptions[0].isRecommended = true;
  }

  return scoredOptions;
}

/**
 * --------------------------------------------------------------------------
 * Main Provider-Independent Route Comparison Function
 * --------------------------------------------------------------------------
 */
export function compareAllTransportModes(
  calcOptions: RouteCalculationOptions
): JourneyRouteComparison {
  const straightMeters = Math.round(
    calculateHaversineDistance(
      calcOptions.originLat,
      calcOptions.originLng,
      calcOptions.destinationLat,
      calcOptions.destinationLng
    )
  );

  const walkingPref: WalkingPreference = calcOptions.walkingPreference || 'normal';
  const transportPref: TransportPreference = calcOptions.transportPreference || 'mixed';
  const walkingSpeed = WALKING_SPEEDS[walkingPref] || 75;
  const maxWalkingLimit =
    calcOptions.maxWalkingDistanceMeters || DEFAULT_COMFORT_WALK_LIMITS[walkingPref];

  const originName =
    calcOptions.originName || (calcOptions.fromPandal ? calcOptions.fromPandal.name : 'Start Location');
  const destName =
    calcOptions.destinationName || (calcOptions.toPandal ? calcOptions.toPandal.name : 'Destination');

  // Build candidate route options
  const walkingOption = buildWalkingOption(calcOptions, straightMeters, walkingSpeed, maxWalkingLimit);
  const metroOption = buildMetroOption(calcOptions, straightMeters, walkingSpeed, maxWalkingLimit);
  const busOption = buildBusOption(calcOptions, straightMeters, walkingSpeed, maxWalkingLimit);
  const autoOption = buildAutoOption(calcOptions, straightMeters, walkingSpeed, maxWalkingLimit);

  const candidates: ModeRouteOption[] = [walkingOption];
  if (metroOption) candidates.push(metroOption);
  if (busOption) candidates.push(busOption);
  if (autoOption) candidates.push(autoOption);

  // Score and rank all options
  const rankedOptions = scoreAndRankTransportOptions(
    candidates,
    walkingOption,
    walkingPref,
    maxWalkingLimit,
    transportPref,
    calcOptions.todayWalkedDistanceMeters,
    calcOptions.energyAwareMode !== false
  );

  const recommendedOption = rankedOptions[0] || walkingOption;

  // Build high-level summary note
  let summaryNote = '';
  if (recommendedOption.mode === 'walking') {
    summaryNote = `Walking is recommended for this leg (${formatDistance(
      recommendedOption.walkingDistanceMeters
    )} • ~${recommendedOption.totalDurationMinutes} min).`;
  } else {
    summaryNote = `${recommendedOption.modeLabel} is recommended: ~${
      recommendedOption.totalDurationMinutes
    } min total (${recommendedOption.recommendationReason})`;
  }

  return {
    originName,
    destinationName: destName,
    originCoordinates: { lat: calcOptions.originLat, lng: calcOptions.originLng },
    destinationCoordinates: { lat: calcOptions.destinationLat, lng: calcOptions.destinationLng },
    straightDistanceMeters: straightMeters,
    recommendedMode: recommendedOption.mode,
    recommendedOption,
    allOptions: rankedOptions,
    summaryNote,
    userWalkingPreference: walkingPref,
    userMaxWalkingDistanceMeters: maxWalkingLimit,
    calculatedAt: new Date().toISOString(),
  };
}
