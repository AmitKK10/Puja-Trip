import React, { useState } from 'react';
import {
  CityId,
  Pandal,
  TripPlan,
  TripLocation,
  WalkingPreference,
  TransportPreference,
  UserPreferences,
} from '../../types';
import { DEFAULT_ANCHORS } from '../../services/pandalRecommendationService';
import { getDefaultLocationsForCity } from '../../services/tripStorageService';
import { PandalPickerModal } from './PandalPickerModal';
import {
  X,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  Footprints,
  Navigation,
  Check,
  Plus,
  Train,
  Flame,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DurgaThirdEye } from '../common/BengaliMotifs';

interface CreateTripModalProps {
  initialTrip?: Partial<TripPlan>;
  activeCity: CityId;
  allPandals: Pandal[];
  onSaveTrip: (tripData: Omit<TripPlan, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onClose: () => void;
  userPrefs: UserPreferences;
}

export const CreateTripModal: React.FC<CreateTripModalProps> = ({
  initialTrip,
  activeCity,
  allPandals,
  onSaveTrip,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';

  const defaultLocs = getDefaultLocationsForCity(activeCity);

  const [city, setCity] = useState<CityId>(initialTrip?.city || activeCity);
  const [name, setName] = useState(
    initialTrip?.name ||
      (city === 'kolkata'
        ? 'Maha Saptami Heritage Walk'
        : 'Contai Town Terracotta Safari')
  );
  const [bengaliName, setBengaliName] = useState(
    initialTrip?.bengaliName ||
      (city === 'kolkata'
        ? 'মহা সপ্তমী হেরিটেজ পরিক্রমা'
        : 'কাঁথি শহর পোড়ামাটি শিল্প সাফারি')
  );
  const [date, setDate] = useState(initialTrip?.date || '2026-10-18');
  const [startTime, setStartTime] = useState(initialTrip?.startTime || '17:00');
  const [endTime, setEndTime] = useState(initialTrip?.endTime || '22:30');

  const [startLocationId, setStartLocationId] = useState<string>(
    initialTrip?.startLocation?.id || defaultLocs.start.id || 'shyambazar-crossing'
  );
  const [endLocationId, setEndLocationId] = useState<string>(
    initialTrip?.endLocation?.id || defaultLocs.end.id || 'college-square-boipara'
  );

  const [walkingPreference, setWalkingPreference] = useState<WalkingPreference>(
    initialTrip?.walkingPreference || 'normal'
  );
  const [preferredTransport, setPreferredTransport] = useState<TransportPreference>(
    initialTrip?.preferredTransport || (city === 'kolkata' ? 'metro' : 'mixed')
  );
  const [maxWalkingDistanceMeters, setMaxWalkingDistanceMeters] = useState<
    number | null
  >(initialTrip?.maxWalkingDistanceMeters ?? 5000);

  // Selected pandal IDs
  const [selectedPandalIds, setSelectedPandalIds] = useState<string[]>(() => {
    if (initialTrip?.selectedPandalIds && initialTrip.selectedPandalIds.length > 0) {
      return initialTrip.selectedPandalIds;
    }
    // Default initial selection for active city
    if (city === 'contai') {
      return [
        'contai-central-bus-stand',
        'contai-sabuj-sangha',
        'contai-highschool-math',
      ];
    }
    return [
      'shobhabazar-rajbari',
      'bagbazar-sarbojanin',
      'tala-park-prattyay',
      'college-square',
    ];
  });

  const [showPandalPicker, setShowPandalPicker] = useState(false);

  // Filter anchors by current city
  const cityAnchors = DEFAULT_ANCHORS.filter((a) => a.city === city);

  const handleCityChange = (newCity: CityId) => {
    setCity(newCity);
    const newLocs = getDefaultLocationsForCity(newCity);
    setStartLocationId(newLocs.start.id || '');
    setEndLocationId(newLocs.end.id || '');
    if (newCity === 'contai') {
      setName('Contai Coastal & Terracotta Safari');
      setBengaliName('কাঁথি কোস্টাল ও পোড়ামাটি শিল্প সাফারি');
      setSelectedPandalIds([
        'contai-central-bus-stand',
        'contai-sabuj-sangha',
        'contai-highschool-math',
      ]);
      setPreferredTransport('mixed');
    } else {
      setName('Maha Saptami Heritage Walk');
      setBengaliName('মহা সপ্তমী হেরিটেজ পরিক্রমা');
      setSelectedPandalIds([
        'shobhabazar-rajbari',
        'bagbazar-sarbojanin',
        'tala-park-prattyay',
        'college-square',
      ]);
      setPreferredTransport('metro');
    }
  };

  const handleTogglePandal = (pandalId: string) => {
    setSelectedPandalIds((prev) =>
      prev.includes(pandalId)
        ? prev.filter((id) => id !== pandalId)
        : [...prev, pandalId]
    );
  };

  const handleSelectAllMustVisit = () => {
    const mustVisit = allPandals
      .filter((p) => p.city === city && p.recommendationLevel === 'Must Visit')
      .map((p) => p.id);
    const combined = Array.from(new Set([...selectedPandalIds, ...mustVisit]));
    setSelectedPandalIds(combined);
  };

  const handleSelectTop5 = () => {
    const top5 = allPandals
      .filter((p) => p.city === city)
      .sort((a, b) => b.overallQualityScore - a.overallQualityScore)
      .slice(0, 5)
      .map((p) => p.id);
    setSelectedPandalIds(top5);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Resolve start location
    const startAnchor =
      cityAnchors.find((a) => a.id === startLocationId) || cityAnchors[0];
    const startLocation: TripLocation = {
      id: startAnchor.id,
      name: startAnchor.name,
      bengaliName: startAnchor.bengaliName,
      city,
      latitude: startAnchor.latitude,
      longitude: startAnchor.longitude,
      description: startAnchor.description,
    };

    // Resolve end location
    const endAnchor =
      cityAnchors.find((a) => a.id === endLocationId) ||
      cityAnchors[cityAnchors.length - 1] ||
      startAnchor;
    const endLocation: TripLocation = {
      id: endAnchor.id,
      name: endAnchor.name,
      bengaliName: endAnchor.bengaliName,
      city,
      latitude: endAnchor.latitude,
      longitude: endAnchor.longitude,
      description: endAnchor.description,
    };

    onSaveTrip({
      name: name.trim() || 'My Durga Puja Trip',
      bengaliName: bengaliName.trim() || undefined,
      city,
      date,
      startTime,
      endTime,
      startLocation,
      endLocation,
      walkingPreference,
      preferredTransport,
      maxWalkingDistanceMeters,
      selectedPandalIds,
      isCustomTrip: true,
      notes: `${city === 'kolkata' ? 'Kolkata' : 'Contai'} custom trip planned for ${date}.`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fadeIn">
      <div
        className={`w-full max-w-xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/40 text-white'
            : 'bg-[#FFFDF9] border-[#D97706]/40 text-stone-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/60 dark:bg-stone-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[#DC2626]/10 text-[#DC2626]">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-display font-black text-h3 sm:text-h2 text-[#881337] dark:text-[#FEF08A]">
                {initialTrip?.id ? 'Edit Puja Trip Plan' : 'Create New Puja Trip'}
              </h3>
              <p className="text-small text-stone-500 font-bengali">
                নতুন শারদ পরিক্রমা সূচি তৈরি করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* City Selection */}
          <div>
            <label className="text-micro font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
              Select City • শহর নির্বাচন
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleCityChange('kolkata')}
                className={`py-2.5 px-3 rounded-2xl border font-display font-bold text-small flex items-center justify-center gap-2 transition-all ${
                  city === 'kolkata'
                    ? 'bg-[#991B1B] text-white border-[#991B1B] shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                <span>Kolkata (কলকাতা)</span>
              </button>
              <button
                type="button"
                onClick={() => handleCityChange('contai')}
                className={`py-2.5 px-3 rounded-2xl border font-display font-bold text-small flex items-center justify-center gap-2 transition-all ${
                  city === 'contai'
                    ? 'bg-[#991B1B] text-white border-[#991B1B] shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                <span>Contai (কাঁথি)</span>
              </button>
            </div>
          </div>

          {/* Trip Name & Bengali Name */}
          <div className="space-y-2">
            <div>
              <label className="text-micro font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Trip Name (English)
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maha Saptami Heritage Walk"
                className="w-full px-3.5 py-2 rounded-xl text-small border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>

            <div>
              <label className="text-micro font-bold uppercase tracking-wider text-stone-500 block mb-1">
                Bengali Title (বাংলা নাম)
              </label>
              <input
                type="text"
                value={bengaliName}
                onChange={(e) => setBengaliName(e.target.value)}
                placeholder="e.g. মহা সপ্তমী হেরিটেজ পরিক্রমা"
                className="w-full px-3.5 py-2 rounded-xl text-small font-bengali-serif border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>
          </div>

          {/* Date, Start Time, End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div>
              <label className="text-micro font-bold uppercase tracking-wider text-stone-500 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Date</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-small border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>

            <div>
              <label className="text-micro font-bold uppercase tracking-wider text-stone-500 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>Start Time</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-small border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>

            <div>
              <label className="text-micro font-bold uppercase tracking-wider text-stone-500 block mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#DC2626]" />
                <span>End Time</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-small border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>
          </div>

          {/* Starting & Ending Locations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-micro font-bold uppercase tracking-wider text-stone-500 block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>Starting Location (যাত্রা সূচনা)</span>
              </label>
              <select
                value={startLocationId}
                onChange={(e) => setStartLocationId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-small border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              >
                {cityAnchors.map((anchor) => (
                  <option key={anchor.id} value={anchor.id}>
                    {anchor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-micro font-bold uppercase tracking-wider text-stone-500 block mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-green-500" />
                <span>Ending Location (যাত্রা সমাপ্তি)</span>
              </label>
              <select
                value={endLocationId}
                onChange={(e) => setEndLocationId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-small border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              >
                {cityAnchors.map((anchor) => (
                  <option key={anchor.id} value={anchor.id}>
                    {anchor.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Walking Preference */}
          <div>
            <label className="text-micro font-bold uppercase tracking-wider text-stone-500 block mb-1.5 flex items-center gap-1">
              <Footprints className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Walking Preference • হাঁটার ইচ্ছা</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'low', label: 'Low (স্বল্প)', sub: 'Min. walking, auto/transit' },
                { id: 'normal', label: 'Normal (স্বাভাবিক)', sub: 'Balanced city pace' },
                { id: 'high', label: 'High (বেশি)', sub: 'Enthusiastic walker' },
              ].map((wp) => (
                <button
                  type="button"
                  key={wp.id}
                  onClick={() => setWalkingPreference(wp.id as WalkingPreference)}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    walkingPreference === wp.id
                      ? 'bg-[#991B1B] text-white border-[#991B1B] shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span className="font-display font-bold text-small block">{wp.label}</span>
                  <span
                    className={`text-micro block mt-0.5 ${
                      walkingPreference === wp.id ? 'text-amber-200' : 'text-stone-500'
                    }`}
                  >
                    {wp.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Preferred Transport */}
          <div>
            <label className="text-micro font-bold uppercase tracking-wider text-stone-500 block mb-1.5 flex items-center gap-1">
              <Navigation className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Preferred Transport • পছন্দের যানবাহন</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { id: 'walking', label: 'Walking', icon: '🚶' },
                { id: 'metro', label: 'Metro', icon: '🚇' },
                { id: 'bus', label: 'Bus', icon: '🚌' },
                { id: 'mixed', label: 'Mixed / Auto', icon: '🛺' },
              ].map((tp) => (
                <button
                  type="button"
                  key={tp.id}
                  onClick={() => setPreferredTransport(tp.id as TransportPreference)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    preferredTransport === tp.id
                      ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span className="text-lg block">{tp.icon}</span>
                  <span className="font-bold text-micro block mt-0.5">{tp.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Max Walking Distance Cap */}
          <div>
            <label className="text-micro font-bold uppercase tracking-wider text-stone-500 block mb-1.5">
              Max Walking Distance Limit (Optional)
            </label>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-micro">
              {[
                { val: null, label: 'No Limit' },
                { val: 2500, label: 'Max 2.5 km' },
                { val: 4000, label: 'Max 4 km' },
                { val: 6000, label: 'Max 6 km' },
                { val: 8000, label: 'Max 8 km' },
              ].map((dist) => (
                <button
                  type="button"
                  key={dist.label}
                  onClick={() => setMaxWalkingDistanceMeters(dist.val)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    maxWalkingDistanceMeters === dist.val
                      ? 'bg-[#991B1B] text-white'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {dist.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pandals Selection Section */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-micro font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300 block">
                  Selected Pandals ({selectedPandalIds.length})
                </span>
                <span className="text-small text-stone-600 dark:text-stone-300 font-medium">
                  {selectedPandalIds.length === 0
                    ? 'No pandals selected yet'
                    : `${selectedPandalIds.length} pandals included in itinerary`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowPandalPicker(true)}
                className="px-3 py-1.5 rounded-xl bg-[#991B1B] hover:bg-[#DC2626] text-white text-small font-bold shadow-sm transition-all flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                <span>Choose Pandals</span>
              </button>
            </div>

            {/* Quick selectors */}
            <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
              <button
                type="button"
                onClick={handleSelectAllMustVisit}
                className="text-micro font-bold text-[#881337] dark:text-[#FEF08A] hover:underline flex items-center gap-0.5"
              >
                <Flame className="w-3 h-3 text-red-500" />
                <span>+ All Must-Visit</span>
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={handleSelectTop5}
                className="text-micro font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-0.5"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>+ Top 5 Worth</span>
              </button>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="pt-3 flex gap-2.5">
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] hover:from-[#881337] hover:to-[#B91C1C] text-white font-display font-bold text-btn shadow-lg transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generate Smart Itinerary (সূচি তৈরি করুন)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold text-btn hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      {/* Pandal Picker Sub-Modal */}
      {showPandalPicker && (
        <PandalPickerModal
          city={city}
          allPandals={allPandals}
          selectedPandalIds={selectedPandalIds}
          onTogglePandal={handleTogglePandal}
          onSelectAllMustVisit={handleSelectAllMustVisit}
          onSelectTop5={handleSelectTop5}
          onClearAll={() => setSelectedPandalIds([])}
          onClose={() => setShowPandalPicker(false)}
          userPrefs={userPrefs}
        />
      )}
    </div>
  );
};
