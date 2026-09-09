import React, { useMemo } from 'react';
import { CityId, UserPreferences } from '../../types';
import { getTodayTithiInfo } from '../../data/festivalCalendar2026';
import { PujaTripLogo, DhunuchiIcon } from './BengaliMotifs';
import { MapPin, Sparkles, AlertCircle, ShieldAlert, Flame } from 'lucide-react';

interface HeaderProps {
  activeCity: CityId;
  onCityChange: (city: CityId) => void;
  userPrefs: UserPreferences;
  onUpdatePrefs: (updater: (prev: UserPreferences) => UserPreferences) => void;
  onOpenSettings: () => void;
  onOpenEmergency: () => void;
  isViewingPandalDetail?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeCity,
  onCityChange,
  userPrefs,
  onUpdatePrefs,
  onOpenSettings,
  onOpenEmergency,
  isViewingPandalDetail = false,
}) => {
  const todayTithi = useMemo(() => getTodayTithiInfo(), []);
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';

  return (
    <header
      id="app-header"
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isDarkMode
          ? 'bg-[#1C1418]/95 border-b border-[#F59E0B]/25 text-[#FFFDF9]'
          : 'bg-[#FFFCF7]/95 border-b border-stone-200/90 text-[#1C1917]'
      } backdrop-blur-md shadow-xs ${
        isViewingPandalDetail
          ? 'border-b-amber-500/50 shadow-[0_4px_16px_rgba(245,158,11,0.15)]'
          : ''
      }`}
    >
      {/* Top micro festive banner */}
      <div className="bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#881337] text-white px-3.5 py-1 text-micro flex items-center justify-between font-medium shadow-inner">
        {isViewingPandalDetail ? (
          <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="animate-dhunuchi inline-flex items-center gap-1 text-[#FEF08A] font-bold">
              <DhunuchiIcon size={15} className="animate-dhunuchi shrink-0" />
              <span className="font-bengali tracking-wide">ধুনুচি আরতি আবহ • শারদ দর্শন</span>
            </span>
            <span className="opacity-90 hidden sm:inline text-amber-100">• Pandal Darshan Ambience</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 overflow-hidden text-ellipsis whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-[#FDE68A] shrink-0 animate-pulse" />
            <span className="font-bengali tracking-wide font-bold text-[#FEF08A]">
              {todayTithi.headerGreeting}
            </span>
            <span className="opacity-90 hidden sm:inline text-amber-100">• {todayTithi.headerSubtext}</span>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenEmergency}
            className="flex items-center gap-1 text-micro bg-black/35 hover:bg-black/50 px-2.5 py-0.5 rounded-full border border-white/30 text-[#FEF08A] font-bold transition-colors shadow-xs"
            title="Puja Emergency & Police Helpline"
          >
            <ShieldAlert className="w-3 h-3 text-[#F87171]" />
            <span>Helpline</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 max-w-5xl mx-auto">
        {/* Logo and Dhunuchi Ambience Indicator */}
        <div className="flex items-center gap-2">
          <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <PujaTripLogo variant={isDarkMode ? 'dark' : 'brand'} size="md" />
          </div>

          {/* Subtle Dhunuchi animation effect active when viewing PandalDetailScreen */}
          {isViewingPandalDetail && (
            <div
              id="header-dhunuchi-ambience"
              className="animate-dhunuchi flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-micro font-bold shadow-xs transition-all"
              title="Dhunuchi Aarti Ambience Active"
            >
              <DhunuchiIcon size={16} className="animate-dhunuchi text-amber-600 shrink-0" />
              <span className="font-bengali tracking-wide hidden xs:inline font-bold">ধুনুচি আরতি</span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* City Switcher Pill */}
          <div
            className={`flex items-center p-0.5 rounded-xl border text-btn shadow-xs ${
              isDarkMode
                ? 'bg-[#281B23] border-[#F59E0B]/30'
                : 'bg-stone-100/90 border-stone-200/90'
            }`}
          >
            <button
              onClick={() => onCityChange('kolkata')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeCity === 'kolkata'
                  ? 'bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white shadow-xs font-extrabold'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-white/70 font-bold'
              }`}
            >
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="font-bengali font-bold">কলকাতা</span>
            </button>
            <button
              onClick={() => onCityChange('contai')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                activeCity === 'contai'
                  ? 'bg-gradient-to-r from-[#B45309] to-[#D97706] text-white shadow-xs font-extrabold'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-white/70 font-bold'
              }`}
            >
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="font-bengali font-bold">কাঁথি</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
