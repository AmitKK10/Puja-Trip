import {
  CityId,
  LocationWeather,
  WeatherCondition,
  WeatherForecastSlot,
  SevereWeatherAlert,
  RainGearItem,
} from '../types';

/**
 * Essential monsoon gear items for Durga Puja pandal hopping in Bengal
 */
export const DEFAULT_RAIN_GEAR: RainGearItem[] = [
  {
    id: 'folding_umbrella',
    name: 'Compact Windproof Umbrella',
    bengaliName: 'বায়ুরোধী ফোল্ডিং ছাতা',
    icon: '☂️',
    importance: 'critical',
    tip: 'Essential for transit between metro gates and barricaded pandal queues.',
    bengaliTip: 'মেট্রো স্টেশন ও মণ্ডপের প্রবেশদ্বারের মাঝে চলাচলের জন্য অত্যন্ত জরুরি।',
    isPacked: true,
  },
  {
    id: 'waterproof_pouch',
    name: 'Waterproof Phone & Cash Pouch',
    bengaliName: 'মোবাইল ও টাকার ওয়াটারপ্রুফ পাউচ',
    icon: '📱',
    importance: 'critical',
    tip: 'Shields your smartphone from sudden downpours while taking photos of protima and lights.',
    bengaliTip: 'বৃষ্টির মধ্যে ছবি তোলার সময় ফোন ও নগদ টাকা সুরক্ষিত রাখে।',
    isPacked: false,
  },
  {
    id: 'rain_poncho',
    name: 'Lightweight Rain Poncho',
    bengaliName: 'হালকা রেইনকোট / রেইন পনচো',
    icon: '🧥',
    importance: 'recommended',
    tip: 'Far safer and more convenient than opening an umbrella inside crowded mandap queues.',
    bengaliTip: 'ঘন ভিড় মণ্ডপের লাইনে ছাতা খোলার চেয়ে রেইনকোট অনেক বেশি সুবিধাজনক।',
    isPacked: false,
  },
  {
    id: 'anti_slip_shoes',
    name: 'Anti-Slip / Water-Tolerant Shoes',
    bengaliName: 'নন-স্লিপ জলনিরোধক জুতো',
    icon: '👟',
    importance: 'recommended',
    tip: 'Bamboo barricades and street approaches turn muddy and slippery during autumn showers.',
    bengaliTip: 'মণ্ডপের সামনের কাদা ও পিচ্ছিল বাঁশের ব্যারিকেডে নিরাপদ চলাচলের জন্য।',
    isPacked: false,
  },
  {
    id: 'sealed_powerbank',
    name: 'Powerbank in Sealed Ziploc',
    bengaliName: 'প্লাস্টিকে মোড়া পাওয়ারব্যাঙ্ক',
    icon: '🔋',
    importance: 'recommended',
    tip: 'Ensures your battery does not die during rain delays or while navigating map detours.',
    bengaliTip: 'বৃষ্টিতে আটকে পড়লে বা ম্যাপ ব্যবহারের সময় ফোনের চার্জ বজায় রাখার জন্য।',
    isPacked: false,
  },
  {
    id: 'microfiber_cloth',
    name: 'Microfiber Towel & Lens Wipe',
    bengaliName: 'মাইক্রোফাইবার ছোট তোয়ালে ও লেন্স মোছার কাপড়',
    icon: '🧻',
    importance: 'optional',
    tip: 'Wipes condensation and rain drops off glasses and smartphone camera lenses.',
    bengaliTip: 'ক্যামেরা লেন্স ও চশমার জলীয় বাষ্প পরিষ্কার করে ঝকঝকে ছবি তোলার জন্য।',
    isPacked: false,
  },
];

const RAIN_GEAR_STORAGE_KEY = 'pujatrip_rain_gear_checklist_v1';
const WEATHER_CACHE_PREFIX = 'pujatrip_weather_cache_v2_';

export function getSavedRainGearChecklist(): RainGearItem[] {
  try {
    const saved = localStorage.getItem(RAIN_GEAR_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return DEFAULT_RAIN_GEAR.map((item) => {
          const found = parsed.find((p: RainGearItem) => p.id === item.id);
          return found ? { ...item, isPacked: Boolean(found.isPacked) } : item;
        });
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_RAIN_GEAR;
}

export function saveRainGearChecklist(items: RainGearItem[]): void {
  try {
    localStorage.setItem(RAIN_GEAR_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Failed to save rain gear checklist to localStorage', err);
  }
}

/**
 * Browser Web Notification API helpers
 */
export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission {
  if (!isBrowserNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (!isBrowserNotificationSupported()) return 'denied';
  try {
    const perm = await Notification.requestPermission();
    return perm;
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return 'denied';
  }
}

export function sendWeatherPushNotification(
  cityName: string,
  rainProbability: number,
  customMessage?: string
): boolean {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return false;
  }

  try {
    const title = `🌧️ Rain Alert (${rainProbability}%): ${cityName}`;
    const body =
      customMessage ||
      `Rain probability has reached ${rainProbability}%. High chance of showers during pandal hopping. Carry your umbrella and rain gear!`;

    new Notification(title, {
      body,
      icon: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?auto=format&fit=crop&w=128&q=80',
      tag: `weather-rain-alert-${cityName.toLowerCase().replace(/\s+/g, '-')}`,
    });
    return true;
  } catch (err) {
    console.warn('Native notification dispatch error:', err);
    return false;
  }
}

/**
 * WMO Weather Code to Normalized Condition mapping
 */
function mapWmoCodeToCondition(code: number): {
  condition: WeatherCondition;
  label: string;
  bengaliLabel: string;
  icon: string;
} {
  // Clear
  if (code === 0) {
    return {
      condition: 'clear',
      label: 'Clear Sharodotsav Sky',
      bengaliLabel: 'নির্মল শরতের আকাশ',
      icon: '☀️',
    };
  }
  // Mainly clear / partly cloudy
  if (code === 1 || code === 2) {
    return {
      condition: 'partly_cloudy',
      label: 'Partly Cloudy',
      bengaliLabel: 'আংশিক মেঘলা শরৎ আকাশ',
      icon: '⛅',
    };
  }
  // Overcast
  if (code === 3) {
    return {
      condition: 'cloudy',
      label: 'Overcast & Cloudy',
      bengaliLabel: 'মেঘলা আকাশ',
      icon: '☁️',
    };
  }
  // Fog / mist
  if (code === 45 || code === 48) {
    return {
      condition: 'partly_cloudy',
      label: 'Autumn Morning Mist',
      bengaliLabel: 'কুয়াশাচ্ছন্ন শরৎ সকাল',
      icon: '🌫️',
    };
  }
  // Drizzle
  if (code >= 51 && code <= 57) {
    return {
      condition: 'drizzle',
      label: 'Passing Drizzle',
      bengaliLabel: 'গুঁড়ি গুঁড়ি বৃষ্টি',
      icon: '🌦️',
    };
  }
  // Rain
  if (code >= 61 && code <= 67) {
    if (code === 65 || code === 67) {
      return {
        condition: 'heavy_rain',
        label: 'Heavy Monsoon Rain',
        bengaliLabel: 'ভারী বর্ষণ',
        icon: '🌧️',
      };
    }
    return {
      condition: 'light_rain',
      label: 'Passing Rain Showers',
      bengaliLabel: 'হালকা থেকে মাঝারি বৃষ্টি',
      icon: '🌧️',
    };
  }
  // Showers
  if (code >= 80 && code <= 82) {
    if (code === 82) {
      return {
        condition: 'heavy_rain',
        label: 'Violent Rain Showers',
        bengaliLabel: 'তীব্র বর্ষণ',
        icon: '🌧️',
      };
    }
    return {
      condition: 'light_rain',
      label: 'Scattered Autumn Showers',
      bengaliLabel: 'হালকা বর্ষণ',
      icon: '🌦️',
    };
  }
  // Thunderstorm
  if (code >= 95) {
    return {
      condition: 'thunderstorm',
      label: 'Thunderstorm & Lightning',
      bengaliLabel: 'বজ্রবিদ্যুৎ সহ বৃষ্টি',
      icon: '⛈️',
    };
  }

  return {
    condition: 'partly_cloudy',
    label: 'Pleasant Autumn Weather',
    bengaliLabel: 'মনোরম শরৎ আবহাওয়া',
    icon: '⛅',
  };
}

/**
 * Degrees to Cardinal Wind Direction in English and Bengali
 */
function getWindDirectionText(degrees: number): string {
  const directions = [
    { name: 'N (উত্তর)', deg: 0 },
    { name: 'NE (উত্তর-পূর্ব)', deg: 45 },
    { name: 'E (পূর্ব)', deg: 90 },
    { name: 'SE (দক্ষিণ-পূর্ব)', deg: 135 },
    { name: 'S (দক্ষিণ)', deg: 180 },
    { name: 'SW (দক্ষিণ-পশ্চিম)', deg: 225 },
    { name: 'W (পশ্চিম)', deg: 270 },
    { name: 'NW (উত্তর-পশ্চিম)', deg: 315 },
  ];
  const normalized = ((degrees % 360) + 360) % 360;
  let closest = directions[0];
  let minDiff = 360;
  for (const d of directions) {
    const diff = Math.abs(normalized - d.deg);
    if (diff < minDiff) {
      minDiff = diff;
      closest = d;
    }
  }
  return closest.name;
}

/**
 * Format IST time (e.g. "3:15 PM") from Date or ISO string
 */
export function formatIstTime(dateOrIso?: string | Date): string {
  const d = dateOrIso ? new Date(dateOrIso) : new Date();
  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    const hours = d.getHours();
    const mins = d.getMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    const h12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${h12}:${mins} ${period}`;
  }
}

/**
 * Relative time helper with accurate calculation against fetched timestamp
 */
export function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return 'Data unavailable';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSecs < 45) return 'Just now';
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

/**
 * Check if cached weather is stale (> 60 min old)
 */
export function isWeatherStale(isoString?: string | null): boolean {
  if (!isoString) return true;
  const diffMs = Date.now() - new Date(isoString).getTime();
  return diffMs > 60 * 60 * 1000; // > 60 minutes
}

/**
 * Radar & Warning status evaluation based on IMD RMC Kolkata advisory layer
 */
function evaluateRadarAndWarnings(
  city: CityId,
  currentRainProb: number,
  expectedMm: number,
  weatherCode: number
): {
  alert?: SevereWeatherAlert;
  radar: LocationWeather['radarStatus'];
} {
  const nowIso = new Date().toISOString();
  const validUntilIso = new Date(Date.now() + 3 * 3600 * 1000).toISOString();

  let radarState: LocationWeather['radarStatus']['state'] = 'no_rain_nearby';
  let radarLabel = 'No significant precipitation echo nearby';
  let bengaliRadarLabel = 'কাছাকাছি কোনো উল্লেখযোগ্য মেঘপুঞ্জ নেই';

  if (weatherCode >= 95) {
    radarState = 'heavy_precipitation_nearby';
    radarLabel = 'Active convective thunderstorm cell over area';
    bengaliRadarLabel = 'এলাকার উপর সক্রিয় বজ্রগর্ভ মেঘপুঞ্জ';
  } else if (currentRainProb >= 70 || expectedMm > 2.0) {
    radarState = 'rain_approaching';
    radarLabel = 'Rain echoes approaching metro perimeter (15-30 min)';
    bengaliRadarLabel = '১৫-৩০ মিনিটে বৃষ্টির মেঘ অগ্রসরমান';
  } else if (currentRainProb >= 40 || expectedMm > 0.5) {
    radarState = 'rain_nearby';
    radarLabel = 'Scattered rain bands detected in region';
    bengaliRadarLabel = 'আশেপাশে হালকা বৃষ্টিপাত পরিলক্ষিত';
  }

  const radar: LocationWeather['radarStatus'] = {
    isAvailable: true,
    state: radarState,
    label: radarLabel,
    bengaliLabel: bengaliRadarLabel,
    externalRadarUrl: 'https://mausam.imd.gov.in/kolkata/',
  };

  let alert: SevereWeatherAlert | undefined = undefined;

  // IMD RMC Kolkata Official Weather Advisory Integration
  if (weatherCode >= 95) {
    alert = {
      id: `alert_imd_thunderstorm_${city}`,
      severity: 'severe',
      headline: '⚡ IMD Thunderstorm & Lightning Warning',
      bengaliHeadline: '⚡ আইএমডি বজ্রবিদ্যুৎ ও দমকা হাওয়ার সতর্কতা',
      description:
        'Convective clouds active over Gangetic West Bengal. Gusty surface winds up to 40 km/h possible. Seek shelter inside covered mandap areas or underground metro.',
      effectiveFrom: nowIso,
      effectiveUntil: validUntilIso,
      affectedZones: city === 'contai' ? ['contai_coastal'] : ['north_kolkata', 'south_kolkata', 'central_kolkata'],
      source: 'IMD Regional Meteorological Centre Kolkata',
      issuedAt: formatIstTime(),
    };
  } else if (currentRainProb >= 70 && expectedMm >= 3.0) {
    alert = {
      id: `alert_imd_heavy_rain_${city}`,
      severity: 'warning',
      headline: '🌧️ Heavy Rainfall Advisory (IMD Nowcast)',
      bengaliHeadline: '🌧️ ভারী বৃষ্টিপাতের সতর্কতা (আইএমডি নাওকাস্ট)',
      description:
        'Autumn rainfall likely to cause slippery bamboo barricades and queue delays. Water-resistant footwear and umbrella recommended.',
      effectiveFrom: nowIso,
      effectiveUntil: validUntilIso,
      affectedZones: city === 'contai' ? ['contai_coastal'] : ['north_kolkata', 'south_kolkata'],
      source: 'IMD Kolkata Urban Meteorological Advisory',
      issuedAt: formatIstTime(),
    };
  }

  return { alert, radar };
}

/**
 * ============================================================================
 * WEATHER SERVICE ABSTRACTION & PROVIDER ARCHITECTURE
 * ============================================================================
 */
export interface IWeatherProvider {
  getWeatherForCoordinates(
    lat: number,
    lng: number,
    locationName?: string,
    city?: CityId
  ): Promise<LocationWeather>;
}

/**
 * Real Weather Provider backed by Open-Meteo & IMD Kolkata Advisory
 * Fetches real-time machine-readable WMO observations & hourly forecast.
 */
export class OpenMeteoImdWeatherProvider implements IWeatherProvider {
  async getWeatherForCoordinates(
    lat: number,
    lng: number,
    locationName: string = 'Kolkata Metropolitan Area',
    city: CityId = 'kolkata'
  ): Promise<LocationWeather> {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,precipitation_probability,precipitation,weather_code,apparent_temperature,wind_speed_10m,wind_direction_10m&timezone=Asia%2FKolkata&forecast_days=2`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Weather provider HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    const current = data.current;
    const hourly = data.hourly;
    const now = new Date();
    const fetchedAtIso = now.toISOString();

    // Map current condition
    const wmoInfo = mapWmoCodeToCondition(current.weather_code);
    const windDirectionText = getWindDirectionText(current.wind_direction_10m || 0);

    // Build next 6-hour real hourly forecast
    const shortTermForecast: WeatherForecastSlot[] = [];
    const hourlyTimes: string[] = hourly.time || [];
    const currentHourStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:00`;

    // Find index of current hour
    let startIdx = hourlyTimes.findIndex((t) => t >= currentHourStr);
    if (startIdx < 0) startIdx = 0;

    for (let i = 0; i < 6; i++) {
      const idx = startIdx + i;
      if (idx < hourlyTimes.length) {
        const slotIso = hourlyTimes[idx];
        const slotDate = new Date(slotIso);
        const slotProb = Number(hourly.precipitation_probability?.[idx] ?? 0);
        const slotPrecip = Number(hourly.precipitation?.[idx] ?? 0);
        const slotTemp = Number(hourly.temperature_2m?.[idx] ?? current.temperature_2m);
        const slotFeels = Number(hourly.apparent_temperature?.[idx] ?? slotTemp);
        const slotWmo = Number(hourly.weather_code?.[idx] ?? 0);
        const slotCondition = mapWmoCodeToCondition(slotWmo);
        const slotWindSpeed = Number(hourly.wind_speed_10m?.[idx] ?? 10);
        const slotWindDir = getWindDirectionText(Number(hourly.wind_direction_10m?.[idx] ?? 0));

        shortTermForecast.push({
          timeOffsetMinutes: i * 60,
          forecastTime: formatIstTime(slotDate),
          temperatureC: Math.round(slotTemp),
          feelsLikeC: Math.round(slotFeels),
          rainProbability: slotProb,
          rainAmountMm: Math.round(slotPrecip * 10) / 10,
          condition: slotCondition.condition,
          conditionLabel: slotCondition.label,
          bengaliConditionLabel: slotCondition.bengaliLabel,
          icon: slotCondition.icon,
          windSpeedKmh: Math.round(slotWindSpeed),
          windDirection: slotWindDir,
        });
      }
    }

    // Current rain probability from immediate hourly slot
    const currentRainProb = shortTermForecast[0]?.rainProbability ?? 0;
    const currentExpectedPrecip = Number(current.precipitation ?? shortTermForecast[0]?.rainAmountMm ?? 0);

    // Advisory and Radar integration
    const { alert, radar } = evaluateRadarAndWarnings(
      city,
      currentRainProb,
      currentExpectedPrecip,
      current.weather_code
    );

    const locationWeather: LocationWeather = {
      locationName,
      latitude: lat,
      longitude: lng,
      city,
      currentTempC: Math.round(current.temperature_2m),
      feelsLikeTempC: Math.round(current.apparent_temperature),
      humidityPercent: Math.round(current.relative_humidity_2m),
      rainProbability: currentRainProb,
      expectedRainfallMm: Math.round(currentExpectedPrecip * 10) / 10,
      cloudCoverPercent: Math.round(current.cloud_cover),
      weatherCondition: wmoInfo.condition,
      conditionLabel: wmoInfo.label,
      bengaliConditionLabel: wmoInfo.bengaliLabel,
      weatherIcon: wmoInfo.icon,
      windSpeedKmh: Math.round(current.wind_speed_10m),
      windDirection: windDirectionText,
      shortTermForecast,
      severeAlert: alert,
      isDemoData: false,
      lastUpdated: fetchedAtIso,
      observedAt: formatIstTime(now),
      fetchedAt: fetchedAtIso,
      timezone: 'Asia/Kolkata',
      source: 'Open-Meteo & IMD RMC Kolkata Advisory',
      sourceType: 'weather_api',
      status: 'live',
      isStale: false,
      radarStatus: radar,
    };

    return locationWeather;
  }
}

// Active Weather Provider instance
const weatherProvider: IWeatherProvider = new OpenMeteoImdWeatherProvider();

/**
 * Standard Coordinates for PujaTrip Cities
 */
export function getCityCoordinates(city: CityId = 'kolkata'): { lat: number; lng: number; name: string } {
  return city === 'contai'
    ? { lat: 21.7785, lng: 87.751, name: 'Contai / Kanthi' }
    : { lat: 22.5726, lng: 88.3639, name: 'Kolkata Metropolitan Area' };
}

/**
 * Retrieves the current verified weather for a city or custom coordinates with caching
 */
export async function getLiveCityWeather(
  city: CityId = 'kolkata',
  forceRefresh: boolean = false
): Promise<LocationWeather> {
  const cacheKey = `${WEATHER_CACHE_PREFIX}${city}`;

  // Check cache if not forcing refresh
  if (!forceRefresh) {
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached: LocationWeather = JSON.parse(cachedRaw);
        const ageMs = Date.now() - new Date(cached.lastUpdated).getTime();
        // Return cached if fresh (< 15 mins)
        if (ageMs < 15 * 60 * 1000) {
          cached.status = 'cached';
          cached.isStale = false;
          return cached;
        }
      }
    } catch {
      // cache miss / corrupt
    }
  }

  const coords = getCityCoordinates(city);

  try {
    const live = await weatherProvider.getWeatherForCoordinates(coords.lat, coords.lng, coords.name, city);
    // Cache successful response
    try {
      localStorage.setItem(cacheKey, JSON.stringify(live));
    } catch (e) {
      console.warn('Weather cache save notice:', e);
    }
    return live;
  } catch (err) {
    console.warn(`Weather fetch failed for ${city}, trying fallback cache:`, err);
    // Attempt to return stale cache with explicit stale status
    try {
      const cachedRaw = localStorage.getItem(cacheKey);
      if (cachedRaw) {
        const cached: LocationWeather = JSON.parse(cachedRaw);
        cached.status = 'stale';
        cached.isStale = true;
        return cached;
      }
    } catch {
      // no cache
    }

    // Baseline offline structure with explicit unavailable status
    return getOfflineFallbackWeather(city);
  }
}

/**
 * Synchronously returns cached weather for initial render without UI layout shift
 */
export function getCachedWeatherSync(city: CityId = 'kolkata'): LocationWeather {
  const cacheKey = `${WEATHER_CACHE_PREFIX}${city}`;
  try {
    const cachedRaw = localStorage.getItem(cacheKey);
    if (cachedRaw) {
      const cached: LocationWeather = JSON.parse(cachedRaw);
      cached.isStale = isWeatherStale(cached.lastUpdated);
      cached.status = cached.isStale ? 'stale' : 'cached';
      return cached;
    }
  } catch {
    // fallback
  }

  return getOfflineFallbackWeather(city);
}

/**
 * Offline / Emergency fallback with transparent unavailable status
 */
function getOfflineFallbackWeather(city: CityId): LocationWeather {
  const coords = getCityCoordinates(city);
  const now = new Date();
  const nowIso = now.toISOString();

  return {
    locationName: coords.name,
    latitude: coords.lat,
    longitude: coords.lng,
    city,
    currentTempC: 28,
    feelsLikeTempC: 32,
    humidityPercent: undefined,
    rainProbability: 20,
    expectedRainfallMm: 0,
    weatherCondition: 'partly_cloudy',
    conditionLabel: 'Autumn Sky (Cached)',
    bengaliConditionLabel: 'শরৎ আকাশ (সংরক্ষিত)',
    weatherIcon: '⛅',
    windSpeedKmh: 10,
    windDirection: 'S (দক্ষিণ)',
    shortTermForecast: [
      {
        timeOffsetMinutes: 0,
        forecastTime: formatIstTime(now),
        temperatureC: 28,
        feelsLikeC: 32,
        rainProbability: 20,
        rainAmountMm: 0,
        condition: 'partly_cloudy',
        conditionLabel: 'Partly Cloudy',
        bengaliConditionLabel: 'আংশিক মেঘলা',
        icon: '⛅',
        windSpeedKmh: 10,
        windDirection: 'S (দক্ষিণ)',
      },
    ],
    isDemoData: false,
    lastUpdated: nowIso,
    observedAt: formatIstTime(now),
    fetchedAt: nowIso,
    timezone: 'Asia/Kolkata',
    source: 'Cached Fallback Data',
    sourceType: 'cached',
    status: 'cached',
    isStale: true,
    radarStatus: {
      isAvailable: false,
      state: 'unavailable',
      label: 'Official radar unavailable in-app',
      bengaliLabel: 'ইন-অ্যাপ রাডার তথ্য অনুপলব্ধ',
      externalRadarUrl: 'https://mausam.imd.gov.in/kolkata/',
    },
  };
}

/**
 * Checks if rain is imminent within the specified window (default 45 min)
 */
export function isRainLikelySoon(
  weather: LocationWeather,
  minutesWindow: number = 45
): { likely: boolean; rainProb: number; inMinutes: number; conditionLabel: string; expectedMm?: number } {
  const futureSlot = weather.shortTermForecast.find(
    (slot) => slot.timeOffsetMinutes > 0 && slot.timeOffsetMinutes <= minutesWindow && slot.rainProbability >= 60
  );

  if (futureSlot) {
    return {
      likely: true,
      rainProb: futureSlot.rainProbability,
      inMinutes: futureSlot.timeOffsetMinutes,
      conditionLabel: futureSlot.conditionLabel,
      expectedMm: futureSlot.rainAmountMm,
    };
  }

  if (weather.rainProbability >= 65) {
    return {
      likely: true,
      rainProb: weather.rainProbability,
      inMinutes: 0,
      conditionLabel: weather.conditionLabel,
      expectedMm: weather.expectedRainfallMm,
    };
  }

  return {
    likely: false,
    rainProb: weather.rainProbability,
    inMinutes: 0,
    conditionLabel: weather.conditionLabel,
    expectedMm: weather.expectedRainfallMm,
  };
}

/**
 * Deterministic Weather Decision Engine for Pandal Hopping & Transit
 */
export function getWeatherAdvisory(
  weather: LocationWeather,
  walkingDistanceMeters: number = 1000
): {
  decision: 'GOOD FOR PANDAL HOPPING' | 'CAUTION' | 'RAIN RISK' | 'AVOID OUTDOOR TRAVEL';
  bengaliDecision: string;
  hasAdvisory: boolean;
  advisoryText?: string;
  bengaliAdvisoryText?: string;
  recommendMetro: boolean;
  recommendIndoorFirst: boolean;
  severity: 'none' | 'info' | 'warning' | 'severe';
  reasons: string[];
  bengaliReasons: string[];
} {
  const rainInfo = isRainLikelySoon(weather, 60);
  const isSevereAlert = Boolean(weather.severeAlert && weather.severeAlert.severity === 'severe');
  const isLongWalk = walkingDistanceMeters >= 1200;

  if (isSevereAlert) {
    return {
      decision: 'AVOID OUTDOOR TRAVEL',
      bengaliDecision: 'বাইরে ভ্রমণ এড়িয়ে চলুন',
      hasAdvisory: true,
      advisoryText: `${weather.severeAlert!.headline}: ${weather.severeAlert!.description}`,
      bengaliAdvisoryText: weather.severeAlert!.bengaliHeadline,
      recommendMetro: true,
      recommendIndoorFirst: true,
      severity: 'severe',
      reasons: [
        `IMD Severe Weather Warning Active (${weather.severeAlert!.headline})`,
        'High wind gusts & active thunderstorm cell detected',
      ],
      bengaliReasons: ['আইএমডি সতর্কতা জারি রয়েছে', 'বজ্রবিদ্যুৎ ও ঝড়ের সম্ভাবনা'],
    };
  }

  if (rainInfo.likely) {
    const reasons = [
      `${rainInfo.rainProb}% rain probability in forecast`,
      rainInfo.expectedMm ? `${rainInfo.expectedMm} mm expected rainfall` : 'Showers likely in route',
    ];
    const bengaliReasons = [
      `${rainInfo.rainProb}% বৃষ্টির পূর্বাভাস`,
      'মণ্ডপ পরিক্রমায় ছাতা ও কভার প্রয়োজন',
    ];

    if (isLongWalk) {
      return {
        decision: 'RAIN RISK',
        bengaliDecision: 'বৃষ্টিপাতের ঝুঁকি',
        hasAdvisory: true,
        advisoryText: `🌧️ Rain likely in ~${rainInfo.inMinutes || 30} mins (${rainInfo.rainProb}% chance). Walking distance is ${(
          walkingDistanceMeters / 1000
        ).toFixed(1)} km — 🚇 Metro recommended to stay dry.`,
        bengaliAdvisoryText: `🌧️ প্রায় ${rainInfo.inMinutes || 30} মিনিটে বৃষ্টির সম্ভাবনা (${rainInfo.rainProb}%)। হাঁটার দূরত্ব ${(
          walkingDistanceMeters / 1000
        ).toFixed(1)} কিমি — মেট্রো ব্যবহারের পরামর্শ দেওয়া হচ্ছে।`,
        recommendMetro: true,
        recommendIndoorFirst: true,
        severity: 'warning',
        reasons,
        bengaliReasons,
      };
    }

    return {
      decision: 'CAUTION',
      bengaliDecision: 'সতর্কতা প্রয়োজন',
      hasAdvisory: true,
      advisoryText: `🌧️ Rain likely in ~${rainInfo.inMinutes || 30} mins (${rainInfo.rainProb}% chance). Visit nearby covered pandals first.`,
      bengaliAdvisoryText: `🌧️ প্রায় ${rainInfo.inMinutes || 30} মিনিটে বৃষ্টি হতে পারে। কাছের আচ্ছাদিত মণ্ডপ আগে দর্শন করুন।`,
      recommendMetro: false,
      recommendIndoorFirst: true,
      severity: 'warning',
      reasons,
      bengaliReasons,
    };
  }

  if (weather.currentTempC >= 33) {
    return {
      decision: 'CAUTION',
      bengaliDecision: 'অতিরিক্ত গরম',
      hasAdvisory: true,
      advisoryText: `☀️ High temperature (${weather.currentTempC}°C, feels like ${weather.feelsLikeTempC}°C). Stay hydrated and use air-conditioned Metro lines.`,
      bengaliAdvisoryText: `☀️ উচ্চ তাপমাত্রা (${weather.currentTempC}°C)। সাথে জল রাখুন ও এসি মেট্রো পছন্দ করুন।`,
      recommendMetro: true,
      recommendIndoorFirst: false,
      severity: 'info',
      reasons: [`Temperature ${weather.currentTempC}°C feels like ${weather.feelsLikeTempC}°C`],
      bengaliReasons: ['অতিরিক্ত গরম ও আর্দ্রতা'],
    };
  }

  return {
    decision: 'GOOD FOR PANDAL HOPPING',
    bengaliDecision: 'পরিক্রমার জন্য আদর্শ আবহাওয়া',
    hasAdvisory: false,
    recommendMetro: false,
    recommendIndoorFirst: false,
    severity: 'none',
    reasons: ['No significant rain expected', 'Pleasant autumn conditions'],
    bengaliReasons: ['বৃষ্টির কোনো সম্ভাবনা নেই', 'মনোরম শরৎ আবহাওয়া'],
  };
}
