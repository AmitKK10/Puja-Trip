import React, { useState } from 'react';
import { CityId, ZoneId, Pandal, UserProfile, UserPreferences } from '../../types';
import { createCommunityPandal, CreatePandalInput } from '../../services/communityPandalService';
import { DEFAULT_DURGA_DEVI_IMAGE } from '../../utils/imageFallback';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  X,
  MapPin,
  Sparkles,
  Upload,
  Image as ImageIcon,
  Check,
  AlertTriangle,
  Tag,
  Plus,
  Compass,
} from 'lucide-react';

interface CreatePandalModalProps {
  activeCity: CityId;
  currentUser: UserProfile;
  onPandalCreated: (newPandal: Pandal) => void;
  onClose: () => void;
  userPrefs?: UserPreferences;
}

const AVAILABLE_TAGS = [
  'Community',
  'Traditional',
  'Family Friendly',
  'Artistic Idol',
  'Eco Friendly',
  'Theme',
  'Bonedi Bari',
  'Night Illumination',
  'Chandannagar Lights',
];

export const CreatePandalModal: React.FC<CreatePandalModalProps> = ({
  activeCity,
  currentUser,
  onPandalCreated,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs?.themeMode === 'mahasaptami_night';

  const [city, setCity] = useState<CityId>(activeCity);
  const [name, setName] = useState('');
  const [bengaliName, setBengaliName] = useState('');
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('');
  const [zone, setZone] = useState<ZoneId>(
    activeCity === 'contai' ? 'contai_central' : 'north_kolkata'
  );
  const [themeConcept, setThemeConcept] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['Community', 'Traditional']);
  
  // Image selection state
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useDefaultDurgaImage, setUseDefaultDurgaImage] = useState(true);
  const [imageFileName, setImageFileName] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Available zones based on city
  const zones: Array<{ id: ZoneId; label: string; bengali: string }> =
    city === 'kolkata'
      ? [
          { id: 'north_kolkata', label: 'North Kolkata', bengali: 'উত্তর কলকাতা' },
          { id: 'south_kolkata', label: 'South Kolkata', bengali: 'দক্ষিণ কলকাতা' },
          { id: 'central_kolkata', label: 'Central Kolkata', bengali: 'মধ্য কলকাতা' },
          { id: 'saltlake_east', label: 'Salt Lake & East', bengali: 'সল্টলেক ও পূর্ব' },
          { id: 'behala_west', label: 'Behala & South-West', bengali: 'বেহালা ও পশ্চিম' },
        ]
      : [
          { id: 'contai_central', label: 'Contai Central Town', bengali: 'কাঁথি কেন্দ্রীয় শহর' },
          { id: 'contai_coastal', label: 'Contai Coastal Belt', bengali: 'কাঁথি উপকূলবর্তী অঞ্চল' },
          { id: 'contai_heritage', label: 'Contai Heritage & Suburbs', bengali: 'কাঁথি ঐতিহ্য ও শহরতলি' },
        ];

  // Handle local file selection from device
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 8MB)
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size is too large (max 8MB). Please choose a smaller photo.');
      return;
    }

    setErrorMessage(null);
    setImageFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setImagePreview(dataUrl);
        setUseDefaultDurgaImage(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMessage('Please enter the pandal name (মণ্ডপের নাম দিন).');
      return;
    }

    if (!address.trim()) {
      setErrorMessage('Please enter the location/address (ঠিকানা বা অবস্থান দিন).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Determine final image URL: uploaded preview or default Durga Devi image
      const finalImage = !useDefaultDurgaImage && imagePreview ? imagePreview : DEFAULT_DURGA_DEVI_IMAGE;

      const input: CreatePandalInput = {
        name: name.trim(),
        bengaliName: bengaliName.trim() || undefined,
        address: address.trim(),
        area: area.trim() || (city === 'contai' ? 'Contai Central' : 'Neighborhood Locality'),
        city,
        zone,
        themeConcept: themeConcept.trim() || undefined,
        description: description.trim() || undefined,
        tags: selectedTags,
        imageUrl: finalImage,
      };

      const newPandal = await createCommunityPandal(input, currentUser);

      playKanshorBell(0.8);
      playDhakHit('dha', 0.9);
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#DC2626', '#FEF08A', '#F59E0B'],
      });

      onPandalCreated(newPandal);
      onClose();
    } catch (err: any) {
      console.error('Error creating community pandal:', err);
      setErrorMessage(err?.message || 'Failed to save pandal. Please check details and try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="create-pandal-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
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
            <div className="w-10 h-10 rounded-2xl bg-[#DC2626]/10 text-[#DC2626] flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-[#DC2626]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                  Add Community Pandal
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black">
                  Community
                </span>
              </div>
              <p className="font-bengali-serif text-small text-[#DC2626] font-bold">
                নিজের পাড়ার পুজো মণ্ডপ যোগ করুন
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-small font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* City Toggle */}
          <div>
            <label className="text-micro font-bold text-stone-500 block mb-1">
              Select Region / City
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCity('kolkata');
                  setZone('north_kolkata');
                }}
                className={`py-2 px-3 rounded-xl border text-small font-bold transition-all cursor-pointer ${
                  city === 'kolkata'
                    ? 'bg-[#881337] text-[#FEF08A] border-[#881337] shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                Kolkata (কলকাতা)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCity('contai');
                  setZone('contai_central');
                }}
                className={`py-2 px-3 rounded-xl border text-small font-bold transition-all cursor-pointer ${
                  city === 'contai'
                    ? 'bg-[#881337] text-[#FEF08A] border-[#881337] shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                }`}
              >
                Contai (কাঁথি)
              </button>
            </div>
          </div>

          {/* Pandal Name Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-small font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Pandal Name (মণ্ডপের নাম) <span className="text-[#DC2626]">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Nabin Pally Sarbojanin / সুরুচি উদ্যান সমিতি"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>

            <div>
              <label className="text-small font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Bengali Script Name <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={bengaliName}
                onChange={(e) => setBengaliName(e.target.value)}
                placeholder="বাংলা নাম (যেমন: নবীন পল্লী সর্বজনীন)"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-bengali font-bold text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
              />
            </div>
          </div>

          {/* Location & Area Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-small font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Location & Address (ঠিকানা বা অবস্থান) <span className="text-[#DC2626]">*</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Kalighat Metro, Harish Chatterjee Street"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-medium text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-micro font-bold text-stone-600 dark:text-stone-400 block mb-1">
                  Neighborhood / Area
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Kalighat / Kanthi Bus Stand"
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-medium text-stone-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-micro font-bold text-stone-600 dark:text-stone-400 block mb-1">
                  Zone Classification
                </label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value as ZoneId)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-medium text-stone-900 dark:text-white cursor-pointer"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.label} ({z.bengali})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Theme & Description */}
          <div className="space-y-3">
            <div>
              <label className="text-small font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Pandal Theme / Concept <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={themeConcept}
                onChange={(e) => setThemeConcept(e.target.value)}
                placeholder="e.g. গ্রাম বাংলার ঐতিহ্য / Traditional Clay Craft"
                className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-medium text-stone-900 dark:text-white"
              />
            </div>

            <div>
              <label className="text-small font-bold text-stone-700 dark:text-stone-300 block mb-1">
                Description & Highlights <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add special cultural attractions, idol specialties, or visitor tips..."
                className="w-full px-3.5 py-2 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-medium text-stone-900 dark:text-white"
              />
            </div>
          </div>

          {/* Image Upload & Fallback Section */}
          <div className="p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-small font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#DC2626]" />
                  <span>Pandal Photo</span>
                </span>
                <p className="text-micro text-stone-500 dark:text-stone-400">
                  Select a photo or automatically use the official Durga Devi artwork.
                </p>
              </div>

              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                Auto-Fallback Ready
              </span>
            </div>

            {/* Current Image Preview */}
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/50 shrink-0 bg-stone-900 shadow-xs relative">
                <img
                  src={!useDefaultDurgaImage && imagePreview ? imagePreview : DEFAULT_DURGA_DEVI_IMAGE}
                  alt="Pandal Preview"
                  className="w-full h-full object-cover"
                />
                {useDefaultDurgaImage && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-[#FEF08A] font-bold text-center py-0.5">
                    Durga Devi
                  </span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:border-[#DC2626] text-micro font-bold text-stone-700 dark:text-stone-200 cursor-pointer shadow-2xs transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>{imagePreview ? 'Change Selected Photo' : 'Upload From Device'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </label>

                {imagePreview && (
                  <button
                    type="button"
                    onClick={() => {
                      setImagePreview(null);
                      setImageFileName('');
                      setUseDefaultDurgaImage(true);
                    }}
                    className="block text-micro font-bold text-[#DC2626] hover:underline cursor-pointer"
                  >
                    Reset to Default Durga Devi Image
                  </button>
                )}

                <p className="text-micro text-stone-500">
                  {imageFileName ? `Selected: ${imageFileName}` : 'Default: Official Sacred Maa Durga Visual'}
                </p>
              </div>
            </div>
          </div>

          {/* Tags Multi-select */}
          <div>
            <label className="text-small font-bold text-stone-700 dark:text-stone-300 block mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Select Tags</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((t) => {
                const isSelected = selectedTags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleToggleTag(t)}
                    className={`px-2.5 py-1 rounded-xl text-micro font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#DC2626] text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-amber-400'
                    }`}
                  >
                    <span>{isSelected ? '✓ ' : '+ '}</span>
                    <span>{t}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Actions */}
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
              <Plus className="w-4 h-4 text-[#FEF08A]" />
              <span>{isSubmitting ? 'Saving Pandal...' : 'Create Pandal'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
