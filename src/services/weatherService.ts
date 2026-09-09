import {
  CityId,
  LocationWeather,
  WeatherCondition,
  WeatherForecastSlot,
  SevereWeatherAlert,
  Pandal,
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
      `Rain probability has exceeded 60%! High chance of sudden showers during pandal hopping. Don't forget your umbrella, waterproof phone pouch, and rain gear!`;

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
 * Provider-Independent Weather Interface.
 * Can be cleanly swapped with OpenWeatherMap, WeatherAPI, IMD, or Apple WeatherKit.
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
 * Demo / Simulation Weather State
 * Allows seamless testing of rain approaching, clear autumn evening, or high humidity.
 */
type WeatherSimulationScenario = 'autumn_breeze' | 'rain_approaching_35m' | 'heavy_thunderstorm' | 'humid_heat';

let currentScenario: WeatherSimulationScenario = 'rain_approaching_35m';
let lastWeatherFetchTimestamp = new Date(Date.now() - 12 * 60 * 1000).toISOString(); // 12 mins ago default
let simulatedRainProbOverride: number | null = null;

export function setSimulatedRainProbability(prob: number | null): void {
  simulatedRainProbOverride = prob;
  lastWeatherFetchTimestamp = new Date().toISOString();
}

export function getSimulatedRainProbability(): number | null {
  return simulatedRainProbOverride;
}

/**
 * Formats time difference into human-friendly relative string (e.g. "Updated 4 min ago")
 */
export function formatTimeAgo(isoString?: string | null): string {
  if (!isoString) return 'Just now';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSecs = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSecs < 60) return `${diffSecs}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${Math.floor(diffHours / 24)}d ago`;
}

/**
 * Generate short-term forecast intervals for next 2 hours (0m, 30m, 60m, 90m, 120m)
 */
function generateShortTermForecast(scenario: WeatherSimulationScenario, baseTemp: number): WeatherForecastSlot[] {
  const now = new Date();

  return [0, 30, 60, 90, 120].map((offsetMinutes) => {
    const slotTime = new Date(now.getTime() + offsetMinutes * 60 * 1000);
    const hours = slotTime.getHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 === 0 ? 12 : hours % 12;
    const minsStr = slotTime.getMinutes().toString().padStart(2, '0');
    const forecastTime = `${hours12}:${minsStr} ${period}`;

    let condition: WeatherCondition = 'partly_cloudy';
    let conditionLabel = 'Pleasant Autumn Evening';
    let bengaliConditionLabel = 'মনোরম শরৎ সন্ধ্যা';
    let icon = '⛅';
    let rainProb = 15;
    let temp = baseTemp;
    let windSpeed = 12;

    switch (scenario) {
      case 'rain_approaching_35m':
        if (offsetMinutes === 0) {
          condition = 'light_rain';
          conditionLabel = 'Rain Imminent (75% Chance)';
          bengaliConditionLabel = 'আসন্ন বৃষ্টিপাত (৭৫% সম্ভাবনা)';
          icon = '🌧️';
          rainProb = 75;
          windSpeed = 18;
        } else if (offsetMinutes === 30) {
          condition = 'light_rain';
          conditionLabel = 'Passing Rain Showers (35m)';
          bengaliConditionLabel = 'হালকা বর্ষণ শুরু (৩৫ মিনিটে)';
          icon = '🌧️';
          rainProb = 85;
          temp -= 2;
          windSpeed = 22;
        } else if (offsetMinutes === 60) {
          condition = 'heavy_rain';
          conditionLabel = 'Moderate to Heavy Showers';
          bengaliConditionLabel = 'মাঝারি থেকে ভারী বৃষ্টি';
          icon = '🌧️';
          rainProb = 90;
          temp -= 3;
          windSpeed = 25;
        } else {
          condition = 'drizzle';
          conditionLabel = 'Scattered Drizzle';
          bengaliConditionLabel = 'গুঁড়ি গুঁড়ি বৃষ্টি';
          icon = '🌦️';
          rainProb = 45;
          windSpeed = 14;
        }
        break;

      case 'heavy_thunderstorm':
        condition = offsetMinutes <= 60 ? 'thunderstorm' : 'heavy_rain';
        conditionLabel = 'Kalbaishakhi Monsoon Storm';
        bengaliConditionLabel = 'কালবৈশাখী ঝড় ও বজ্রবিদ্যুৎ';
        icon = '⛈️';
        rainProb = 95;
        temp = baseTemp - 4;
        windSpeed = 38;
        break;

      case 'humid_heat':
        condition = 'clear';
        conditionLabel = 'High Humidity & Heat';
        bengaliConditionLabel = 'অতিরিক্ত আর্দ্রতা ও গরম';
        icon = '☀️';
        rainProb = 10;
        temp = baseTemp + 2;
        windSpeed = 8;
        break;

      case 'autumn_breeze':
      default:
        condition = offsetMinutes % 60 === 0 ? 'clear' : 'partly_cloudy';
        conditionLabel = 'Clear Sharodotsav Sky';
        bengaliConditionLabel = 'নির্মল শরতের আকাশ';
        icon = '🌙';
        rainProb = 10;
        windSpeed = 11;
        break;
    }

    // Apply manual simulation override to current slot (0m) if specified
    if (offsetMinutes === 0 && simulatedRainProbOverride !== null) {
      rainProb = simulatedRainProbOverride;
      if (simulatedRainProbOverride >= 90) {
        condition = 'heavy_rain';
        conditionLabel = 'Heavy Monsoon Downpour';
        bengaliConditionLabel = 'ভারী বর্ষণ';
        icon = '🌧️';
      } else if (simulatedRainProbOverride > 60) {
        condition = 'light_rain';
        conditionLabel = `High Rain Probability (${simulatedRainProbOverride}%)`;
        bengaliConditionLabel = `উচ্চ বৃষ্টির সম্ভাবনা (${simulatedRainProbOverride}%)`;
        icon = '🌧️';
      } else if (simulatedRainProbOverride > 30) {
        condition = 'partly_cloudy';
        conditionLabel = 'Scattered Clouds';
        bengaliConditionLabel = 'আংশিক মেঘলা আকাশ';
        icon = '⛅';
      } else {
        condition = 'clear';
        conditionLabel = 'Dry Autumn Weather';
        bengaliConditionLabel = 'শুষ্ক শরৎ আকাশ';
        icon = '🌙';
      }
    }

    return {
      timeOffsetMinutes: offsetMinutes,
      forecastTime,
      temperatureC: temp,
      feelsLikeC: temp + 3,
      rainProbability: rainProb,
      condition,
      conditionLabel,
      bengaliConditionLabel,
      icon,
      windSpeedKmh: windSpeed,
      windDirection: 'SSE (দক্ষিণ-দক্ষিণ-পূর্ব)',
    };
  });
}

/**
 * Provider-Independent Demo Implementation
 * Returns structured weather object with explicit demo indicators and freshness.
 */
export class DemoWeatherProvider implements IWeatherProvider {
  async getWeatherForCoordinates(
    lat: number,
    lng: number,
    locationName: string = 'Kolkata Central',
    city: CityId = 'kolkata'
  ): Promise<LocationWeather> {
    const baseTemp = city === 'contai' ? 29 : 28;
    const forecast = generateShortTermForecast(currentScenario, baseTemp);
    const currentSlot = forecast[0];

    let severeAlert: SevereWeatherAlert | undefined = undefined;
    if (currentScenario === 'rain_approaching_35m') {
      severeAlert = {
        id: 'alert-rain-sharodotsav',
        severity: 'warning',
        headline: '🌧️ Sharp Autumn Shower Expected in 30-40 min',
        bengaliHeadline: '🌧️ ৩০-৪০ মিনিটে উত্তর ও দক্ষিণ কলকাতায় হালকা থেকে মাঝারি বৃষ্টিপাতের সম্ভাবনা',
        description:
          'Monsoon trough movement across Gangetic West Bengal. Outdoor queues may experience wet conditions; consider covered pandals or Metro transit.',
        effectiveFrom: new Date().toISOString(),
        effectiveUntil: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        affectedZones: ['north_kolkata', 'south_kolkata', 'saltlake_east'],
      };
    } else if (currentScenario === 'heavy_thunderstorm') {
      severeAlert = {
        id: 'alert-thunderstorm',
        severity: 'severe',
        headline: '⛈️ Severe Thunderstorm & Gusty Wind Advisory',
        bengaliHeadline: '⛈️ ভারী বজ্রবিদ্যুৎ ও দমকা হাওয়ার সতর্কতা',
        description: 'Wind speeds gusting up to 45 km/h. Please seek shelter inside underground metro corridors.',
        effectiveFrom: new Date().toISOString(),
        effectiveUntil: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
        affectedZones: ['north_kolkata', 'south_kolkata', 'contai_coastal'],
      };
    }

    if (!severeAlert && currentSlot.rainProbability > 60) {
      severeAlert = {
        id: 'alert-rain-threshold-60',
        severity: currentSlot.rainProbability >= 90 ? 'severe' : 'warning',
        headline: `🌧️ Rain Alert: ${currentSlot.rainProbability}% Rain Probability`,
        bengaliHeadline: `🌧️ বৃষ্টির সতর্কতা: ${currentSlot.rainProbability}% বৃষ্টির সম্ভাবনা`,
        description: `Rain probability exceeds 60% in ${city === 'contai' ? 'Contai' : 'Kolkata'}. Check and carry your monsoon gear: umbrella, rain poncho, and waterproof phone pouch!`,
        effectiveFrom: new Date().toISOString(),
        effectiveUntil: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
        affectedZones: city === 'contai' ? ['contai_coastal'] : ['north_kolkata', 'south_kolkata'],
      };
    }

    return {
      locationName,
      latitude: lat,
      longitude: lng,
      city,
      currentTempC: currentSlot.temperatureC,
      feelsLikeTempC: currentSlot.feelsLikeC,
      humidityPercent: currentScenario === 'humid_heat' ? 88 : 76,
      rainProbability: currentSlot.rainProbability,
      weatherCondition: currentSlot.condition,
      conditionLabel: currentSlot.conditionLabel,
      bengaliConditionLabel: currentSlot.bengaliConditionLabel,
      weatherIcon: currentSlot.icon,
      windSpeedKmh: currentSlot.windSpeedKmh,
      windDirection: currentSlot.windDirection,
      shortTermForecast: forecast,
      severeAlert,
      isDemoData: true,
      lastUpdated: lastWeatherFetchTimestamp,
      status: 'live_demo',
    };
  }
}

// Active Weather Provider instance (default Demo)
const weatherProvider: IWeatherProvider = new DemoWeatherProvider();

/**
 * Retrieves the current weather for a city or custom coordinates
 */
export async function getLiveCityWeather(city: CityId = 'kolkata'): Promise<LocationWeather> {
  const coords =
    city === 'contai'
      ? { lat: 21.7785, lng: 87.751, name: 'Contai / Kanthi' }
      : { lat: 22.5748, lng: 88.3582, name: 'Kolkata Metropolitan Area' };

  return weatherProvider.getWeatherForCoordinates(coords.lat, coords.lng, coords.name, city);
}

/**
 * Synchronously returns cached weather for instant UI rendering without layout thrashing
 */
export function getCachedWeatherSync(city: CityId = 'kolkata'): LocationWeather {
  const baseTemp = city === 'contai' ? 29 : 28;
  const forecast = generateShortTermForecast(currentScenario, baseTemp);
  const currentSlot = forecast[0];

  let severeAlert: SevereWeatherAlert | undefined = undefined;
  if (currentScenario === 'rain_approaching_35m') {
    severeAlert = {
      id: 'alert-rain-sharodotsav',
      severity: 'warning',
      headline: '🌧️ Sharp Autumn Shower Expected in 30-40 min',
      bengaliHeadline: '🌧️ ৩০-৪০ মিনিটে উত্তর ও দক্ষিণ কলকাতায় হালকা থেকে মাঝারি বৃষ্টিপাতের সম্ভাবনা',
      description:
        'Passing rain showers likely. Outdoor walking routes may get wet; consider covered pandals or underground Metro corridors.',
      effectiveFrom: new Date().toISOString(),
      effectiveUntil: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      affectedZones: ['north_kolkata', 'south_kolkata'],
    };
  } else if (currentScenario === 'heavy_thunderstorm') {
    severeAlert = {
      id: 'alert-thunderstorm',
      severity: 'severe',
      headline: '⛈️ Severe Thunderstorm & Gusty Wind Advisory',
      bengaliHeadline: '⛈️ ভারী বজ্রবিদ্যুৎ ও দমকা হাওয়ার সতর্কতা',
      description: 'Wind speeds gusting up to 45 km/h. Please seek shelter inside underground metro corridors.',
      effectiveFrom: new Date().toISOString(),
      effectiveUntil: new Date(Date.now() + 3 * 3600 * 1000).toISOString(),
      affectedZones: ['north_kolkata', 'south_kolkata', 'contai_coastal'],
    };
  }

  if (!severeAlert && currentSlot.rainProbability > 60) {
    severeAlert = {
      id: 'alert-rain-threshold-60',
      severity: currentSlot.rainProbability >= 90 ? 'severe' : 'warning',
      headline: `🌧️ Rain Alert: ${currentSlot.rainProbability}% Rain Probability`,
      bengaliHeadline: `🌧️ বৃষ্টির সতর্কতা: ${currentSlot.rainProbability}% বৃষ্টির সম্ভাবনা`,
      description: `Rain probability exceeds 60% in ${city === 'contai' ? 'Contai' : 'Kolkata'}. Check and carry your monsoon gear: umbrella, rain poncho, and waterproof phone pouch!`,
      effectiveFrom: new Date().toISOString(),
      effectiveUntil: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      affectedZones: city === 'contai' ? ['contai_coastal'] : ['north_kolkata', 'south_kolkata'],
    };
  }

  return {
    locationName: city === 'contai' ? 'Contai (Kanthi)' : 'Kolkata Region',
    latitude: city === 'contai' ? 21.7785 : 22.5748,
    longitude: city === 'contai' ? 87.751 : 88.3582,
    city,
    currentTempC: currentSlot.temperatureC,
    feelsLikeTempC: currentSlot.feelsLikeC,
    humidityPercent: 78,
    rainProbability: currentSlot.rainProbability,
    weatherCondition: currentSlot.condition,
    conditionLabel: currentSlot.conditionLabel,
    bengaliConditionLabel: currentSlot.bengaliConditionLabel,
    weatherIcon: currentSlot.icon,
    windSpeedKmh: currentSlot.windSpeedKmh,
    windDirection: currentSlot.windDirection,
    shortTermForecast: forecast,
    severeAlert,
    isDemoData: true,
    lastUpdated: lastWeatherFetchTimestamp,
    status: 'live_demo',
  };
}

/**
 * Checks if rain is imminent within the specified window (default 45 min)
 */
export function isRainLikelySoon(
  weather: LocationWeather,
  minutesWindow: number = 45
): { likely: boolean; rainProb: number; inMinutes: number; conditionLabel: string } {
  const futureSlot = weather.shortTermForecast.find(
    (slot) => slot.timeOffsetMinutes > 0 && slot.timeOffsetMinutes <= minutesWindow && slot.rainProbability >= 60
  );

  if (futureSlot) {
    return {
      likely: true,
      rainProb: futureSlot.rainProbability,
      inMinutes: futureSlot.timeOffsetMinutes,
      conditionLabel: futureSlot.conditionLabel,
    };
  }

  if (weather.rainProbability >= 70) {
    return {
      likely: true,
      rainProb: weather.rainProbability,
      inMinutes: 0,
      conditionLabel: weather.conditionLabel,
    };
  }

  return {
    likely: false,
    rainProb: weather.rainProbability,
    inMinutes: 0,
    conditionLabel: weather.conditionLabel,
  };
}

/**
 * Generates an intelligent, context-aware weather advisory for route planning and walking
 */
export function getWeatherAdvisory(
  weather: LocationWeather,
  walkingDistanceMeters: number = 1000
): {
  hasAdvisory: boolean;
  advisoryText?: string;
  bengaliAdvisoryText?: string;
  recommendMetro: boolean;
  recommendIndoorFirst: boolean;
  severity: 'none' | 'info' | 'warning' | 'severe';
} {
  const rainInfo = isRainLikelySoon(weather, 45);

  if (rainInfo.likely) {
    const isLongWalk = walkingDistanceMeters >= 1200;
    if (isLongWalk) {
      return {
        hasAdvisory: true,
        advisoryText: `🌧️ Rain likely in ~${rainInfo.inMinutes || 35} minutes (${rainInfo.rainProb}% prob). Walking route is ${(
          walkingDistanceMeters / 1000
        ).toFixed(1)} km — 🚇 Metro recommended to reduce outdoor walking.`,
        bengaliAdvisoryText: `🌧️ প্রায় ${rainInfo.inMinutes || 35} মিনিটে বৃষ্টি শুরু হতে পারে। হাঁটার পথ ${(
          walkingDistanceMeters / 1000
        ).toFixed(1)} কিমি — রাস্তায় ভিজে যাওয়া এড়াতে মেট্রো ব্যবহার করুন।`,
        recommendMetro: true,
        recommendIndoorFirst: true,
        severity: 'warning',
      };
    }

    return {
      hasAdvisory: true,
      advisoryText: `🌧️ Rain likely in ~${rainInfo.inMinutes || 35} minutes. Recommendation: Visit nearby covered/indoor pandals first.`,
      bengaliAdvisoryText: `🌧️ প্রায় ${rainInfo.inMinutes || 35} মিনিটে বৃষ্টির সম্ভাবনা। কাছের আচ্ছাদিত মণ্ডপ আগে দর্শন করুন।`,
      recommendMetro: false,
      recommendIndoorFirst: true,
      severity: 'warning',
    };
  }

  if (weather.severeAlert) {
    const alertSeverity = weather.severeAlert.severity === 'advisory' ? 'info' : weather.severeAlert.severity;
    return {
      hasAdvisory: true,
      advisoryText: `${weather.severeAlert.headline}: ${weather.severeAlert.description}`,
      bengaliAdvisoryText: weather.severeAlert.bengaliHeadline,
      recommendMetro: true,
      recommendIndoorFirst: true,
      severity: alertSeverity,
    };
  }

  if (weather.currentTempC >= 32) {
    return {
      hasAdvisory: true,
      advisoryText: `☀️ High temperature (${weather.currentTempC}°C, feels like ${weather.feelsLikeTempC}°C). Stay hydrated and use air-conditioned Metro lines.`,
      bengaliAdvisoryText: `☀️ উচ্চ তাপমাত্রা (${weather.currentTempC}°C)। সাথে জল রাখুন ও এয়ার-কন্ডিশন্ড মেট্রো পছন্দ করুন।`,
      recommendMetro: true,
      recommendIndoorFirst: false,
      severity: 'info',
    };
  }

  return {
    hasAdvisory: false,
    recommendMetro: false,
    recommendIndoorFirst: false,
    severity: 'none',
  };
}

/**
 * Allows the user or test runner to switch simulation weather scenario (e.g. for testing rain approaching)
 */
export function setWeatherScenario(scenario: WeatherSimulationScenario) {
  currentScenario = scenario;
  lastWeatherFetchTimestamp = new Date().toISOString();
}

export function getCurrentWeatherScenario(): WeatherSimulationScenario {
  return currentScenario;
}
