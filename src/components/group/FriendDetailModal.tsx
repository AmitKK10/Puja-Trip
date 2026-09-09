import React, { useState } from 'react';
import { GroupMemberLocation, UserPreferences } from '../../types';
import { FESTIVE_AVATARS } from '../../services/friendGroupService';
import { formatTimeAgo } from '../../utils/geoUtils';
import {
  X,
  MapPin,
  Compass,
  Footprints,
  Clock,
  Navigation,
  CheckCircle2,
  Sparkles,
  Crown,
  Share2,
  ArrowRight,
  ShieldCheck,
  Radio,
  LocateFixed,
} from 'lucide-react';

interface FriendDetailModalProps {
  memberLocation: GroupMemberLocation;
  totalTripPandals?: number;
  visitedPandalsCount?: number;
  onFindFriend: (member: GroupMemberLocation) => void;
  onClose: () => void;
  userPrefs: UserPreferences;
}

export const FriendDetailModal: React.FC<FriendDetailModalProps> = ({
  memberLocation,
  totalTripPandals = 8,
  visitedPandalsCount = 5,
  onFindFriend,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [showMeetGuidance, setShowMeetGuidance] = useState(false);

  const profile = memberLocation.profile;
  const avatar =
    FESTIVE_AVATARS.find((a) => a.id === (memberLocation.userAvatar || profile?.avatarUrl)) ||
    FESTIVE_AVATARS[0];

  const hasCoordinates = memberLocation.latitude !== 0 && memberLocation.longitude !== 0;
  const isSharing = memberLocation.isSharing && memberLocation.status !== 'disabled';
  const isStale = memberLocation.status === 'stale';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-white border-[#D97706]/30 text-stone-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 border-b flex items-center justify-between ${
            isDarkMode ? 'bg-[#281B23] border-stone-800' : 'bg-[#FEF3C7]/40 border-stone-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
              Squad Friend Details
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Profile Card */}
          <div className="flex items-center gap-3.5">
            <div
              className={`w-16 h-16 rounded-2xl bg-gradient-to-tr ${avatar.gradient} flex items-center justify-center text-3xl shadow-md ring-2 ring-white/30 shrink-0`}
            >
              {avatar.emoji}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-display font-black text-h2 text-stone-900 dark:text-white truncate">
                  {memberLocation.userName}
                </h4>
                {memberLocation.profile?.displayName?.includes('Admin') && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span>Admin</span>
                  </span>
                )}
              </div>

              {profile?.bengaliName && (
                <p className="font-bengali-serif text-small text-[#DC2626] font-bold">
                  {profile.bengaliName}
                </p>
              )}

              <div className="flex items-center gap-2 mt-1 text-micro text-stone-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      !isSharing
                        ? 'bg-stone-400'
                        : memberLocation.isStationary
                        ? 'bg-teal-500 animate-pulse'
                        : isStale
                        ? 'bg-amber-500'
                        : 'bg-emerald-500 animate-pulse'
                    }`}
                  />
                  <span>
                    {!isSharing
                      ? 'Location sharing disabled'
                      : memberLocation.isStationary
                      ? `Stationary in queue (${memberLocation.stationaryDurationMinutes || 5}m)`
                      : isStale
                      ? 'Last known location'
                      : 'Live Location Active'}
                  </span>
                </span>
                <span>•</span>
                <span>Updated {formatTimeAgo(memberLocation.updatedAt)}</span>
              </div>

              {/* Eco Battery Saver & Stationary status pill */}
              {isSharing && (memberLocation.isStationary || memberLocation.isBatterySaver) && (
                <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                  {memberLocation.isStationary && (
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-800 dark:text-teal-300 border border-teal-500/30 text-[10px] font-bold flex items-center gap-1">
                      <span>💤 GPS Sleeping (Queue / Resting)</span>
                    </span>
                  )}
                  {memberLocation.isBatterySaver && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold flex items-center gap-1">
                      <span>🔋 Eco Battery Saver Active</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Live Proximity & Direction Metric Cards */}
          {isSharing && hasCoordinates ? (
            <div className="grid grid-cols-2 gap-2.5">
              {/* Distance from me */}
              <div
                className={`p-3 rounded-2xl border ${
                  isDarkMode ? 'bg-[#281B23] border-stone-800' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-micro text-stone-500 font-semibold">
                  <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Distance from me</span>
                </div>
                <div className="font-display font-black text-h2 text-[#991B1B] dark:text-[#FEF08A] mt-1 tabular-nums">
                  {memberLocation.formattedDistance || 'Nearby'}
                </div>
                <span className="text-[10px] text-stone-400 block font-medium">Straight line</span>
              </div>

              {/* Bearing & Direction */}
              <div
                className={`p-3 rounded-2xl border ${
                  isDarkMode ? 'bg-[#281B23] border-stone-800' : 'bg-stone-50 border-stone-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-micro text-stone-500 font-semibold">
                  <Compass className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Direction from me</span>
                </div>
                <div className="font-display font-black text-h3 text-stone-800 dark:text-stone-100 mt-1 flex items-center gap-1.5">
                  <span className="text-xl">{memberLocation.arrowIcon || '🧭'}</span>
                  <span>{memberLocation.direction || 'North'}</span>
                </div>
                <span className="text-[10px] text-[#DC2626] font-bengali font-bold block">
                  {memberLocation.bengaliDirection || ''}
                </span>
              </div>
            </div>
          ) : (
            <div
              className={`p-3.5 rounded-2xl border text-center ${
                isDarkMode ? 'bg-[#22161E] border-stone-800' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <Radio className="w-5 h-5 text-stone-400 mx-auto mb-1" />
              <p className="text-small font-bold text-stone-700 dark:text-stone-300">
                Live Location Not Active
              </p>
              <p className="text-micro text-stone-500 mt-0.5">
                {memberLocation.userName} has paused location sharing or is offline.
              </p>
            </div>
          )}

          {/* Nearest Area / Landmark */}
          {memberLocation.nearestLandmarkName && (
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between text-small ${
                isDarkMode ? 'bg-[#241820] border-stone-800' : 'bg-amber-50/60 border-amber-200/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#DC2626] shrink-0" />
                <div>
                  <span className="text-micro text-stone-500 block font-semibold">Current Area:</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200">
                    {memberLocation.nearestLandmarkName}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Darshan & Trip Progress */}
          <div
            className={`p-3.5 rounded-2xl border space-y-2 ${
              isDarkMode ? 'bg-[#241820] border-stone-800' : 'bg-stone-50 border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-micro font-bold text-stone-500">Trip Darshan Progress</span>
              <span className="text-small font-black text-[#DC2626] tabular-nums">
                {visitedPandalsCount} / {totalTripPandals} Pandals Visited
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-[#DC2626] transition-all duration-300"
                style={{
                  width: `${Math.round((visitedPandalsCount / (totalTripPandals || 1)) * 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Action Buttons: Find Friend & Meet Friend */}
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onFindFriend(memberLocation);
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-btn border border-stone-300 dark:border-stone-700 transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <LocateFixed className="w-4 h-4 text-[#DC2626]" />
                <span>Find Friend</span>
              </button>

              <button
                onClick={() => setShowMeetGuidance(!showMeetGuidance)}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white font-bold text-btn shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Footprints className="w-4 h-4" />
                <span>Meet Friend</span>
              </button>
            </div>

            {/* Meet Friend Walk Guidance Card (Future-Ready Structure) */}
            {showMeetGuidance && (
              <div
                className={`p-4 rounded-2xl border space-y-2.5 animate-fadeIn ${
                  isDarkMode
                    ? 'bg-[#2E1B26] border-[#DC2626]/40 text-white'
                    : 'bg-gradient-to-br from-amber-50 to-orange-50/70 border-amber-300 text-stone-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Footprints className="w-4 h-4 text-[#DC2626]" />
                    <span className="font-display font-bold text-small text-[#881337] dark:text-[#FEF08A]">
                      Meet {memberLocation.userName.split(' ')[0]}
                    </span>
                  </div>
                  <span className="text-micro font-bold text-[#DC2626] tabular-nums">
                    ~{memberLocation.estimatedWalkingMinutes || 8} mins walk
                  </span>
                </div>

                <div className="space-y-1.5 text-micro text-stone-600 dark:text-stone-300">
                  <p className="flex items-center gap-1.5">
                    <span>📍</span>
                    <span>
                      Friend Location: <strong>{memberLocation.nearestLandmarkName || 'Nearby'}</strong>
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span>🧭</span>
                    <span>
                      Heading:{' '}
                      <strong>
                        {memberLocation.arrowIcon} {memberLocation.direction || 'Ahead'}
                      </strong>{' '}
                      ({memberLocation.formattedDistance || 'Short walk'})
                    </span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span>🚶</span>
                    <span>
                      Walking Distance:{' '}
                      <strong>{memberLocation.formattedWalkingDistance || '~650m'}</strong>
                    </span>
                  </p>
                </div>

                <div className="pt-2 border-t border-amber-200 dark:border-stone-700 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Routing placeholder ready for future turns</span>
                  <button
                    onClick={() => {
                      onFindFriend(memberLocation);
                      onClose();
                    }}
                    className="text-[#DC2626] font-bold hover:underline"
                  >
                    Locate on Map →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
