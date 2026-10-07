import React, { useState } from 'react';
import { GroupMemberLocation } from '../../types';
import { FESTIVE_AVATARS } from '../../services/friendGroupService';
import { formatTimeAgo } from '../../utils/geoUtils';
import {
  Phone,
  MessageCircle,
  Navigation,
  X,
  Crown,
  Shield,
  MapPin,
  Clock,
  Compass,
  AlertCircle,
  Footprints,
} from 'lucide-react';

interface SquadMemberDetailSheetProps {
  member: GroupMemberLocation;
  onClose: () => void;
  onNavigateToCoords?: (lat: number, lng: number) => void;
  onShowToast?: (msg: string) => void;
  isDarkMode?: boolean;
}

export const SquadMemberDetailSheet: React.FC<SquadMemberDetailSheetProps> = ({
  member,
  onClose,
  onNavigateToCoords,
  onShowToast,
  isDarkMode = false,
}) => {
  const [callAlert, setCallAlert] = useState<string | null>(null);

  const profile = member.profile;
  const avatar =
    FESTIVE_AVATARS.find((a) => a.id === (member.userAvatar || profile?.avatarUrl)) ||
    FESTIVE_AVATARS[0];

  const phoneNumber = member.phoneNumber || profile?.phoneNumber || null;
  const role = member.role || (profile?.displayName?.includes('Admin') ? 'admin' : 'member');
  const isSharing = member.isSharing && member.status !== 'disabled' && member.status !== 'location_off';
  const hasCoords = member.latitude !== 0 && member.longitude !== 0 && isSharing;

  // Calculate live status according to timestamps
  const diffMs = member.updatedAt ? Date.now() - new Date(member.updatedAt).getTime() : Infinity;
  const isLive = isSharing && diffMs <= 60 * 1000;
  const isRecent = isSharing && diffMs > 60 * 1000 && diffMs <= 10 * 60 * 1000;
  const isOffline = isSharing && diffMs > 10 * 60 * 1000;

  const statusBadge = !isSharing ? (
    <span className="px-2 py-0.5 rounded-full bg-stone-500/15 text-stone-600 dark:text-stone-400 text-micro font-bold flex items-center gap-1 border border-stone-500/20">
      <span className="w-2 h-2 rounded-full bg-stone-400" />
      <span>LOCATION OFF</span>
    </span>
  ) : isLive ? (
    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-micro font-bold flex items-center gap-1 border border-emerald-500/30">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span>● LIVE</span>
    </span>
  ) : isRecent ? (
    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 text-micro font-bold flex items-center gap-1 border border-amber-500/30">
      <span className="w-2 h-2 rounded-full bg-amber-500" />
      <span>RECENT</span>
    </span>
  ) : (
    <span className="px-2 py-0.5 rounded-full bg-stone-500/15 text-stone-600 dark:text-stone-400 text-micro font-bold flex items-center gap-1 border border-stone-500/20">
      <span className="w-2 h-2 rounded-full bg-stone-400" />
      <span>OFFLINE</span>
    </span>
  );

  // Time ago text based on real timestamp
  const lastUpdatedText = member.updatedAt
    ? `Updated ${formatTimeAgo(member.updatedAt)}`
    : 'No recent updates';

  // Handle Intentional Calling
  const handleCall = () => {
    if (!phoneNumber) {
      const msg = 'Phone number not available.';
      setCallAlert(msg);
      onShowToast?.(msg);
      return;
    }
    // Launch device's native dialer intentionally
    window.location.href = `tel:${phoneNumber.replace(/\s+/g, '')}`;
  };

  // Handle Messaging
  const handleMessage = () => {
    if (!phoneNumber) {
      const msg = 'Phone number not available for direct messaging.';
      setCallAlert(msg);
      onShowToast?.(msg);
      return;
    }
    window.location.href = `sms:${phoneNumber.replace(/\s+/g, '')}`;
  };

  // Handle Directions
  const handleDirections = () => {
    if (!hasCoords) {
      onShowToast?.('Live coordinates not available.');
      return;
    }
    if (onNavigateToCoords) {
      onNavigateToCoords(member.latitude, member.longitude);
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${member.latitude},${member.longitude}`,
        '_blank'
      );
    }
  };

  return (
    <div
      id="squad-member-floating-card"
      className="absolute bottom-3 left-3 right-3 z-30 animate-slideUp pointer-events-auto"
    >
      <div
        className={`p-3.5 rounded-2xl border shadow-xl backdrop-blur-md flex flex-col gap-2.5 transition-all ${
          isDarkMode
            ? 'bg-stone-900/98 border-[#F59E0B]/30 text-white'
            : 'bg-white/98 border-[#D97706]/30 text-stone-900'
        }`}
      >
        {/* Header Row: Avatar, Member Info, Status, Close */}
        <div className="flex items-start justify-between gap-3">
          {/* Avatar */}
          <div
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr ${avatar.gradient} flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-md ring-2 ring-white/40 dark:ring-stone-800`}
          >
            {avatar.emoji}
          </div>

          {/* Member Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {statusBadge}

              {/* Role badge */}
              {role === 'admin' ? (
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-micro font-bold flex items-center gap-1 border border-amber-500/30">
                  <Crown className="w-3 h-3 text-amber-500" />
                  <span>Admin</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-micro font-bold">
                  Member
                </span>
              )}
            </div>

            <h4 className="font-display font-black text-small sm:text-h4 text-stone-900 dark:text-white truncate mt-1">
              {member.userName}
            </h4>

            {profile?.bengaliName && (
              <p className="font-bengali text-micro text-[#DC2626] font-bold truncate">
                {profile.bengaliName}
              </p>
            )}

            {/* Timestamp & Distance info */}
            <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{lastUpdatedText}</span>
              </span>
              {isSharing && member.formattedDistance && (
                <>
                  <span>•</span>
                  <span className="font-semibold text-stone-700 dark:text-stone-300">
                    {member.formattedDistance} away
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
            title="Dismiss Sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Area / Nearest Public Pandal (Only shown if consented / sharing) */}
        {isSharing && member.nearestLandmarkName && (
          <div
            className={`p-2 rounded-xl text-micro flex items-center justify-between border ${
              isDarkMode ? 'bg-[#241820] border-stone-800' : 'bg-amber-50/70 border-amber-200/60'
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#DC2626] shrink-0" />
              <div className="truncate">
                <span className="text-stone-400 font-medium">Nearest Pandal / Area: </span>
                <strong className="text-stone-800 dark:text-stone-200 font-bold">
                  {member.nearestLandmarkName}
                </strong>
              </div>
            </div>
            {member.direction && (
              <span className="text-[10px] text-stone-500 font-semibold shrink-0 ml-2">
                {member.arrowIcon} {member.direction}
              </span>
            )}
          </div>
        )}

        {/* Call Alert Toast / Feedback if no phone */}
        {callAlert && (
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-micro font-semibold flex items-center justify-between gap-1 animate-fadeIn">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{callAlert}</span>
            </div>
            <button
              onClick={() => setCallAlert(null)}
              className="text-stone-400 hover:text-stone-600 text-[10px] font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Action Buttons Row: [ Call ], [ Message ], [ Directions ] */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-stone-100 dark:border-stone-800/80">
          {/* 1. CALL */}
          <button
            type="button"
            id="btn-call-squad-member"
            onClick={handleCall}
            className={`py-2 px-3 rounded-xl font-bold text-micro shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer ${
              phoneNumber
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white'
                : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-300 dark:border-stone-700'
            }`}
            title={phoneNumber ? `Call ${phoneNumber}` : 'Call squad member'}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Call</span>
          </button>

          {/* 2. MESSAGE */}
          <button
            type="button"
            id="btn-message-squad-member"
            onClick={handleMessage}
            className="py-2 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-micro border border-stone-300 dark:border-stone-700 flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            title="Send SMS message"
          >
            <MessageCircle className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Message</span>
          </button>

          {/* 3. DIRECTIONS */}
          <button
            type="button"
            id="btn-directions-squad-member"
            disabled={!hasCoords}
            onClick={handleDirections}
            className="py-2 px-3 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] hover:brightness-110 disabled:opacity-40 text-white font-bold text-micro shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            title="Get directions to squad member"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Directions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
