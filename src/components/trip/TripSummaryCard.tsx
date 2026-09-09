import React from 'react';
import {
  ItinerarySummary,
  ItineraryOptimizationSuggestion,
  UserPreferences,
} from '../../types';
import {
  Clock,
  Footprints,
  Navigation,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Trash2,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { AlpanaCorner } from '../common/BengaliMotifs';

interface TripSummaryCardProps {
  summary: ItinerarySummary;
  userPrefs: UserPreferences;
  onApplySuggestion?: (suggestion: ItineraryOptimizationSuggestion) => void;
  onRecalculate?: () => void;
}

export const TripSummaryCard: React.FC<TripSummaryCardProps> = ({
  summary,
  userPrefs,
  onApplySuggestion,
  onRecalculate,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';

  const isExceeding = summary.timeFeasibilityStatus === 'exceeds_time';
  const isTight = summary.timeFeasibilityStatus === 'tight';

  return (
    <div className="space-y-3" id="trip-summary-container">
      {/* Main Metrics Card */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-lg relative overflow-hidden transition-all ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#381423] via-[#24171F] to-[#191116] border-[#F59E0B]/30 text-white'
            : 'bg-gradient-to-br from-[#881337] via-[#991B1B] to-[#7F1D1D] border-[#FDE68A]/30 text-white'
        }`}
      >
        <AlpanaCorner
          position="top-right"
          size={48}
          color="#FDE68A"
          className="absolute top-1 right-1 opacity-20 pointer-events-none"
        />

        {/* Top Badges */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/20 text-micro font-bold text-[#FEF08A] uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Itinerary Overview • সফর সূচি</span>
          </div>

          <div className="text-micro font-bold px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-amber-200">
            {summary.plannedStartTime} → {summary.plannedEndTime}
          </div>
        </div>

        {/* Big Duration & Stops */}
        <div className="mt-3.5 flex items-baseline justify-between">
          <div>
            <span className="text-micro uppercase tracking-wider text-amber-200/90 font-bold block">
              Total Trip Duration
            </span>
            <h3 className="font-display font-black text-2xl sm:text-3xl text-white tracking-tight tabular-nums mt-0.5">
              {summary.formattedTotalDuration}
            </h3>
          </div>

          <div className="text-right">
            <span className="text-micro uppercase tracking-wider text-amber-200/90 font-bold block">
              Selected Pandals
            </span>
            <span className="font-display font-black text-2xl sm:text-3xl text-[#FEF08A] tabular-nums">
              {summary.pandalCount}{' '}
              <span className="text-sm font-semibold text-white/80">Stops</span>
            </span>
          </div>
        </div>

        {/* 4-Column Grid Metrics */}
        <div className="mt-4 pt-3.5 border-t border-white/15 grid grid-cols-3 sm:grid-cols-3 gap-2 text-center">
          {/* Walking Distance */}
          <div className="bg-black/25 p-2.5 rounded-2xl border border-white/10 flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 text-micro text-amber-200 font-bold mb-0.5">
              <Footprints className="w-3 h-3 text-[#F59E0B]" />
              <span>Walking</span>
            </div>
            <span className="font-display font-black text-h4 sm:text-h3 text-white tabular-nums">
              {summary.formattedTotalWalkingDistance}
            </span>
          </div>

          {/* Transport Time */}
          <div className="bg-black/25 p-2.5 rounded-2xl border border-white/10 flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 text-micro text-amber-200 font-bold mb-0.5">
              <Navigation className="w-3 h-3 text-[#F59E0B]" />
              <span>Transit Time</span>
            </div>
            <span className="font-display font-black text-h4 sm:text-h3 text-white tabular-nums">
              {summary.formattedTransportTime}
            </span>
          </div>

          {/* Total Visit Time */}
          <div className="bg-black/25 p-2.5 rounded-2xl border border-white/10 flex flex-col justify-center">
            <div className="flex items-center justify-center gap-1 text-micro text-amber-200 font-bold mb-0.5">
              <Clock className="w-3 h-3 text-[#F59E0B]" />
              <span>Darshan Time</span>
            </div>
            <span className="font-display font-black text-h4 sm:text-h3 text-white tabular-nums">
              {summary.formattedVisitTime}
            </span>
          </div>
        </div>
      </div>

      {/* Time Feasibility & Warning Banner */}
      {isExceeding && (
        <div
          id="time-feasibility-warning"
          className="p-4 rounded-3xl bg-red-500/10 border-2 border-red-500/40 text-red-700 dark:text-red-300 space-y-3 animate-fadeIn"
        >
          <div className="flex items-start gap-2.5">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-display font-bold text-h4 text-red-800 dark:text-red-200">
                Trip Time Limit Exceeded
              </h4>
              <p className="text-small text-red-700 dark:text-red-300 mt-0.5 leading-relaxed font-semibold">
                {summary.warningMessage}
              </p>
            </div>
          </div>

          {/* Optimization Suggestions List */}
          {summary.suggestions.length > 0 && (
            <div className="pt-2 border-t border-red-500/20 space-y-2">
              <span className="text-micro uppercase font-bold tracking-wider text-red-800 dark:text-red-300 block">
                Recommended Actions to Fit Your Schedule:
              </span>
              <div className="space-y-1.5">
                {summary.suggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-stone-900/80 border border-red-500/30 flex items-center justify-between gap-2 text-small shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-stone-800 dark:text-stone-200 font-medium text-small truncate">
                        {sug.explanation}
                      </span>
                    </div>

                    {onApplySuggestion && sug.pandalId && (
                      <button
                        onClick={() => onApplySuggestion(sug)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-micro shrink-0 flex items-center gap-1 shadow-sm transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {isTight && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 flex items-center gap-2.5 text-small">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-semibold">{summary.warningMessage}</span>
        </div>
      )}

      {!isExceeding && !isTight && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 text-small">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">
            Itinerary fits comfortably within your scheduled hours ({summary.formattedTotalDuration} of{' '}
            {summary.availableTimeMinutes}m available).
          </span>
        </div>
      )}
    </div>
  );
};
