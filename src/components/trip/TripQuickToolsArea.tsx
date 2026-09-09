import React from 'react';
import { UserPreferences, CityId } from '../../types';
import {
  AlertOctagon,
  Compass,
  Users,
  Train,
  Phone,
  Shield,
  MapPin,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { playKanshorBell } from '../../utils/audioSynth';

interface TripQuickToolsAreaProps {
  activeCity: CityId;
  onOpenSOS: () => void;
  onOpenLost: () => void;
  onOpenMeetingPoint: () => void;
  onFindFriend: () => void;
  onFindNearbyMetro: () => void;
  onFindNearbyToilet: () => void;
  onFindNearbyFood: () => void;
  onOpenEmergencyInfo: () => void;
  userPrefs: UserPreferences;
}

export const TripQuickToolsArea: React.FC<TripQuickToolsAreaProps> = ({
  activeCity,
  onOpenSOS,
  onOpenLost,
  onOpenMeetingPoint,
  onFindFriend,
  onFindNearbyMetro,
  onFindNearbyToilet,
  onFindNearbyFood,
  onOpenEmergencyInfo,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';

  const tools = [
    {
      id: 'tool-sos',
      title: 'Group SOS',
      bengaliTitle: 'জরুরি এসওএস',
      icon: '🆘',
      color: 'bg-red-500 hover:bg-red-600 text-white border-red-600',
      action: onOpenSOS,
      badge: 'Emergency',
    },
    {
      id: 'tool-lost',
      title: "I'm Lost",
      bengaliTitle: 'দলচ্যুত',
      icon: '🧭',
      color: 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600',
      action: onOpenLost,
      badge: 'Reunion',
    },
    {
      id: 'tool-meet-point',
      title: 'Meeting Point',
      bengaliTitle: 'মিলনস্থল',
      icon: '🤝',
      color: isDarkMode ? 'bg-[#3A222E] hover:bg-[#482B3B] text-white border-[#F59E0B]/30' : 'bg-white hover:bg-amber-50 text-stone-900 border-amber-200',
      action: onOpenMeetingPoint,
    },
    {
      id: 'tool-find-friend',
      title: 'Find Friend',
      bengaliTitle: 'বন্ধু সন্ধান',
      icon: '📍',
      color: isDarkMode ? 'bg-[#3A222E] hover:bg-[#482B3B] text-white border-[#F59E0B]/30' : 'bg-white hover:bg-amber-50 text-stone-900 border-amber-200',
      action: onFindFriend,
    },
    {
      id: 'tool-nearby-metro',
      title: activeCity === 'kolkata' ? 'Nearby Metro' : 'Bus Stand',
      bengaliTitle: activeCity === 'kolkata' ? 'মেট্রো স্টেশন' : 'বাস স্ট্যান্ড',
      icon: activeCity === 'kolkata' ? '🚇' : '🚌',
      color: isDarkMode ? 'bg-[#3A222E] hover:bg-[#482B3B] text-white border-blue-500/30' : 'bg-white hover:bg-blue-50 text-stone-900 border-blue-200',
      action: onFindNearbyMetro,
    },
    {
      id: 'tool-nearby-toilet',
      title: 'Nearby Toilet',
      bengaliTitle: 'পৌর শৌচাগার',
      icon: '🚻',
      color: isDarkMode ? 'bg-[#3A222E] hover:bg-[#482B3B] text-white border-sky-500/30' : 'bg-white hover:bg-sky-50 text-stone-900 border-sky-200',
      action: onFindNearbyToilet,
    },
    {
      id: 'tool-nearby-food',
      title: 'Food & Bhog',
      bengaliTitle: 'খাবার ও চা',
      icon: '🍴',
      color: isDarkMode ? 'bg-[#3A222E] hover:bg-[#482B3B] text-white border-rose-500/30' : 'bg-white hover:bg-rose-50 text-stone-900 border-rose-200',
      action: onFindNearbyFood,
    },
    {
      id: 'tool-emergency-info',
      title: 'Emergency 112',
      bengaliTitle: 'জরুরি হেল্পলাইন',
      icon: '📞',
      color: isDarkMode ? 'bg-[#3A222E] hover:bg-[#482B3B] text-white border-red-500/30' : 'bg-white hover:bg-red-50 text-stone-900 border-red-200',
      action: onOpenEmergencyInfo,
      badge: 'Official',
    },
  ];

  return (
    <section
      id="trip-quick-tools-area"
      className={`p-3.5 sm:p-4 rounded-3xl border shadow-sm ${
        isDarkMode
          ? 'bg-[#251A20] border-[#F59E0B]/20 text-stone-100'
          : 'bg-[#FFFDF9] border-[#D97706]/20 text-stone-900'
      }`}
    >
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-[#DC2626]" />
          <h3 className="font-display font-bold text-h4 text-[#881337] dark:text-[#FDE68A] uppercase tracking-wide">
            Trip Safety & Quick Tools
          </h3>
        </div>
        <span className="text-micro text-stone-500 font-bold uppercase">
          Live Actions
        </span>
      </div>

      {/* Grid of Large Touch Targets (min 48px height) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tools.map((tool) => {
          return (
            <button
              key={tool.id}
              id={tool.id}
              onClick={() => {
                playKanshorBell(0.5);
                tool.action();
              }}
              className={`min-h-[52px] p-2.5 rounded-2xl border shadow-sm transition-all duration-150 active:scale-95 flex items-center gap-2.5 text-left relative overflow-hidden ${tool.color}`}
            >
              <div className="w-9 h-9 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center text-xl shrink-0">
                {tool.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <span className="font-display font-bold text-small leading-tight truncate">
                    {tool.title}
                  </span>
                  {tool.badge && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-black/25 text-amber-200 shrink-0">
                      {tool.badge}
                    </span>
                  )}
                </div>
                <span className="font-bengali text-micro opacity-85 block truncate">
                  {tool.bengaliTitle}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
