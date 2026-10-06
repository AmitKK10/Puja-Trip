import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  UserPreferences,
  SharedTripGroup,
  CityId,
} from '../../types';
import {
  fetchSquadByInviteCode,
  requestToJoinSquad,
  FESTIVE_AVATARS,
  DEMO_PROFILES,
  switchDemoUser,
} from '../../services/friendGroupService';
import { DurgaThirdEye } from '../common/BengaliMotifs';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import {
  X,
  Users,
  KeyRound,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  Train,
  Bus,
  Footprints,
  MapPin,
  Calendar,
  ShieldCheck,
  Check,
  UserCheck,
  LogIn,
  Loader2,
  Crown,
} from 'lucide-react';

interface JoinSquadModalProps {
  initialInviteCode?: string;
  currentUser: UserProfile;
  onJoined: (group: SharedTripGroup) => void;
  onClose: () => void;
  userPrefs: UserPreferences;
  onUserSwitch?: (user: UserProfile) => void;
}

export const JoinSquadModal: React.FC<JoinSquadModalProps> = ({
  initialInviteCode = '',
  currentUser,
  onJoined,
  onClose,
  userPrefs,
  onUserSwitch,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [inviteCode, setInviteCode] = useState(initialInviteCode.trim().toUpperCase());
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewSquad, setPreviewSquad] = useState<SharedTripGroup | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  // Auto-verify if opened with initialInviteCode
  useEffect(() => {
    if (initialInviteCode) {
      const clean = initialInviteCode.trim().toUpperCase();
      setInviteCode(clean);
      verifyCode(clean);
    }
  }, [initialInviteCode]);

  const verifyCode = async (codeToVerify: string) => {
    const clean = codeToVerify.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      setPreviewSquad(null);
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const result = await fetchSquadByInviteCode(clean);
      if (result.error || !result.group) {
        setPreviewSquad(null);
        setErrorMsg(result.error || `Invalid or expired squad invite code "${clean}".`);
      } else {
        setPreviewSquad(result.group);
      }
    } catch (err: any) {
      setPreviewSquad(null);
      setErrorMsg(err?.message || 'Error verifying squad invite.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setInviteCode(val);
    setErrorMsg(null);
    setSuccessMsg(null);
    if (val.length >= 6) {
      verifyCode(val);
    } else {
      setPreviewSquad(null);
    }
  };

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode) {
      verifyCode(inviteCode);
    }
  };

  // Membership status checks for currently selected user
  const isAlreadyMember = Boolean(
    previewSquad &&
      (previewSquad.createdBy === currentUser.id ||
        previewSquad.members.some((m) => m.userId === currentUser.id))
  );

  const isPendingApproval = Boolean(
    previewSquad &&
      previewSquad.joinRequests?.some(
        (r) => r.userId === currentUser.id && r.status === 'pending'
      )
  );

  const handleJoinSquad = async () => {
    const clean = inviteCode.trim().toUpperCase();
    if (!clean) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await requestToJoinSquad(clean, currentUser);

      if (!res.success && res.error) {
        setErrorMsg(res.error);
        setIsSubmitting(false);
        return;
      }

      if (res.status === 'already_member' && res.group) {
        playKanshorBell(0.6);
        onJoined(res.group);
        onClose();
        return;
      }

      if (res.status === 'joined' && res.group) {
        playKanshorBell(0.9);
        playDhakHit('dha', 1.0);
        setSuccessMsg(`🎉 You have joined "${res.group.trip.name}"!`);
        setTimeout(() => {
          onJoined(res.group!);
          onClose();
        }, 1200);
        return;
      }

      if (res.status === 'request_pending') {
        playKanshorBell(0.7);
        setRequestSubmitted(true);
        setSuccessMsg('✓ Join request sent! Waiting for squad admin approval.');
        if (res.group) {
          setPreviewSquad(res.group);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit squad join request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (code: string) => {
    setInviteCode(code);
    setErrorMsg(null);
    verifyCode(code);
    playKanshorBell(0.4);
  };

  const handleSwitchUser = (demoId: string) => {
    const switched = switchDemoUser(demoId);
    if (onUserSwitch) {
      onUserSwitch(switched);
    }
    playKanshorBell(0.3);
  };

  // Emblem representation
  const squadEmblem = previewSquad
    ? FESTIVE_AVATARS.find((a) => a.id === previewSquad.trip.emblem) || FESTIVE_AVATARS[0]
    : FESTIVE_AVATARS[0];

  return (
    <div
      id="join-squad-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-5 border shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-[#FFFDF9] border-[#D97706]/30 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#DC2626]">
                  🔥 SQUAD INVITATION
                </span>
              </div>
              <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                Join Puja Squad
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error or Success feedback banner */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-small font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-small font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Invite Code Input Section */}
        <form onSubmit={handleManualVerify} className="space-y-2">
          <label className="text-micro font-bold text-stone-600 dark:text-stone-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Squad Invite Code</span>
            </span>
            {isVerifying && (
              <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Checking Supabase...</span>
              </span>
            )}
          </label>

          <div className="relative flex gap-2">
            <input
              type="text"
              required
              maxLength={10}
              value={inviteCode}
              onChange={handleInputChange}
              placeholder="e.g. KP26RY"
              className="flex-1 px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-h3 font-mono font-black tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-[#DC2626] placeholder:text-stone-400 placeholder:tracking-normal placeholder:text-base placeholder:font-sans"
            />
            <button
              type="submit"
              disabled={isVerifying || !inviteCode.trim()}
              className="px-4 py-3 rounded-2xl bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-50 text-white font-bold text-small flex items-center justify-center cursor-pointer transition-colors shadow-xs"
            >
              Verify
            </button>
          </div>
        </form>

        {/* VERIFIED SQUAD CARD PREVIEW */}
        {previewSquad && (
          <div
            className={`p-4 rounded-3xl border space-y-3 animate-fadeIn ${
              isDarkMode
                ? 'bg-gradient-to-br from-[#281A22] to-[#1E131A] border-[#F59E0B]/30'
                : 'bg-gradient-to-br from-amber-50/90 to-rose-50/70 border-amber-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${squadEmblem.gradient} flex items-center justify-center text-2xl shadow-sm`}
                >
                  {squadEmblem.emoji}
                </div>
                <div>
                  <span className="px-2 py-0.5 rounded-md bg-[#DC2626]/10 text-[#DC2626] text-[10px] font-black uppercase tracking-wider">
                    {previewSquad.trip.city.toUpperCase()} SQUAD
                  </span>
                  <h4 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A] leading-snug">
                    {previewSquad.trip.name}
                  </h4>
                  {previewSquad.trip.bengaliName && (
                    <p className="font-bengali-serif text-small text-[#DC2626] font-bold">
                      {previewSquad.trip.bengaliName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Metrics Badges */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-micro">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 text-center">
                <span className="text-stone-400 block text-[9px] uppercase font-bold">Members</span>
                <span className="font-black text-[#DC2626] dark:text-[#FEF08A] flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{previewSquad.members.length} Hoppers</span>
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 text-center">
                <span className="text-stone-400 block text-[9px] uppercase font-bold">Stops</span>
                <span className="font-black text-stone-800 dark:text-stone-200 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500" />
                  <span>{previewSquad.trip.selectedPandalIds.length} Pandals</span>
                </span>
              </div>

              <div className="p-2 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 text-center">
                <span className="text-stone-400 block text-[9px] uppercase font-bold">Transit</span>
                <span className="font-black text-stone-800 dark:text-stone-200 capitalize flex items-center justify-center gap-1">
                  {previewSquad.trip.preferredTransport === 'metro' && (
                    <Train className="w-3 h-3 text-[#DC2626]" />
                  )}
                  {previewSquad.trip.preferredTransport === 'bus' && (
                    <Bus className="w-3 h-3 text-amber-500" />
                  )}
                  {previewSquad.trip.preferredTransport === 'walking' && (
                    <Footprints className="w-3 h-3 text-emerald-500" />
                  )}
                  <span>{previewSquad.trip.preferredTransport}</span>
                </span>
              </div>
            </div>

            {/* Date and Itinerary timing */}
            <div className="flex items-center justify-between text-micro text-stone-600 dark:text-stone-400 border-t border-stone-200/80 dark:border-stone-800/80 pt-2 px-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-500" />
                <span>{previewSquad.trip.date}</span>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span>{previewSquad.trip.startTime} - {previewSquad.trip.endTime}</span>
              </span>
            </div>
          </div>
        )}

        {/* Current User Identity / Quick Login Switcher */}
        <div
          className={`p-3 rounded-2xl border space-y-2 ${
            isDarkMode ? 'bg-[#22161E] border-stone-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-micro font-bold text-stone-500">
              Joining Squad as:
            </span>
            <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              <span>Verified Session</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-[#DC2626] flex items-center justify-center text-sm font-bold text-white shadow-2xs">
              {currentUser.displayName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-small text-stone-900 dark:text-white truncate">
                {currentUser.displayName}
              </div>
              <div className="text-micro text-stone-500 truncate">
                {currentUser.email || 'puja.hopper@pujatrip.app'}
              </div>
            </div>
          </div>

          {/* Quick Demo Profile Switcher for Multi-Device Simulation */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
            <span className="text-[10px] text-stone-500 block mb-1 font-bold">
              Test as another squad hopper:
            </span>
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
              {DEMO_PROFILES.map((p) => {
                const isSel = p.id === currentUser.id;
                const av = FESTIVE_AVATARS.find((a) => a.id === p.avatarUrl) || FESTIVE_AVATARS[0];
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSwitchUser(p.id)}
                    className={`px-2 py-0.5 rounded-lg text-micro font-bold shrink-0 flex items-center gap-1 transition-all cursor-pointer ${
                      isSel
                        ? 'bg-[#DC2626] text-white shadow-2xs'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-[#DC2626]'
                    }`}
                  >
                    <span>{av.emoji}</span>
                    <span>{p.displayName.split(' ')[0]}</span>
                    {p.id.includes('admin') && <Crown className="w-2.5 h-2.5 text-amber-300" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sample Codes if no preview squad */}
        {!previewSquad && (
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1.5">
            <p className="text-micro font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Or click a sample active squad code to preview:</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('KP26X7')}
                className="flex-1 py-1 px-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:border-[#DC2626] text-small font-mono font-bold text-[#DC2626] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>KP26X7</span>
                <span className="text-[10px] font-sans text-stone-500">(Kolkata)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('CT26M9')}
                className="flex-1 py-1 px-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:border-[#DC2626] text-small font-mono font-bold text-[#DC2626] flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                <span>CT26M9</span>
                <span className="text-[10px] font-sans text-stone-500">(Contai)</span>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
          {previewSquad ? (
            isAlreadyMember ? (
              <button
                type="button"
                onClick={() => {
                  onJoined(previewSquad);
                  onClose();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Check className="w-5 h-5" />
                <span>You&apos;re Already in this Squad • Open Squad</span>
              </button>
            ) : isPendingApproval || requestSubmitted ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-small text-center space-y-1">
                <div className="font-bold flex items-center justify-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>Join Request Pending Admin Approval</span>
                </div>
                <p className="text-micro text-stone-500 dark:text-stone-400">
                  The squad admin will review your request. Once approved, the squad will appear in your Squad tab automatically.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 px-4 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-micro font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
                >
                  Close & Wait for Approval
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-confirm-join-squad"
                onClick={handleJoinSquad}
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-600 via-[#DC2626] to-[#881337] hover:brightness-110 active:scale-95 disabled:opacity-50 text-white font-display font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-[#DC2626]/20 cursor-pointer transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Users className="w-5 h-5" />
                    <span>JOIN SQUAD NOW</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            )
          ) : (
            <button
              type="button"
              disabled={!inviteCode.trim() || isVerifying}
              onClick={() => verifyCode(inviteCode)}
              className="w-full py-3.5 px-4 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-small flex items-center justify-center gap-2 cursor-pointer hover:bg-stone-300 dark:hover:bg-stone-700 transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              <span>Verify Invite Code to Join</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-micro font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer text-center"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
