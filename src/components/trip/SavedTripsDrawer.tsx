import React from 'react';
import {
  CityId,
  TripPlan,
  UserPreferences,
} from '../../types';
import {
  X,
  Plus,
  Copy,
  Trash2,
  Edit,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  Footprints,
  Navigation,
  CheckCircle2,
} from 'lucide-react';
import { DurgaThirdEye } from '../common/BengaliMotifs';

interface SavedTripsDrawerProps {
  activeCity: CityId;
  trips: TripPlan[];
  activeTripId: string;
  onSelectTrip: (trip: TripPlan) => void;
  onOpenCreateTrip: () => void;
  onOpenEditTrip: (trip: TripPlan) => void;
  onDuplicateTrip: (tripId: string) => void;
  onDeleteTrip: (tripId: string) => void;
  onClose: () => void;
  userPrefs: UserPreferences;
}

export const SavedTripsDrawer: React.FC<SavedTripsDrawerProps> = ({
  activeCity,
  trips,
  activeTripId,
  onSelectTrip,
  onOpenCreateTrip,
  onOpenEditTrip,
  onDuplicateTrip,
  onDeleteTrip,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';

  const cityTrips = trips.filter((t) => t.city === activeCity);
  const otherCityTrips = trips.filter((t) => t.city !== activeCity);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div
        className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/40 text-white'
            : 'bg-[#FFFDF9] border-[#D97706]/40 text-stone-900'
        }`}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/60 dark:bg-stone-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#DC2626]/10 text-[#DC2626]">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-black text-h3 sm:text-h2 text-[#881337] dark:text-[#FEF08A]">
                My Saved Puja Trips
              </h3>
              <p className="text-small text-stone-500 font-bengali">
                সংরক্ষিত শারদ পরিক্রমা তালিকা ({activeCity === 'kolkata' ? 'কলকাতা' : 'কাঁথি'})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenCreateTrip}
              className="px-3 py-1.5 rounded-xl bg-[#991B1B] hover:bg-[#DC2626] text-white text-small font-bold shadow-sm transition-all flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              <span>New Trip</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Trips List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cityTrips.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-stone-500 text-small">
                No saved trips for {activeCity === 'kolkata' ? 'Kolkata' : 'Contai'} yet.
              </p>
              <button
                onClick={onOpenCreateTrip}
                className="px-4 py-2 rounded-xl bg-[#991B1B] text-white font-bold text-small shadow-md"
              >
                Create Your First Trip
              </button>
            </div>
          ) : (
            cityTrips.map((trip) => {
              const isActive = trip.id === activeTripId;

              return (
                <div
                  key={trip.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-amber-500/10 border-[#F59E0B] shadow-md ring-2 ring-[#F59E0B]/30'
                      : isDarkMode
                      ? 'bg-[#281B23] border-stone-800 hover:border-stone-700'
                      : 'bg-white border-stone-200 hover:border-amber-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex-1 min-w-0" onClick={() => onSelectTrip(trip)}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display font-bold text-h4 sm:text-h3 leading-tight cursor-pointer hover:text-[#DC2626]">
                          {trip.name}
                        </h4>
                        {isActive && (
                          <span className="text-micro font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                            Active Itinerary
                          </span>
                        )}
                        {!trip.isCustomTrip && (
                          <span className="text-micro font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                            Curated Demo
                          </span>
                        )}
                      </div>

                      {trip.bengaliName && (
                        <p className="font-bengali-serif text-small text-[#DC2626] dark:text-[#FEF08A] font-bold mt-0.5">
                          {trip.bengaliName}
                        </p>
                      )}

                      {/* Info Chips */}
                      <div className="flex items-center gap-3 text-micro text-stone-500 dark:text-stone-400 mt-2 flex-wrap tabular-nums font-semibold">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#DC2626]" />
                          <span>{trip.date}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#DC2626]" />
                          <span>
                            {trip.startTime} - {trip.endTime}
                          </span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <strong className="text-stone-800 dark:text-stone-200">
                            {trip.selectedPandalIds.length} Pandals
                          </strong>
                        </span>
                      </div>

                      {/* Start -> End info */}
                      <div className="mt-2 text-micro text-stone-600 dark:text-stone-300 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">{trip.startLocation.name}</span>
                        <ArrowRight className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{trip.endLocation.name}</span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => onOpenEditTrip(trip)}
                        className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                        title="Edit Trip Parameters"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDuplicateTrip(trip.id)}
                        className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                        title="Duplicate Trip"
                      >
                        <Copy className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to delete "${trip.name}"?`
                            )
                          ) {
                            onDeleteTrip(trip.id);
                          }
                        }}
                        className="p-1.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-500"
                        title="Delete Trip"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Load/Activate Button */}
                  {!isActive && (
                    <div className="mt-3 pt-2 border-t border-stone-200/60 dark:border-stone-800 flex justify-end">
                      <button
                        onClick={() => onSelectTrip(trip)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#991B1B] hover:bg-[#DC2626] text-white text-small font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <span>Load Itinerary</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
