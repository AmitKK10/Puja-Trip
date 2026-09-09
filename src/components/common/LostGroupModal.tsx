import React, { useState, useEffect } from 'react';
import {
  TripLostAlert,
  CityId,
  Pandal,
  UserPreferences,
  SuggestedMeetingPoint,
} from '../../types';
import {
  triggerImLostAlert,
  resolveImLostAlert,
  getActiveLostAlerts,
  computeEnhancedMeetingPoint,
} from '../../services/safetyAndUtilitiesService';
import { getCurrentUserProfile } from '../../services/friendGroupService';
import { getStoredGroupLocations } from '../../services/groupLocationService';
import { formatTimeAgo } from '../../utils/geoUtils';
import { DurgaThirdEye, ShankhaIcon, DhakIcon, AlpanaCorner } from './BengaliMotifs';
import {
  Compass,
  MapPin,
  Clock,
  Navigation,
  CheckCircle,
  Users,
  X,
  Radio,
  ArrowRight,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { playKanshorBell } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';

interface LostGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  activeCity: CityId;
  pandals: Pandal[];
  userPrefs: UserPreferences;
  onNavigateToPoint?: (lat: number, lng: number, name: string) => void;
}

export const LostGroupModal: React.FC<LostGroupModalProps> = ({
  isOpen,
  onClose,
  tripId,
  activeCity,
  pandals,
  userPrefs,
  onNavigateToPoint,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const currentUser = getCurrentUserProfile();
  const [activeLostList, setActiveLostList] = useState<TripLostAlert[]>(() => getActiveLostAlerts(tripId));
  const [isActivating, setIsActivating] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  // Meeting point preview
  const [meetingPoint, setMeetingPoint] = useState<SuggestedMeetingPoint | null>(() =>
    computeEnhancedMeetingPoint(tripId, activeCity, pandals)
  );

  const myActiveLost = activeLostList.find((a) => a.userId === currentUser.id);

  // Group locations
  const rawLocations = getStoredGroupLocations(tripId);
  const myLoc = rawLocations.find((l) => l.userId === currentUser.id && l.isSharing);
  const hasGps = Boolean(myLoc && myLoc.latitude !== 0 && myLoc.longitude !== 0);

  useEffect(() => {
    if (isOpen) {
      setActiveLostList(getActiveLostAlerts(tripId));
      setMeetingPoint(computeEnhancedMeetingPoint(tripId, activeCity, pandals));
    }
  }, [isOpen, tripId, activeCity, pandals]);

  if (!isOpen) return null;

  const handleTriggerLost = async () => {
    setIsActivating(true);
    playKanshorBell(0.5);

    try {
      const alert = await triggerImLostAlert(
        tripId,
        activeCity,
        customMsg.trim() || undefined,
        pandals
      );
      setActiveLostList(getActiveLostAlerts(tripId));
    } catch (err) {
      console.error('Error triggering Lost alert:', err);
    } finally {
      setIsActivating(false);
    }
  };

  const handleResolveLost = async (alertId?: string) => {
    await resolveImLostAlert(tripId, alertId);
    setActiveLostList(getActiveLostAlerts(tripId));
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div
      id="lost-group-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="lost-group-modal-card"
        className={`w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-scaleUp ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#D97706]/40 text-stone-100'
            : 'bg-[#FFFDF9] border-[#D97706]/30 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#F59E0B] text-white flex items-start justify-between shrink-0 overflow-hidden">
          <AlpanaCorner position="top-right" size={40} color="#FEF08A" className="absolute top-1 right-1 opacity-30" />
          <AlpanaCorner position="bottom-left" size={40} color="#FEF08A" className="absolute bottom-1 left-1 opacity-30" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner text-2xl">
              🧭
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/25 text-amber-200 text-micro uppercase font-bold tracking-wider">
                <Users className="w-3 h-3 text-amber-300" />
                <span>Squad Separation Helper</span>
              </div>
              <h2 className="font-display font-black text-h2 text-white mt-0.5">I'm Separated From Group</h2>
              <p className="font-bengali text-small text-amber-100">
                বন্ধুদের সাথে দূরত্ব ও প্রস্তাবিত মিলনস্থল
              </p>
            </div>
          </div>

          <button
            id="close-lost-modal-btn"
            onClick={onClose}
            className="relative z-10 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Active Lost State for Current User */}
          {myActiveLost ? (
            <div
              id="my-active-lost-box"
              className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-stone-900 dark:text-stone-100 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold">
                  <Compass className="w-6 h-6 animate-spin" />
                  <span className="font-display text-h3 uppercase">"I'm Lost" Alert Sent</span>
                </div>
                <span className="text-micro font-bold px-2 py-0.5 rounded-md bg-amber-600 text-white uppercase">
                  Squad Notified
                </span>
              </div>

              <p className="text-small text-stone-600 dark:text-stone-300">
                Your squad knows you are separated. Check the distance and suggested meeting spot below.
              </p>

              {/* Distance from Group info */}
              <div className="grid grid-cols-2 gap-2 text-small">
                <div className="p-3 rounded-xl bg-white/80 dark:bg-black/40 border border-amber-200 dark:border-amber-900/50">
                  <span className="text-micro uppercase text-stone-500 dark:text-stone-400 font-bold block">
                    Distance to Squad
                  </span>
                  <span className="font-display font-black text-h3 text-amber-700 dark:text-amber-300 mt-0.5 block">
                    {myActiveLost.formattedDistanceFromGroup || 'Calculating...'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/80 dark:bg-black/40 border border-amber-200 dark:border-amber-900/50">
                  <span className="text-micro uppercase text-stone-500 dark:text-stone-400 font-bold block">
                    Direction
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xl">{myActiveLost.arrowIcon || '🧭'}</span>
                    <span className="font-display font-bold text-h4 text-stone-800 dark:text-stone-200">
                      {myActiveLost.directionFromGroup || 'Nearby'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggested Meeting Point */}
              {myActiveLost.suggestedMeetingPoint && (
                <div className="p-3.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-micro font-bold text-amber-800 dark:text-amber-300 uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Suggested Meeting Point</span>
                  </div>
                  <h4 className="font-display font-bold text-h4 text-stone-900 dark:text-stone-100">
                    {myActiveLost.suggestedMeetingPoint.nearestLandmarkName}
                  </h4>
                  <p className="text-micro text-stone-600 dark:text-stone-400">
                    {myActiveLost.suggestedMeetingPoint.bengaliDescription}
                  </p>

                  {onNavigateToPoint && (
                    <button
                      onClick={() => {
                        onNavigateToPoint(
                          myActiveLost.suggestedMeetingPoint!.latitude,
                          myActiveLost.suggestedMeetingPoint!.longitude,
                          myActiveLost.suggestedMeetingPoint!.nearestLandmarkName
                        );
                        onClose();
                      }}
                      className="w-full mt-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-small shadow-sm flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Meet Here / Navigate</span>
                    </button>
                  )}
                </div>
              )}

              <button
                id="resolve-my-lost-btn"
                onClick={() => handleResolveLost(myActiveLost.id)}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-display font-bold text-h4 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>I Found My Squad / Cancel Alert</span>
              </button>
            </div>
          ) : (
            /* Lost Trigger Card */
            <div className="space-y-3.5">
              <div
                className={`p-4 rounded-2xl border text-small ${
                  isDarkMode
                    ? 'bg-[#251A20] border-stone-800 text-stone-300'
                    : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-2 font-display font-bold text-stone-900 dark:text-stone-100">
                  <Compass className="w-4 h-4 text-[#D97706]" />
                  <span>How "I'm Lost" Works</span>
                </div>
                <p className="mt-1.5 text-micro opacity-90 leading-relaxed">
                  Sends a gentle ping to your group members with your live distance, relative direction, and an automatically calculated central meeting point.
                </p>
              </div>

              {/* Suggested Meeting Point Preview */}
              {meetingPoint && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-2">
                  <div className="flex items-center justify-between text-micro text-amber-800 dark:text-amber-300 font-bold uppercase">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Central Meeting Point</span>
                    </span>
                    <span>~{meetingPoint.formattedAverageDistance} avg walk</span>
                  </div>
                  <h4 className="font-display font-bold text-h4 text-stone-900 dark:text-stone-100">
                    {meetingPoint.nearestLandmarkName}
                  </h4>
                  <p className="font-bengali text-small text-[#991B1B] dark:text-amber-300">
                    {meetingPoint.bengaliLandmarkName}
                  </p>
                </div>
              )}

              {/* Optional Note */}
              <div>
                <label className="block text-micro uppercase font-bold text-stone-500 dark:text-stone-400 mb-1">
                  Optional Message to Squad
                </label>
                <input
                  id="lost-custom-note-input"
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Standing near Book Stall 4..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#2A1C22] text-small focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  maxLength={100}
                />
              </div>

              {/* BIG "I'M LOST" BUTTON */}
              <button
                id="activate-im-lost-btn"
                onClick={handleTriggerLost}
                disabled={isActivating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D97706] via-[#B45309] to-[#92400E] hover:brightness-110 active:scale-98 text-white font-display font-black text-h3 shadow-xl border-2 border-amber-400/50 transition-all flex items-center justify-center gap-3"
              >
                <Compass className="w-6 h-6 animate-pulse" />
                <span>{isActivating ? 'Notifying Squad...' : "NOTIFY SQUAD: I'M LOST"}</span>
              </button>
            </div>
          )}

          {/* Active Lost from OTHER members */}
          {activeLostList.filter((a) => a.userId !== currentUser.id).length > 0 && (
            <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
              <h3 className="font-display font-bold text-h4 text-amber-700 dark:text-amber-400 flex items-center gap-1.5 uppercase">
                <Radio className="w-4 h-4 text-amber-500 animate-ping" />
                <span>Separated Squad Members ({activeLostList.filter((a) => a.userId !== currentUser.id).length})</span>
              </h3>

              {activeLostList
                .filter((a) => a.userId !== currentUser.id)
                .map((lost) => (
                  <div
                    key={lost.id}
                    className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{lost.userAvatar || '🪔'}</span>
                        <div>
                          <h4 className="font-bold text-h4 text-stone-900 dark:text-stone-100">
                            {lost.userName}
                          </h4>
                          <span className="text-micro text-stone-500">
                            Notified {formatTimeAgo(lost.timestamp)}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-micro font-bold uppercase">
                        Separated
                      </span>
                    </div>

                    {lost.message && (
                      <p className="text-small bg-white/70 dark:bg-black/30 p-2.5 rounded-xl border border-amber-200 dark:border-amber-900/40 text-stone-800 dark:text-stone-200 font-medium">
                        "{lost.message}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-small pt-1">
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                        <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                        <span className="text-micro font-medium">
                          {lost.isLocationAvailable
                            ? lost.nearestLandmark || `${lost.latitude.toFixed(4)}, ${lost.longitude.toFixed(4)}`
                            : 'Location unavailable'}
                        </span>
                      </div>

                      {lost.isLocationAvailable && onNavigateToPoint && (
                        <button
                          onClick={() => {
                            onNavigateToPoint(lost.latitude, lost.longitude, lost.userName);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-micro shadow-sm flex items-center gap-1 transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Find {lost.userName.split(' ')[0]}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#251A20] flex items-center justify-between shrink-0">
          <span className="text-micro text-stone-500 dark:text-stone-400">
            Squad Reunion Helper • PujaTrip
          </span>
          <button
            id="lost-close-btn"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 font-bold text-small hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
