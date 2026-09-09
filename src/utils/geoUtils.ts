import { CompassDirection } from '../types';

/**
 * Earth radius in meters (WGS-84 mean radius)
 */
const EARTH_RADIUS_METERS = 6371000;

/**
 * Typical urban walking route winding multiplier for historic Kolkata and Contai streets.
 * Straight-line Euclidean distance must be kept separate from actual walking-path distance.
 */
export const URBAN_WALKING_CIRCUITY_FACTOR = 1.28;

/**
 * Average pedestrian walking speed in meters per minute (~4.6 km/h)
 */
export const AVERAGE_WALKING_SPEED_METERS_PER_MIN = 76;

/**
 * Calculates the great-circle straight-line distance between two geographic coordinates using the Haversine formula.
 *
 * @param lat1 Latitude of point 1 in degrees
 * @param lon1 Longitude of point 1 in degrees
 * @param lat2 Latitude of point 2 in degrees
 * @param lon2 Longitude of point 2 in degrees
 * @returns Straight-line distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(EARTH_RADIUS_METERS * c);
}

/**
 * Helper to get straight-line distance in kilometers.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const meters = calculateHaversineDistance(lat1, lon1, lat2, lon2);
  return Math.round((meters / 1000) * 10) / 10;
}

/**
 * Formats a metric distance into clean human-readable string (e.g. "450m" or "1.4 km").
 */
export function formatDistance(distanceMeters: number): string {
  if (distanceMeters < 1000) {
    return `${Math.round(distanceMeters)}m`;
  }
  const km = (distanceMeters / 1000).toFixed(1);
  return `${km} km`;
}

/**
 * Estimates walking route distance and duration from straight-line Haversine distance.
 * Note: Keeps straight-line distance and walking distance strictly distinct.
 *
 * @param straightLineMeters Distance in meters as calculated by Haversine
 */
export function estimateWalkingDistance(straightLineMeters: number): {
  walkingDistanceMeters: number;
  formattedWalkingDistance: string;
  estimatedWalkingMinutes: number;
} {
  const walkingDistanceMeters = Math.round(straightLineMeters * URBAN_WALKING_CIRCUITY_FACTOR);
  const estimatedWalkingMinutes = Math.max(
    1,
    Math.round(walkingDistanceMeters / AVERAGE_WALKING_SPEED_METERS_PER_MIN)
  );

  return {
    walkingDistanceMeters,
    formattedWalkingDistance: formatDistance(walkingDistanceMeters),
    estimatedWalkingMinutes,
  };
}

/**
 * Calculates the initial forward bearing/azimuth in degrees (0° to 360°) from point 1 to point 2.
 * 0° = North, 90° = East, 180° = South, 270° = West.
 *
 * @param lat1 Start latitude
 * @param lon1 Start longitude
 * @param lat2 Destination latitude
 * @param lon2 Destination longitude
 * @returns Bearing in degrees (0 to 359.9)
 */
export function calculateBearing(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = toRadians(lat1);
  const phi2 = toRadians(lat2);
  const deltaLambda = toRadians(lon2 - lon1);

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  const theta = Math.atan2(y, x);
  const bearing = (toDegrees(theta) + 360) % 360;

  return Math.round(bearing * 10) / 10;
}

export interface DirectionInfo {
  direction: CompassDirection;
  bengaliDirection: string;
  arrowIcon: string;
  bearingDegrees: number;
}

/**
 * Maps a bearing in degrees (0-360) to one of the 8 cardinal/ordinal compass directions.
 */
export function getCompassDirection(bearingDegrees: number): DirectionInfo {
  const normalized = (bearingDegrees % 360 + 360) % 360;

  if (normalized >= 337.5 || normalized < 22.5) {
    return { direction: 'North', bengaliDirection: 'উত্তর', arrowIcon: '⬆️', bearingDegrees: normalized };
  } else if (normalized >= 22.5 && normalized < 67.5) {
    return { direction: 'North-East', bengaliDirection: 'উত্তর-পূর্ব', arrowIcon: '↗️', bearingDegrees: normalized };
  } else if (normalized >= 67.5 && normalized < 112.5) {
    return { direction: 'East', bengaliDirection: 'পূর্ব', arrowIcon: '➡️', bearingDegrees: normalized };
  } else if (normalized >= 112.5 && normalized < 157.5) {
    return { direction: 'South-East', bengaliDirection: 'দক্ষিণ-পূর্ব', arrowIcon: '↘️', bearingDegrees: normalized };
  } else if (normalized >= 157.5 && normalized < 202.5) {
    return { direction: 'South', bengaliDirection: 'দক্ষিণ', arrowIcon: '⬇️', bearingDegrees: normalized };
  } else if (normalized >= 202.5 && normalized < 247.5) {
    return { direction: 'South-West', bengaliDirection: 'দক্ষিণ-পশ্চিম', arrowIcon: '↙️', bearingDegrees: normalized };
  } else if (normalized >= 247.5 && normalized < 292.5) {
    return { direction: 'West', bengaliDirection: 'পশ্চিম', arrowIcon: '⬅️', bearingDegrees: normalized };
  } else {
    return { direction: 'North-West', bengaliDirection: 'উত্তর-পশ্চিম', arrowIcon: '↖️', bearingDegrees: normalized };
  }
}

/**
 * Combined helper calculating both distance (straight-line + walking estimate) and direction between two points.
 */
export function calculateDistanceAndDirection(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number
): {
  straightDistanceMeters: number;
  formattedStraightDistance: string;
  walkingDistanceMeters: number;
  formattedWalkingDistance: string;
  estimatedWalkingMinutes: number;
  bearingDegrees: number;
  direction: CompassDirection;
  bengaliDirection: string;
  arrowIcon: string;
} {
  const straightDistanceMeters = calculateHaversineDistance(fromLat, fromLon, toLat, toLon);
  const walkingInfo = estimateWalkingDistance(straightDistanceMeters);
  const bearingDegrees = calculateBearing(fromLat, fromLon, toLat, toLon);
  const compass = getCompassDirection(bearingDegrees);

  return {
    straightDistanceMeters,
    formattedStraightDistance: formatDistance(straightDistanceMeters),
    walkingDistanceMeters: walkingInfo.walkingDistanceMeters,
    formattedWalkingDistance: walkingInfo.formattedWalkingDistance,
    estimatedWalkingMinutes: walkingInfo.estimatedWalkingMinutes,
    bearingDegrees,
    direction: compass.direction,
    bengaliDirection: compass.bengaliDirection,
    arrowIcon: compass.arrowIcon,
  };
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Projects real-world Latitude & Longitude to the 0..100 percentage viewport grid of the vector SVG map.
 */
export function latLngToMapCoordinates(
  lat: number,
  lng: number,
  city: 'kolkata' | 'contai' = 'kolkata'
): { mapX: number; mapY: number } {
  if (city === 'kolkata') {
    // Kolkata Lat: 22.5000 (South) to 22.6100 (North)
    // Kolkata Lng: 88.3300 (West) to 88.4200 (East)
    const minLat = 22.4950;
    const maxLat = 22.6180;
    const minLng = 88.3200;
    const maxLng = 88.4300;

    const normY = (maxLat - lat) / (maxLat - minLat); // North (maxLat) is map top (low Y)
    const normX = (lng - minLng) / (maxLng - minLng); // East (maxLng) is map right (high X)

    const mapX = Math.round(15 + Math.max(0, Math.min(1, normX)) * 70);
    const mapY = Math.round(15 + Math.max(0, Math.min(1, normY)) * 70);

    return {
      mapX: Math.max(8, Math.min(92, mapX)),
      mapY: Math.max(8, Math.min(92, mapY)),
    };
  } else {
    // Contai Lat: 21.7500 to 21.8100
    // Contai Lng: 87.7200 to 87.7900
    const minLat = 21.7450;
    const maxLat = 21.8150;
    const minLng = 87.7150;
    const maxLng = 87.7950;

    const normY = (maxLat - lat) / (maxLat - minLat);
    const normX = (lng - minLng) / (maxLng - minLng);

    const mapX = Math.round(15 + Math.max(0, Math.min(1, normX)) * 70);
    const mapY = Math.round(15 + Math.max(0, Math.min(1, normY)) * 70);

    return {
      mapX: Math.max(8, Math.min(92, mapX)),
      mapY: Math.max(8, Math.min(92, mapY)),
    };
  }
}

/**
 * Returns a human-friendly relative time string (e.g. "12 seconds ago", "3 minutes ago", "just now").
 */
export function formatTimeAgo(isoDateString?: string | null): string {
  if (!isoDateString) return 'Never';
  const diffMs = Date.now() - new Date(isoDateString).getTime();
  if (isNaN(diffMs) || diffMs < 0) return 'Just now';

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 15) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  return `${Math.floor(diffHours / 24)}d ago`;
}

