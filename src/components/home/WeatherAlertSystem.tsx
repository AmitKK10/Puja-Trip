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
  Sliders,
  ShieldAlert,
  Smartphone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  getSavedRainGearChecklist,
  saveRainGearChecklist,
  sendWeatherPushNotification,
  requestBrowserNotificationPermission,
  getBrowserNotificationPermission,
  isBrowserNotificationSupported,
  setSimulatedRainProbability,
  getSimulatedRainProbability,
} from '../../services/weatherService';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';

interface WeatherAlertSystemProps {
  activeCity: CityId;
  currentWeather: LocationWeather;
  isDarkMode?: boolean;
  onWeatherChange?: (updatedWeather: LocationWeather) => void;
}

export const WeatherAlertSystem: React.FC<WeatherAlertSystemProps> = ({
  activeCity,
  currentWeather,
  isDarkMode = false,
  onWeatherChange,
}) => {
  const [gearItems, setGearItems] = useState<RainGearItem[]>(() => getSavedRainGearChecklist());
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  const [showSimControls, setShowSimControls] = useState(false);
  const [simSliderValue, setSimSliderValue] = useState<number>(() => {
    const override = getSimulatedRainProbability();
    return override !== null ? override : currentWeather.rainProbability;
  });

  // Keep track of the last alerted probability to avoid repeated triggers
  const lastAlertedProbRef = useRef<number | null>(null);
  const snoozeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const rainProbability = currentWeather.rainProbability;
  const isRainAlertActive = rainProbability > 60;
  const cityName = activeCity === 'kolkata' ? 'Kolkata' : 'Contai (Kanthi)';
  const bengaliCityName = activeCity === 'kolkata' ? 'কলকাতায়' : 'কাঁথিতে';

  // Total packed gear count
  const packedCount = gearItems.filter((i) => i.isPacked).length;
  const totalGearCount = gearItems.length;
  const isAllGearPacked = packedCount === totalGearCount;

  // Monitor rain probability changes and trigger notification if threshold (>60%) is reached
  useEffect(() => {
    if (isRainAlertActive && !isSnoozed) {
      // Trigger notification if not alerted yet for this probability band
      if (lastAlertedProbRef.current !== rainProbability) {
        lastAlertedProbRef.current = rainProbability;
        triggerWeatherAlertNotification(rainProbability);
      }
    } else if (!isRainAlertActive) {
      // Reset last alerted prob when weather clears up
      lastAlertedProbRef.current = null;
    }
  }, [rainProbability, isRainAlertActive, isSnoozed]);

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
      `Rain probability is ${prob}% (>60% threshold)! Autumn showers expected. Please check your monsoon gear: umbrella, rain poncho, and waterproof phone pouch.`
    );

    // 3. Trigger in-app high-visibility floating toast
    setInAppToast({
      visible: true,
      title: `🌧️ Rain Alert: ${prob}% Chance in ${cityName}`,
      message: `Rain probability exceeds 60%! High chance of sudden autumn showers. Check your pandal-hopping gear before stepping out.`,
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
        `Push alerts active! We'll notify you if rain probability exceeds 60% during Durga Puja.`
      );
    }
  };

  // Manual test trigger for testing the alert system
  const handleManualTestAlert = () => {
    const testProb = Math.max(rainProbability, 75);
    triggerWeatherAlertNotification(testProb);
  };

  // Simulation controls handler
  const handleSetSimulatedProb = (prob: number | null) => {
    setSimulatedRainProbability(prob);
    if (prob !== null) {
      setSimSliderValue(prob);
    }
    // Update weather state if parent callback provided
    if (onWeatherChange) {
      const updated = {
        ...currentWeather,
        rainProbability: prob !== null ? prob : currentWeather.rainProbability,
      };
      onWeatherChange(updated);
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
                    <span>Rain Threshold Exceeded (&gt;60%)</span>
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
                    className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-btn flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <Umbrella className="w-3.5 h-3.5" />
                    <span>Check Rain Gear ({packedCount}/{totalGearCount})</span>
                  </button>

                  <button
                    onClick={handleSnoozeAlert}
                    className="px-2.5 py-1.5 rounded-xl bg-black/30 hover:bg-black/40 text-amber-100 text-btn font-semibold border border-white/20 active:scale-95 transition-all"
                  >
                    Snooze (30m)
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setInAppToast(null)}
              className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-all shrink-0"
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
          {/* Subtle Rain Motif background watermark */}
          <div className="absolute top-2 right-2 opacity-10 pointer-events-none text-7xl select-none">
            🌧️
          </div>

          <div className="relative z-10 space-y-3">
            {/* Header Badge Strip */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-red-600 text-white text-micro font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                  <CloudRain className="w-3.5 h-3.5 animate-bounce" />
                  <span>Weather Alert: High Rain Probability</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-micro font-bold tabular-nums">
                  {rainProbability}% &gt; 60% Target
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
                        className="inline-flex items-center gap-1 text-micro font-bold text-stone-700 dark:text-stone-300 hover:text-stone-950 bg-stone-200/80 dark:bg-stone-800 px-2 py-0.5 rounded-md hover:scale-105 transition-all"
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
                {bengaliCityName} ৬০% এর বেশি বৃষ্টির সম্ভাবনা রয়েছে। মণ্ডপ পরিক্রমায় বেরোনোর আগে ছাতা ও রেইন গিয়ার সঙ্গে আছে কিনা পরীক্ষা করে নিন।
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
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:brightness-110 text-white font-bold text-btn shrink-0 shadow-sm active:scale-95 transition-all flex items-center gap-1"
              >
                <span>Check Gear</span>
              </button>
            </div>

            {/* Bottom Actions: Test Push & Simulation Controls */}
            <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualTestAlert}
                  className="text-micro font-bold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white flex items-center gap-1 underline underline-offset-2"
                  title="Test Push Notification"
                >
                  <Volume2 className="w-3 h-3 text-red-600" />
                  <span>Test Push Alert</span>
                </button>

                <span className="text-stone-300 dark:text-stone-700">•</span>

                <button
                  onClick={() => setShowSimControls((prev) => !prev)}
                  className="text-micro font-bold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 flex items-center gap-1"
                >
                  <Sliders className="w-3 h-3" />
                  <span>{showSimControls ? 'Hide Tester' : 'Rain Simulator'}</span>
                  {showSimControls ? (
                    <ChevronUp className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              </div>

              <span className="text-micro text-stone-500 font-medium">
                Recommendation: Use Metro Green/Blue lines to stay dry
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Compact Weather Bar when Rain Probability <= 60% */
        <div
          id="weather-normal-status-bar"
          className={`px-3.5 py-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
            isDarkMode
              ? 'bg-[#24171E] border-stone-800 text-stone-300'
              : 'bg-white border-stone-200 text-stone-700 shadow-sm'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🌤️</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-btn text-stone-900 dark:text-white">
                  Weather Alert System Active
                </span>
                <span className="text-micro px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                  {rainProbability}% Rain Prob (&le;60%)
                </span>
              </div>
              <p className="text-micro text-stone-500 dark:text-stone-400 font-bengali">
                বৃষ্টিপাতের সম্ভাবনা স্বাভাবিক। ৬০% ছাড়ালে সতর্কবার্তা পাঠানো হবে।
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleSetSimulatedProb(75)}
              className="px-2.5 py-1 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-[#DC2626] dark:text-red-300 font-bold text-micro active:scale-95 transition-all border border-red-500/30 flex items-center gap-1"
              title="Simulate Rain Probability exceeding 60%"
            >
              <CloudRain className="w-3 h-3" />
              <span>Simulate &gt;60% Alert</span>
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 transition-all"
              title="View Gear Checklist"
            >
              <Umbrella className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 3. SIMULATOR TEST DRAWER / SLIDER (Allows reviewers to test exact thresholds) */}
      {showSimControls && (
        <div
          id="rain-simulation-tester"
          className={`p-3 rounded-2xl border space-y-2.5 ${
            isDarkMode ? 'bg-black/40 border-stone-800' : 'bg-amber-50/70 border-amber-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span className="font-display font-bold text-btn text-stone-900 dark:text-white">
                Rain Probability Threshold Tester
              </span>
            </div>
            <span className="text-micro font-mono font-bold text-stone-600 dark:text-stone-300">
              Current: {simSliderValue}%
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={simSliderValue}
              onChange={(e) => {
                const val = Number(e.target.value);
                setSimSliderValue(val);
                handleSetSimulatedProb(val);
              }}
              className="w-full accent-[#DC2626] cursor-pointer"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => handleSetSimulatedProb(15)}
              className={`px-2.5 py-1 rounded-lg text-micro font-bold border transition-all ${
                simSliderValue <= 30
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300'
              }`}
            >
              Clear (15%)
            </button>

            <button
              onClick={() => handleSetSimulatedProb(50)}
              className={`px-2.5 py-1 rounded-lg text-micro font-bold border transition-all ${
                simSliderValue > 30 && simSliderValue <= 60
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300'
              }`}
            >
              Overcast (50%)
            </button>

            <button
              onClick={() => handleSetSimulatedProb(75)}
              className={`px-2.5 py-1 rounded-lg text-micro font-bold border transition-all ${
                simSliderValue > 60 && simSliderValue < 90
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300'
              }`}
            >
              Alert Trigger (75% &gt; 60%)
            </button>

            <button
              onClick={() => handleSetSimulatedProb(95)}
              className={`px-2.5 py-1 rounded-lg text-micro font-bold border transition-all ${
                simSliderValue >= 90
                  ? 'bg-purple-700 text-white border-purple-700'
                  : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300'
              }`}
            >
              Heavy Storm (95%)
            </button>

            <button
              onClick={() => {
                handleSetSimulatedProb(null);
                setShowSimControls(false);
              }}
              className="px-2.5 py-1 rounded-lg text-micro font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-all ml-auto"
            >
              Reset to Default
            </button>
          </div>
        </div>
      )}

      {/* 4. MONSOON GEAR CHECKLIST MODAL */}
      {isModalOpen && (
        <div
          id="monsoon-gear-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            id="monsoon-gear-modal-content"
            className={`w-full max-w-lg rounded-3xl border shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto ${
              isDarkMode
                ? 'bg-[#1E151A] border-amber-500/30 text-white'
                : 'bg-white border-amber-200 text-stone-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b pb-3 border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center text-2xl text-white shadow-md">
                  ☂️
                </div>
                <div>
                  <h3 className="font-display font-black text-h3 text-stone-900 dark:text-white">
                    Durga Puja Rain Gear Checklist
                  </h3>
                  <p className="font-bengali text-small text-[#991B1B] dark:text-[#FEF08A] font-bold">
                    শারদোৎসব বর্ষা গিয়ার চেকলিস্ট
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Weather Context Banner */}
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                isRainAlertActive
                  ? 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-200'
                  : 'bg-stone-100 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CloudRain className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <span className="font-bold text-btn block">
                    Current Forecast: {rainProbability}% Rain Probability in {cityName}
                  </span>
                  <span className="text-micro text-stone-600 dark:text-stone-300">
                    {isRainAlertActive
                      ? '⚠️ Rain probability exceeds 60%! High chance of getting soaked in queue.'
                      : 'Normal weather conditions. Keep gear handy just in case.'}
                  </span>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-micro font-black uppercase tracking-wider shrink-0 ${
                  isRainAlertActive ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
                }`}
              >
                {isRainAlertActive ? 'Alert Active' : 'Normal'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-btn font-bold">
                <span className="text-stone-700 dark:text-stone-300">Packing Progress</span>
                <span className="tabular-nums text-red-600 dark:text-amber-400">
                  {packedCount} of {totalGearCount} packed ({Math.round((packedCount / totalGearCount) * 100)}%)
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-600 transition-all duration-300 rounded-full"
                  style={{ width: `${(packedCount / totalGearCount) * 100}%` }}
                />
              </div>

              {isAllGearPacked && (
                <div className="flex items-center gap-1.5 text-small font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                  <Sparkles className="w-4 h-4" />
                  <span>All monsoon essentials packed! You are fully prepared for pandal hopping!</span>
                </div>
              )}
            </div>

            {/* Gear Items List */}
            <div className="space-y-2.5">
              {gearItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleGear(item.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                    item.isPacked
                      ? isDarkMode
                        ? 'bg-emerald-950/20 border-emerald-600/40 text-white'
                        : 'bg-emerald-50/70 border-emerald-300 text-stone-900'
                      : isDarkMode
                      ? 'bg-black/30 border-stone-800 text-stone-200 hover:border-stone-700'
                      : 'bg-white border-stone-200 text-stone-900 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0 pt-0.5">{item.icon}</div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-display font-bold text-btn ${
                            item.isPacked ? 'line-through opacity-75' : ''
                          }`}
                        >
                          {item.name}
                        </span>
                        <span className="font-bengali text-micro text-red-700 dark:text-amber-300 font-semibold">
                          {item.bengaliName}
                        </span>
                        <span
                          className={`text-micro px-1.5 py-0.2 rounded font-bold uppercase tracking-wider ${
                            item.importance === 'critical'
                              ? 'bg-red-500/20 text-red-700 dark:text-red-300'
                              : item.importance === 'recommended'
                              ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                              : 'bg-stone-500/20 text-stone-600 dark:text-stone-300'
                          }`}
                        >
                          {item.importance}
                        </span>
                      </div>
                      <p className="text-micro text-stone-500 dark:text-stone-400">
                        {item.tip}
                      </p>
                      <p className="text-micro font-bengali text-stone-500 dark:text-stone-400">
                        {item.bengaliTip}
                      </p>
                    </div>
                  </div>

                  <div className="pt-1 shrink-0">
                    {item.isPacked ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Circle className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pandal Hopping Rain Tips */}
            <div
              className={`p-3 rounded-2xl border text-small space-y-1.5 ${
                isDarkMode ? 'bg-black/40 border-stone-800' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <h5 className="font-display font-bold text-btn text-stone-900 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Local Autumn Rain Advice from Kolkata Veterans</span>
              </h5>
              <ul className="text-micro text-stone-600 dark:text-stone-300 space-y-1 list-disc list-inside">
                <li>
                  During sudden downpours, take the <strong>North-South Metro (Blue Line)</strong> or <strong>East-West (Green Line)</strong> to travel between clusters while staying dry underground.
                </li>
                <li>
                  Ponchos are safer than open umbrellas inside packed barricaded queues where umbrella tips can poke neighboring devotees.
                </li>
                <li>
                  Keep phones in transparent ziplocs so you can scan QR codes and navigate Google Maps even in drizzle.
                </li>
              </ul>
            </div>

            {/* Modal Bottom Action Strip */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleMarkAllPacked}
                  className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-bold text-btn transition-all"
                >
                  Mark All Packed
                </button>
                <button
                  onClick={handleResetChecklist}
                  className="px-3 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-semibold text-btn transition-all"
                >
                  Reset
                </button>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#991B1B] text-white font-bold text-btn shadow-md active:scale-95 transition-all"
              >
                Ready to Hop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
