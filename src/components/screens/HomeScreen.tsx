import React, { useState, useEffect, useMemo } from 'react';
import { CityId, Pandal, UserPreferences, CuratedRoute, LocationWeather } from '../../types';
import { getTodayTithiInfo } from '../../data/festivalCalendar2026';
import { getMahalayaCountdown } from '../../data/pujaCalendar2026';
import { getCurrentPujaStatus } from '../../utils/pujaDateStatus';
import { CURATED_ROUTES } from '../../data/curatedRoutes';
import { DurgaThirdEye, DhunuchiIcon, DhakIcon, AlpanaCorner } from '../common/BengaliMotifs';
import { WeatherTicker } from '../common/WeatherTicker';
import { WeatherAlertSystem } from '../home/WeatherAlertSystem';
import { WhatShouldWeDoNowCard } from '../common/WhatShouldWeDoNowCard';
import { PersonalWalkingCard } from '../common/PersonalWalkingCard';
import { CrowdIntensityIndicator } from '../common/CrowdIntensityIndicator';
import { PWAInstallCard } from '../common/PWAInstallCard';
import { getCachedWeatherSync, getLiveCityWeather } from '../../services/weatherService';
import { handleImageError } from '../../utils/imageFallback';
import {
  Sparkles,
  Clock,
  Compass,
  MapPin,
  TrendingUp,
  Flame,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Star,
  Users,
  ChevronRight,
  Headphones,
  Footprints,
  Train,
  ShieldCheck,
} from 'lucide-react';

interface HomeScreenProps {
  activeCity: CityId;
  pandals: Pandal[];
  favorites: string[];
  visitedList?: string[];
  activeTripPandalIds?: string[];
  onToggleFavorite: (id: string) => void;
  onSelectPandal: (pandal: Pandal) => void;
  onSelectRoute: (route: CuratedRoute) => void;
  onNavigateTab: (tab: 'discovery' | 'map' | 'route' | 'favorites' | 'settings') => void;
  onAddPandalToTrip?: (pandalId: string) => void;
  userPrefs: UserPreferences;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  activeCity,
  pandals,
  favorites,
  visitedList = [],
  activeTripPandalIds = [],
  onToggleFavorite,
  onSelectPandal,
  onSelectRoute,
  onNavigateTab,
  onAddPandalToTrip,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';

  const [currentWeather, setCurrentWeather] = useState<LocationWeather>(() =>
    getCachedWeatherSync(activeCity)
  );

  useEffect(() => {
    let isMounted = true;
    getLiveCityWeather(activeCity).then((w) => {
      if (isMounted) setCurrentWeather(w);
    });
    return () => {
      isMounted = false;
    };
  }, [activeCity]);

  const cityPandals = pandals.filter((p) => p.city === activeCity);
  const cityRoutes = CURATED_ROUTES.filter((r) => r.city === activeCity);

  const featuredPandals = cityPandals.slice(0, 3);
  const topCrowdPuller = cityPandals.find((p) => p.crowdLevel === 'peak_surge') || cityPandals[0];

  const todayTithi = useMemo(() => getTodayTithiInfo(), []);
  const mahalayaCountdown = useMemo(() => getMahalayaCountdown(), []);
  const pujaStatus = useMemo(() => getCurrentPujaStatus(), []);

  return (
    <div id="home-dashboard" className="space-y-5 pb-8 animate-fadeIn">
      {/* 1. Tithi & Ritual Hero Card */}
      <section
        id="tithi-hero-card"
        className={`relative overflow-hidden rounded-3xl p-4 sm:p-5 shadow-lg border ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#3B1324] via-[#2A161E] to-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-gradient-to-br from-[#881337] via-[#991B1B] to-[#7F1D1D] border-[#FDE68A]/30 text-white'
        }`}
      >
        <AlpanaCorner position="top-right" size={48} color="#FDE68A" className="absolute top-1 right-1 opacity-25" />
        <AlpanaCorner position="bottom-left" size={48} color="#FDE68A" className="absolute bottom-1 left-1 opacity-25" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-micro font-bold text-[#FEF08A] uppercase">
              <Sparkles className="w-3.5 h-3.5 text-[#F59E0B] animate-pulse" />
              <span className="font-bengali-serif font-bold text-small">{todayTithi.bengaliDayName}</span>
              <span className="opacity-75">• {todayTithi.dayName}</span>
            </div>

            <div className="flex items-center gap-1 text-micro bg-white/10 px-2.5 py-1 rounded-full text-stone-200 tabular-nums font-bold">
              <Clock className="w-3 h-3 text-[#FDE68A]" />
              <span>{todayTithi.dateStr}</span>
            </div>
          </div>

          <div className="mt-3.5 flex items-start justify-between">
            <div>
              <h2 className="font-display font-black text-h1 sm:text-[28px] text-white tracking-tight">
                {activeCity === 'kolkata' ? 'Kolkata Pandal Trail' : 'Contai Puja Safari'}
              </h2>
              <p className="font-bengali text-h4 text-[#FEF08A] font-semibold mt-0.5">
                {activeCity === 'kolkata'
                  ? 'উত্তর ও দক্ষিণ কলকাতার সর্বশ্রেষ্ঠ পূজামণ্ডপ পরিক্রমা'
                  : 'কাঁথি শহর ও সাগরতীরের ঐতিহাসিক শারদ আনন্দ'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
              <DhunuchiIcon size={28} />
            </div>
          </div>

          {/* Today's Ritual Highlights Bar */}
          <div className="mt-4 pt-3 border-t border-white/15 grid grid-cols-1 sm:grid-cols-2 gap-2 text-small">
            <div className="flex items-center gap-2 bg-black/20 p-2.5 rounded-xl border border-white/10">
              <span className="text-lg">🌸</span>
              <div>
                <span className="text-micro uppercase tracking-wider text-amber-200 block font-bold">
                  {todayTithi.highlightLeftLabel}
                </span>
                <span className="font-semibold text-white text-small">{todayTithi.highlightLeftContent}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-black/20 p-2.5 rounded-xl border border-white/10">
              <span className="text-lg">🪔</span>
              <div>
                <span className="text-micro uppercase tracking-wider text-amber-200 block font-bold">
                  {todayTithi.highlightRightLabel}
                </span>
                <span className="font-semibold text-white text-small">{todayTithi.highlightRightContent}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 1A. Dynamic Mahalaya Countdown / Festival Status Banner (Synchronized with Festive Frame) */}
      <section
        id="mahalaya-countdown-card"
        className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-xs ${
          pujaStatus.type === 'MAHALAYA' || pujaStatus.isFestivalActive
            ? isDarkMode
              ? 'bg-gradient-to-r from-[#451A03] via-[#78350F] to-[#451A03] border-[#F59E0B]/50 text-white'
              : 'bg-gradient-to-r from-amber-100 via-amber-50 to-orange-100 border-[#F59E0B] text-stone-950'
            : isDarkMode
            ? 'bg-gradient-to-r from-[#2A161E] via-[#20141C] to-[#1A1017] border-[#F59E0B]/30 text-white'
            : 'bg-amber-50/80 border-amber-300/90 text-stone-950'
        }`}
      >
        <AlpanaCorner
          position="top-right"
          size={40}
          color={isDarkMode ? '#FDE68A' : '#D97706'}
          className="absolute top-1 right-1 opacity-20 pointer-events-none"
        />
        <AlpanaCorner
          position="bottom-left"
          size={40}
          color={isDarkMode ? '#FDE68A' : '#D97706'}
          className="absolute bottom-1 left-1 opacity-20 pointer-events-none"
        />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {pujaStatus.isCountdown ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-micro font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 shadow-2xs">
                  <Clock className="w-3 h-3 text-[#B45309] dark:text-[#F59E0B]" />
                  {pujaStatus.englishText}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-micro font-black uppercase tracking-wider bg-amber-400 text-stone-950 shadow-xs animate-pulse">
                  <Sparkles className="w-3 h-3 text-stone-950" />
                  {pujaStatus.type === 'MAHALAYA' ? 'TODAY' : 'FESTIVAL ACTIVE'}
                </span>
              )}
              <span className="text-micro font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                Asia/Kolkata • {pujaStatus.date}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-2 pt-0.5">
              <h3 className="font-bengali-serif font-black text-h4 sm:text-h3 text-[#991B1B] dark:text-amber-300">
                {pujaStatus.bengaliText}
              </h3>
              <span className="font-display font-black text-small sm:text-body text-stone-900 dark:text-stone-100">
                • {pujaStatus.englishText}
              </span>
            </div>

            <p className="text-small text-stone-700 dark:text-stone-300 font-medium line-clamp-1">
              {pujaStatus.isCountdown
                ? 'Target: October 10, 2026 (Mahalaya) • Dawn Tarpan & Chakkhu Daan'
                : 'শারদ পরিক্রমা ও লাইভ প্যান্ডেল দর্শন • #PujaTripMoments'}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 bg-white dark:bg-white/10 px-3 py-2 rounded-xl border border-amber-200/90 dark:border-white/15 shadow-2xs">
            <span className="text-2xl" role="img" aria-label="shankha">
              🐚
            </span>
            <div className="text-left">
              <span className="text-micro font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300 block">
                {pujaStatus.isCountdown ? 'Auspicious Dawn' : 'Live Ritual'}
              </span>
              <span className="text-small font-bold text-stone-950 dark:text-stone-100">
                {pujaStatus.isCountdown
                  ? 'Mahishasuramardini 4:00 AM'
                  : pujaStatus.englishText}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 1B. Weather Alert System & Rain Gear Notification (>60% Rain Threshold) */}
      <WeatherAlertSystem
        activeCity={activeCity}
        currentWeather={currentWeather}
        isDarkMode={isDarkMode}
        onWeatherChange={(updated) => setCurrentWeather(updated)}
      />

      {/* Real-Time Outdoor Weather & Pandal Hopping Advisory */}
      <WeatherTicker
        activeCity={activeCity}
        onWeatherChange={(updated) => setCurrentWeather(updated)}
      />

      {/* 2. What Should We Do Now? Smart Recommendation Component */}
      <WhatShouldWeDoNowCard
        activeCity={activeCity}
        pandals={pandals}
        visitedList={visitedList}
        onSelectPandal={onSelectPandal}
        onAddPandalToTrip={onAddPandalToTrip}
        userPrefs={userPrefs}
      />

      {/* 2B. Energy Tracker: Walking Distance & Estimated Step Count */}
      <PersonalWalkingCard
        userPrefs={userPrefs}
        activeCity={activeCity}
        onOpenSettings={() => onNavigateTab('settings')}
      />

      {/* 2. Live Crowd Surge & Queue Alert Bar */}
      <section id="live-crowd-ticker" className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-[#DC2626] animate-pulse" />
            <h3 className="font-display font-bold text-h4 text-[#881337] dark:text-[#FDE68A] uppercase tracking-wide">
              Live Crowd & Queue Monitor
            </h3>
          </div>
          <span className="text-micro text-stone-500 font-medium tabular-nums">Updated 3 mins ago</span>
        </div>

        {/* Live Queue Cards Horizontal Scroll */}
        <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar -mx-1 px-1">
          {cityPandals.map((pandal) => {
            return (
              <div
                key={pandal.id}
                onClick={() => onSelectPandal(pandal)}
                className={`min-w-[195px] p-3 rounded-2xl border cursor-pointer transition-all hover:scale-[1.02] shadow-xs hover:shadow-md flex flex-col justify-between shrink-0 ${
                  isDarkMode
                    ? 'bg-[#281B23] border-[#F59E0B]/30 text-white'
                    : 'bg-white border-stone-200 hover:border-amber-500/40 text-[#1C1917]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-micro font-bold px-2 py-0.5 rounded-full ${
                        pandal.crowdLevel === 'peak_surge'
                          ? 'bg-red-500/20 text-red-700 dark:text-red-400 border border-red-500/40 font-black'
                          : pandal.crowdLevel === 'high'
                          ? 'bg-orange-500/20 text-orange-800 dark:text-orange-400 border border-orange-500/40 font-black'
                          : 'bg-green-500/20 text-green-800 dark:text-green-400 border border-green-500/40 font-bold'
                      }`}
                    >
                      {pandal.crowdLevel === 'peak_surge'
                        ? '🔥 Peak Surge'
                        : pandal.crowdLevel === 'high'
                        ? '⚡ High Queue'
                        : '✨ Moderate Flow'}
                    </span>
                    <span className="text-small font-black text-stone-900 dark:text-stone-100 flex items-center gap-0.5 tabular-nums">
                      <Clock className="w-3 h-3 text-[#D97706]" />
                      {pandal.queueWaitMinutes}m wait
                    </span>
                  </div>
                  <h4 className="font-display font-bold text-h4 text-stone-900 dark:text-white line-clamp-1">{pandal.name}</h4>
                  <p className="font-bengali text-small text-[#991B1B] dark:text-[#FEF08A] font-bold line-clamp-1">{pandal.bengaliName}</p>
                </div>

                <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-micro text-stone-600 dark:text-stone-400 font-medium">
                  <span className="line-clamp-1">{pandal.zoneLabel}</span>
                  <span className="font-extrabold text-[#DC2626] flex items-center gap-0.5">
                    View <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Quick Action Hub */}
      <section className="grid grid-cols-3 gap-2">
        <button
          onClick={() => onNavigateTab('map')}
          className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02] shadow-xs hover:shadow-md ${
            isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/30 text-white' : 'bg-white border-stone-200 hover:border-amber-500/40 text-stone-900'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center text-[#D97706]">
            <Compass className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-btn text-stone-900 dark:text-white">Live Map</span>
          <span className="text-micro font-bengali text-stone-600 dark:text-stone-400 -mt-1 font-bold">ইন্টারেক্টিভ ম্যাপ</span>
        </button>

        <button
          onClick={() => onNavigateTab('route')}
          className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02] shadow-xs hover:shadow-md ${
            isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/30 text-white' : 'bg-white border-stone-200 hover:border-amber-500/40 text-stone-900'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-red-500/15 flex items-center justify-center text-[#DC2626]">
            <Footprints className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-btn text-stone-900 dark:text-white">Trip Planner</span>
          <span className="text-micro font-bengali text-stone-600 dark:text-stone-400 -mt-1 font-bold">রুট প্ল্যানার</span>
        </button>

        <button
          onClick={() => onNavigateTab('discovery')}
          className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all hover:scale-[1.02] shadow-xs hover:shadow-md ${
            isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/30 text-white' : 'bg-white border-stone-200 hover:border-amber-500/40 text-stone-900'
          }`}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center text-emerald-600">
            <Headphones className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-btn text-stone-900 dark:text-white">Audio Guides</span>
          <span className="text-micro font-bengali text-stone-600 dark:text-stone-400 -mt-1 font-bold">অডিও গাইড</span>
        </button>
      </section>

      {/* PWA App Installation Promotion */}
      <PWAInstallCard variant="home" isDarkMode={isDarkMode} />

      {/* 4. Curated Ready-Made Routes */}
      <section id="curated-routes-section" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-h2 text-[#881337] dark:text-[#FEF08A]">
              Curated Hopping Circuits
            </h3>
            <p className="text-small text-stone-600 dark:text-stone-400 font-bengali font-bold">বিশেষ বাছাই করা শারদ পরিক্রমা</p>
          </div>
          <button
            onClick={() => onNavigateTab('route')}
            className="text-btn font-bold text-[#DC2626] hover:underline flex items-center gap-0.5"
          >
            All Trails <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {cityRoutes.map((route) => (
            <div
              key={route.id}
              onClick={() => onSelectRoute(route)}
              className={`rounded-2xl p-3.5 border transition-all cursor-pointer hover:shadow-md ${
                isDarkMode
                  ? 'bg-[#281B23] border-[#F59E0B]/30 text-white'
                  : 'bg-white border-stone-200 hover:border-amber-500/40 text-stone-900 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="inline-block px-2 py-0.5 rounded-md bg-[#DC2626]/10 text-[#991B1B] border border-[#DC2626]/30 font-bold text-micro uppercase tracking-wider">
                    {route.badge}
                  </div>
                  <h4 className="font-display font-black text-h3 leading-tight text-stone-950 dark:text-white">
                    {route.title}
                  </h4>
                  <p className="font-bengali text-h4 text-[#991B1B] dark:text-[#FDE68A] font-bold">{route.bengaliTitle}</p>
                  <p className="text-small text-stone-700 dark:text-stone-300 line-clamp-2 mt-1 font-medium leading-relaxed">
                    {route.subtitle}
                  </p>
                </div>

                <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative shadow-inner">
                  <img
                    src={route.coverImage}
                    alt={route.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <span className="absolute bottom-1 right-1 text-micro font-bold text-white bg-black/70 px-1.5 py-0.2 rounded tabular-nums">
                    {route.pandalIds.length} stops
                  </span>
                </div>
              </div>

              {/* Route Metric Pills */}
              <div className="mt-3 pt-2.5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-small font-semibold text-stone-700 dark:text-stone-300">
                <span className="flex items-center gap-1 tabular-nums font-bold">
                  <Clock className="w-3.5 h-3.5 text-[#D97706]" />
                  {route.estimatedHours} hrs
                </span>
                <span className="flex items-center gap-1 font-bold">
                  <Train className="w-3.5 h-3.5 text-[#DC2626]" />
                  {route.transportMode === 'metro_walk' ? 'Metro + Walk' : 'Auto / Car'}
                </span>
                <span className="text-[#DC2626] font-bold flex items-center gap-0.5 text-btn">
                  Start Route <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Spotlight Pandals */}
      <section id="spotlight-pandals" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-black text-h2 text-[#881337] dark:text-[#FEF08A]">
              Top Rated Pandals • সেরা মণ্ডপ
            </h3>
            <p className="text-small text-stone-600 dark:text-stone-400 font-semibold">Curated highlights for {activeCity === 'kolkata' ? 'Kolkata' : 'Contai'}</p>
          </div>
          <button
            onClick={() => onNavigateTab('discovery')}
            className="text-btn font-bold text-[#DC2626] hover:underline flex items-center gap-0.5"
          >
            Explore All ({cityPandals.length}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {featuredPandals.map((pandal) => {
            const isFav = favorites.includes(pandal.id);

            return (
              <div
                key={pandal.id}
                className={`rounded-3xl border overflow-hidden shadow-xs transition-all hover:shadow-md flex flex-col justify-between ${
                  isDarkMode
                    ? 'bg-[#281B23] border-[#F59E0B]/30 text-white'
                    : 'bg-white border-stone-200 hover:border-amber-500/40 text-stone-900'
                }`}
              >
                {/* Image Container */}
                <div
                  className="h-44 relative cursor-pointer group overflow-hidden"
                  onClick={() => onSelectPandal(pandal)}
                >
                  <img
                    src={pandal.heroImage}
                    alt={pandal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between">
                    <span className="bg-black/70 backdrop-blur-md text-[#FEF08A] text-micro font-bold px-2.5 py-1 rounded-full border border-white/25">
                      {pandal.categoryLabel}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(pandal.id);
                      }}
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#DC2626] shadow-md hover:scale-110 active:scale-95 transition-all"
                    >
                      {isFav ? <BookmarkCheck className="w-4 h-4 fill-[#DC2626]" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Bottom Image Overlay text */}
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <div className="flex items-center gap-1.5 text-small text-amber-300 font-bold mb-0.5 tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{pandal.rating}</span>
                      <span className="opacity-90 font-medium">({pandal.reviewCount} reviews)</span>
                    </div>
                    <h4 className="font-display font-black text-h3 leading-tight text-white drop-shadow-sm">
                      {pandal.name}
                    </h4>
                    <p className="font-bengali-serif text-h4 text-[#FEF08A] font-bold">{pandal.bengaliName}</p>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-small text-stone-700 dark:text-stone-300 font-semibold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
                      <span className="line-clamp-1">{pandal.address}</span>
                    </div>
                    <p className="text-small text-stone-700 dark:text-stone-300 line-clamp-2 mt-1.5 leading-relaxed font-medium">
                      {pandal.themeConcept}
                    </p>
                  </div>

                  {/* Bottom Action strip */}
                  <div className="pt-2.5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap">
                    <CrowdIntensityIndicator
                      pandal={pandal}
                      variant="badge"
                      size="sm"
                      showTrafficLights={true}
                    />

                    <button
                      onClick={() => onSelectPandal(pandal)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white font-bold text-btn shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. Bengali Pujo Food & Adda Trail */}
      <section
        id="pujo-food-spotlight"
        className={`p-4 rounded-3xl border shadow-xs ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#281B23] to-[#1C1418] border-[#F59E0B]/30'
            : 'bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-amber-300/80'
        }`}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">🍢</span>
          <div>
            <h4 className="font-display font-black text-h3 text-[#881337] dark:text-[#FDE68A]">
              Pujo Food & Street Adda Nearby
            </h4>
            <p className="text-small text-stone-700 dark:text-stone-300 font-bengali font-bold">
              মণ্ডপের আশেপাশে বিখ্যাত বাঙালি খাওয়াদাওয়া
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
          <div className="bg-white dark:bg-black/40 p-2.5 rounded-xl border border-amber-200 dark:border-stone-800 text-small shadow-2xs">
            <span className="font-bold text-[#991B1B] dark:text-[#FEF08A] block">
              {activeCity === 'kolkata' ? 'Kolkata Kathi Rolls' : 'Contai Cashew & Pitha'}
            </span>
            <span className="text-micro text-stone-700 dark:text-stone-300 font-medium">
              {activeCity === 'kolkata' ? 'Near Maddox & Gariahat' : 'Near Sabuj Sangha & Kanthi Town'}
            </span>
          </div>
          <div className="bg-white dark:bg-black/40 p-2.5 rounded-xl border border-amber-200 dark:border-stone-800 text-small shadow-2xs">
            <span className="font-bold text-[#991B1B] dark:text-[#FEF08A] block">
              {activeCity === 'kolkata' ? 'Mitra Cafe & Fish Fry' : 'Fresh Coastal Sea Fish Fry'}
            </span>
            <span className="text-micro text-stone-700 dark:text-stone-300 font-medium">
              {activeCity === 'kolkata' ? 'Near Bagbazar & Sovabazar' : 'Near Junput Coastal Highway'}
            </span>
          </div>
          <div className="bg-white dark:bg-black/40 p-2.5 rounded-xl border border-amber-200 dark:border-stone-800 text-small shadow-2xs">
            <span className="font-bold text-[#991B1B] dark:text-[#FEF08A] block">
              {activeCity === 'kolkata' ? 'Hot Baked Rosogolla' : 'Kanthir Kacha Golla'}
            </span>
            <span className="text-micro text-stone-700 dark:text-stone-300 font-medium">
              {activeCity === 'kolkata' ? 'Balaram Mullick & Chittaranjan' : 'Sabitri Mistanna Bhandar'}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};
