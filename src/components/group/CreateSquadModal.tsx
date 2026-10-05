import React, { useState, useMemo } from 'react';
import {
  CityId,
  Pandal,
  UserProfile,
  UserPreferences,
  SharedTripGroup,
  TripPlan,
  TransportPreference,
} from '../../types';
import { createSharedTripGroup } from '../../services/friendGroupService';
import { getSavedTrips } from '../../services/tripStorageService';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  X,
  Users,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Compass,
  Check,
  Plus,
  Train,
  CheckCircle2,
  Crown,
} from 'lucide-react';

interface CreateSquadModalProps {
  currentUser: UserProfile;
  activeCity: CityId;
  pandals: Pandal[];
  onSquadCreated: (group: SharedTripGroup) => void;
  onClose: () => void;
  userPrefs?: UserPreferences;
}

export const CreateSquadModal: React.FC<CreateSquadModalProps> = ({
  currentUser,
  activeCity,
  pandals,
  onSquadCreated,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs?.themeMode === 'mahasaptami_night';

  // Form states
  const [squadName, setSquadName] = useState(
    activeCity === 'kolkata' ? 'Kolkata Maha Saptami Hoppers' : 'Contai Sharad Anjali Squad'
  );
  const [bengaliName, setBengaliName] = useState(
    activeCity === 'kolkata' ? 'কলকাতা শারদ পরিক্রমা দল' : 'কাঁথি শারদ অঞ্জলি স্কোয়াড'
  );
  const [city, setCity] = useState<CityId>(activeCity);
  const [transport, setTransport] = useState<TransportPreference>('metro');
  const [date, setDate] = useState('2026-10-18'); // Maha Saptami 2026
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('23:00');
  const [tripSourceMode, setTripSourceMode] = useState<'saved' | 'curated'>('saved');
  const [selectedSavedTripId, setSelectedSavedTripId] = useState<string>('');
  const [selectedPandalIds, setSelectedPandalIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Available saved trips for current city
  const savedTrips = useMemo(() => {
    return getSavedTrips().filter((t) => t.city === city);
  }, [city]);

  // Top must-visit pandals for quick selection
  const cityPandals = useMemo(() => {
    return pandals.filter((p) => p.city === city);
  }, [pandals, city]);

  // Initialize selected trip / pandals
  React.useEffect(() => {
    if (savedTrips.length > 0) {
      setSelectedSavedTripId(savedTrips[0].id);
      setSelectedPandalIds(savedTrips[0].selectedPandalIds);
    } else {
      setTripSourceMode('curated');
      const defaultIds = cityPandals.slice(0, 4).map((p) => p.id);
      setSelectedPandalIds(defaultIds);
    }
  }, [city, savedTrips, cityPandals]);

  // When user picks a saved trip
  const handleSelectSavedTrip = (tripId: string) => {
    setSelectedSavedTripId(tripId);
    const trip = savedTrips.find((t) => t.id === tripId);
    if (trip) {
      setSquadName(`${trip.name} Squad`);
      if (trip.bengaliName) setBengaliName(`${trip.bengaliName} স্কোয়াড`);
      setSelectedPandalIds(trip.selectedPandalIds);
      setTransport(trip.preferredTransport || 'metro');
      setDate(trip.date || '2026-10-18');
      setStartTime(trip.startTime || '17:00');
      setEndTime(trip.endTime || '23:00');
    }
    playKanshorBell(0.4);
  };

  // Toggle individual pandal selection
  const handleTogglePandal = (pId: string) => {
    setSelectedPandalIds((prev) =>
      prev.includes(pId) ? prev.filter((id) => id !== pId) : [...prev, pId]
    );
    playKanshorBell(0.3);
  };

  // Submit squad creation
  const handleCreateSquad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!squadName.trim()) {
      setErrorMsg('Please enter a squad name.');
      return;
    }

    if (selectedPandalIds.length === 0) {
      setErrorMsg('Please select at least one pandal for your squad route.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const tripData: Omit<TripPlan, 'id' | 'createdAt' | 'updatedAt'> = {
        name: squadName.trim(),
        bengaliName: bengaliName.trim() || undefined,
        city,
        date,
        startTime,
        endTime,
        startLocation: {
          id: `${city}-start-hub`,
          name: city === 'kolkata' ? 'Shyambazar Five-Point Crossing' : 'Central Bus Stand Contai',
          bengaliName: city === 'kolkata' ? 'শ্যামবাজার পাঁচমাথার মোড়' : 'কাঁথি সেন্ট্রাল বাস স্ট্যান্ড',
          city,
          latitude: city === 'kolkata' ? 22.6015 : 21.7788,
          longitude: city === 'kolkata' ? 88.3712 : 87.7511,
        },
        endLocation: {
          id: `${city}-end-hub`,
          name: city === 'kolkata' ? 'College Square Lake' : 'Kanthi High School Math',
          bengaliName: city === 'kolkata' ? 'কলেজ স্কোয়ার সরোবর' : 'কাঁথি হাই স্কুল মাঠ',
          city,
          latitude: city === 'kolkata' ? 22.5744 : 21.7820,
          longitude: city === 'kolkata' ? 88.3629 : 87.7470,
        },
        walkingPreference: 'normal',
        preferredTransport: transport,
        maxWalkingDistanceMeters: 4500,
        selectedPandalIds,
        isCustomTrip: true,
        notes: `Created by ${currentUser.displayName} for Durga Puja 2026 hopping.`,
      };

      const newGroup = await createSharedTripGroup(tripData, currentUser);

      playKanshorBell(0.8);
      playDhakHit('dha', 0.9);
      confetti({
        particleCount: 65,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#DC2626', '#FEF08A', '#F59E0B'],
      });

      onSquadCreated(newGroup);
      onClose();
    } catch (err: any) {
      console.error('Error creating squad:', err);
      setErrorMsg(err?.message || 'Failed to create squad. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="create-squad-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        className={`w-full max-w-lg rounded-3xl p-5 border shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-[#FFFDF9] border-[#D97706]/30 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                  Create Puja Squad
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black flex items-center gap-1">
                  <Crown className="w-2.5 h-2.5" />
                  <span>You are Admin</span>
                </span>
              </div>
              <p className="font-bengali-serif text-small text-[#DC2626] font-bold">
                নতুন পূজা স্কোয়াড তৈরি করুন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-small font-semibold">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleCreateSquad} className="space-y-4">
          {/* Squad Name Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-small font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Squad Name <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={squadName}
                onChange={(e) => setSquadName(e.target.value)}
                placeholder="e.g. North Kolkata Midnight Hoppers"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-bold focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>

            <div>
              <label className="text-small font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Bengali Squad Name <span className="text-stone-400 font-normal">(ঐচ্ছিক)</span>
              </label>
              <input
                type="text"
                value={bengaliName}
                onChange={(e) => setBengaliName(e.target.value)}
                placeholder="e.g. উত্তর কলকাতা সপ্তমী আড্ডা"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-bengali font-bold focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>
          </div>

          {/* City Selection */}
          <div>
            <label className="text-small font-bold text-stone-700 dark:text-stone-300 block mb-1.5">
              Region / City
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setCity('kolkata')}
                className={`py-2 px-3 rounded-2xl border text-small font-bold transition-all cursor-pointer ${
                  city === 'kolkata'
                    ? 'bg-[#881337] text-[#FEF08A] border-[#881337] shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                <span>Kolkata (কলকাতা)</span>
              </button>
              <button
                type="button"
                onClick={() => setCity('contai')}
                className={`py-2 px-3 rounded-2xl border text-small font-bold transition-all cursor-pointer ${
                  city === 'contai'
                    ? 'bg-[#881337] text-[#FEF08A] border-[#881337] shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                <span>Contai (কাঁথি)</span>
              </button>
            </div>
          </div>

          {/* Itinerary Source: Saved Trips vs Custom Pandals */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-small font-bold text-stone-700 dark:text-stone-300">
                Itinerary & Pandals
              </label>
              <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800 p-0.5 rounded-xl border border-stone-200 dark:border-stone-700">
                <button
                  type="button"
                  onClick={() => setTripSourceMode('saved')}
                  className={`px-2.5 py-1 rounded-lg text-micro font-bold transition-all cursor-pointer ${
                    tripSourceMode === 'saved'
                      ? 'bg-[#DC2626] text-white shadow-2xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Saved Trips ({savedTrips.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTripSourceMode('curated')}
                  className={`px-2.5 py-1 rounded-lg text-micro font-bold transition-all cursor-pointer ${
                    tripSourceMode === 'curated'
                      ? 'bg-[#DC2626] text-white shadow-2xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Select Pandals
                </button>
              </div>
            </div>

            {tripSourceMode === 'saved' && savedTrips.length > 0 ? (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {savedTrips.map((st) => {
                  const isSelected = selectedSavedTripId === st.id;
                  return (
                    <div
                      key={st.id}
                      onClick={() => handleSelectSavedTrip(st.id)}
                      className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500/50 ring-1 ring-amber-500/40'
                          : isDarkMode
                          ? 'bg-stone-800/60 border-stone-700'
                          : 'bg-white border-stone-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-display font-bold text-small truncate text-stone-900 dark:text-white">
                          {st.name}
                        </p>
                        <p className="text-micro text-stone-500">
                          {st.selectedPandalIds.length} stops • {st.preferredTransport || 'mixed'}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center text-xs font-bold">
                            ✓
                          </span>
                        ) : (
                          <span className="w-5 h-5 rounded-full border border-stone-300 dark:border-stone-600 block" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                <p className="text-micro text-stone-500 mb-1">
                  Select pandals to add to this squad itinerary ({selectedPandalIds.length} chosen):
                </p>
                {cityPandals.map((p) => {
                  const isChecked = selectedPandalIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleTogglePandal(p.id)}
                      className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-500/10 border-emerald-500/40 text-stone-900 dark:text-white'
                          : isDarkMode
                          ? 'bg-stone-800/40 border-stone-700/60 text-stone-400'
                          : 'bg-stone-50 border-stone-200 text-stone-600'
                      }`}
                    >
                      <div className="min-w-0 flex items-center gap-2">
                        <span className="text-xs">🛕</span>
                        <div className="truncate">
                          <span className="font-display font-bold text-xs truncate block">
                            {p.name}
                          </span>
                          <span className="text-[10px] opacity-75">{p.area}</span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isChecked ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600 block" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transport Preference */}
          <div>
            <label className="text-small font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Primary Squad Transport
            </label>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {[
                { id: 'metro', label: 'Metro', icon: '🚇' },
                { id: 'walking', label: 'Walk', icon: '🚶' },
                { id: 'bus', label: 'Bus', icon: '🚌' },
                { id: 'mixed', label: 'Mixed', icon: '🚖' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTransport(t.id as TransportPreference)}
                  className={`p-2 rounded-xl border text-micro font-bold transition-all cursor-pointer ${
                    transport === t.id
                      ? 'bg-[#DC2626] text-white border-[#DC2626] shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                  }`}
                >
                  <span className="text-sm block">{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-small font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 via-[#DC2626] to-[#881337] text-white text-small font-bold shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-[#FEF08A]" />
              <span>{isSubmitting ? 'Creating Squad...' : 'Create Squad & Get Code'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
