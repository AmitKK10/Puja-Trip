import React from 'react';
import { DynamicReplanningOption } from '../../types';
import { playKanshorBell } from '../../utils/audioSynth';
import { formatDistance } from '../../utils/geoUtils';
import {
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Clock,
  Footprints,
  Train,
  CheckCircle2,
  XCircle,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface DynamicReplanningCardProps {
  replanOption: DynamicReplanningOption;
  onApplyPlan: (newPandalIds: string[]) => void;
  onDismiss: () => void;
}

export const DynamicReplanningCard: React.FC<DynamicReplanningCardProps> = ({
  replanOption,
  onApplyPlan,
  onDismiss,
}) => {
  const isWarning = replanOption.severity === 'warning' || replanOption.severity === 'critical';

  const handleApply = () => {
    playKanshorBell(0.8);
    onApplyPlan(replanOption.suggestedPandalIds);
  };

  const handleKeep = () => {
    onDismiss();
  };

  return (
    <div
      id="dynamic-route-replanning-card"
      className={`rounded-3xl p-4 sm:p-5 border shadow-lg relative overflow-hidden transition-all animate-in slide-in-from-top-2 duration-300 ${
        isWarning
          ? 'bg-gradient-to-br from-amber-500/15 via-rose-500/10 to-amber-500/15 border-amber-500/40 text-stone-900 dark:text-amber-100'
          : 'bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-blue-500/10 border-blue-500/30 text-stone-900 dark:text-blue-100'
      }`}
    >
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#881337] dark:bg-[#7F1D1D] text-white text-micro font-black uppercase tracking-wider shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5 text-[#FDE68A] animate-pulse" />
          <span>Your Plan Could Be Improved</span>
        </div>

        <span className="text-micro font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full">
          ⚡ Saves ~{replanOption.timeSavedMinutes} mins
        </span>
      </div>

      {/* Title & Reason */}
      <div className="mt-3 space-y-1.5">
        <h3 className="font-display font-black text-h3 sm:text-h2 text-stone-900 dark:text-white leading-tight">
          {replanOption.title}
        </h3>
        <p className="text-small text-stone-700 dark:text-stone-300 leading-relaxed font-medium">
          {replanOption.triggerReason}
        </p>
      </div>

      {/* Sequence Comparison (Current vs Suggested) */}
      <div className="mt-4 p-3.5 rounded-2xl bg-white/90 dark:bg-black/40 border border-amber-500/25 space-y-3">
        {/* Current Path */}
        <div>
          <div className="text-micro font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-stone-400"></span>
            <span>Current Sequence:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap text-small text-stone-700 dark:text-stone-300 font-medium">
            {replanOption.currentPandalNames.map((name, i) => (
              <React.Fragment key={i}>
                <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                  {name}
                </span>
                {i < replanOption.currentPandalNames.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Suggested Path */}
        <div>
          <div className="text-micro font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Suggested Sequence (Optimized):</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap text-small text-stone-900 dark:text-white font-bold">
            {replanOption.suggestedPandalNames.map((name, i) => (
              <React.Fragment key={i}>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200">
                  {name}
                </span>
                {i < replanOption.suggestedPandalNames.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Metric Pill Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-stone-200/60 dark:border-stone-800 text-micro">
          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Time Saved: ~{replanOption.timeSavedMinutes} mins</span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
            <Footprints className="w-3.5 h-3.5" />
            <span>
              Walking Change:{' '}
              {replanOption.walkingDistanceChangeMeters <= 0
                ? `${Math.abs(replanOption.walkingDistanceChangeMeters)}m less walking`
                : `+${replanOption.walkingDistanceChangeMeters}m walk`}
            </span>
          </div>

          {replanOption.transportChangeLabel && (
            <div className="flex items-center gap-1.5 text-[#881337] dark:text-amber-300 font-bold">
              <Train className="w-3.5 h-3.5" />
              <span>{replanOption.transportChangeLabel}</span>
            </div>
          )}
        </div>
      </div>

      {/* Decision Buttons (Strictly User-Authoritative) */}
      <div className="mt-4 flex items-center gap-2.5">
        <button
          id="keep-current-trip-plan-btn"
          onClick={handleKeep}
          className="flex-1 py-2.5 px-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-800 text-small font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-center"
        >
          Keep Current Plan
        </button>

        <button
          id="apply-new-replan-route-btn"
          onClick={handleApply}
          className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-small font-bold shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Apply New Plan</span>
        </button>
      </div>
    </div>
  );
};
