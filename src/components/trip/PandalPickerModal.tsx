import React, { useState, useMemo } from 'react';
import {
  CityId,
  Pandal,
  RecommendationLevel,
  UserPreferences,
} from '../../types';
import {
  Search,
  X,
  Plus,
  Check,
  Sparkles,
  Filter,
  Flame,
  CheckCircle2,
  Trash2,
  Clock,
  Navigation,
} from 'lucide-react';
import { DurgaThirdEye } from '../common/BengaliMotifs';

interface PandalPickerModalProps {
  city: CityId;
  allPandals: Pandal[];
  selectedPandalIds: string[];
  onTogglePandal: (pandalId: string) => void;
  onSelectAllMustVisit: () => void;
  onSelectTop5: () => void;
  onClearAll: () => void;
  onClose: () => void;
  userPrefs: UserPreferences;
}

export const PandalPickerModal: React.FC<PandalPickerModalProps> = ({
  city,
  allPandals,
  selectedPandalIds,
  onTogglePandal,
  onSelectAllMustVisit,
  onSelectTop5,
  onClearAll,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const cityPandals = useMemo(
    () => allPandals.filter((p) => p.city === city),
    [allPandals, city]
  );

  const filteredPandals = useMemo(() => {
    return cityPandals.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.bengaliName.includes(searchQuery) ||
        p.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.zoneLabel.toLowerCase().includes(searchQuery.toLowerCase());

      const matchLevel =
        selectedLevel === 'all' || p.recommendationLevel === selectedLevel;

      const matchCategory =
        selectedCategory === 'all' || p.category === selectedCategory;

      return matchSearch && matchLevel && matchCategory;
    });
  }, [cityPandals, searchQuery, selectedLevel, selectedCategory]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div
        className={`w-full max-w-xl max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/40 text-white'
            : 'bg-[#FFFDF9] border-[#D97706]/40 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/50 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#DC2626]/10 text-[#DC2626]">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="font-display font-black text-h3 sm:text-h2 text-[#881337] dark:text-[#FEF08A]">
                Select Pandals for Trip
              </h3>
            </div>
            <p className="text-small text-stone-500 font-bengali mt-0.5">
              {selectedPandalIds.length} মণ্ডপ নির্বাচিত ({city === 'kolkata' ? 'কলকাতা' : 'কাঁথি'})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Batch Actions */}
        <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap shrink-0 bg-amber-500/5">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onSelectAllMustVisit}
              className="px-2.5 py-1 rounded-xl bg-[#991B1B] hover:bg-[#DC2626] text-white text-micro font-bold shadow-sm transition-all flex items-center gap-1"
            >
              <Flame className="w-3 h-3 text-amber-300" />
              <span>+ Add All Must-Visit</span>
            </button>
            <button
              onClick={onSelectTop5}
              className="px-2.5 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-micro font-bold shadow-sm transition-all flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-yellow-200" />
              <span>+ Add Top 5 Worth</span>
            </button>
          </div>

          {selectedPandalIds.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-micro font-bold text-red-600 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Selection</span>
            </button>
          )}
        </div>

        {/* Search & Level Filters */}
        <div className="p-3.5 space-y-2.5 border-b border-stone-200 dark:border-stone-800 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by pandal name, neighborhood, or theme..."
              className="w-full pl-9 pr-4 py-2 rounded-xl text-small border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            />
          </div>

          {/* Level Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-micro">
            {['all', 'Must Visit', 'Highly Recommended', 'Good', 'Optional'].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-all ${
                  selectedLevel === lvl
                    ? 'bg-[#991B1B] text-white shadow-sm'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                }`}
              >
                {lvl === 'all' ? 'All Recommendations' : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Pandals List */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-2">
          {filteredPandals.length === 0 ? (
            <div className="py-8 text-center text-stone-500 text-small">
              No pandals match your search criteria.
            </div>
          ) : (
            filteredPandals.map((pandal) => {
              const isSelected = selectedPandalIds.includes(pandal.id);
              const worthScore = Math.round(pandal.overallQualityScore * 10);

              return (
                <div
                  key={pandal.id}
                  onClick={() => onTogglePandal(pandal.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-500/10 border-[#F59E0B] shadow-sm'
                      : isDarkMode
                      ? 'bg-[#281B23]/70 border-stone-800 hover:border-stone-700'
                      : 'bg-white border-stone-200 hover:border-amber-300'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0">
                    <img
                      src={pandal.heroImage}
                      alt={pandal.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-display font-bold text-h4 leading-tight truncate">
                        {pandal.name}
                      </h4>
                      <span className="text-micro font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 tabular-nums">
                        ⭐ {worthScore} Worth
                      </span>
                    </div>

                    <p className="font-bengali-serif text-small text-[#DC2626] font-bold truncate mt-0.5">
                      {pandal.bengaliName}
                    </p>

                    <div className="flex items-center gap-2 text-micro text-stone-500 mt-1 tabular-nums">
                      <span>{pandal.recommendationLevel}</span>
                      <span>•</span>
                      <span>{pandal.estimatedVisitDuration}m darshan</span>
                      <span>•</span>
                      <span>{pandal.zoneLabel}</span>
                    </div>
                  </div>

                  {/* Selection Checkbox */}
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
                      isSelected
                        ? 'bg-[#991B1B] border-[#991B1B] text-white shadow-sm'
                        : 'border-stone-300 dark:border-stone-700 text-transparent'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Done Button */}
        <div className="p-3.5 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 flex items-center justify-between gap-3 shrink-0">
          <span className="text-small font-bold text-stone-700 dark:text-stone-300 tabular-nums">
            {selectedPandalIds.length} Selected
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-[#991B1B] hover:bg-[#DC2626] text-white font-bold text-btn shadow-md transition-all"
          >
            Done Selecting
          </button>
        </div>
      </div>
    </div>
  );
};
