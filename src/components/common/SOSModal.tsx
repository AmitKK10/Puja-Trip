import React, { useState, useEffect } from 'react';
import {
  TripSOSAlert,
  CityId,
  Pandal,
  UserPreferences,
  GroupMemberLocation,
} from '../../types';
import {
  triggerGroupSOS,
  cancelGroupSOS,
  getActiveSOSAlerts,
} from '../../services/safetyAndUtilitiesService';
import { getCurrentUserProfile } from '../../services/friendGroupService';
import { getStoredGroupLocations } from '../../services/groupLocationService';
import { formatTimeAgo } from '../../utils/geoUtils';
import { DurgaThirdEye, ShankhaIcon, DhakIcon, AlpanaCorner } from './BengaliMotifs';
import {
  AlertOctagon,
  ShieldAlert,
  ShieldCheck,
  MapPin,
  Clock,
  Navigation,
  Phone,
  X,
  AlertTriangle,
  Radio,
  Volume2,
} from 'lucide-react';
import { playKanshorBell } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';

interface SOSModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  activeCity: CityId;
  pandals: Pandal[];
  userPrefs: UserPreferences;
  onOpenEmergencyNumbers?: () => void;
  onNavigateToCoords?: (lat: number, lng: number, name: string) => void;
}

export const SOSModal: React.FC<SOSModalProps> = ({
  isOpen,
  onClose,
  tripId,
  activeCity,
  pandals,
  userPrefs,
  onOpenEmergencyNumbers,
  onNavigateToCoords,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const currentUser = getCurrentUserProfile();
  const [activeSOSList, setActiveSOSList] = useState<TripSOSAlert[]>(() => getActiveSOSAlerts(tripId));
  const [isActivating, setIsActivating] = useState(false);
  const [customMsg, setCustomMsg] = useState('');

  // Check if current user has an active SOS
  const myActiveSOS = activeSOSList.find((a) => a.userId === currentUser.id);

  // Check user's current location from storage
  const rawLocations = getStoredGroupLocations(tripId);
  const myLoc = rawLocations.find((l) => l.userId === currentUser.id && l.isSharing);
  const hasGps = Boolean(myLoc && myLoc.latitude !== 0 && myLoc.longitude !== 0);

  useEffect(() => {
    if (isOpen) {
      setActiveSOSList(getActiveSOSAlerts(tripId));
    }
  }, [isOpen, tripId]);

  if (!isOpen) return null;

  const handleTriggerSOS = async () => {
    setIsActivating(true);
    playKanshorBell(0.8);

    try {
      const alert = await triggerGroupSOS(
        tripId,
        activeCity,
        customMsg.trim() || undefined,
        pandals
      );
      setActiveSOSList(getActiveSOSAlerts(tripId));
    } catch (err) {
      console.error('Error triggering SOS:', err);
    } finally {
      setIsActivating(false);
    }
  };

  const handleCancelSOS = async (alertId?: string) => {
    await cancelGroupSOS(tripId, alertId);
    setActiveSOSList(getActiveSOSAlerts(tripId));
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div
      id="sos-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="sos-modal-card"
        className={`w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden animate-scaleUp ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#DC2626]/50 text-stone-100'
            : 'bg-[#FFFDF9] border-[#DC2626]/40 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="relative p-5 bg-gradient-to-r from-[#7F1D1D] via-[#991B1B] to-[#DC2626] text-white flex items-start justify-between shrink-0 overflow-hidden">
          <AlpanaCorner position="top-right" size={40} color="#FDE68A" className="absolute top-1 right-1 opacity-25" />
          <AlpanaCorner position="bottom-left" size={40} color="#FDE68A" className="absolute bottom-1 left-1 opacity-25" />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center shadow-inner text-2xl animate-pulse">
              🆘
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/30 text-amber-200 text-micro uppercase font-bold tracking-wider">
                <Radio className="w-3 h-3 text-red-300 animate-ping" />
                <span>Squad Emergency SOS</span>
              </div>
              <h2 className="font-display font-black text-h2 text-white mt-0.5">Emergency Group Alert</h2>
              <p className="font-bengali text-small text-amber-100">
                জরুরি পরিস্থিতিতে গ্রুপের বন্ধুদের তাৎক্ষণিক অবস্থান পাঠানো
              </p>
            </div>
          </div>

          <button
            id="close-sos-modal-btn"
            onClick={onClose}
            className="relative z-10 w-9 h-9 rounded-full bg-black/25 hover:bg-black/40 text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Active SOS Banner for Current User */}
          {myActiveSOS ? (
            <div
              id="my-active-sos-box"
              className="p-4 sm:p-5 rounded-2xl bg-red-500/15 border-2 border-red-500 text-stone-900 dark:text-stone-100 animate-pulse space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                  <AlertOctagon className="w-6 h-6 animate-spin" />
                  <span className="font-display text-h3 uppercase">Your SOS is Active</span>
                </div>
                <span className="text-micro font-bold px-2 py-0.5 rounded-md bg-red-600 text-white uppercase">
                  Alerting Squad
                </span>
              </div>

              <p className="text-small text-stone-600 dark:text-stone-300">
                Your group members have received your emergency alert. Keep this app open to update your location live.
              </p>

              <div className="p-3 rounded-xl bg-white/80 dark:bg-black/40 border border-red-200 dark:border-red-900/50 space-y-1.5 text-small">
                <div className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="font-semibold">
                    {myActiveSOS.isLocationAvailable
                      ? myActiveSOS.nearestLandmark || `${myActiveSOS.latitude.toFixed(4)}, ${myActiveSOS.longitude.toFixed(4)}`
                      : 'Location Unavailable (GPS not sharing)'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-micro">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Alert sent {formatTimeAgo(myActiveSOS.timestamp)}</span>
                </div>
              </div>

              <button
                id="cancel-my-sos-btn"
                onClick={() => handleCancelSOS(myActiveSOS.id)}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-display font-bold text-h4 shadow-md transition-all flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>I'm Safe / Cancel SOS</span>
              </button>
            </div>
          ) : (
            /* SOS Trigger Card */
            <div className="space-y-3.5">
              <div
                className={`p-4 rounded-2xl border text-small ${
                  isDarkMode
                    ? 'bg-[#251A20] border-stone-800 text-stone-300'
                    : 'bg-stone-50 border-stone-200 text-stone-700'
                }`}
              >
                <div className="flex items-center gap-2 font-display font-bold text-stone-900 dark:text-stone-100">
                  <ShieldAlert className="w-4 h-4 text-red-500" />
                  <span>How Group SOS Works</span>
                </div>
                <ul className="mt-2 space-y-1 text-micro opacity-90 list-disc list-inside">
                  <li>Broadcasts an immediate red alert to all trip squad members.</li>
                  <li>Shares your latest known GPS position and nearest landmark.</li>
                  <li>Allows your friends to navigate directly to your coordinates.</li>
                  <li>Does NOT call emergency services or send automated SMS.</li>
                </ul>
              </div>

              {/* Location Availability Status */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between text-small ${
                  hasGps
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="font-semibold text-micro">
                    {hasGps
                      ? 'GPS Location Sharing is Active'
                      : 'Location sharing is OFF (Will alert without GPS)'}
                  </span>
                </div>
                <span className="text-micro font-bold uppercase">
                  {hasGps ? '🟢 Ready' : '🟡 Offline GPS'}
                </span>
              </div>

              {/* Optional Custom Note */}
              <div>
                <label className="block text-micro uppercase font-bold text-stone-500 dark:text-stone-400 mb-1">
                  Optional Quick Note (e.g. Lost in crowd / Medical aid needed)
                </label>
                <input
                  id="sos-custom-note-input"
                  type="text"
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Need help near Pandal Gate 2..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-[#2A1C22] text-small focus:ring-2 focus:ring-red-500 focus:outline-none"
                  maxLength={100}
                />
              </div>

              {/* BIG SOS BUTTON */}
              <button
                id="activate-group-sos-btn"
                onClick={handleTriggerSOS}
                disabled={isActivating}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#DC2626] via-[#B91C1C] to-[#991B1B] hover:brightness-110 active:scale-98 text-white font-display font-black text-h3 sm:text-h2 shadow-xl border-2 border-red-400/50 transition-all flex items-center justify-center gap-3"
              >
                <AlertOctagon className="w-6 h-6 animate-pulse" />
                <span>{isActivating ? 'Broadcasting Alert...' : 'BROADCAST SOS ALERT'}</span>
              </button>
            </div>
          )}

          {/* Active SOS from OTHER members */}
          {activeSOSList.filter((a) => a.userId !== currentUser.id).length > 0 && (
            <div className="mt-4 pt-4 border-t border-stone-200 dark:border-stone-800 space-y-3">
              <h3 className="font-display font-bold text-h4 text-red-600 dark:text-red-400 flex items-center gap-1.5 uppercase">
                <Radio className="w-4 h-4 animate-ping" />
                <span>Active Squad SOS Alerts ({activeSOSList.filter((a) => a.userId !== currentUser.id).length})</span>
              </h3>

              {activeSOSList
                .filter((a) => a.userId !== currentUser.id)
                .map((sos) => (
                  <div
                    key={sos.id}
                    className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">{sos.userAvatar || '🪔'}</span>
                        <div>
                          <h4 className="font-bold text-h4 text-stone-900 dark:text-stone-100">
                            {sos.userName}
                          </h4>
                          <span className="text-micro text-stone-500">
                            Alert sent {formatTimeAgo(sos.timestamp)}
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-micro font-bold uppercase">
                        SOS Active
                      </span>
                    </div>

                    {sos.message && (
                      <p className="text-small bg-white/70 dark:bg-black/30 p-2.5 rounded-xl border border-red-200 dark:border-red-900/40 text-stone-800 dark:text-stone-200 font-medium">
                        "{sos.message}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-small pt-1">
                      <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
                        <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                        <span className="text-micro font-medium">
                          {sos.isLocationAvailable
                            ? sos.nearestLandmark || `${sos.latitude.toFixed(4)}, ${sos.longitude.toFixed(4)}`
                            : 'Location unavailable'}
                        </span>
                      </div>

                      {sos.isLocationAvailable && onNavigateToCoords && (
                        <button
                          onClick={() => {
                            onNavigateToCoords(sos.latitude, sos.longitude, sos.userName);
                            onClose();
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-micro shadow-sm flex items-center gap-1 transition-all"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Navigate to Member</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Quick Helpline shortcut */}
          <div className="pt-2">
            <button
              id="open-emergency-numbers-from-sos-btn"
              onClick={() => {
                if (onOpenEmergencyNumbers) {
                  onClose();
                  onOpenEmergencyNumbers();
                }
              }}
              className="w-full py-3 rounded-xl bg-stone-100 dark:bg-[#2A1C22] hover:bg-stone-200 dark:hover:bg-[#341F28] border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 text-small font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Phone className="w-4 h-4 text-[#DC2626]" />
              <span>Official Emergency Helpline Numbers (112, 100, 102)</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-[#251A20] flex items-center justify-between shrink-0">
          <span className="text-micro text-stone-500 dark:text-stone-400">
            Realtime Squad SOS Engine • PujaTrip
          </span>
          <button
            id="sos-close-btn"
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
