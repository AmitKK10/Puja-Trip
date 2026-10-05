import React, { useState, useEffect, useMemo } from 'react';
import { Pandal, UserPreferences } from '../../types';
import { DurgaThirdEye, DhakIcon, DhunuchiIcon, ShankhaIcon, AlpanaCorner, AlpanaDivider } from '../common/BengaliMotifs';
import { CrowdIntensityIndicator } from '../common/CrowdIntensityIndicator';
import { CrowdDensityVisualIndicator } from '../pandal/CrowdDensityVisualIndicator';
import { CrowdIntensitySparkline } from '../pandal/CrowdIntensitySparkline';
import { PandalDensityIndicator } from '../pandal/PandalDensityIndicator';
import { OfflinePandalManager } from '../common/OfflinePandalManager';
import { useOfflinePandal } from '../../hooks/useOfflinePandal';
import { FestiveCameraModal } from '../pandal/FestiveCameraModal';
import { PandalQuickNotes } from '../pandal/PandalQuickNotes';
import { CommunityGallery } from '../pandal/CommunityGallery';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import { handleImageError } from '../../utils/imageFallback';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  Headphones,
  MapPin,
  Pause,
  Play,
  Plus,
  Share2,
  Sparkles,
  Star,
  Train,
  Users,
  Utensils,
  Volume2,
  Check,
  Award,
  ShieldCheck,
  Info,
  Timer,
  Tag,
  HardDrive,
} from 'lucide-react';

interface PandalDetailScreenProps {
  pandal: Pandal;
  onBack: () => void;
  favorites: string[];
  visitedList: string[];
  activeTripPandalIds: string[];
  onToggleFavorite: (id: string) => void;
  onToggleVisited: (id: string) => void;
  onToggleTripPandal: (id: string) => void;
  userPrefs: UserPreferences;
  onSelectOtherPandal?: (pandal: Pandal) => void;
}

export const PandalDetailScreen: React.FC<PandalDetailScreenProps> = ({
  pandal,
  onBack,
  favorites,
  visitedList,
  activeTripPandalIds,
  onToggleFavorite,
  onToggleVisited,
  onToggleTripPandal,
  userPrefs,
  onSelectOtherPandal,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const isFav = favorites.includes(pandal.id);
  const isVisited = visitedList.includes(pandal.id);
  const inTrip = activeTripPandalIds.includes(pandal.id);
  const [showCameraModal, setShowCameraModal] = useState(false);

  const { isCached, isEffectiveOffline } = useOfflinePandal(pandal);

  const displayPhotos = useMemo(() => {
    if (pandal.images && pandal.images.length > 0) return pandal.images;
    if (pandal.photos && pandal.photos.length > 0) return pandal.photos;
    return [pandal.heroImage];
  }, [pandal]);

  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  useEffect(() => {
    setActivePhotoIdx(0);
  }, [pandal.id]);

  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(25);

  const handleMarkVisited = () => {
    onToggleVisited(pandal.id);
    if (!isVisited) {
      playKanshorBell(0.7);
      playDhakHit('dha', 0.8);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#DC2626', '#F59E0B', '#FFFDF9', '#B45309'],
      });
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${pandal.name} • PujaTrip`,
        text: `Check out ${pandal.name} (${pandal.bengaliName}) on PujaTrip! Theme: ${pandal.themeConcept}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      alert(`Pandal link copied: ${pandal.name} (${pandal.bengaliName})`);
    }
  };

  const hourlyQueue = [
    { hour: '8 AM', queue: 10, label: 'Low' },
    { hour: '12 PM', queue: 25, label: 'Mid' },
    { hour: '4 PM', queue: 35, label: 'Moderate' },
    { hour: '8 PM', queue: pandal.queueWaitMinutes, label: 'Peak' },
    { hour: '12 AM', queue: Math.max(15, pandal.queueWaitMinutes - 15), label: 'High' },
    { hour: '3 AM', queue: 10, label: 'Peaceful' },
  ];

  const getRecommendationBadgeStyle = (level: string) => {
    switch (level) {
      case 'Must Visit':
        return 'bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-[#FEF08A] border-[#FDE68A]/60 shadow-md';
      case 'Highly Recommended':
        return 'bg-gradient-to-r from-[#B45309] to-[#D97706] text-white border-[#FDE68A]/40 shadow-sm';
      case 'Good':
        return 'bg-[#15803D] text-white border-[#86EFAC]/40';
      default:
        return 'bg-stone-600 text-white border-white/20';
    }
  };

  return (
    <div id="pandal-detail-screen" className="space-y-4 pb-12 animate-fadeIn">
      {/* Top Floating Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-stone-800/80 backdrop-blur-md border border-stone-200 dark:border-stone-700 text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all text-stone-800 dark:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            id="btn-snap-photo-top"
            onClick={() => setShowCameraModal(true)}
            className="px-2.5 py-1.5 rounded-2xl bg-gradient-to-r from-amber-600 via-[#DC2626] to-[#881337] text-white flex items-center gap-1.5 shadow-sm hover:brightness-110 active:scale-95 transition-all text-xs font-bold"
            title="Snap Festive Photo with Branded Frame"
          >
            <Camera className="w-3.5 h-3.5 text-[#FEF08A]" />
            <span className="hidden sm:inline">Snap Photo</span>
          </button>

          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-2xl bg-white/80 dark:bg-stone-800/80 backdrop-blur-md border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shadow-sm"
            title="Share Pandal"
          >
            <Share2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => onToggleFavorite(pandal.id)}
            className={`w-9 h-9 rounded-2xl border flex items-center justify-center shadow-sm transition-all ${
              isFav
                ? 'bg-[#DC2626] border-[#DC2626] text-white'
                : 'bg-white/80 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300'
            }`}
            title="Save to Favorites"
          >
            {isFav ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Offline Pandal Caching Manager & Crowd Congestion Alert */}
      <OfflinePandalManager
        pandal={pandal}
        isDarkMode={isDarkMode}
        onSelectOtherPandal={onSelectOtherPandal}
      />

      {/* Hero Photo Carousel */}
      <div className="rounded-3xl overflow-hidden shadow-lg border border-stone-200 dark:border-stone-800 relative bg-black">
        <div className="h-64 sm:h-80 relative">
          <img
            src={displayPhotos[activePhotoIdx] || pandal.heroImage}
            alt={pandal.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={handleImageError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

          {/* Top Recommendation & Category badge */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1.5">
            <div className="flex flex-wrap gap-1.5">
              <span className={`text-micro font-bold px-3 py-1 rounded-full border flex items-center gap-1 ${getRecommendationBadgeStyle(pandal.recommendationLevel)}`}>
                <Sparkles className="w-3 h-3 text-[#FEF08A]" />
                <span>{pandal.recommendationLevel}</span>
              </span>

              <span className="bg-black/60 backdrop-blur-md text-stone-200 text-micro font-bold px-2.5 py-1 rounded-full border border-white/20">
                {pandal.categoryLabel}
              </span>

              {isCached && (
                <span
                  className="bg-emerald-700/85 backdrop-blur-md text-emerald-100 text-micro font-bold px-2.5 py-1 rounded-full border border-emerald-400/40 flex items-center gap-1 shadow-xs"
                  title="Cached in Local Storage for Offline Darshan"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                  <span>Available Offline</span>
                </span>
              )}
            </div>

            <span className="bg-white/90 text-stone-900 text-micro font-bold px-2.5 py-1 rounded-full tabular-nums shadow-sm shrink-0">
              Est. {pandal.yearEstablished}
            </span>
          </div>

          {/* Bottom title on photo */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <div className="flex items-center gap-1.5 text-small text-amber-300 font-bold mb-0.5 tabular-nums">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{pandal.rating}</span>
              <span className="opacity-80 font-normal">({pandal.reviewCount} reviews)</span>
              <span className="mx-1">•</span>
              <span className="font-normal">{pandal.area}</span>
            </div>
            <h1 className="font-display font-black text-h1 sm:text-[28px] leading-tight text-white drop-shadow-md">
              {pandal.name}
            </h1>
            <p className="font-bengali-serif text-h2 font-bold text-[#FEF08A] drop-shadow-sm mt-0.5">
              {pandal.bengaliName}
            </p>
          </div>
        </div>

        {/* Thumbnail Selector */}
        {displayPhotos.length > 1 && (
          <div className="flex items-center justify-between gap-2 p-2.5 bg-stone-950 overflow-x-auto">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {displayPhotos.map((photo, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`w-14 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                    activePhotoIdx === idx ? 'border-[#F59E0B] scale-105' : 'border-transparent opacity-60 hover:opacity-90'
                  }`}
                >
                  <img src={photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={handleImageError} />
                </button>
              ))}
            </div>

            <a
              href="#community-gallery-section"
              className="ml-auto px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FEF08A] text-micro font-bold shrink-0 flex items-center gap-1.5 transition-colors border border-white/15"
              title="Jump to 2026 Community Gallery"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span className="whitespace-nowrap">2026 Gallery ↓</span>
            </a>
          </div>
        )}
      </div>

      {/* Main Action Bar */}
      <div className="space-y-2.5">
        {/* Prominent Snap Festive Photo with Branded Frame */}
        <button
          id="btn-snap-photo-main"
          onClick={() => setShowCameraModal(true)}
          className="w-full py-3 px-4 rounded-2xl font-bold text-btn flex items-center justify-center gap-2.5 border border-[#F59E0B]/40 bg-gradient-to-r from-amber-600 via-[#DC2626] to-[#881337] text-white shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
        >
          <Camera className="w-5 h-5 text-[#FEF08A]" />
          <span>Snap Photo with Festive Frame (উৎসব ফ্রেম ছবি)</span>
          <Sparkles className="w-4 h-4 text-[#FEF08A] animate-pulse" />
        </button>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => onToggleTripPandal(pandal.id)}
            className={`py-3 px-4 rounded-2xl font-bold text-btn flex items-center justify-center gap-2 border shadow-sm transition-all active:scale-[0.98] ${
              inTrip
                ? 'bg-[#15803D] text-white border-[#15803D]'
                : 'bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white border-transparent hover:brightness-110'
            }`}
          >
            {inTrip ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{inTrip ? 'Added to My Route' : 'Add to Trip Route'}</span>
          </button>

          <button
            onClick={handleMarkVisited}
            className={`py-3 px-4 rounded-2xl font-bold text-btn flex items-center justify-center gap-2 border shadow-sm transition-all active:scale-[0.98] ${
              isVisited
                ? 'bg-[#D97706] text-white border-[#D97706]'
                : isDarkMode
                ? 'bg-[#281B23] text-stone-200 border-[#F59E0B]/30 hover:bg-[#3B1324]'
                : 'bg-white text-stone-800 border-[#D97706]/30 hover:bg-[#FEF3C7]'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${isVisited ? 'text-white' : 'text-[#D97706]'}`} />
            <span>{isVisited ? 'Visited! (শারদ দর্শন ✓)' : 'Mark as Visited'}</span>
          </button>
        </div>
      </div>

      {/* Quality & Worth Scores Breakdown */}
      <section
        id="quality-score-matrix"
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/25 text-white'
            : 'bg-white border-[#D97706]/25 text-stone-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-[#D97706]" />
            <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
              Pandal Quality & Worth Ratings
            </h3>
          </div>
          <span className="text-micro font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 tabular-nums">
            Scale 0 - 10
          </span>
        </div>

        {/* 4-Metric Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Overall Quality */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
            <span className="text-micro text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider block">
              Overall Quality
            </span>
            <div className="text-2xl font-black text-[#991B1B] dark:text-[#FEF08A] tabular-nums mt-0.5">
              {pandal.overallQualityScore.toFixed(1)}
            </div>
            <span className="text-micro text-stone-500 block">Composite Rating</span>
          </div>

          {/* Idol Quality */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-center">
            <span className="text-micro text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider block">
              Idol Sculpture
            </span>
            <div className="text-2xl font-black text-[#D97706] tabular-nums mt-0.5">
              {pandal.idolQualityScore.toFixed(1)}
            </div>
            <span className="text-micro text-stone-500 block">Artisan Craft</span>
          </div>

          {/* Theme Quality */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-center">
            <span className="text-micro text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider block">
              Theme Marvel
            </span>
            <div className="text-2xl font-black text-[#D97706] tabular-nums mt-0.5">
              {pandal.themeQualityScore.toFixed(1)}
            </div>
            <span className="text-micro text-stone-500 block">Architectural Concept</span>
          </div>

          {/* Popularity */}
          <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-center">
            <span className="text-micro text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider block">
              Popularity
            </span>
            <div className="text-2xl font-black text-stone-800 dark:text-stone-200 tabular-nums mt-0.5">
              {pandal.popularityScore.toFixed(1)}
            </div>
            <span className="text-micro text-stone-500 block">Festive Buzz</span>
          </div>
        </div>

        {/* Visit Duration & Tags Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-200 dark:border-stone-800 text-small">
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
            <Timer className="w-4 h-4 text-[#DC2626]" />
            <span>Est. Visit Duration: <strong className="tabular-nums text-stone-800 dark:text-white">{pandal.estimatedVisitDuration} mins</strong></span>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1">
            {pandal.tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-micro font-medium px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/60 dark:border-stone-700"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Audio Guide Player */}
      <div
        className={`p-4 rounded-3xl border shadow-sm ${
          isDarkMode
            ? 'bg-gradient-to-r from-[#281B23] via-[#3B1324] to-[#281B23] border-[#F59E0B]/30 text-white'
            : 'bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-[#FFFBEB] border-[#D97706]/30 text-stone-900'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#DC2626] text-white flex items-center justify-center shadow-sm">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-display font-bold text-h4">Curated Audio Guide (স্মার্ট অডিও বিবরণী)</h4>
              <p className="text-micro text-stone-500 font-bengali font-semibold">
                {pandal.bengaliName}-এর ইতিহাস ও প্রতিমার ব্যাখ্যা
              </p>
            </div>
          </div>
          <span className="text-small font-bold text-[#D97706] tabular-nums">
            {Math.floor(pandal.audioDurationSeconds / 60)}:
            {(pandal.audioDurationSeconds % 60).toString().padStart(2, '0')} mins
          </span>
        </div>

        {/* Audio controls */}
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => {
              setIsPlayingAudio(!isPlayingAudio);
              if (!isPlayingAudio) playKanshorBell(0.4);
            }}
            className="w-10 h-10 rounded-full bg-[#991B1B] text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all shrink-0"
          >
            {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <div className="flex-1 space-y-1">
            <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden cursor-pointer relative">
              <div
                className="h-full bg-gradient-to-r from-[#D97706] to-[#DC2626] rounded-full transition-all duration-300"
                style={{ width: `${isPlayingAudio ? 60 : audioProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-micro text-stone-500 tabular-nums font-medium">
              <span>{isPlayingAudio ? '0:48' : '0:00'}</span>
              <span>
                {Math.floor(pandal.audioDurationSeconds / 60)}:
                {(pandal.audioDurationSeconds % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Crowd & Wait Time Analysis */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/20 text-white' : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#DC2626]" />
            <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
              Live Queue & Crowd Forecast
            </h3>
          </div>
          <span className="text-micro font-bold bg-red-500/15 text-red-600 px-2.5 py-0.5 rounded-full tabular-nums">
            {pandal.queueWaitMinutes} mins current wait
          </span>
        </div>

        {/* Color-Coded Green/Yellow/Red Crowd Density Indicator Component */}
        <CrowdDensityVisualIndicator
          pandal={pandal}
          variant="card"
          isDarkMode={isDarkMode}
          showAvoidanceTip={true}
        />

        {/* Simplified Real-Time Courtyard Density Indicator */}
        <PandalDensityIndicator
          pandal={pandal}
          isDarkMode={isDarkMode}
        />

        {/* Predictive Crowd Intensity Trend Sparkline (Recharts) */}
        <CrowdIntensitySparkline
          pandal={pandal}
          isDarkMode={isDarkMode}
        />

        {/* Hourly Forecast Bar Chart */}
        <div className="grid grid-cols-6 gap-1 pt-1 text-center">
          {hourlyQueue.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div className="h-16 w-full bg-stone-100 dark:bg-stone-800 rounded-lg relative flex items-end justify-center p-1 overflow-hidden">
                <div
                  className={`w-full rounded-md transition-all ${
                    item.queue > 40
                      ? 'bg-[#DC2626]'
                      : item.queue > 20
                      ? 'bg-[#F59E0B]'
                      : 'bg-[#10B981]'
                  }`}
                  style={{ height: `${Math.min(100, (item.queue / 80) * 100)}%` }}
                />
              </div>
              <span className="text-micro font-semibold text-stone-500">{item.hour}</span>
              <span className="text-micro font-bold text-stone-700 dark:text-stone-300 tabular-nums">{item.queue}m</span>
            </div>
          ))}
        </div>

        <div className="bg-amber-500/10 p-2.5 rounded-xl text-small text-stone-700 dark:text-stone-300">
          <strong className="text-[#991B1B] dark:text-[#FEF08A] block mb-0.5">💡 Best Visiting Advice:</strong>
          {pandal.bestTimeToVisit}. Peak rush occurs between {pandal.peakHours}.
        </div>
      </div>

      {/* Theme Concept & Storytelling */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/20 text-white' : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div>
          <span className="text-micro font-bold uppercase tracking-wider text-[#D97706]">This Year's Theme</span>
          <h3 className="font-display font-black text-h2 text-[#881337] dark:text-[#FEF08A] leading-snug">
            {pandal.themeConcept}
          </h3>
          <p className="font-bengali-serif text-h3 font-bold text-[#DC2626] mt-0.5">{pandal.bengaliTheme}</p>
        </div>

        <p className="text-body text-stone-700 dark:text-stone-300 leading-relaxed">
          {pandal.description}
        </p>

        {/* Artisanal Credits */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-small">
          <div className="bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl">
            <span className="text-micro text-stone-400 uppercase font-semibold block">Idol Artisan (প্রতিমা শিল্পী)</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">{pandal.idolArtisan}</span>
          </div>
          <div className="bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl">
            <span className="text-micro text-stone-400 uppercase font-semibold block">Pandal Architecture (মণ্ডপ রূপায়ণ)</span>
            <span className="font-bold text-stone-800 dark:text-stone-200">{pandal.pandalArchitect}</span>
          </div>
        </div>

        {/* Key Highlights Checklist */}
        <div className="pt-2">
          <h4 className="font-display font-bold text-h4 text-stone-800 dark:text-stone-200 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Must-See Highlights:</span>
          </h4>
          <ul className="space-y-1.5 text-small text-stone-600 dark:text-stone-300">
            {pandal.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[#DC2626] font-bold">✦</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Community Gallery: 2026 Live Darshan Photos & Visual Impressiveness Evaluation */}
      <CommunityGallery
        pandal={pandal}
        isDarkMode={isDarkMode}
        onOpenFestiveCamera={() => setShowCameraModal(true)}
      />

      {/* Transit, Metro & Route Directions */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/20 text-white' : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Train className="w-4 h-4 text-[#DC2626]" />
          <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
            Transit & How to Reach
          </h3>
        </div>

        <div className="space-y-2 text-small">
          {pandal.transit.nearestMetro && (
            <div className="flex items-start gap-2.5 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl">
              <span className="text-xl">🚇</span>
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200 block">
                  Nearest Metro: {pandal.transit.nearestMetro.station} ({pandal.transit.nearestMetro.line})
                </span>
                <span className="text-stone-500 text-micro">
                  {pandal.transit.nearestMetro.gate ? `Use ${pandal.transit.nearestMetro.gate} • ` : ''}
                  {pandal.transit.nearestMetro.walkingMins} min walk to pandal
                </span>
              </div>
            </div>
          )}

          {pandal.transit.nearestBusStop && (
            <div className="flex items-start gap-2.5 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl">
              <span className="text-xl">🚌</span>
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200 block">
                  Nearest Bus Stop: {pandal.transit.nearestBusStop.stop}
                </span>
                <span className="text-stone-500 text-micro">
                  {pandal.transit.nearestBusStop.routes?.length ? `Routes: ${pandal.transit.nearestBusStop.routes.join(', ')} • ` : ''}
                  {pandal.transit.nearestBusStop.walkingMins} min walk
                </span>
              </div>
            </div>
          )}

          {pandal.transit.nearestAutoStand && (
            <div className="flex items-start gap-2.5 bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl">
              <span className="text-xl">🛺</span>
              <div>
                <span className="font-bold text-stone-800 dark:text-stone-200 block">
                  Auto Stand Route
                </span>
                <span className="text-stone-500 text-micro">
                  {pandal.transit.nearestAutoStand.route} ({pandal.transit.nearestAutoStand.walkingMins} min walk)
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-micro text-stone-500 pt-1">
            <span>
              Parking: <strong>{pandal.transit.parkingAvailability.replace('_', ' ')}</strong>
            </span>
            <span>
              Wheelchair Accessible: <strong>{pandal.transit.wheelchairAccessible ? 'Yes ✓' : 'No'}</strong>
            </span>
          </div>

          {/* Offline accessibility confirmation */}
          <div className="mt-1 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-micro text-emerald-800 dark:text-emerald-300 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Gate & transit instructions cached on device</span>
            </span>
            <span className="text-[11px] font-normal opacity-80">Works with zero signal</span>
          </div>
        </div>
      </div>

      {/* Famous Food Stalls Nearby */}
      <div
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/20 text-white' : 'bg-white border-[#D97706]/20 text-stone-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-[#D97706]" />
          <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
            Famous Street Food Nearby (বাঙালি পেটপুজো)
          </h3>
        </div>

        <div className="space-y-2">
          {pandal.foodNearby.map((f, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 text-small"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-xl">{f.icon}</span>
                <div>
                  <h5 className="font-bold text-stone-800 dark:text-stone-200">{f.name}</h5>
                  <p className="text-micro text-[#DC2626] font-semibold">{f.famousDish}</p>
                </div>
              </div>
              <span className="text-micro font-bold text-stone-500 bg-black/5 dark:bg-white/5 px-2 py-1 rounded-full tabular-nums">
                {f.distance}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Notes & Memories Section */}
      <PandalQuickNotes pandal={pandal} isDarkMode={isDarkMode} />

      {/* Demo Record Notice */}
      <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 flex items-start gap-2 text-micro text-stone-500">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-stone-400" />
        <div>
          <strong className="text-stone-700 dark:text-stone-300">PujaTrip Demo Dataset:</strong> Scores, walking estimates and transit routes are curated sample records for route planning simulations across Kolkata and Contai.
        </div>
      </div>

      {/* Branded Festive Camera Modal */}
      <FestiveCameraModal
        pandal={pandal}
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        isDarkMode={isDarkMode}
      />
    </div>
  );
};
