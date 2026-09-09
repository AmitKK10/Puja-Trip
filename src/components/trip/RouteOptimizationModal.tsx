import React, { useMemo } from 'react';
import { Pandal, TripPlan, TripLocation } from '../../types';
import { optimizePandalSequence } from '../../services/tripPlanningEngine';
import { calculateHaversineDistance, formatDistance } from '../../utils/geoUtils';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Route,
  ArrowRight,
  Check,
  X,
  Compass,
  MapPin,
  Clock,
  Footprints,
  Navigation,
  CheckCircle2,
  TrendingDown,
  Info,
} from 'lucide-react';

interface RouteOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTrip: TripPlan;
  currentPandals: Pandal[];
  onApplyOptimization: (optimizedPandalIds: string[]) => void;
  isDarkMode?: boolean;
}

export const RouteOptimizationModal: React.FC<RouteOptimizationModalProps> = ({
  isOpen,
  onClose,
  activeTrip,
  currentPandals,
  onApplyOptimization,
  isDarkMode = false,
}) => {
  // Calculate total path distance for an ordered array of pandals
  const calculateTotalPathDistance = (
    startLoc: TripLocation,
    endLoc: TripLocation,
    pandalList: Pandal[]
  ): number => {
    if (pandalList.length === 0) return 0;
    let total = 0;
    let curLat = startLoc.latitude;
    let curLng = startLoc.longitude;

    pandalList.forEach((p) => {
      total += calculateHaversineDistance(curLat, curLng, p.latitude, p.longitude);
      curLat = p.latitude;
      curLng = p.longitude;
    });

    total += calculateHaversineDistance(curLat, curLng, endLoc.latitude, endLoc.longitude);
    return Math.round(total);
  };

  // Compute optimized sequence based on geographic proximity
  const {
    optimizedPandals,
    currentDistanceMeters,
    optimizedDistanceMeters,
    distanceSavedMeters,
    estimatedMinutesSaved,
    isAlreadyOptimal,
  } = useMemo(() => {
    if (currentPandals.length <= 1) {
      return {
        optimizedPandals: currentPandals,
        currentDistanceMeters: 0,
        optimizedDistanceMeters: 0,
        distanceSavedMeters: 0,
        estimatedMinutesSaved: 0,
        isAlreadyOptimal: true,
      };
    }

    const currentDist = calculateTotalPathDistance(
      activeTrip.startLocation,
      activeTrip.endLocation,
      currentPandals
    );

    const optimized = optimizePandalSequence(
      activeTrip.startLocation,
      activeTrip.endLocation,
      currentPandals,
      activeTrip.walkingPreference,
      activeTrip.preferredTransport
    );

    const optDist = calculateTotalPathDistance(
      activeTrip.startLocation,
      activeTrip.endLocation,
      optimized
    );

    const isIdentical =
      currentPandals.length === optimized.length &&
      currentPandals.every((p, idx) => p.id === optimized[idx].id);

    const diff = Math.max(0, currentDist - optDist);
    // Rough estimate of minutes saved (walking/urban transit ~12 mins per km)
    const minsSaved = Math.round((diff / 1000) * 12);

    return {
      optimizedPandals: optimized,
      currentDistanceMeters: currentDist,
      optimizedDistanceMeters: optDist,
      distanceSavedMeters: diff,
      estimatedMinutesSaved: minsSaved,
      isAlreadyOptimal: isIdentical || diff < 100,
    };
  }, [activeTrip, currentPandals]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyOptimization(optimizedPandals.map((p) => p.id));
    playKanshorBell(0.9);
    playDhakHit('dha', 0.85);

    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#D97706', '#DC2626', '#FDE68A', '#10B981'],
    });

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="route-optimization-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
    >
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all ${
          isDarkMode
            ? 'bg-[#1E141B] border-amber-500/30 text-white'
            : 'bg-white border-amber-600/30 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 bg-gradient-to-r from-amber-600/10 via-red-600/10 to-amber-600/10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="route-optimization-modal-title"
                className="font-display font-black text-h3 leading-tight"
              >
                Geographic Route Optimization
              </h3>
              <p className="font-bengali text-micro text-amber-700 dark:text-amber-300 font-semibold">
                ভৌগোলিক নৈকট্য ভিত্তিক সবচেয়ে কার্যকর পরিক্রমা ক্রম
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close route optimization dialog"
            className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Key Metric Highlights */}
          {isAlreadyOptimal ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-small">Your Current Visiting Order is Already Optimal!</p>
                <p className="text-micro opacity-90 mt-0.5">
                  The sequence currently follows the shortest geographical travel path without redundant zig-zag backtracking.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                  Distance Saved
                </span>
                <span className="font-display font-black text-h2 text-stone-900 dark:text-white tabular-nums">
                  ~{formatDistance(distanceSavedMeters)}
                </span>
                <span className="text-[10px] text-stone-500 block mt-0.5">
                  Less walking & backtracking
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 block">
                  Time Saved
                </span>
                <span className="font-display font-black text-h2 text-emerald-700 dark:text-emerald-400 tabular-nums">
                  ~{estimatedMinutesSaved} mins
                </span>
                <span className="text-[10px] text-stone-500 block mt-0.5">
                  Faster pandal hops
                </span>
              </div>
            </div>
          )}

          {/* Explanation Banner */}
          <div className="text-small text-stone-600 dark:text-stone-300 p-3 rounded-xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 flex items-start gap-2">
            <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-micro leading-relaxed">
              <p>
                <strong>Proximity-First Routing:</strong> Reorders your stops to minimize travel detours starting from{' '}
                <strong className="text-stone-900 dark:text-white">{activeTrip.startLocation.name}</strong> and ending at{' '}
                <strong className="text-stone-900 dark:text-white">{activeTrip.endLocation.name}</strong>.
              </p>
            </div>
          </div>

          {/* Suggested Sequence List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-small text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                <Route className="w-4 h-4 text-red-600" />
                <span>Suggested Visiting Sequence ({optimizedPandals.length} Stops)</span>
              </h4>
              <span className="text-micro text-stone-400">Optimal Proximity Flow</span>
            </div>

            <div className="space-y-2">
              {/* Start Location */}
              <div className="p-2.5 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 flex items-center gap-2.5 text-micro bg-stone-50/50 dark:bg-stone-900/30">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  S
                </div>
                <div className="flex-1">
                  <p className="font-bold text-stone-700 dark:text-stone-300">Start: {activeTrip.startLocation.name}</p>
                </div>
              </div>

              {/* Sequential Pandals */}
              {optimizedPandals.map((pandal, idx) => {
                const originalIndex = currentPandals.findIndex((p) => p.id === pandal.id);
                const orderChanged = originalIndex !== idx;

                return (
                  <div
                    key={pandal.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                      orderChanged
                        ? 'bg-amber-500/10 border-amber-500/40 text-stone-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-stone-900/40 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-[#991B1B] text-white font-display font-black text-small flex items-center justify-center shrink-0">
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <h5 className="font-bold text-small truncate leading-tight">
                          {pandal.name}
                        </h5>
                        <p className="font-bengali text-micro text-[#DC2626] font-semibold truncate">
                          {pandal.bengaliName} • {pandal.area}
                        </p>
                      </div>
                    </div>

                    {orderChanged && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 shrink-0">
                        Moved from #{originalIndex + 1}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* End Location */}
              <div className="p-2.5 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 flex items-center gap-2.5 text-micro bg-stone-50/50 dark:bg-stone-900/30">
                <div className="w-6 h-6 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0">
                  E
                </div>
                <div className="flex-1">
                  <p className="font-bold text-stone-700 dark:text-stone-300">End: {activeTrip.endLocation.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800 text-btn font-bold transition-colors"
          >
            {isAlreadyOptimal ? 'Close' : 'Keep Current Order'}
          </button>

          {!isAlreadyOptimal && (
            <button
              onClick={handleApply}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 via-[#DC2626] to-[#991B1B] text-white text-btn font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply Optimized Route</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
