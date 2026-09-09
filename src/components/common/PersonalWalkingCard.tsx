import React, { useState, useEffect } from 'react';
import {
  WalkingSessionStats,
  UserWalkingEnergyConfig,
  UserPreferences,
  CityId,
} from '../../types';
import {
  getWalkingSessionStats,
  getWalkingEnergyConfig,
  evaluateWalkingThresholds,
  seedSampleWalkingStatsIfEmpty,
  recordRestBreakTaken,
} from '../../services/walkingEnergyService';
import { RestBreakSuggestionModal } from './RestBreakSuggestionModal';
import { playKanshorBell } from '../../utils/audioSynth';
import {
  Footprints,
  Flame,
  Clock,
  TrendingUp,
  AlertTriangle,
  Coffee,
  Sliders,
  CheckCircle2,
  Info,
  ShieldAlert,
  ChevronRight,
  Compass,
} from 'lucide-react';

interface PersonalWalkingCardProps {
  tripId?: string;
  userPrefs: UserPreferences;
  activeCity?: CityId;
  userLat?: number;
  userLng?: number;
  onOpenSettings?: () => void;
  onNavigateToRestSpot?: (lat: number, lng: number) => void;
  compact?: boolean;
}

export const PersonalWalkingCard: React.FC<PersonalWalkingCardProps> = ({
  tripId = 'default-trip',
  userPrefs,
  activeCity = userPrefs.activeCity || 'kolkata',
  userLat,
  userLng,
  onOpenSettings,
  onNavigateToRestSpot,
  compact = false,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [stats, setStats] = useState<WalkingSessionStats>(() => {
    // Seed initial realistic sample if first time so UI shows meaningful data immediately
    return seedSampleWalkingStatsIfEmpty(tripId, 6.4);
  });
  const [config, setConfig] = useState<UserWalkingEnergyConfig>(() => getWalkingEnergyConfig());
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);

  // Sync with walking events & config modifications
  useEffect(() => {
    const handleStatsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<WalkingSessionStats>;
      if (customEvent.detail) {
        setStats(customEvent.detail);
      } else {
        setStats(getWalkingSessionStats(tripId));
      }
    };

    const handleConfigChanged = (e: Event) => {
      const customEvent = e as CustomEvent<UserWalkingEnergyConfig>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(getWalkingEnergyConfig());
      }
    };

    window.addEventListener('pujatrip_walking_stats_updated', handleStatsUpdated);
    window.addEventListener('pujatrip_walking_config_changed', handleConfigChanged);

    return () => {
      window.removeEventListener('pujatrip_walking_stats_updated', handleStatsUpdated);
      window.removeEventListener('pujatrip_walking_config_changed', handleConfigChanged);
    };
  }, [tripId]);

  const evaluation = evaluateWalkingThresholds(stats, config);
  const walkedKm = Number((stats.totalDistanceMeters / 1000).toFixed(1));
  const walkingHours = Math.floor(stats.totalDurationMinutes / 60);
  const walkingMins = stats.totalDurationMinutes % 60;
  const formattedDuration =
    walkingHours > 0 ? `${walkingHours}h ${walkingMins}m` : `${walkingMins}m`;

  const isContinuousWalkingAlert =
    stats.continuousWalkingMinutes >= config.maxContinuousWalkingMins;

  const handleQuickRest = () => {
    playKanshorBell(0.6);
    recordRestBreakTaken(20, tripId);
  };

  return (
    <section
      id="energy-tracker-section"
      role="region"
      aria-labelledby="energy-tracker-heading"
      className={`rounded-3xl p-4 sm:p-5 border shadow-md transition-all ${
        isDarkMode
          ? 'bg-[#22161E] border-stone-700/80 text-white'
          : 'bg-white border-stone-200 text-stone-900'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200/70 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
            <Footprints className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h3
              id="energy-tracker-heading"
              className="font-display font-bold text-h4 text-stone-900 dark:text-white leading-tight"
            >
              Energy Tracker
            </h3>
            <p className="font-bengali text-micro text-amber-700 dark:text-amber-300">
              আজকের হাঁটা ও শক্তি ট্র্যাকার • Walking & Step Counter
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onOpenSettings && (
            <button
              id="open-walking-limits-btn"
              onClick={onOpenSettings}
              aria-label="Configure Walking Limits and Energy Targets"
              title="Configure Walking Limits"
              className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <Sliders className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Primary Metrics Grid (3 Pillars with tabular-nums) */}
      <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3 text-center">
        {/* Today's Walking Distance */}
        <div
          className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-col items-center justify-center"
          aria-label={`Today's total walking distance: ${walkedKm} kilometers`}
        >
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">
            Today's Distance
          </span>
          <span className="font-display font-black text-h3 text-stone-900 dark:text-white mt-0.5 tabular-nums">
            <span aria-hidden="true">🚶 </span>{walkedKm} <span className="text-small font-normal">km</span>
          </span>
          <span className="text-[10px] text-stone-500 mt-0.5 tabular-nums">
            {stats.completedWalkingLegs} legs completed
          </span>
        </div>

        {/* Estimated Step Count */}
        <div
          className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center"
          aria-label={`Estimated step count: ${stats.estimatedSteps.toLocaleString()} steps`}
        >
          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            Estimated Steps*
          </span>
          <span className="font-display font-black text-h3 text-stone-900 dark:text-white mt-0.5 tabular-nums">
            {stats.estimatedSteps.toLocaleString()}
          </span>
          <span className="text-[10px] text-stone-500 mt-0.5">
            Approximate count
          </span>
        </div>

        {/* Walking Time */}
        <div
          className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center"
          aria-label={`Total active walking duration: ${formattedDuration}`}
        >
          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
            Walking Time
          </span>
          <span className="font-display font-black text-h3 text-stone-900 dark:text-white mt-0.5 tabular-nums">
            {formattedDuration}
          </span>
          <span className="text-[10px] text-stone-500 mt-0.5">
            Active transit
          </span>
        </div>
      </div>

      {/* Target Progress Bar */}
      <div className="mt-4 space-y-1.5">
        <div className="flex items-center justify-between text-micro font-bold">
          <span className="text-stone-600 dark:text-stone-400">
            Daily Target: <span className="tabular-nums font-semibold">{config.maxWalkingLimitKm} km</span> (Comfort: <span className="tabular-nums font-semibold">{config.comfortableWalkingLimitKm} km</span>)
          </span>
          <span
            className={`tabular-nums ${
              evaluation.isExceedingMax
                ? 'text-red-600 dark:text-red-400'
                : evaluation.isApproachingLimit
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {evaluation.percentageOfMax}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={Math.min(100, evaluation.percentageOfMax)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext={`${evaluation.percentageOfMax}% of daily target`}
          aria-label="Daily walking target progress"
          className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden relative"
        >
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              evaluation.isExceedingMax
                ? 'bg-red-500'
                : evaluation.isApproachingLimit
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, evaluation.percentageOfMax)}%` }}
          />
        </div>
      </div>

      {/* Threshold Status Banner if Approaching or Exceeding Limit */}
      {(evaluation.isApproachingLimit || evaluation.isExceedingMax) && (
        <div
          role="alert"
          className={`mt-3.5 p-3 rounded-2xl border flex items-start gap-2.5 text-small ${
            evaluation.isExceedingMax
              ? 'bg-red-500/15 border-red-500/30 text-red-900 dark:text-red-200'
              : 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-bold">
              {evaluation.isExceedingMax
                ? `🚨 Maximum Target Reached (${walkedKm} km / ${config.maxWalkingLimitKm} km)`
                : `⚠️ Approaching Walking Target (${walkedKm} km of ${config.maxWalkingLimitKm} km)`}
            </p>
            <p className="text-micro opacity-90 mt-0.5">
              {evaluation.statusMessage}
            </p>
            <p className="font-bengali text-micro opacity-85 mt-0.5">
              {evaluation.bengaliStatusMessage}
            </p>
          </div>
        </div>
      )}

      {/* Continuous Walking Alert (e.g. >= 45 min) */}
      {isContinuousWalkingAlert && (
        <div
          role="alert"
          className="mt-3.5 p-3 rounded-2xl bg-teal-500/15 border border-teal-500/30 text-teal-950 dark:text-teal-200 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-2">
            <Coffee className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-bold text-small">
                🚶 Continuous Walking: <span className="tabular-nums">{stats.continuousWalkingMinutes}</span> mins
              </p>
              <p className="text-micro opacity-90 mt-0.5">
                ☕ Consider a short break to hydrate and prevent fatigue before entering next queue.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-1 shrink-0">
            <button
              onClick={() => setIsRestModalOpen(true)}
              aria-label="Find nearby rest spots and refreshment options"
              className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-micro shadow-xs flex items-center gap-1"
            >
              <Coffee className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Rest Spots</span>
            </button>
            <button
              onClick={handleQuickRest}
              aria-label="Reset continuous walking counter"
              className="text-[10px] text-teal-800 dark:text-teal-300 underline font-semibold text-center"
            >
              Reset Counter
            </button>
          </div>
        </div>
      )}

      {/* Transit & Rest Breakdown Strip */}
      {!compact && (
        <div className="mt-3.5 pt-3 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between flex-wrap gap-2 text-micro text-stone-500">
          <div className="flex items-center gap-3 tabular-nums">
            <span>🚇 Metro: {stats.transitUsageCount.metro}</span>
            <span>🚌 Bus: {stats.transitUsageCount.bus}</span>
            <span>🛺 Auto: {stats.transitUsageCount.auto}</span>
            <span>☕ Breaks: {stats.restBreaksTaken}</span>
          </div>

          <button
            onClick={() => setIsRestModalOpen(true)}
            aria-label="Find nearby rest spots or food cabins"
            className="text-amber-700 dark:text-amber-300 font-bold hover:underline flex items-center gap-1"
          >
            <Coffee className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Find Nearby Rest / Food</span>
          </button>
        </div>
      )}

      {/* Non-medical Disclaimer Note */}
      <div className="mt-3 pt-2 border-t border-stone-200/40 dark:border-stone-800/40 flex items-center gap-1.5 text-[10px] text-stone-400">
        <Info className="w-3 h-3 shrink-0" aria-hidden="true" />
        <span>
          *Estimated steps and distance are approximate calculations from map routing & GPS pacing. Not a medical or fitness tracking device.
        </span>
      </div>

      {/* Rest Suggestions Modal */}
      {isRestModalOpen && (
        <RestBreakSuggestionModal
          isOpen={isRestModalOpen}
          onClose={() => setIsRestModalOpen(false)}
          userLat={userLat}
          userLng={userLng}
          activeCity={activeCity}
          userPrefs={userPrefs}
          tripId={tripId}
          onNavigateToRestSpot={onNavigateToRestSpot}
        />
      )}
    </section>
  );
};
