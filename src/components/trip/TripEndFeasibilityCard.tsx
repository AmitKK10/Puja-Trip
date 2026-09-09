import React, { useState } from 'react';
import { RunningLateStatus, TripPlan, Pandal } from '../../types';
import { playKanshorBell } from '../../utils/audioSynth';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  Train,
  Sliders,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface TripEndFeasibilityCardProps {
  status: RunningLateStatus;
  trip: TripPlan;
  onRemovePandal?: (pandalId: string) => void;
  onSwitchTransportToMetro?: () => void;
  onReduceVisitDuration?: () => void;
  onRecalculateRoute?: () => void;
}

export const TripEndFeasibilityCard: React.FC<TripEndFeasibilityCardProps> = ({
  status,
  trip,
  onRemovePandal,
  onSwitchTransportToMetro,
  onReduceVisitDuration,
  onRecalculateRoute,
}) => {
  const [isActionsOpen, setIsActionsOpen] = useState(false);

  // If everything is perfectly on time and feasible
  if (status.isEndFeasible && !status.isBehindSchedule) {
    return (
      <div
        id="trip-feasibility-on-track-card"
        className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-small text-emerald-900 dark:text-emerald-200"
      >
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold flex items-center gap-2">
              <span>On Schedule: {status.remainingStopsCount} pandals remaining</span>
            </div>
            <div className="text-micro text-emerald-800 dark:text-emerald-300">
              Est. Finish: <strong>{status.estimatedCompletionTime}</strong> • Planned End: {status.plannedEndTime}
            </div>
          </div>
        </div>

        <span className="text-micro font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-200">
          Feasible ✨
        </span>
      </div>
    );
  }

  return (
    <div
      id="trip-feasibility-alert-card"
      className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-amber-500/15 border border-amber-500/40 space-y-3 text-stone-900 dark:text-amber-100 shadow-sm"
    >
      {/* Header alert */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#881337] text-white flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-4 h-4 text-[#FDE68A] animate-pulse" />
          </div>
          <div>
            <h4 className="font-display font-black text-small text-[#881337] dark:text-amber-200">
              {status.isBehindSchedule
                ? `⚠️ You are ~${status.minutesBehind} minutes behind schedule`
                : `⚠️ Trip Overrun: ~${status.overScheduleMinutes} mins past deadline`}
            </h4>
            <div className="text-micro text-stone-600 dark:text-stone-300 mt-0.5">
              You have <strong>{status.remainingStopsCount} pandals remaining</strong>. Est. completion:{' '}
              <strong className="text-stone-900 dark:text-white">{status.estimatedCompletionTime}</strong> (Planned:{' '}
              {status.plannedEndTime})
            </div>
          </div>
        </div>

        <span className="text-micro font-black px-2.5 py-0.5 rounded-full bg-[#881337] text-white shrink-0">
          +{status.overScheduleMinutes || status.minutesBehind}m
        </span>
      </div>

      {/* Suggested Lowest Priority Removal (Never auto-removed!) */}
      {status.suggestedRemovals && status.suggestedRemovals.length > 0 && (
        <div className="p-3 rounded-xl bg-white/90 dark:bg-black/40 border border-amber-500/30 space-y-2">
          <div className="text-micro font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Recommended Remedy to Catch Up:</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black">
              Saves ~{status.suggestedRemovals[0].timeSavedMinutes} min
            </span>
          </div>

          <p className="text-micro text-stone-600 dark:text-stone-300 leading-snug">
            Skipping <strong>{status.suggestedRemovals[0].pandalName}</strong> (Lower priority stop) will bring your
            itinerary right back within schedule.
          </p>

          <div className="flex items-center gap-2 pt-1">
            {onRemovePandal && (
              <button
                id="skip-optional-pandal-remedy-btn"
                onClick={() => {
                  playKanshorBell(0.6);
                  onRemovePandal(status.suggestedRemovals[0].pandalId);
                }}
                className="py-1.5 px-3 rounded-lg bg-rose-600/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-micro font-bold hover:bg-rose-600 hover:text-white transition-all flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Skip {status.suggestedRemovals[0].pandalName}</span>
              </button>
            )}

            {onSwitchTransportToMetro && (
              <button
                id="switch-metro-remedy-btn"
                onClick={() => {
                  playKanshorBell(0.6);
                  onSwitchTransportToMetro();
                }}
                className="py-1.5 px-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-micro font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
              >
                <Train className="w-3.5 h-3.5" />
                <span>Switch Leg to Metro</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
