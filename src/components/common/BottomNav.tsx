import React from 'react';
import { Home, Compass, Map as MapIcon, Route as RouteIcon, Bookmark, Settings as SettingsIcon, Users } from 'lucide-react';
import { UserPreferences } from '../../types';

export type ScreenTab = 'splash' | 'home' | 'discovery' | 'detail' | 'map' | 'route' | 'favorites' | 'group' | 'settings';

interface BottomNavProps {
  currentTab: ScreenTab;
  onSelectTab: (tab: ScreenTab) => void;
  favoritesCount: number;
  visitedCount: number;
  userPrefs: UserPreferences;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  favoritesCount,
  visitedCount,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';

  const navItems = [
    {
      id: 'home' as ScreenTab,
      label: 'Home',
      bengaliLabel: 'আজকের পুজো',
      icon: Home,
    },
    {
      id: 'discovery' as ScreenTab,
      label: 'Explore',
      bengaliLabel: 'প্যান্ডেল',
      icon: Compass,
    },
    {
      id: 'route' as ScreenTab,
      label: 'Routes',
      bengaliLabel: 'পরিক্রমা',
      icon: RouteIcon,
    },
    {
      id: 'group' as ScreenTab,
      label: 'Squad',
      bengaliLabel: 'আড্ডা ও দল',
      icon: Users,
    },
    {
      id: 'map' as ScreenTab,
      label: 'Map',
      bengaliLabel: 'ম্যাপ',
      icon: MapIcon,
    },
    {
      id: 'favorites' as ScreenTab,
      label: 'Saved',
      bengaliLabel: 'পছন্দ',
      icon: Bookmark,
      badge: favoritesCount > 0 ? favoritesCount : undefined,
    },
    {
      id: 'settings' as ScreenTab,
      label: 'Settings',
      bengaliLabel: 'সেটিংস',
      icon: SettingsIcon,
    },
  ];

  return (
    <nav
      id="bottom-navigation-bar"
      className={`fixed bottom-0 left-0 right-0 z-40 transition-colors duration-300 ${
        isDarkMode
          ? 'bg-[#1C1418]/95 border-t border-[#F59E0B]/25 text-stone-300'
          : 'bg-[#FFFCF7]/95 border-t border-stone-200/90 text-stone-700'
      } backdrop-blur-lg pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.08)]`}
    >
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onSelectTab(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 group ${
                isActive
                  ? isDarkMode
                    ? 'text-[#FDE68A]'
                    : 'text-[#991B1B]'
                  : isDarkMode
                  ? 'text-stone-400 hover:text-stone-200'
                  : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100/60'
              }`}
            >
              {/* Active Indicator Backdrop */}
              {isActive && (
                <div
                  className={`absolute inset-0 rounded-2xl -z-10 transition-transform ${
                    isDarkMode
                      ? 'bg-gradient-to-b from-[#881337]/50 to-[#281B23] border border-[#F59E0B]/30 shadow-xs'
                      : 'bg-gradient-to-b from-[#FEE2E2]/90 to-[#FEF3C7]/70 border border-[#DC2626]/20 shadow-xs'
                  }`}
                />
              )}

              {/* Icon Container with Badge */}
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive
                      ? 'scale-110 stroke-[2.6]'
                      : 'stroke-[2.1]'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-[#DC2626] text-white text-[9.5px] font-black px-1.5 py-0.2 rounded-full ring-2 ring-white shadow-xs tabular-nums">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className={`text-[11px] mt-0.5 tracking-tight ${isActive ? 'font-black' : 'font-bold'}`}>
                {item.label}
              </span>
              <span
                className={`text-[9.5px] -mt-0.5 font-bengali leading-none font-semibold ${
                  isActive
                    ? isDarkMode
                      ? 'text-[#FDE68A] font-bold'
                      : 'text-[#DC2626] font-bold'
                    : isDarkMode
                    ? 'text-stone-400'
                    : 'text-stone-500'
                }`}
              >
                {item.bengaliLabel}
              </span>

              {/* Active Golden/Red Dot */}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#DC2626] mt-0.5 shadow-xs" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
