import React, { useState, useEffect, useRef } from 'react';
import { CityId, LocationWeather, RainGearItem } from '../../types';
import {
  CloudRain,
  Umbrella,
  AlertTriangle,
  Bell,
  BellRing,
  CheckCircle2,
  Circle,
  X,
  Sparkles,
  Volume2,
  ShieldAlert,
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings,
  Radio,
} from 'lucide-react';
import {
  getSavedRainGearChecklist,
  saveRainGearChecklist,
  sendWeatherPushNotification,
  requestBrowserNotificationPermission,
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
} from '../../services/weatherService';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';

interface WeatherAlertSystemProps {
  activeCity: CityId;
  currentWeather: LocationWeather;
  isDarkMode?: boolean;
  onWeatherChange?: (updatedWeather: LocationWeather) => void;
}

const DEFAULT_THRESHOLD = 60; // User configurable threshold (default 60%)

export const WeatherAlertSystem: React.FC<WeatherAlertSystemProps> = ({
  activeCity,
  currentWeather,
  isDarkMode = false,
  onWeatherChange,
}) => {
  const [gearItems, setGearItems] = useState<RainGearItem[]>(() => getSavedRainGearChecklist());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rainThreshold, setRainThreshold] = useState<number>(DEFAULT_THRESHOLD);
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  const [inAppToast, setInAppToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
    rainProb: number;
    timestamp: number;
  } | null>(null);

  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    () => getBrowserNotificationPermission()
  );
  const [isSnoozed, setIsSnoozed] = useState(false);

  // Keep track of the last alerted probability to avoid duplicate triggers
  const lastAlertedProbRef = useRef<number | null>(null);
  const snoozeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const rainProbability = currentWeather.rainProbability;
  // Trigger alert strictly based on actual forecast rain probability > user threshold
  const isRainAlertActive = rainProbability > rainThreshold;
  const cityName = activeCity === 'kolkata' ? 'Kolkata' : 'Contai (Kanthi)';
  const bengaliCityName = activeCity === 'kolkata' ? 'কলকাতায়' : 'কাঁথিতে';

  // Total packed gear count
  const packedCount = gearItems.filter((i) => i.isPacked).length;
  const totalGearCount = gearItems.length;
  const isAllGearPacked = packedCount === totalGearCount;

  // Monitor rain probability changes from real weather provider
  useEffect(() => {
    if (isRainAlertActive && !isSnoozed) {
      if (lastAlertedProbRef.current !== rainProbability) {
        lastAlertedProbRef.current = rainProbability;
        triggerWeatherAlertNotification(rainProbability);
      }
    } else if (!isRainAlertActive) {
      lastAlertedProbRef.current = null;
    }
  }, [rainProbability, isRainAlertActive, isSnoozed, rainThreshold]);

  const triggerWeatherAlertNotification = (prob: number) => {
    // 1. Play authentic alert sound
    try {
      playKanshorBell(0.65);
      setTimeout(() => playDhakHit('ta', 0.5), 150);
    } catch (err) {
      console.warn('Audio alert skipped:', err);
    }

    // 2. Dispatch native browser push notification if permitted
    sendWeatherPushNotification(
      cityName,
      prob,
      `Rain probability is ${prob}% (exceeding your ${rainThreshold}% threshold)! Check your monsoon gear: umbrella, rain poncho, and waterproof phone pouch.`
    );

    // 3. Trigger in-app high-visibility floating toast
    setInAppToast({
      visible: true,
      title: `🌧️ Rain Alert: ${prob}% Chance in ${cityName}`,
      message: `Rain probability exceeds your ${rainThreshold}% alert threshold! High chance of autumn showers. Check your pandal-hopping gear.`,
      rainProb: prob,
      timestamp: Date.now(),
    });
  };

  // Toggle gear item packed state
  const handleToggleGear = (id: string) => {
    setGearItems((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, isPacked: !item.isPacked } : item
      );
      saveRainGearChecklist(updated);
      return updated;
    });
  };

  // Mark all packed
  const handleMarkAllPacked = () => {
    setGearItems((prev) => {
      const updated = prev.map((item) => ({ ...item, isPacked: true }));
      saveRainGearChecklist(updated);
      return updated;
    });
  };

  // Reset checklist
  const handleResetChecklist = () => {
    setGearItems((prev) => {
      const updated = prev.map((item) => ({ ...item, isPacked: false }));
      saveRainGearChecklist(updated);
      return updated;
    });
  };

  // Snooze alert for 30 minutes
  const handleSnoozeAlert = () => {
    setIsSnoozed(true);
    setInAppToast(null);
    if (snoozeTimeoutRef.current) clearTimeout(snoozeTimeoutRef.current);
    snoozeTimeoutRef.current = setTimeout(() => {
      setIsSnoozed(false);
    }, 30 * 60 * 1000);
  };

  // Request browser notification permission
  const handleRequestPermission = async () => {
    const perm = await requestBrowserNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      sendWeatherPushNotification(
        cityName,
        rainProbability,
        `Push alerts active! We will notify you if rain probability exceeds ${rainThreshold}% during Durga Puja.`
      );
    }
  };

  return (
    <div id="weather-alert-system" className="w-full space-y-2.5 my-2">
      {/* 1. FLOATING IN-APP PUSH NOTIFICATION TOAST */}
      {inAppToast?.visible && (
        <div
          id="in-app-weather-toast"
          className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#B91C1C] text-white shadow-2xl border-2 border-amber-300/80 animate-in fade-in slide-in-from-top-4 duration-300 relative z-30"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                🌧️
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-stone-900 text-micro uppercase font-black tracking-wider flex items-center gap-1 shadow-sm">
                    <AlertTriangle className="w-3 h-3 text-red-700" />
                    <span>Rain Threshold Exceeded ({inAppToast.rainProb}% &gt; {rainThreshold}%)</span>
                  </span>
                  <span className="text-micro font-bengali text-amber-200 font-semibold">
                    {bengaliCityName} {inAppToast.rainProb}% বৃষ্টির সতর্কতা
                  </span>
                </div>

                <h4 className="font-display font-black text-h3 text-white leading-tight">
                  {inAppToast.title}
                </h4>

                <p className="text-small text-amber-100 leading-snug">
                  {inAppToast.message}
                </p>

                {/* Quick Action Buttons inside Toast */}
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <button
                    onClick={() => {
                      setIsModalOpen(true);
                      setInAppToast(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-btn flex items-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Umbrella className="w-3.5 h-3.5" />
                    <span>Check Rain Gear ({packedCount}/{totalGearCount})</span>
                  </button>

                  <button
                    onClick={handleSnoozeAlert}
                    className="px-2.5 py-1.5 rounded-xl bg-black/30 hover:bg-black/40 text-amber-100 text-btn font-semibold border border-white/20 active:scale-95 transition-all cursor-pointer"
                  >
                    Snooze (30m)
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setInAppToast(null)}
              className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-all shrink-0 cursor-pointer"
              title="Dismiss Toast"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN ACTIVE WEATHER ALERT CARD ON HOMESCREEN */}
      {isRainAlertActive ? (
        <div
          id="weather-rain-alert-card"
          className={`p-4 rounded-3xl border-2 transition-all shadow-md relative overflow-hidden ${
            isDarkMode
              ? 'bg-gradient-to-br from-[#3B151E] via-[#2A1218] to-[#1F0D12] border-amber-500/60 text-white'
              : 'bg-gradient-to-br from-[#FEF2F2] via-[#FFF7ED] to-[#FEF3C7] border-red-400/70 text-stone-900'
          }`}
        >
          <div className="relative z-10 space-y-3">
            {/* Header Badge Strip */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-micro font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <CloudRain className="w-3.5 h-3.5 animate-bounce" />
                  <span>Weather Alert: Rain Threshold Exceeded</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-micro font-bold tabular-nums">
                  Rain: {rainProbability}% (Threshold: {rainThreshold}%)
                </span>
              </div>

              {/* Native Push Notification Status */}
              <div className="flex items-center gap-1.5">
                {isBrowserNotificationSupported() && (
                  <>
                    {notificationPermission === 'granted' ? (
                      <span className="inline-flex items-center gap-1 text-micro font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        <BellRing className="w-3 h-3" />
                        <span>Push Active</span>
                      </span>
                    ) : (
                      <button
                        onClick={handleRequestPermission}
                        className="inline-flex items-center gap-1 text-micro font-bold text-stone-700 dark:text-stone-300 hover:text-stone-950 bg-stone-200/80 dark:bg-stone-800 px-2 py-0.5 rounded-md hover:scale-105 transition-all cursor-pointer"
                      >
                        <Bell className="w-3 h-3" />
                        <span>Enable Push</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Title & Bengali Translation */}
            <div>
              <h3 className="font-display font-black text-h3 leading-snug text-red-950 dark:text-amber-100">
                🌧️ {rainProbability}% Rain Expected in {cityName}
              </h3>
              <p className="font-bengali text-small text-red-800 dark:text-amber-200 font-semibold mt-0.5">
                {bengaliCityName} {rainProbability}% বৃষ্টির পূর্বাভাস রয়েছে। মণ্ডপ পরিক্রমায় বেরোনোর আগে ছাতা ও রেইন গিয়ার সঙ্গে আছে কিনা পরীক্ষা করে নিন।
              </p>
            </div>

            {/* Gear Reminder Preview Strip */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                isDarkMode
                  ? 'bg-black/30 border-amber-500/20'
                  : 'bg-white/90 border-red-200/80 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl shrink-0">
                  {isAllGearPacked ? '✅' : '☂️'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-btn text-stone-900 dark:text-white">
                      Monsoon Hopping Gear
                    </span>
                    <span
                      className={`text-micro font-bold px-2 py-0.2 rounded-full ${
                        isAllGearPacked
                          ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {packedCount} / {totalGearCount} Ready
                    </span>
                  </div>
                  <p className="text-micro text-stone-600 dark:text-stone-300 line-clamp-1 mt-0.5">
                    {isAllGearPacked
                      ? 'All rain gear packed! You are ready for sudden autumn downpours.'
                      : 'Umbrella, waterproof phone pouch, rain poncho & anti-slip shoes.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:brightness-110 text-white font-bold text-btn shrink-0 shadow-sm active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>Check Gear</span>
              </button>
            </div>

            {/* Bottom Actions: Threshold Adjust & Weather Source */}
            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap text-micro text-stone-500">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowThresholdConfig((prev) => !prev)}
                  className="font-bold text-stone-700 dark:text-stone-300 hover:text-stone-900 flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                >
                  <Settings className="w-3 h-3 text-amber-600" />
                  <span>Adjust Alert Threshold ({rainThreshold}%)</span>
                </button>
              </div>

              <span className="font-medium text-[11px]">
                Source: {currentWeather.source} (Observed: {currentWeather.observedAt || 'Current'})
              </span>
            </div>

            {/* Configurable Alert Threshold Slider */}
            {showThresholdConfig && (
              <div className="p-3 rounded-2xl bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800 space-y-2">
                <div className="flex items-center justify-between text-micro font-bold">
                  <span>Alert me when rain probability exceeds:</span>
                  <span className="text-[#DC2626] font-black">{rainThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="90"
                  step="5"
                  value={rainThreshold}
                  onChange={(e) => setRainThreshold(Number(e.target.value))}
                  className="w-full accent-[#DC2626]"
                />
                <div className="flex justify-between text-[10px] text-stone-400">
                  <span>30% (Sensitive)</span>
                  <span>60% (Default)</span>
                  <span>90% (Severe Only)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Compact Weather Bar when Rain Probability <= Threshold */
        <div
          id="weather-normal-status-bar"
          className={`px-3.5 py-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
            isDarkMode
              ? 'bg-[#24171E] border-stone-800 text-stone-300'
              : 'bg-white border-stone-200 text-stone-700 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{currentWeather.weatherIcon || '🌤️'}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-btn text-stone-900 dark:text-white">
                  Weather Alert System Active
                </span>
                <span className="text-micro px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                  {rainProbability}% Rain Prob (&le;{rainThreshold}% threshold)
                </span>
              </div>
              <p className="text-micro text-stone-500 dark:text-stone-400 font-bengali">
                বৃষ্টিপাতের সম্ভাবনা স্বাভাবিক। {rainThreshold}% ছাড়ালে সতর্কবার্তা পাঠানো হবে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 transition-all cursor-pointer"
              title="View Gear Checklist"
            >
              <Umbrella className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. GEAR CHECKLIST MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto ${
              isDarkMode
                ? 'bg-[#251720] border-stone-800 text-white'
                : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <Umbrella className="w-5 h-5 text-[#DC2626]" />
                <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                  Monsoon Hopping Gear Checklist
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-small text-stone-500">
              Durga Puja hopping gear checklist. Protect your smartphone, cameras, and clothes during autumn showers.
            </p>

            {/* Checklist Items */}
            <div className="space-y-2">
              {gearItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleGear(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    item.isPacked
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-950 dark:text-emerald-200'
                      : 'bg-stone-50 dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl pt-0.5">{item.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-display font-bold text-btn ${
                            item.isPacked ? 'line-through opacity-70' : ''
                          }`}
                        >
                          {item.name}
                        </span>
                        <span className="font-bengali text-micro text-[#DC2626] font-semibold">
                          {item.bengaliName}
                        </span>
                      </div>
                      <p className="text-micro text-stone-500 dark:text-stone-400 mt-0.5">
                        {item.tip}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {item.isPacked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllPacked}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-bold text-btn cursor-pointer"
                >
                  Mark All Packed
                </button>
                <button
                  onClick={handleResetChecklist}
                  className="px-3 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-semibold text-btn cursor-pointer"
                >
                  Reset
                </button>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-[#DC2626] text-white font-bold text-btn shadow-md active:scale-95 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
