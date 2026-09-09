export type CityId = 'kolkata' | 'contai';

export type ZoneId = 
  | 'north_kolkata'
  | 'south_kolkata'
  | 'central_kolkata'
  | 'saltlake_east'
  | 'behala_west'
  | 'contai_central'
  | 'contai_coastal'
  | 'contai_heritage';

export type PandalCategory = 
  | 'heritage_bonedi'
  | 'theme_marvel'
  | 'traditional_sabeki'
  | 'crowd_puller'
  | 'eco_friendly'
  | 'chandannagar_lights';

export type CrowdLevel = 'low' | 'moderate' | 'high' | 'extreme' | 'peak_surge';

export type CrowdTrend = 'increasing' | 'stable' | 'decreasing';

export type CrowdDataReliability = 'high' | 'moderate' | 'low' | 'outdated' | 'insufficient_data';

export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'drizzle'
  | 'light_rain'
  | 'heavy_rain'
  | 'thunderstorm';

export interface WeatherForecastSlot {
  timeOffsetMinutes: number; // 0, 30, 60, 90, 120
  forecastTime: string; // e.g. "07:30 PM"
  temperatureC: number;
  feelsLikeC: number;
  rainProbability: number; // 0-100%
  condition: WeatherCondition;
  conditionLabel: string;
  bengaliConditionLabel: string;
  icon: string;
  windSpeedKmh: number;
  windDirection: string;
}

export interface SevereWeatherAlert {
  id: string;
  severity: 'advisory' | 'warning' | 'severe';
  headline: string;
  bengaliHeadline: string;
  description: string;
  effectiveFrom: string;
  effectiveUntil: string;
  affectedZones: string[];
}

export interface LocationWeather {
  locationName: string;
  latitude: number;
  longitude: number;
  city: CityId;
  currentTempC: number;
  feelsLikeTempC: number;
  humidityPercent: number;
  rainProbability: number;
  weatherCondition: WeatherCondition;
  conditionLabel: string;
  bengaliConditionLabel: string;
  weatherIcon: string;
  windSpeedKmh: number;
  windDirection: string;
  shortTermForecast: WeatherForecastSlot[];
  severeAlert?: SevereWeatherAlert;
  isDemoData: boolean;
  lastUpdated: string;
  status: 'live_demo' | 'cached' | 'unavailable';
}

export interface RainGearItem {
  id: string;
  name: string;
  bengaliName: string;
  icon: string;
  importance: 'critical' | 'recommended' | 'optional';
  tip: string;
  bengaliTip: string;
  isPacked: boolean;
}

export interface PandalCrowdLiveStatus {
  pandalId: string;
  crowdLevel: CrowdLevel;
  queueWaitMinutes: number;
  trend: CrowdTrend;
  trendIcon: string; // ↗️ ➡️ ↘️
  lastUpdated: string; // ISO date or time string
  reportCount: number;
  reliability: CrowdDataReliability;
  reliabilityLabel: string;
  isOutdated: boolean;
  recentReports: CrowdReportRecord[];
}

export interface DynamicVisitScore {
  pandalId: string;
  baseQualityScore: number; // e.g. 9.4 (Permanent Quality out of 10)
  currentVisitScore: number; // e.g. 6.8 (Temporary Visit Now score out of 10)
  queueWaitMinutes: number;
  crowdLevel: CrowdLevel;
  crowdTrend: CrowdTrend;
  rainProbability: number;
  isRainApproaching: boolean;
  scoreBreakdown: {
    basePoints: number;
    queueDeduction: number;
    crowdDeduction: number;
    weatherDeduction: number;
    trendAdjustment: number;
  };
  reasons: string[];
  bengaliReasons: string[];
  isRecommendedRightNow: boolean;
  summaryBadge: string;
}

export interface DynamicReplanningOption {
  id: string;
  type: 'queue_spike' | 'rain_approaching' | 'running_late' | 'time_infeasible' | 'better_sequence_available';
  title: string;
  bengaliTitle: string;
  severity: 'info' | 'warning' | 'critical';
  triggerReason: string;
  bengaliTriggerReason: string;
  currentPandalIds: string[];
  suggestedPandalIds: string[];
  currentPandalNames: string[];
  suggestedPandalNames: string[];
  timeSavedMinutes: number;
  walkingDistanceChangeMeters: number;
  transportChangeLabel?: string;
  suggestedRemovals?: Array<{ pandalId: string; pandalName: string; reason: string; timeSavedMinutes: number }>;
  suggestedModeChanges?: Array<{ fromPandalName: string; toPandalName: string; originalMode: string; newMode: string; timeSavedMinutes: number }>;
  createdAt: string;
}

export interface RunningLateStatus {
  isBehindSchedule: boolean;
  minutesBehind: number;
  completedStopsCount: number;
  remainingStopsCount: number;
  estimatedCompletionTime: string;
  plannedEndTime: string;
  isEndFeasible: boolean;
  overScheduleMinutes: number;
  suggestedRemovals: Array<{ pandalId: string; pandalName: string; worthScore: number; timeSavedMinutes: number }>;
}

export type RecommendationLevel = 
  | 'Must Visit'
  | 'Highly Recommended'
  | 'Good'
  | 'Optional';

export type PandalTag = 
  | 'Famous'
  | 'Theme'
  | 'Traditional'
  | 'Artistic Idol'
  | 'Award Winner'
  | 'Family Friendly'
  | 'Eco Friendly'
  | 'Heritage'
  | 'Night Illumination'
  | 'Folk Art'
  | 'Water Reflection'
  | 'Chandannagar Lights'
  | 'Bonedi Bari'
  | string;

export type CompassDirection = 
  | 'North'
  | 'North-East'
  | 'East'
  | 'South-East'
  | 'South'
  | 'South-West'
  | 'West'
  | 'North-West';

export interface PandalHighlight {
  title: string;
  description: string;
}

export interface NearbyFood {
  name: string;
  cuisine: string;
  famousDish: string;
  distance: string;
  icon: string;
}

export interface TransitInfo {
  nearestMetro?: {
    station: string;
    line: string;
    gate?: string;
    walkingMins: number;
  };
  nearestBusStop?: {
    stop: string;
    routes?: string[];
    walkingMins: number;
  };
  nearestAutoStand?: {
    route: string;
    walkingMins: number;
  };
  parkingAvailability: 'none' | 'limited' | 'dedicated_bay';
  vipPassEntryGate?: string;
  wheelchairAccessible: boolean;
}

export interface Pandal {
  id: string;
  name: string;
  bengaliName: string;
  tagline: string;
  city: CityId;
  area: string; // neighborhood / locality
  bengaliArea?: string;
  zone: ZoneId;
  zoneLabel: string;
  bengaliZoneLabel: string;
  address: string;
  latitude: number;
  longitude: number;
  coordinates: {
    lat: number;
    lng: number;
    mapX: number; // percentage for interactive vector map (0-100)
    mapY: number; // percentage for interactive vector map (0-100)
  };
  category: PandalCategory;
  categoryLabel: string;
  yearEstablished: number;
  
  // Quality & Recommendation Foundation
  idolQualityScore: number; // Score out of 10 (e.g. 9.8)
  themeQualityScore: number; // Score out of 10 (e.g. 9.6)
  popularityScore: number; // Score out of 10 (e.g. 9.9)
  overallQualityScore: number; // Composite quality score out of 10 (e.g. 9.8)
  recommendationLevel: RecommendationLevel; // 'Must Visit' | 'Highly Recommended' | 'Good' | 'Optional'
  estimatedVisitDuration: number; // in minutes (e.g. 35)
  typicalCrowdLevel: CrowdLevel;
  tags: PandalTag[];
  isDemoRecord: boolean; // clearly labelled demo/sample record

  // Real-time / Live simulation fields
  crowdLevel: CrowdLevel;
  queueWaitMinutes: number;
  peakHours: string;
  bestTimeToVisit: string;

  // Cultural & Architectural details
  idolArtisan: string;
  pandalArchitect: string;
  themeConcept: string;
  themeDescription: string;
  bengaliTheme: string;
  description: string;
  fullHistory: string;
  photos: string[];
  heroImage: string;
  audioGuideUrl?: string;
  audioDurationSeconds: number;
  highlights: string[];
  transit: TransitInfo;
  foodNearby: NearbyFood[];
  rating: number;
  reviewCount: number;
  isVIPPassAvailable: boolean;
  isOpen24Hours: boolean;
  tithiAartiTimes: {
    sandhiPuja: string;
    dhunuchiAarti: string;
    bhogDistribution: string;
  };
}

export interface TripStop {
  pandalId: string;
  order: number;
  customNotes?: string;
  isVisited: boolean;
  visitedTimestamp?: string;
}

export interface CuratedRoute {
  id: string;
  title: string;
  bengaliTitle: string;
  city: CityId;
  subtitle: string;
  description: string;
  pandalIds: string[];
  totalDistanceKm: number;
  estimatedHours: number;
  bestTime: string;
  transportMode: 'metro_walk' | 'car_hired' | 'auto_circuit' | 'coastal_drive';
  crowdStrategy: string;
  coverImage: string;
  badge: string;
}

export interface PujaTithiInfo {
  dayName: string;
  bengaliDayName: string;
  tithi: string;
  bengaliTithi: string;
  dateStr: string;
  anjaliTimings: string;
  sandhiPujaTimings?: string;
  specialRitual: string;
  dhunuchiChallenge: string;
}

export interface UserWalkingEnergyConfig {
  comfortableWalkingLimitKm: number; // default: 6.0 km
  maxWalkingLimitKm: number; // default: 8.0 km
  maxContinuousWalkingMins: number; // default: 45 mins
  shareWalkingStats: boolean; // default: true
}

export interface UserPreferences {
  activeCity: CityId;
  themeMode: 'festive_vermilion' | 'mahasaptami_night' | 'kora_cream';
  language: 'en' | 'bn' | 'banglish';
  soundEnabled: boolean;
  dhakVolume: number;
  notificationsEnabled: boolean;
  offlineMode: boolean;
  walkingConfig?: UserWalkingEnergyConfig;
  vipPasses: Array<{
    pandalId: string;
    passCode: string;
    slot: string;
  }>;
}

export interface AnchorLocation {
  id: string;
  name: string;
  bengaliName: string;
  city: CityId;
  latitude: number;
  longitude: number;
  description: string;
}

export type WalkingPreference = 'low' | 'normal' | 'high';
export type TransportPreference = 'walking' | 'metro' | 'bus' | 'mixed';

// -------------------------------------------------------------
// Smart Transport & Route Engine Types
// -------------------------------------------------------------

export type SmartTransportMode =
  | 'walking'
  | 'metro'
  | 'bus'
  | 'auto_rickshaw'
  | 'mixed_metro_walk'
  | 'mixed_bus_walk'
  | 'mixed_metro_bus';

export type RouteStepType =
  | 'walk_start'
  | 'metro_board'
  | 'metro_ride'
  | 'metro_transfer'
  | 'metro_alight'
  | 'bus_board'
  | 'bus_ride'
  | 'bus_alight'
  | 'auto_board'
  | 'auto_ride'
  | 'auto_alight'
  | 'walk_end'
  | 'arrive_destination';

export interface RouteStep {
  id: string;
  type: RouteStepType;
  instruction: string;
  bengaliInstruction?: string;
  distanceMeters: number;
  durationMinutes: number;
  icon: string;
  metadata?: {
    stationName?: string;
    bengaliStationName?: string;
    lineName?: string;
    lineColor?: string;
    gate?: string;
    stopCount?: number;
    stopsList?: string[];
    routeNumber?: string;
    transferStation?: string;
    departureLocation?: string;
    arrivalLocation?: string;
  };
}

export interface RouteOptionBreakdown {
  walkToTransitMeters: number;
  walkToTransitMinutes: number;
  transitRideMinutes: number;
  walkFromTransitMeters: number;
  walkFromTransitMinutes: number;
  transfersMinutes: number;
}

export interface ModeRouteOption {
  mode: SmartTransportMode;
  modeLabel: string;
  bengaliModeLabel: string;
  icon: string;
  totalDurationMinutes: number;
  totalDistanceMeters: number;
  walkingDistanceMeters: number;
  straightDistanceMeters: number;
  transitDurationMinutes: number;
  walkingDurationMinutes: number;
  transferCount: number;
  waitingTimeMinutes: number;
  isRecommended: boolean;
  recommendationScore: number; // 0 - 100
  recommendationReason: string;
  timeSavedVersusWalkMinutes?: number;
  exceedsMaxWalkingLimit: boolean;
  comfortTag: string; // e.g. "Fastest", "Eco-friendly", "Direct Walk", "Air Conditioned", "Zero Fatigue"
  breakdown: RouteOptionBreakdown;
  steps: RouteStep[];
}

export interface JourneyRouteComparison {
  originName: string;
  destinationName: string;
  originCoordinates: { lat: number; lng: number };
  destinationCoordinates: { lat: number; lng: number };
  straightDistanceMeters: number;
  recommendedMode: SmartTransportMode;
  recommendedOption: ModeRouteOption;
  allOptions: ModeRouteOption[];
  summaryNote: string;
  userWalkingPreference: WalkingPreference;
  userMaxWalkingDistanceMeters?: number;
  calculatedAt: string;
}

export interface MetroStationEntrance {
  gateNumber: string;
  name: string;
  bengaliName?: string;
  directionFacing: string;
  nearestLandmark?: string;
}

export interface MetroStationRecord {
  id: string;
  name: string;
  bengaliName: string;
  city: CityId;
  line: 'blue_line' | 'green_line' | 'purple_line' | 'orange_line';
  lineLabel: string;
  lineColor: string;
  latitude: number;
  longitude: number;
  orderOnLine: number;
  isInterchange: boolean;
  interchangeLines?: string[];
  entrances: MetroStationEntrance[];
  nearbyPandalIds: Array<{
    pandalId: string;
    walkingDistanceMeters: number;
    walkingMinutes: number;
  }>;
  isDemoData: boolean;
}

export interface BusStopRecord {
  id: string;
  name: string;
  bengaliName: string;
  city: CityId;
  corridor: string;
  latitude: number;
  longitude: number;
  routes: string[];
  nearbyPandalIds: Array<{
    pandalId: string;
    walkingDistanceMeters: number;
    walkingMinutes: number;
  }>;
  isDemoData: boolean;
}

export interface BusRouteRecord {
  id: string;
  routeNumber: string;
  routeName: string;
  corridor: string;
  frequencyMinutes: number;
  stopIds: string[];
  isDemoData: boolean;
}

export interface RouteCalculationOptions {
  originLat: number;
  originLng: number;
  originName?: string;
  destinationLat: number;
  destinationLng: number;
  destinationName?: string;
  fromPandal?: Pandal;
  toPandal?: Pandal;
  walkingPreference?: WalkingPreference;
  transportPreference?: TransportPreference;
  maxWalkingDistanceMeters?: number | null;
  todayWalkedDistanceMeters?: number;
  energyAwareMode?: boolean;
  city?: CityId;
  crowdLevel?: CrowdLevel;
  currentGpsPosition?: { latitude: number; longitude: number };
}

export interface TripLocation {
  id?: string;
  name: string;
  bengaliName?: string;
  city: CityId;
  latitude: number;
  longitude: number;
  isCustom?: boolean;
  description?: string;
}

export interface TripPlan {
  id: string;
  name: string;
  bengaliName?: string;
  city: CityId;
  date: string; // e.g. "2026-10-19" (Maha Saptami)
  startTime: string; // e.g. "17:30"
  endTime: string; // e.g. "22:30"
  startLocation: TripLocation;
  endLocation: TripLocation;
  walkingPreference: WalkingPreference;
  preferredTransport: TransportPreference;
  maxWalkingDistanceMeters?: number | null;
  selectedPandalIds: string[];
  isCustomTrip?: boolean;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}

export interface ItineraryStop {
  id: string;
  type: 'start' | 'pandal' | 'end';
  stopIndex: number;
  pandalId?: string;
  pandal?: Pandal;
  locationName: string;
  bengaliLocationName?: string;
  recommendationLevel?: RecommendationLevel;
  worthScore?: number;
  distanceFromPrevMeters: number;
  formattedDistanceFromPrev: string;
  bearingDegreesFromPrev: number;
  directionFromPrev: CompassDirection;
  bengaliDirectionFromPrev: string;
  arrowIconFromPrev: string;
  estimatedTravelMinutes: number;
  estimatedVisitDurationMinutes: number;
  transportMode: 'walking' | 'metro' | 'bus' | 'auto_mixed';
  transportModeLabel: string;
  transportIcon: string;
  smartRecommendationReason?: string;
  routeComparison?: JourneyRouteComparison;
  smartModeOption?: ModeRouteOption;
  plannedArrivalTime: string;
  plannedDepartureTime: string;
  isVisited?: boolean;
}

export interface ItineraryOptimizationSuggestion {
  id: string;
  action: 'remove_pandal' | 'adjust_duration' | 'change_transport';
  pandalId?: string;
  pandalName?: string;
  recommendationLevel?: RecommendationLevel;
  timeSavedMinutes: number;
  explanation: string;
}

export interface ItinerarySummary {
  pandalCount: number;
  totalTripDurationMinutes: number;
  formattedTotalDuration: string;
  totalWalkingDistanceMeters: number;
  formattedTotalWalkingDistance: string;
  totalTransportMinutes: number;
  formattedTransportTime: string;
  totalVisitDurationMinutes: number;
  formattedVisitTime: string;
  plannedStartTime: string;
  plannedEndTime: string;
  availableTimeMinutes: number;
  timeFeasibilityStatus: 'fits_well' | 'tight' | 'exceeds_time';
  timeDifferenceMinutes: number; // >0 means exceeds available time, <0 means buffer left
  warningMessage?: string;
  suggestions: ItineraryOptimizationSuggestion[];
}

export interface PlannedItinerary {
  trip: TripPlan;
  stops: ItineraryStop[];
  summary: ItinerarySummary;
}

// -------------------------------------------------------------
// Supabase Backend & Friend Group Architecture Models
// -------------------------------------------------------------

export type MemberRole = 'admin' | 'member';

export interface UserProfile {
  id: string; // Auth User ID (UUID)
  email?: string;
  displayName: string;
  bengaliName?: string;
  avatarUrl: string; // Festive avatar icon / image
  isLocationSharingEnabled: boolean;
  lastSeenAt: string; // ISO Date string
  isOnline: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TripMember {
  id: string; // UUID
  tripId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
  lastActiveAt: string;
  profile?: UserProfile;
}

export interface TripPandalStopRecord {
  id: string;
  tripId: string;
  pandalId: string;
  stopOrder: number;
  customNotes?: string;
  addedBy?: string;
  createdAt: string;
}

export interface PandalVisitStatusRecord {
  id: string;
  tripId: string;
  pandalId: string;
  userId: string;
  userName?: string;
  isVisited: boolean;
  visitedAt: string;
  rating?: number;
  review?: string;
}

export type ExpenseCategory =
  | 'food'
  | 'transport_cab'
  | 'transport_transit'
  | 'tickets'
  | 'shopping'
  | 'stay'
  | 'snacks'
  | 'other';

export type ExpenseSplitType = 'equal' | 'custom_amount' | 'percentage';

export interface ExpenseParticipantSplit {
  userId: string;
  userName: string;
  bengaliName?: string;
  avatarUrl?: string;
  amount: number; // Exact amount owed for this expense (in Rupees)
  percentage?: number; // Optional percentage if split by %
}

export interface TripExpenseRecord {
  id: string;
  tripId: string;
  title: string;
  amount: number; // Total expense amount in INR
  category: ExpenseCategory;
  paidBy: string; // userId of member who paid
  paidByName: string;
  paidByAvatar?: string;
  splitType: ExpenseSplitType;
  splitBetween: string[]; // array of userIds participating
  splits: ExpenseParticipantSplit[]; // Detailed breakdown for each participant
  date: string; // e.g. "2026-10-19" (Maha Saptami)
  time?: string; // e.g. "19:30"
  note?: string;
  pandalId?: string; // Optional associated pandal ID
  pandalName?: string; // Optional associated location/pandal name (e.g. "Food near Tala Park")
  receiptPhotoUrl?: string; // Optional receipt/photo attachment placeholder or data URL
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
}

export interface MemberExpenseBalance {
  userId: string;
  userName: string;
  bengaliName?: string;
  avatarUrl?: string;
  totalPaid: number; // Total amount paid out of pocket
  totalOwed: number; // Fair share owed across all trip expenses
  netBalance: number; // totalPaid - totalOwed (>0: receives money, <0: owes money, 0: settled)
  isCurrentUser?: boolean;
}

export interface SmartSettlementTransaction {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserId: string;
  toUserName: string;
  toUserAvatar?: string;
  amount: number;
  explanation: string;
  bengaliExplanation?: string;
}

export interface GroupExpenseCategoryStat {
  category: ExpenseCategory;
  categoryLabel: string;
  categoryBengaliLabel: string;
  emoji: string;
  total: number;
  percentage: number;
  count: number;
}

export interface GroupExpenseDashboardSummary {
  tripId: string;
  totalTripSpending: number;
  formattedTotalSpending: string;
  categoryStats: GroupExpenseCategoryStat[];
  memberBalances: MemberExpenseBalance[];
  smartSettlements: SmartSettlementTransaction[];
  currentUserBalance?: MemberExpenseBalance;
  totalExpensesCount: number;
  highestSpender?: {
    userId: string;
    userName: string;
    amount: number;
  };
}

export interface CrowdReportRecord {
  id: string;
  tripId?: string;
  pandalId: string;
  userId: string;
  userName: string;
  crowdLevel: CrowdLevel;
  queueWaitMinutes: number;
  reportedAt: string;
  notes?: string;
}

export type LocationSharingDuration = '1h' | '3h' | 'until_trip_ends';

export interface LocationSharingSettings {
  isSharing: boolean;
  duration: LocationSharingDuration;
  startedAt: string | null;
  expiresAt: string | null;
  lastUpdated: string | null;
  // Battery Saver Mode
  batterySaverMode?: boolean;
  isStationary?: boolean;
  stationarySince?: string | null;
  stationaryDurationMinutes?: number;
  gpsState?: 'active_watching' | 'sleep_stationary' | 'polling_battery_saver' | 'disabled';
  updateFrequencySeconds?: number;
  batterySavingsPercent?: number;
}

export interface LiveLocationRecord {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  latitude: number;
  longitude: number;
  mapX?: number;
  mapY?: number;
  heading?: number;
  speed?: number;
  accuracy?: number;
  isSharing: boolean;
  duration?: LocationSharingDuration;
  expiresAt?: string;
  updatedAt: string;
  // Battery & Stationary flags
  isBatterySaver?: boolean;
  isStationary?: boolean;
  stationaryDurationMinutes?: number;
  gpsState?: 'active_watching' | 'sleep_stationary' | 'polling_battery_saver' | 'disabled';
}

export interface GroupMemberLocation extends LiveLocationRecord {
  profile?: UserProfile;
  distanceMeters?: number;
  formattedDistance?: string;
  direction?: CompassDirection;
  bengaliDirection?: string;
  arrowIcon?: string;
  bearingDegrees?: number;
  estimatedWalkingMinutes?: number;
  formattedWalkingDistance?: string;
  nearestLandmarkName?: string;
  bengaliLandmarkName?: string;
  status: 'active' | 'stale' | 'disabled';
  isCurrentUser: boolean;
}

export interface MemberMeetingDistanceInfo {
  userId: string;
  userName: string;
  userAvatar?: string;
  bengaliName?: string;
  distanceMeters: number;
  formattedDistance: string;
  estimatedWalkingMinutes: number;
  direction: CompassDirection;
  bengaliDirection: string;
  arrowIcon: string;
  isCurrentUser: boolean;
}

export interface SuggestedMeetingPoint {
  latitude: number;
  longitude: number;
  mapX: number;
  mapY: number;
  nearestLandmarkName: string;
  bengaliLandmarkName?: string;
  description: string;
  bengaliDescription: string;
  activeMemberCount: number;
  averageDistanceMeters: number;
  formattedAverageDistance: string;
  memberDistances?: MemberMeetingDistanceInfo[];
  disclaimer?: string;
  bengaliDisclaimer?: string;
}

// -------------------------------------------------------------
// Safety, Emergency & SOS Alert Architecture
// -------------------------------------------------------------

export type AlertStatus = 'active' | 'cancelled' | 'resolved';

export interface TripSOSAlert {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  bengaliName?: string;
  latitude: number;
  longitude: number;
  mapX?: number;
  mapY?: number;
  nearestLandmark?: string;
  bengaliLandmark?: string;
  isLocationAvailable: boolean;
  status: AlertStatus;
  message?: string;
  timestamp: string; // ISO string
  resolvedAt?: string;
}

export interface TripLostAlert {
  id: string;
  tripId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  bengaliName?: string;
  latitude: number;
  longitude: number;
  mapX?: number;
  mapY?: number;
  nearestLandmark?: string;
  bengaliLandmark?: string;
  isLocationAvailable: boolean;
  distanceFromGroupMeters?: number;
  formattedDistanceFromGroup?: string;
  directionFromGroup?: string;
  bengaliDirectionFromGroup?: string;
  arrowIcon?: string;
  status: AlertStatus;
  suggestedMeetingPoint?: SuggestedMeetingPoint | null;
  message?: string;
  timestamp: string;
  resolvedAt?: string;
}

export interface GroupSafetyStatus {
  activeCount: number;
  staleCount: number;
  offlineCount: number;
  stoppedCount: number;
  activeSOSCount: number;
  activeLostCount: number;
  activeSOSAlerts: TripSOSAlert[];
  activeLostAlerts: TripLostAlert[];
}

export type EssentialPlaceCategory =
  | 'metro'
  | 'bus_stop'
  | 'public_toilet'
  | 'hospital'
  | 'police'
  | 'petrol_pump'
  | 'food'
  | 'tea_snacks'
  | 'rest_spot';

export interface EssentialPlaceRecord {
  id: string;
  name: string;
  bengaliName: string;
  category: EssentialPlaceCategory;
  city: CityId;
  latitude: number;
  longitude: number;
  mapX: number; // 0-100 percentage for interactive vector map
  mapY: number; // 0-100 percentage for interactive vector map
  address: string;
  bengaliAddress?: string;
  landmark?: string;
  bengaliLandmark?: string;
  is24Hours: boolean;
  phone?: string;
  details?: string;
  bengaliDetails?: string;
  isDemoData: boolean;
}

export interface EmergencyContactNumber {
  id: string;
  title: string;
  bengaliTitle: string;
  number: string;
  category: 'national' | 'police' | 'medical' | 'women_child' | 'disaster_puja' | 'local_district';
  description: string;
  bengaliDescription: string;
  is24x7: boolean;
  icon: string;
  badge?: string;
}


export interface PandalGroupVisitSummary {
  pandalId: string;
  pandalName: string;
  bengaliPandalName?: string;
  totalMembers: number;
  visitedCount: number;
  visitedPercentage: number;
  visitedMembers: {
    userId: string;
    userName: string;
    bengaliName?: string;
    avatarUrl: string;
    visitedAt: string;
  }[];
  notVisitedMembers: {
    userId: string;
    userName: string;
    bengaliName?: string;
    avatarUrl: string;
  }[];
  isCurrentUserVisited: boolean;
}

export interface GroupTripProgressSummary {
  totalPandals: number;
  completedPandalsCount: number;
  percentage: number;
  memberProgress: {
    userId: string;
    userName: string;
    bengaliName?: string;
    avatarUrl: string;
    visitedCount: number;
    totalCount: number;
    percentage: number;
  }[];
}

export interface GroupActivityEvent {
  id: string;
  tripId: string;
  type: 'member_joined' | 'pandal_added' | 'pandal_removed' | 'stop_reordered' | 'darshan_completed' | 'crowd_reported' | 'expense_added' | 'location_started' | 'location_stopped';
  userId: string;
  userName: string;
  userAvatar?: string;
  description: string;
  bengaliDescription?: string;
  pandalId?: string;
  pandalName?: string;
  timestamp: string;
}

export interface SharedTripGroup {
  trip: TripPlan;
  inviteCode: string; // 6-character unique code e.g. "KP26X7"
  createdBy: string; // Admin User ID
  members: TripMember[];
  myRole: MemberRole;
  isSupabaseSynced: boolean;
  recentActivities: GroupActivityEvent[];
}

// -------------------------------------------------------------
// Walking & Energy Intelligence Models
// -------------------------------------------------------------

export interface WalkingSessionStats {
  tripId?: string;
  date: string; // e.g. "2026-10-19"
  totalDistanceMeters: number;
  totalDurationMinutes: number;
  estimatedSteps: number; // approximate ~1,330 steps/km (non-medical estimate)
  completedWalkingLegs: number;
  longestWalkingLegMeters: number;
  continuousWalkingMinutes: number;
  lastWalkActiveTimestamp?: string;
  isContinuousWalkWarningActive: boolean;
  restBreaksTaken: number;
  transitUsageCount: {
    metro: number;
    bus: number;
    auto: number;
  };
  lastUpdated: string;
}

export interface RestOpportunity {
  id: string;
  name: string;
  bengaliName?: string;
  category: 'rest_spot' | 'tea_snacks' | 'food';
  categoryLabel: string;
  distanceMeters: number;
  walkingMinutes: number;
  address: string;
  landmark?: string;
  suggestedDurationMinutes: number; // e.g. 20
  itineraryDelayMinutes: number;
  reason: string;
  bengaliReason?: string;
  latitude: number;
  longitude: number;
}

export interface MemberWalkingActivity {
  userId: string;
  userName: string;
  bengaliName?: string;
  avatarUrl: string;
  distanceKm: number;
  estimatedSteps: number;
  walkingMinutes: number;
  isSharingStats: boolean; // if false, "Stats hidden"
  lastActiveTime?: string;
}

export interface EnergyAwareRecommendationNote {
  isEnergyTriggered: boolean;
  todayWalkedKm: number;
  targetWalkingLimitKm: number;
  percentageOfTarget: number;
  exceedsComfortLimit: boolean;
  exceedsMaxLimit: boolean;
  recommendedMode: SmartTransportMode;
  distanceSavedMeters?: number;
  note: string;
  bengaliNote?: string;
}


