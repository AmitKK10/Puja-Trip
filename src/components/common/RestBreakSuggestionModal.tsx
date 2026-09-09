import React, { useState } from 'react';
import { RestOpportunity, CityId, UserPreferences } from '../../types';
import { findNearbyRestOpportunities, recordRestBreakTaken } from '../../services/walkingEnergyService';
import { formatDistance } from '../../utils/geoUtils';
import { playKanshorBell } from '../../utils/audioSynth';
import {
  Coffee,
  X,
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  Sparkles,
  Info,
} from 'lucide-react';

interface RestBreakSuggestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat?: number;
  userLng?: number;
  activeCity: CityId;
  userPrefs: UserPreferences;
  tripId?: string;
  onNavigateToRestSpot?: (lat: number, lng: number) => void;
  onBreakAccepted?: (minutes: number) => void;
}

export const RestBreakSuggestionModal: React.FC<RestBreakSuggestionModalProps> = ({
  isOpen,
  onClose,
  userLat = 22.5726,
  userLng = 88.3639,
  activeCity,
  userPrefs,
  tripId,
  onNavigateToRestSpot,
  onBreakAccepted,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [selectedSpot, setSelectedSpot] = useState<RestOpportunity | null>(null);
  const [isBreakConfirmed, setIsBreakConfirmed] = useState(false);

  const opportunities = React.useMemo(() => {
    return findNearbyRestOpportunities(userLat, userLng, activeCity, 4);
  }, [userLat, userLng, activeCity]);

  if (!isOpen) return null;

  const handleConfirmBreak = (spot: RestOpportunity) => {
    recordRestBreakTaken(spot.suggestedDurationMinutes, tripId);
    playKanshorBell(0.6);
    setIsBreakConfirmed(true);
    if (onBreakAccepted) {
      onBreakAccepted(spot.suggestedDurationMinutes);
    }
    setTimeout(() => {
      onClose();
      setIsBreakConfirmed(false);
    }, 1200);
  };

  return (
    <div
      id="rest-break-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="rest-break-modal-container"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-3xl p-5 sm:p-6 border shadow-2xl overflow-hidden transition-all animate-scaleUp ${
          isDarkMode
            ? 'bg-[#1C1418] border-stone-700 text-white'
            : 'bg-white border-amber-200 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-600">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-h3 text-stone-900 dark:text-white">
                Rest & Refresh Opportunity
              </h3>
              <p className="font-bengali text-micro text-amber-700 dark:text-amber-300">
                চা ও জলপানের জন্য বিশ্রামস্থল
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Energy guidance note */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-small text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Recharge Your Festive Energy</p>
              <p className="text-micro opacity-90 mt-0.5">
                Taking a 15–20 min break resets fatigue, hydrates the squad, and keeps your Puja enthusiasm high for evening pandals.
              </p>
            </div>
          </div>

          {/* Nearby spots list */}
          <div className="space-y-2.5">
            <p className="text-micro font-black uppercase tracking-wider text-stone-500">
              Nearby Rest Spots & Tea Stalls
            </p>

            {opportunities.map((spot) => {
              const isSelected = selectedSpot?.id === spot.id;
              return (
                <div
                  key={spot.id}
                  onClick={() => setSelectedSpot(spot)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/15 shadow-sm'
                      : isDarkMode
                      ? 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                      : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-micro font-bold px-2 py-0.5 rounded-md bg-amber-600 text-white">
                          {spot.categoryLabel}
                        </span>
                        <span className="text-micro font-semibold text-stone-500">
                          {formatDistance(spot.distanceMeters)} (~{spot.walkingMinutes}m walk)
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-h4 mt-1">
                        {spot.name}
                      </h4>
                      {spot.bengaliName && (
                        <p className="font-bengali text-micro text-amber-700 dark:text-amber-300">
                          {spot.bengaliName}
                        </p>
                      )}
                      <p className="text-micro text-stone-600 dark:text-stone-300 mt-1">
                        {spot.reason}
                      </p>
                      {spot.landmark && (
                        <p className="text-micro text-stone-400 mt-0.5">
                          Landmark: {spot.landmark}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-block px-2 py-1 rounded-xl bg-white/80 dark:bg-black/40 text-micro font-bold border border-stone-200 dark:border-stone-700">
                        ⏱️ ~{spot.suggestedDurationMinutes}m
                      </span>
                    </div>
                  </div>

                  {/* Impact on Itinerary Preview */}
                  <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-stone-800 flex items-center justify-between text-micro">
                    <span className="text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>Itinerary Impact: +{spot.itineraryDelayMinutes}m buffer</span>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onNavigateToRestSpot && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToRestSpot(spot.latitude, spot.longitude);
                            onClose();
                          }}
                          className="px-2 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 text-micro font-bold hover:opacity-80 flex items-center gap-1"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Map</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmBreak(spot);
                        }}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-micro shadow-xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Take Break Here</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Non-medical estimate disclaimer */}
          <div className="pt-2 flex items-center gap-1.5 text-[11px] text-stone-400 border-t border-stone-200 dark:border-stone-800">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              Rest & energy suggestions are algorithmic approximations to assist trip comfort, not medical advice.
            </span>
          </div>
        </div>

        {/* Footer Confirmation */}
        {isBreakConfirmed && (
          <div className="mt-3 p-3 rounded-2xl bg-emerald-500 text-white font-bold text-small text-center flex items-center justify-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4" />
            <span>Rest break recorded! Continuous walking counter reset. Enjoy your tea! ☕</span>
          </div>
        )}
      </div>
    </div>
  );
};
