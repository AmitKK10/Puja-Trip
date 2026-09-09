import {
  CityId,
  Pandal,
  RecommendationLevel,
  CompassDirection,
  AnchorLocation,
} from '../types';
import {
  calculateDistanceAndDirection,
  formatDistance,
} from '../utils/geoUtils';

export interface WorthwhilePandalResult {
  pandal: Pandal;
  straightDistanceMeters: number;
  formattedStraightDistance: string;
  walkingDistanceMeters: number;
  formattedWalkingDistance: string;
  estimatedWalkingMinutes: number;
  bearingDegrees: number;
  direction: CompassDirection;
  bengaliDirection: string;
  arrowIcon: string;
  worthScore: number; // 0 to 100
  recommendationLevel: RecommendationLevel;
  rankSummary: string;
  scoreBreakdown: {
    qualityPoints: number;
    recommendationPoints: number;
    popularityPoints: number;
    proximityPoints: number;
    crowdAdjustment: number;
  };
}

export interface WorthwhileQueryOptions {
  anchorLat: number;
  anchorLng: number;
  anchorName?: string;
  pandals: Pandal[];
  city?: CityId;
  maxDistanceMeters?: number; // default unlimited or 15km
  minRecommendationLevel?: RecommendationLevel | 'all';
  hideOptional?: boolean;
  sortBy?: 'worth_score' | 'distance' | 'overall_quality' | 'queue_time';
}

/**
 * Pre-defined prominent anchor spots in Kolkata & Contai for quick "Where are you now?" testing.
 */
export const DEFAULT_ANCHORS: AnchorLocation[] = [
  // Kolkata Anchors
  {
    id: 'tala-park',
    name: 'Tala Park (North Kolkata)',
    bengaliName: 'টালা পার্ক (উত্তর কলকাতা)',
    city: 'kolkata',
    latitude: 22.6041,
    longitude: 88.3755,
    description: 'Iconic North Kolkata park near Shyambazar, Bagbazar and Sree Bhumi belt.',
  },
  {
    id: 'shyambazar-crossing',
    name: 'Shyambazar Five-Point',
    bengaliName: 'শ্যামবাজার পাঁচমাথার মোড়',
    city: 'kolkata',
    latitude: 22.6015,
    longitude: 88.3712,
    description: 'Major transit hub connecting North Kolkata heritage pandals.',
  },
  {
    id: 'college-square-boipara',
    name: 'College Street Boipara',
    bengaliName: 'কলেজ স্ট্রিট বইপাড়া',
    city: 'kolkata',
    latitude: 22.5744,
    longitude: 88.3629,
    description: 'Central Kolkata cultural core, near College Square & Bowbazar.',
  },
  {
    id: 'maddox-square-park',
    name: 'Maddox Square (South Kolkata)',
    bengaliName: 'ম্যাডক্স স্কোয়ার (দক্ষিণ কলকাতা)',
    city: 'kolkata',
    latitude: 22.5298,
    longitude: 88.3582,
    description: 'Heart of South Kolkata Adda, near Ballygunge Cultural and Hazra.',
  },
  {
    id: 'gariahat-crossing',
    name: 'Gariahat Crossing',
    bengaliName: 'গড়িয়াহাট মোড়',
    city: 'kolkata',
    latitude: 22.5186,
    longitude: 88.3688,
    description: 'South Kolkata illumination corridor near Ekdalia Evergreen.',
  },
  {
    id: 'saltlake-city-centre',
    name: 'Salt Lake City Centre 1',
    bengaliName: 'সল্টলেক সিটি সেন্টার ১',
    city: 'kolkata',
    latitude: 22.5898,
    longitude: 88.4082,
    description: 'East Kolkata hub near FD Block, BJ Block & Sree Bhumi.',
  },
  // Contai Anchors
  {
    id: 'contai-central-bus-terminus',
    name: 'Contai Central Bus Stand (Kanthi)',
    bengaliName: 'কাঁথি সেন্ট্রাল বাস স্ট্যান্ড',
    city: 'contai',
    latitude: 21.7820,
    longitude: 87.7460,
    description: 'Central gateway of Kanthi town connecting highway and rural routes.',
  },
  {
    id: 'contai-sabuj-sangha-ground',
    name: 'Sabuj Sangha Ground (Contai)',
    bengaliName: 'সবুজ সংঘ ময়দান (কাঁথি)',
    city: 'contai',
    latitude: 21.7782,
    longitude: 87.7517,
    description: 'Focal cultural arena of Contai town renowned for terracotta art.',
  },
  {
    id: 'contai-junput-junction',
    name: 'Junput Coastal Highway Junction',
    bengaliName: 'জুনপুট কোস্টাল হাইওয়ে জংশন',
    city: 'contai',
    latitude: 21.7510,
    longitude: 87.7720,
    description: 'Southern gateway to coastal sea-shell pandals and Junput beach.',
  },
];

const RECOMMENDATION_PRIORITY_MAP: Record<RecommendationLevel, number> = {
  'Must Visit': 4,
  'Highly Recommended': 3,
  Good: 2,
  Optional: 1,
};

/**
 * Calculates recommendation score weighting points.
 */
function getRecommendationBasePoints(level: RecommendationLevel): number {
  switch (level) {
    case 'Must Visit':
      return 35;
    case 'Highly Recommended':
      return 25;
    case 'Good':
      return 15;
    case 'Optional':
      return 5;
    default:
      return 10;
  }
}

/**
 * Calculates proximity points based on straight-line distance.
 * Nearby pandals receive up to 15 bonus points, gracefully decaying with distance.
 */
function calculateProximityPoints(distanceMeters: number): number {
  if (distanceMeters <= 500) return 15;
  if (distanceMeters <= 1000) return 13;
  if (distanceMeters <= 2000) return 10;
  if (distanceMeters <= 3500) return 7;
  if (distanceMeters <= 5000) return 4;
  if (distanceMeters <= 8000) return 2;
  return 0;
}

/**
 * Computes a queue/congestion adjustment score (-5 to +2).
 */
function calculateCrowdAdjustment(queueWaitMinutes: number, crowdLevel: string): number {
  if (queueWaitMinutes <= 15) return 2; // Fast moving bonus
  if (queueWaitMinutes <= 30) return 0;
  if (queueWaitMinutes <= 60) return -3;
  return -5; // Long queue penalty
}

/**
 * Core Algorithm: Answers "Which nearby pandals are actually worthwhile to visit?"
 *
 * Combines:
 * 1. Distance & Walking estimate
 * 2. Overall Quality Score (0-10)
 * 3. Recommendation Level ('Must Visit', 'Highly Recommended', etc.)
 * 4. Popularity Score (0-10)
 * 5. Current Crowd & Queue
 *
 * Does NOT merely return every nearby pandal. Ranks the most worthwhile pandals first.
 */
export function getWorthwhileNearbyPandals(
  options: WorthwhileQueryOptions
): WorthwhilePandalResult[] {
  const {
    anchorLat,
    anchorLng,
    pandals,
    city,
    maxDistanceMeters = 25000, // 25 km radius default
    minRecommendationLevel = 'all',
    hideOptional = false,
    sortBy = 'worth_score',
  } = options;

  // 1. Filter by city if specified
  const filteredCityPandals = city
    ? pandals.filter((p) => p.city === city)
    : pandals;

  const results: WorthwhilePandalResult[] = [];

  for (const pandal of filteredCityPandals) {
    // 2. Filter out Optional if hideOptional is true
    if (hideOptional && pandal.recommendationLevel === 'Optional') {
      continue;
    }

    // 3. Filter by min recommendation level if set
    if (
      minRecommendationLevel !== 'all' &&
      RECOMMENDATION_PRIORITY_MAP[pandal.recommendationLevel] <
        RECOMMENDATION_PRIORITY_MAP[minRecommendationLevel]
    ) {
      continue;
    }

    // 4. Calculate Distance & Bearing from Anchor
    const geo = calculateDistanceAndDirection(
      anchorLat,
      anchorLng,
      pandal.latitude,
      pandal.longitude
    );

    // Skip if exceeding max distance
    if (geo.straightDistanceMeters > maxDistanceMeters) {
      continue;
    }

    // 5. Calculate Score Components
    // Quality Points: Scale 0-10 to 0-35
    const qualityPoints = Math.round((pandal.overallQualityScore / 10) * 35 * 10) / 10;

    // Recommendation Level Points: (5 to 35 pts)
    const recommendationPoints = getRecommendationBasePoints(pandal.recommendationLevel);

    // Popularity Points: Scale 0-10 to 0-15
    const popularityPoints = Math.round((pandal.popularityScore / 10) * 15 * 10) / 10;

    // Proximity Points: (0 to 15 pts)
    const proximityPoints = calculateProximityPoints(geo.straightDistanceMeters);

    // Crowd adjustment: (-5 to +2 pts)
    const crowdAdjustment = calculateCrowdAdjustment(pandal.queueWaitMinutes, pandal.crowdLevel);

    // Composite Worth Score (0 - 100 scale)
    const rawWorthScore =
      qualityPoints +
      recommendationPoints +
      popularityPoints +
      proximityPoints +
      crowdAdjustment;

    const worthScore = Math.min(100, Math.max(0, Math.round(rawWorthScore * 10) / 10));

    const rankSummary = `${pandal.recommendationLevel} • ${geo.formattedStraightDistance} (${geo.direction}) • ⭐ ${pandal.overallQualityScore}`;

    results.push({
      pandal,
      straightDistanceMeters: geo.straightDistanceMeters,
      formattedStraightDistance: geo.formattedStraightDistance,
      walkingDistanceMeters: geo.walkingDistanceMeters,
      formattedWalkingDistance: geo.formattedWalkingDistance,
      estimatedWalkingMinutes: geo.estimatedWalkingMinutes,
      bearingDegrees: geo.bearingDegrees,
      direction: geo.direction,
      bengaliDirection: geo.bengaliDirection,
      arrowIcon: geo.arrowIcon,
      worthScore,
      recommendationLevel: pandal.recommendationLevel,
      rankSummary,
      scoreBreakdown: {
        qualityPoints,
        recommendationPoints,
        popularityPoints,
        proximityPoints,
        crowdAdjustment,
      },
    });
  }

  // 6. Sort results according to requested sorting criteria
  results.sort((a, b) => {
    if (sortBy === 'worth_score') {
      return b.worthScore - a.worthScore;
    }
    if (sortBy === 'distance') {
      return a.straightDistanceMeters - b.straightDistanceMeters;
    }
    if (sortBy === 'overall_quality') {
      return b.pandal.overallQualityScore - a.pandal.overallQualityScore;
    }
    if (sortBy === 'queue_time') {
      return a.pandal.queueWaitMinutes - b.pandal.queueWaitMinutes;
    }
    return b.worthScore - a.worthScore;
  });

  return results;
}
