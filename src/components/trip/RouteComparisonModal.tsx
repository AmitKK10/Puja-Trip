import React, { useState } from 'react';
import {
  JourneyRouteComparison,
  ModeRouteOption,
  RouteStep,
  SmartTransportMode,
  WalkingPreference,
} from '../../types';
import { formatDistance } from '../../utils/geoUtils';
import {
  X,
  Footprints,
  Train,
  Bus,
  Compass,
  Sparkles,
  ArrowRight,
  Clock,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

interface RouteComparisonModalProps {
  comparison: JourneyRouteComparison;
  isOpen: boolean;
  onClose: () => void;
  onSelectModeOverride?: (mode: SmartTransportMode) => void;
}

export const RouteComparisonModal: React.FC<RouteComparisonModalProps> = ({
  comparison,
  isOpen,
  onClose,
  onSelectModeOverride,
}) => {
  const [selectedMode, setSelectedMode] = useState<SmartTransportMode>(
    comparison.recommendedMode || 'walking'
  );

  if (!isOpen) return null;

  const activeOption =
    comparison.allOptions.find((opt) => opt.mode === selectedMode) ||
    comparison.recommendedOption;

  return (
    <div
      id="route-comparison-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-[#1E161C] border border-[#FDE68A]/30 dark:border-[#F59E0B]/30 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleUp">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#881337] via-[#991B1B] to-[#7F1D1D] p-4 sm:p-5 text-white relative">
          <button
            id="close-route-comparison-modal-btn"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 text-micro uppercase tracking-wider text-amber-200 font-bold">
            <Compass className="w-3.5 h-3.5" />
            <span>Smart Transport & Route Engine</span>
            <span className="opacity-75">• Source-Verified Transit</span>
          </div>

          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="font-bold text-small sm:text-base text-white truncate max-w-[200px]">
              {comparison.originName}
            </span>
            <ArrowRight className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="font-bold text-small sm:text-base text-[#FEF08A] truncate max-w-[200px]">
              {comparison.destinationName}
            </span>
          </div>

          <div className="mt-2 flex items-center gap-3 text-micro text-amber-100 font-medium">
            <span>Straight-line: {formatDistance(comparison.straightDistanceMeters)}</span>
            <span>•</span>
            <span className="capitalize">Walk Pace: {comparison.userWalkingPreference}</span>
          </div>
        </div>

        {/* Modal Content Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Mode Comparison Grid */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-small font-bold text-[#881337] dark:text-[#FEF08A] uppercase tracking-wider">
                Intelligent Mode Comparison
              </h4>
              <span className="text-micro text-stone-500 dark:text-stone-400">
                Ranked by Travel Score
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {comparison.allOptions.map((option) => {
                const isSelected = option.mode === selectedMode;
                const isRec = option.isRecommended;

                return (
                  <button
                    key={option.mode}
                    id={`select-transport-mode-${option.mode}`}
                    onClick={() => setSelectedMode(option.mode)}
                    className={`relative text-left p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#DC2626] dark:border-[#F59E0B] bg-amber-50/60 dark:bg-amber-950/30 ring-2 ring-[#DC2626]/20 shadow-sm'
                        : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900/50 hover:border-stone-300'
                    }`}
                  >
                    {isRec && (
                      <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-red-500 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>Best Choice</span>
                      </div>
                    )}

                    <div className="pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{option.icon}</span>
                        <span className="text-micro font-bold px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                          {option.comfortTag}
                        </span>
                      </div>
                      <h5 className="font-bold text-small text-stone-900 dark:text-white mt-1">
                        {option.modeLabel}
                      </h5>
                      <p className="text-micro text-stone-500 dark:text-stone-400 font-bengali">
                        {option.bengaliModeLabel}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                      <div className="flex items-baseline justify-between">
                        <span className="font-bold text-base text-[#881337] dark:text-[#FEF08A]">
                          ~{option.totalDurationMinutes}m
                        </span>
                        {option.fareRupees !== undefined ? (
                          <span className="text-micro font-bold text-emerald-700 dark:text-emerald-300">
                            ₹{option.fareRupees}
                          </span>
                        ) : (
                          <span className="text-micro text-stone-500 font-medium">
                            {formatDistance(option.walkingDistanceMeters)} walk
                          </span>
                        )}
                      </div>

                      {option.operationalType && (
                        <div className="mt-1 flex items-center justify-between text-[9px] font-semibold">
                          <span
                            className={`px-1.5 py-0.2 rounded ${
                              option.operationalType === 'live'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                : option.operationalType === 'scheduled'
                                ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                            }`}
                          >
                            {option.operationalType.toUpperCase()}
                          </span>
                          <span className="text-stone-400 truncate max-w-[80px]">
                            {formatDistance(option.walkingDistanceMeters)} walk
                          </span>
                        </div>
                      )}

                      {option.timeSavedVersusWalkMinutes !== undefined &&
                        option.timeSavedVersusWalkMinutes > 0 && (
                          <span className="mt-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
                            ⚡ Saves {option.timeSavedVersusWalkMinutes}m vs walk
                          </span>
                        )}

                      {option.exceedsMaxWalkingLimit && (
                        <span className="mt-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>Exceeds walk limit</span>
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Detailed Recommendation Reason Card */}
          <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h5 className="text-small font-bold text-stone-900 dark:text-white">
                  Why {activeOption.modeLabel}?
                </h5>
                <p className="text-small text-stone-700 dark:text-stone-300 leading-relaxed">
                  {activeOption.recommendationReason || comparison.summaryNote}
                </p>
                <div className="flex items-center gap-4 text-micro text-stone-500 dark:text-stone-400 pt-1 flex-wrap">
                  <span>Match Score: {activeOption.recommendationScore}/100</span>
                  <span>•</span>
                  <span>Transfers: {activeOption.transferCount}</span>
                  {activeOption.waitingTimeMinutes > 0 && (
                    <>
                      <span>•</span>
                      <span>Wait: ~{activeOption.waitingTimeMinutes}m</span>
                    </>
                  )}
                  {activeOption.verifiedSource && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-300">
                        Source: {activeOption.verifiedSource}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Step-by-Step Breakdown Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-small font-bold text-[#881337] dark:text-[#FEF08A] uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-stone-400" />
                <span>Step-by-Step Journey Breakdown</span>
              </h4>
              <span className="text-micro text-stone-500 font-medium">
                {activeOption.steps.length} Steps
              </span>
            </div>

            <div className="space-y-2 relative pl-3 border-l-2 border-dashed border-stone-200 dark:border-stone-800 ml-2">
              {activeOption.steps.map((step, idx) => {
                return (
                  <div key={step.id || idx} className="relative pl-4 group">
                    {/* Node Dot / Icon */}
                    <div className="absolute -left-[19px] top-1 w-7 h-7 rounded-full bg-white dark:bg-stone-900 border-2 border-[#881337] dark:border-[#F59E0B] flex items-center justify-center text-xs shadow-xs">
                      {step.icon}
                    </div>

                    <div className="bg-white dark:bg-stone-900/60 p-3 rounded-xl border border-stone-100 dark:border-stone-800 space-y-1 hover:border-stone-300 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-small text-stone-900 dark:text-white">
                          {step.instruction}
                        </span>
                        {step.durationMinutes > 0 && (
                          <span className="text-micro font-bold text-stone-500 dark:text-stone-400 shrink-0 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full">
                            ~{step.durationMinutes} min
                          </span>
                        )}
                      </div>

                      {step.bengaliInstruction && (
                        <p className="text-micro text-stone-500 dark:text-stone-400 font-bengali">
                          {step.bengaliInstruction}
                        </p>
                      )}

                      {step.metadata?.lineName && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold mt-1">
                          <Train className="w-3 h-3" />
                          <span>{step.metadata.lineName}</span>
                          {step.metadata.stopCount && (
                            <span>• {step.metadata.stopCount} stops</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 dark:bg-stone-900 p-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
          <button
            id="close-route-comparison-bottom-btn"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-small font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            Close
          </button>

          {onSelectModeOverride && (
            <button
              id="confirm-selected-transport-mode-btn"
              onClick={() => {
                onSelectModeOverride(selectedMode);
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#881337] to-[#DC2626] text-white text-small font-bold shadow-md hover:brightness-110 transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Use {activeOption.modeLabel} for This Leg</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
