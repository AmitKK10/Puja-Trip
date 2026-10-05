import React, { useState, useMemo } from 'react';
import {
  CityId,
  Pandal,
  PandalCategory,
  RecommendationLevel,
  UserPreferences,
  AnchorLocation,
} from '../../types';
import { DurgaThirdEye, ShankhaIcon, DhakIcon } from '../common/BengaliMotifs';
import { CrowdIntensityIndicator } from '../common/CrowdIntensityIndicator';
import { PandalCrowdHeatmap } from '../common/PandalCrowdHeatmap';
import { QRCodeScannerModal } from '../discovery/QRCodeScannerModal';
import {
  DEFAULT_ANCHORS,
  getWorthwhileNearbyPandals,
} from '../../services/pandalRecommendationService';
import { handleImageError } from '../../utils/imageFallback';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Clock,
  Star,
  Bookmark,
  BookmarkCheck,
  Train,
  Headphones,
  Plus,
  Check,
  Sparkles,
  Volume2,
  Award,
  Compass,
  Timer,
  Tag,
  Info,
  QrCode,
} from 'lucide-react';

interface DiscoveryScreenProps {
  activeCity: CityId;
  pandals: Pandal[];
  favorites: string[];
  activeTripPandalIds: string[];
  visitedList?: string[];
  onToggleFavorite: (id: string) => void;
  onToggleTripPandal: (id: string) => void;
  onToggleVisited?: (id: string) => void;
  onSelectPandal: (pandal: Pandal) => void;
  userPrefs: UserPreferences;
}

export const DiscoveryScreen: React.FC<DiscoveryScreenProps> = ({
  activeCity,
  pandals,
  favorites,
  activeTripPandalIds,
  visitedList = [],
  onToggleFavorite,
  onToggleTripPandal,
  onToggleVisited,
  onSelectPandal,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const cityAnchors = useMemo(() => DEFAULT_ANCHORS.filter((a) => a.city === activeCity), [activeCity]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRecommendation, setSelectedRecommendation] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedCrowd, setSelectedCrowd] = useState<string>('all');
  const [selectedAnchorId, setSelectedAnchorId] = useState<string>('none');
  const [sortBy, setSortBy] = useState<'worth' | 'rating' | 'distance' | 'queue' | 'year'>('worth');
  const [showQRScanner, setShowQRScanner] = useState(false);

  const activeAnchor = useMemo(() => {
    return cityAnchors.find((a) => a.id === selectedAnchorId);
  }, [cityAnchors, selectedAnchorId]);

  const categories: Array<{ id: string; label: string; bengali: string }> = [
    { id: 'all', label: 'All Pandals', bengali: 'সব মণ্ডপ' },
    { id: 'theme_marvel', label: 'Theme Marvels', bengali: 'থিম সৃষ্টি' },
    { id: 'traditional_sabeki', label: 'Sabeki (Traditional)', bengali: 'সাবেকি একচালা' },
    { id: 'crowd_puller', label: 'Mega Crowd Pullers', bengali: 'বিশাল ভিড়' },
    { id: 'heritage_bonedi', label: 'Bonedi Bari (Heritage)', bengali: 'বনেদি বাড়ি' },
    { id: 'eco_friendly', label: 'Eco-Art & Clay', bengali: 'পরিবেশ-বান্ধব' },
    { id: 'chandannagar_lights', label: 'Chandannagar Lights', bengali: 'আলোকসজ্জা' },
  ];

  const popularTags = [
    'all',
    'Must Visit',
    'Artistic Idol',
    'Award Winner',
    'Theme',
    'Traditional',
    'Famous',
    'Family Friendly',
  ];

  const zones = useMemo(() => {
    if (activeCity === 'kolkata') {
      return [
        { id: 'all', label: 'All Kolkata Zones' },
        { id: 'north_kolkata', label: 'North Kolkata' },
        { id: 'south_kolkata', label: 'South Kolkata' },
        { id: 'central_kolkata', label: 'Central Kolkata' },
        { id: 'saltlake_east', label: 'Salt Lake & VIP' },
      ];
    } else {
      return [
        { id: 'all', label: 'All Contai Zones' },
        { id: 'contai_central', label: 'Contai Central Town' },
        { id: 'contai_coastal', label: 'Coastal / Junput Route' },
      ];
    }
  }, [activeCity]);

  // Compute worthwhile nearby ranking if anchor selected
  const nearbyRankingsMap = useMemo(() => {
    if (!activeAnchor) return new Map();
    const ranked = getWorthwhileNearbyPandals({
      anchorLat: activeAnchor.latitude,
      anchorLng: activeAnchor.longitude,
      anchorName: activeAnchor.name,
      pandals: pandals.filter((p) => p.city === activeCity),
      city: activeCity,
    });
    const map = new Map();
    ranked.forEach((r) => map.set(r.pandal.id, r));
    return map;
  }, [activeAnchor, pandals, activeCity]);

  // Filter logic
  const filteredPandals = useMemo(() => {
    return pandals
      .filter((p) => p.city === activeCity)
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          p.name.toLowerCase().includes(q) ||
          p.bengaliName.includes(q) ||
          p.area.toLowerCase().includes(q) ||
          p.themeConcept.toLowerCase().includes(q) ||
          p.bengaliTheme.includes(q) ||
          p.address.toLowerCase().includes(q) ||
          p.idolArtisan.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
      .filter((p) => {
        if (selectedCategory === 'all') return true;
        return p.category === selectedCategory;
      })
      .filter((p) => {
        if (selectedRecommendation === 'all') return true;
        return p.recommendationLevel === selectedRecommendation;
      })
      .filter((p) => {
        if (selectedTag === 'all') return true;
        return p.tags.includes(selectedTag);
      })
      .filter((p) => {
        if (selectedZone === 'all') return true;
        return p.zone === selectedZone;
      })
      .filter((p) => {
        if (selectedCrowd === 'all') return true;
        if (selectedCrowd === 'low') return p.crowdLevel === 'low' || p.queueWaitMinutes <= 25;
        if (selectedCrowd === 'moderate')
          return p.crowdLevel === 'moderate' || (p.queueWaitMinutes > 25 && p.queueWaitMinutes <= 45);
        if (selectedCrowd === 'high') return p.crowdLevel === 'high' || p.crowdLevel === 'peak_surge';
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'worth') {
          if (activeAnchor) {
            const rankA = nearbyRankingsMap.get(a.id)?.worthScore || 0;
            const rankB = nearbyRankingsMap.get(b.id)?.worthScore || 0;
            return rankB - rankA;
          }
          return b.overallQualityScore - a.overallQualityScore;
        }
        if (sortBy === 'rating') return b.overallQualityScore - a.overallQualityScore;
        if (sortBy === 'distance' && activeAnchor) {
          const distA = nearbyRankingsMap.get(a.id)?.straightDistanceMeters || 999999;
          const distB = nearbyRankingsMap.get(b.id)?.straightDistanceMeters || 999999;
          return distA - distB;
        }
        if (sortBy === 'queue') return a.queueWaitMinutes - b.queueWaitMinutes;
        if (sortBy === 'year') return a.yearEstablished - b.yearEstablished;
        return 0;
      });
  }, [
    pandals,
    activeCity,
    searchQuery,
    selectedCategory,
    selectedRecommendation,
    selectedTag,
    selectedZone,
    selectedCrowd,
    sortBy,
    activeAnchor,
    nearbyRankingsMap,
  ]);

  return (
    <div id="discovery-screen" className="space-y-4 pb-10 animate-fadeIn">
      {/* Search Bar & Physical QR Code Scanner Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
          <input
            id="pandal-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeCity === 'kolkata' ? 'Kolkata' : 'Contai'} pandals, themes, tags, artisans...`}
            className={`w-full pl-10 pr-10 py-3 rounded-2xl border text-sm font-medium transition-all shadow-xs focus:outline-none focus:ring-2 ${
              isDarkMode
                ? 'bg-[#281B23] border-[#F59E0B]/30 text-white placeholder-stone-400 focus:ring-[#F59E0B]'
                : 'bg-white border-stone-300 hover:border-stone-400 text-stone-900 placeholder-stone-500 focus:ring-[#DC2626]'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs bg-stone-200 dark:bg-stone-700 px-1.5 py-0.5 rounded-full text-stone-700 dark:text-stone-200 font-bold"
            >
              Clear
            </button>
          )}
        </div>

        <button
          id="btn-discovery-qr-scanner"
          onClick={() => setShowQRScanner(true)}
          className="py-3 px-3.5 rounded-2xl bg-gradient-to-r from-[#DC2626] to-[#991B1B] hover:brightness-110 active:scale-95 text-white font-bold text-btn flex items-center gap-1.5 shadow-sm transition-all shrink-0 border border-amber-400/40"
          title="Scan physical QR code at pandal gate to check in and mark visit"
        >
          <QrCode className="w-4 h-4 text-[#FEF08A]" />
          <span className="font-bold">Scan & Visit</span>
        </button>
      </div>

      {/* Pandal Gate QR Arrival Check-In Banner */}
      <div
        id="banner-pandal-arrival-qr"
        onClick={() => setShowQRScanner(true)}
        className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 cursor-pointer shadow-xs transition-all hover:scale-[1.005] active:scale-[0.99] ${
          isDarkMode
            ? 'bg-gradient-to-r from-[#281B23] via-[#3B1324] to-[#281B23] border-amber-500/30 text-white'
            : 'bg-gradient-to-r from-amber-50 via-[#FFFDF9] to-amber-50 border-amber-300 text-stone-900'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#DC2626] to-[#991B1B] text-white flex items-center justify-center shrink-0 shadow-sm">
            <QrCode className="w-5 h-5 text-amber-200" />
          </div>
          <div className="min-w-0">
            <p className="text-small font-black leading-tight text-stone-900 dark:text-white flex items-center gap-1.5">
              <span>Arrived at a Pandal? Scan Gate QR Code</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                Instant Visit
              </span>
            </p>
            <p className="text-micro text-stone-600 dark:text-stone-300 font-medium truncate">
              Scan physical QR at entrance to record your visit (শারদ দর্শন নথিভুক্ত করুন) & load crowd data
            </p>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowQRScanner(true);
          }}
          className="px-3 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white text-btn font-extrabold shrink-0 shadow-xs flex items-center gap-1"
        >
          <span>Scan</span>
          <span className="hidden xs:inline">Now</span>
        </button>
      </div>

      {/* Anchor Location / "Nearby from..." Filter Bar */}
      <div
        className={`p-2.5 px-3.5 rounded-2xl border flex items-center justify-between gap-2 shadow-xs ${
          isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/30' : 'bg-amber-50 border-amber-300/80'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <Compass className="w-4 h-4 text-[#DC2626] shrink-0" />
          <span className="text-small font-extrabold text-stone-900 dark:text-stone-100 truncate">
            Proximity Reference:
          </span>
        </div>

        <select
          value={selectedAnchorId}
          onChange={(e) => setSelectedAnchorId(e.target.value)}
          className={`px-2.5 py-1 rounded-xl border text-small font-bold focus:outline-none cursor-pointer shadow-xs ${
            isDarkMode
              ? 'bg-[#3B1324] border-[#F59E0B]/40 text-[#FEF08A]'
              : 'bg-white border-stone-300 text-stone-900'
          }`}
        >
          <option value="none">Default (Overall Rating)</option>
          {cityAnchors.map((anchor) => (
            <option key={anchor.id} value={anchor.id}>
              From {anchor.name.split('(')[0]}
            </option>
          ))}
        </select>
      </div>

      {/* Category Horizontal Filter Pills */}
      <div className="space-y-2">
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-btn whitespace-nowrap transition-all flex flex-col items-center shrink-0 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white border-amber-300/50 shadow-xs'
                    : isDarkMode
                    ? 'bg-[#281B23] border-white/10 text-stone-200 hover:bg-[#3B1324]'
                    : 'bg-white border-stone-300 text-stone-900 hover:bg-stone-50 shadow-2xs'
                }`}
              >
                <span className="font-bold">{cat.label}</span>
                <span className={`text-micro font-bengali font-bold ${isSelected ? 'text-[#FEF08A]' : 'text-stone-600 dark:text-stone-400'}`}>
                  {cat.bengali}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tags Row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-micro">
          <span className="text-stone-600 dark:text-stone-400 font-extrabold uppercase shrink-0">Tags:</span>
          {popularTags.map((tag) => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-2.5 py-1 rounded-lg border font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#991B1B] text-white border-[#DC2626] shadow-xs'
                    : isDarkMode
                    ? 'bg-stone-800 border-stone-700 text-stone-200'
                    : 'bg-white border-stone-300 text-stone-800 hover:text-stone-950 shadow-2xs'
                }`}
              >
                {tag === 'all' ? 'All Tags' : `#${tag}`}
              </button>
            );
          })}
        </div>

        {/* Secondary Zone, Recommendation & Sort Filters */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 text-small">
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-stone-700 dark:text-stone-300 text-micro font-extrabold uppercase">Rec:</span>
            <select
              value={selectedRecommendation}
              onChange={(e) => setSelectedRecommendation(e.target.value)}
              className={`px-2 py-1 rounded-lg border text-small font-bold focus:outline-none shadow-2xs ${
                isDarkMode ? 'bg-[#281B23] border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
              }`}
            >
              <option value="all">All Levels</option>
              <option value="Must Visit">Must Visit ⭐</option>
              <option value="Highly Recommended">Highly Recommended</option>
              <option value="Good">Good</option>
            </select>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-stone-700 dark:text-stone-300 text-micro font-extrabold uppercase">Zone:</span>
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className={`px-2 py-1 rounded-lg border text-small font-bold focus:outline-none shadow-2xs ${
                isDarkMode ? 'bg-[#281B23] border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
              }`}
            >
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <span className="text-stone-700 dark:text-stone-300 text-micro font-extrabold uppercase">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className={`px-2 py-1 rounded-lg border text-small font-bold focus:outline-none shadow-2xs ${
                isDarkMode ? 'bg-[#281B23] border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
              }`}
            >
              <option value="worth">Worth Score 🏆</option>
              <option value="rating">Top Quality ⭐</option>
              {activeAnchor && <option value="distance">Nearest Distance 📍</option>}
              <option value="queue">Fastest Queue ⚡</option>
              <option value="year">Oldest Heritage 📜</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-small text-stone-700 dark:text-stone-300 font-medium px-1">
        <span>
          Showing <strong className="text-stone-900 dark:text-white tabular-nums font-black">{filteredPandals.length}</strong> pandals in{' '}
          {activeCity === 'kolkata' ? 'Kolkata' : 'Contai'}
          {activeAnchor ? ` (from ${activeAnchor.name.split('(')[0]})` : ''}
        </span>
        {filteredPandals.length > 0 && (
          <span className="text-[#DC2626] font-bold text-micro flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Live crowd sync active
          </span>
        )}
      </div>

      {/* Pandal Cards List */}
      {filteredPandals.length === 0 ? (
        <div className="py-12 text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#DC2626]/10 flex items-center justify-center mx-auto text-[#DC2626]">
            <ShankhaIcon size={36} />
          </div>
          <h4 className="font-display font-bold text-h3 text-stone-800 dark:text-stone-200">
            No pandals match your filters
          </h4>
          <p className="text-small text-stone-500 font-bengali">
            কোনো মণ্ডপ খুঁজে পাওয়া যায়নি। ফিল্টার রিসেট করে আবার চেষ্টা করুন।
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedRecommendation('all');
              setSelectedTag('all');
              setSelectedZone('all');
              setSelectedCrowd('all');
              setSelectedAnchorId('none');
            }}
            className="px-4 py-2 rounded-xl bg-[#991B1B] text-white text-btn font-bold shadow-sm"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredPandals.map((pandal) => {
            const isFav = favorites.includes(pandal.id);
            const inTrip = activeTripPandalIds.includes(pandal.id);
            const nearbyInfo = nearbyRankingsMap.get(pandal.id);

            return (
              <div
                key={pandal.id}
                className={`rounded-3xl border overflow-hidden shadow-xs transition-all hover:shadow-md ${
                  isDarkMode
                    ? 'bg-[#281B23] border-[#F59E0B]/30 text-white'
                    : 'bg-white border-stone-200 hover:border-amber-500/40 text-stone-900'
                }`}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Left Hero Image */}
                  <div
                    className="sm:w-2/5 h-44 sm:h-auto relative cursor-pointer group overflow-hidden shrink-0"
                    onClick={() => onSelectPandal(pandal)}
                  >
                    <img
                      src={pandal.heroImage}
                      alt={pandal.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 min-h-[170px]"
                      referrerPolicy="no-referrer"
                      onError={handleImageError}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent sm:hidden" />

                    {/* Recommendation Level & Category badge */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                      <span
                        className={`text-micro font-bold px-2 py-0.5 rounded-full shadow-sm ${
                          pandal.recommendationLevel === 'Must Visit'
                            ? 'bg-[#991B1B] text-[#FEF08A] border border-[#FDE68A]/40'
                            : 'bg-black/75 backdrop-blur-md text-white border border-white/20'
                        }`}
                      >
                        {pandal.recommendationLevel}
                      </span>
                      <span className="bg-black/70 text-stone-200 text-micro font-bold px-2 py-0.5 rounded-md backdrop-blur-sm">
                        {pandal.categoryLabel.split(' ')[0]}
                      </span>
                    </div>

                    {/* Quality Score badge */}
                    <div className="absolute bottom-2.5 left-2.5 text-micro font-black bg-white/95 text-stone-950 px-2 py-0.5 rounded-md shadow-sm tabular-nums flex items-center gap-1 border border-stone-200">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      <span>{pandal.overallQualityScore.toFixed(1)}</span>
                      <span className="text-stone-500 font-medium">({pandal.reviewCount})</span>
                    </div>
                  </div>

                  {/* Right Content details */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      {/* Top row: Title + Actions */}
                      <div className="flex items-start justify-between gap-2">
                        <div onClick={() => onSelectPandal(pandal)} className="cursor-pointer">
                          <h4 className="font-display font-black text-h3 leading-tight text-stone-950 dark:text-white hover:text-[#DC2626] transition-colors">
                            {pandal.name}
                          </h4>
                          <p className="font-bengali-serif text-h4 text-[#991B1B] dark:text-[#FEF08A] font-bold">{pandal.bengaliName}</p>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => onToggleFavorite(pandal.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                              isFav
                                ? 'bg-[#DC2626] border-[#DC2626] text-white shadow-xs'
                                : 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:border-stone-400'
                            }`}
                            title={isFav ? 'Remove from Saved' : 'Save to Favorites'}
                          >
                            {isFav ? <BookmarkCheck className="w-4 h-4 fill-white" /> : <Bookmark className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => onToggleTripPandal(pandal.id)}
                            className={`px-2.5 py-1.5 rounded-full text-micro font-bold flex items-center gap-1 border transition-all ${
                              inTrip
                                ? 'bg-[#15803D] border-[#15803D] text-white shadow-xs'
                                : 'bg-amber-50 border-amber-300 text-amber-950 hover:bg-amber-100 shadow-2xs'
                            }`}
                            title={inTrip ? 'In Current Trip Route' : 'Add to Trip Route'}
                          >
                            {inTrip ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>{inTrip ? 'Added' : 'Trip'}</span>
                          </button>
                        </div>
                      </div>

                      {/* Proximity / Direction from Active Anchor */}
                      {nearbyInfo && (
                        <div className="mt-1 flex items-center gap-2 text-micro font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-lg tabular-nums">
                          <span>{nearbyInfo.arrowIcon} {nearbyInfo.direction} ({nearbyInfo.bengaliDirection})</span>
                          <span>•</span>
                          <span>{nearbyInfo.formattedStraightDistance}</span>
                          <span>•</span>
                          <span>~{nearbyInfo.estimatedWalkingMinutes} min walk ({nearbyInfo.formattedWalkingDistance})</span>
                        </div>
                      )}

                      {/* Theme snippet */}
                      <p className="text-small text-stone-700 dark:text-stone-300 line-clamp-2 mt-1.5 leading-relaxed font-medium">
                        {pandal.themeConcept}
                      </p>

                      {/* Tags & Key details chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2 text-micro">
                        {pandal.transit.nearestMetro && (
                          <span className="bg-stone-100 dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 px-2 py-0.5 rounded-md flex items-center gap-1 text-stone-800 dark:text-stone-200 font-semibold tabular-nums shadow-2xs">
                            <Train className="w-3 h-3 text-[#DC2626]" />
                            {pandal.transit.nearestMetro.station} ({pandal.transit.nearestMetro.walkingMins}m)
                          </span>
                        )}
                        <span className="bg-stone-100 dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 px-2 py-0.5 rounded-md flex items-center gap-1 text-stone-800 dark:text-stone-200 font-semibold shadow-2xs">
                          <MapPin className="w-3 h-3 text-[#D97706]" />
                          {pandal.area}
                        </span>
                        <span className="bg-stone-100 dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 px-2 py-0.5 rounded-md flex items-center gap-1 text-stone-800 dark:text-stone-200 font-semibold tabular-nums shadow-2xs">
                          <Timer className="w-3 h-3 text-stone-500" />
                          ~{pandal.estimatedVisitDuration}m visit
                        </span>
                      </div>

                      {/* Real-Time Crowd Heatmap Indicator */}
                      <div className="mt-2.5">
                        <PandalCrowdHeatmap pandal={pandal} variant="full" />
                      </div>
                    </div>

                    {/* Bottom Status & CTA */}
                    <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap">
                      <span className="text-micro text-stone-600 dark:text-stone-400 font-medium">
                        Tap card for 360° tour & gallery
                      </span>

                      <button
                        onClick={() => onSelectPandal(pandal)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] hover:brightness-110 text-white text-btn font-extrabold shadow-xs transition-all"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QR Code Scanner Modal for Physical Pandal Codes */}
      <QRCodeScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        pandals={pandals}
        activeTripPandalIds={activeTripPandalIds}
        favorites={favorites}
        visitedList={visitedList}
        onToggleTripPandal={onToggleTripPandal}
        onToggleFavorite={onToggleFavorite}
        onToggleVisited={onToggleVisited}
        onSelectPandal={onSelectPandal}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
