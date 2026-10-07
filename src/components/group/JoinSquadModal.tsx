import React, { useState, useEffect, useMemo } from 'react';
import {
  UserProfile,
  UserPreferences,
  SharedTripGroup,
  CityId,
} from '../../types';
import {
  fetchSquadByInviteCode,
  requestToJoinSquad,
  checkJoinRequestStatus,
  subscribeToTripUpdates,
  signInWithEmail,
  signUpWithEmail,
  isUserLoggedIn,
  markUserLoggedIn,
  switchDemoUser,
  FESTIVE_AVATARS,
  DEMO_PROFILES,
  getSquadProductionInviteUrl,
  LOCAL_STORAGE_PENDING_INVITE,
} from '../../services/friendGroupService';
import { DurgaThirdEye, AlpanaCorner } from '../common/BengaliMotifs';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
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
  Loader2,
  Crown,
  LogIn,
  UserPlus,
  RefreshCw,
  Copy,
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
  const [inviteCode, setInviteCode] = useState(() => {
    const raw = initialInviteCode || localStorage.getItem(LOCAL_STORAGE_PENDING_INVITE) || '';
    return raw.trim().toUpperCase();
  });

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [previewSquad, setPreviewSquad] = useState<SharedTripGroup | null>(null);
  const [requestStatus, setRequestStatus] = useState<'none' | 'pending' | 'approved' | 'rejected'>('none');
  const [copiedLink, setCopiedLink] = useState(false);

  // Authentication states
  const [isAuthUser, setIsAuthUser] = useState(() => isUserLoggedIn());
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [authTab, setAuthTab] = useState<'quick' | 'email'>('quick');
  const [quickName, setQuickName] = useState('');
  const [quickAvatar, setQuickAvatar] = useState('dhunuchi_dancer');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Ensure pending invite code is preserved across reloads & sessions
  useEffect(() => {
    if (inviteCode && inviteCode.length >= 4) {
      try {
        localStorage.setItem(LOCAL_STORAGE_PENDING_INVITE, inviteCode);
      } catch (e) {}
    }
  }, [inviteCode]);

  // Auto-verify if code exists
  useEffect(() => {
    if (inviteCode && inviteCode.length >= 4) {
      verifyCode(inviteCode);
    }
  }, [inviteCode]);

  const verifyCode = async (codeToVerify: string) => {
    const clean = codeToVerify.trim().toUpperCase();
    if (!clean || clean.length < 4) {
      setPreviewSquad(null);
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      const result = await fetchSquadByInviteCode(clean);
      if (result.error || !result.group) {
        setPreviewSquad(null);
        setErrorMsg(result.error || `Invalid or expired squad invite code "${clean}".`);
      } else {
        setPreviewSquad(result.group);
        // Check current user status in this squad
        const statusRes = await checkJoinRequestStatus(result.group.trip.id, currentUser.id);
        if (statusRes.isMember || statusRes.status === 'approved') {
          setRequestStatus('approved');
        } else if (statusRes.status === 'pending') {
          setRequestStatus('pending');
        } else if (statusRes.status === 'rejected') {
          setRequestStatus('rejected');
        } else {
          setRequestStatus('none');
        }
      }
    } catch (err: any) {
      setPreviewSquad(null);
      setErrorMsg(err?.message || 'Error verifying squad invite.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Realtime subscription and active polling for admin review updates
  useEffect(() => {
    if (!previewSquad) return;

    // 1. Subscribe to Realtime events
    const unsubscribe = subscribeToTripUpdates(previewSquad.trip.id, async (event) => {
      const statusRes = await checkJoinRequestStatus(previewSquad.trip.id, currentUser.id);
      if (statusRes.isMember || statusRes.status === 'approved') {
        setRequestStatus('approved');
        playKanshorBell(0.9);
        playDhakHit('dha', 1.0);
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        setSuccessMsg(`🎉 You have been approved and joined "${previewSquad.trip.name}"!`);
        try {
          localStorage.removeItem(LOCAL_STORAGE_PENDING_INVITE);
        } catch (e) {}
        setTimeout(() => {
          onJoined(statusRes.group || previewSquad);
          onClose();
        }, 1200);
      } else if (statusRes.status === 'rejected') {
        setRequestStatus('rejected');
      }
    });

    // 2. Active Polling interval every 3 seconds for guaranteed multi-device synchronization
    const interval = setInterval(async () => {
      if (requestStatus === 'pending') {
        const statusRes = await checkJoinRequestStatus(previewSquad.trip.id, currentUser.id);
        if (statusRes.isMember || statusRes.status === 'approved') {
          clearInterval(interval);
          setRequestStatus('approved');
          playKanshorBell(0.9);
          playDhakHit('dha', 1.0);
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
          setSuccessMsg(`🎉 You have been approved and joined "${previewSquad.trip.name}"!`);
          try {
            localStorage.removeItem(LOCAL_STORAGE_PENDING_INVITE);
          } catch (e) {}
          setTimeout(() => {
            onJoined(statusRes.group || previewSquad);
            onClose();
          }, 1200);
        } else if (statusRes.status === 'rejected') {
          setRequestStatus('rejected');
        }
      }
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [previewSquad?.trip.id, currentUser.id, requestStatus]);

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

  // Resolve Host / Admin Name
  const hostName = useMemo(() => {
    if (!previewSquad) return 'Squad Admin';
    const ownerMember = previewSquad.members.find(
      (m) => m.isOwner || m.userId === previewSquad.createdBy || m.role === 'admin'
    );
    if (ownerMember?.profile?.displayName) {
      return ownerMember.profile.displayName;
    }
    const matched = DEMO_PROFILES.find((p) => p.id === previewSquad.createdBy);
    if (matched?.displayName) {
      return matched.displayName;
    }
    return 'Anirban Mukhopadhyay (Squad Admin)';
  }, [previewSquad]);

  // Membership checks
  const isAlreadyMember = Boolean(
    previewSquad &&
      (previewSquad.createdBy === currentUser.id ||
        previewSquad.members.some((m) => m.userId === currentUser.id) ||
        requestStatus === 'approved')
  );

  const isPendingApproval = requestStatus === 'pending';

  // Join Squad Action
  const handleJoinSquad = async () => {
    const clean = inviteCode.trim().toUpperCase();
    if (!clean) return;

    // If visitor is not logged in, ask to authenticate first
    if (!isAuthUser) {
      setShowAuthForm(true);
      setErrorMsg('Please enter your name or sign in below so the Admin knows who is requesting.');
      return;
    }

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
        try {
          localStorage.removeItem(LOCAL_STORAGE_PENDING_INVITE);
        } catch (e) {}
        onJoined(res.group);
        onClose();
        return;
      }

      if (res.status === 'joined' && res.group) {
        playKanshorBell(0.9);
        playDhakHit('dha', 1.0);
        confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
        setSuccessMsg(`🎉 You have joined "${res.group.trip.name}"!`);
        try {
          localStorage.removeItem(LOCAL_STORAGE_PENDING_INVITE);
        } catch (e) {}
        setTimeout(() => {
          onJoined(res.group!);
          onClose();
        }, 1200);
        return;
      }

      if (res.status === 'request_pending') {
        playKanshorBell(0.7);
        setRequestStatus('pending');
        setSuccessMsg('✓ Join request submitted! Waiting for Admin to approve.');
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

  // Quick Sign In with Name & Festive Avatar
  const handleQuickJoinProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) {
      setErrorMsg('Please enter your name to proceed.');
      return;
    }

    const newProfile: UserProfile = {
      id: `user_${Date.now()}`,
      displayName: quickName.trim(),
      email: authEmail.trim() || `${quickName.toLowerCase().replace(/\s+/g, '')}@pujatrip.app`,
      avatarUrl: quickAvatar,
      isLocationSharingEnabled: true,
      lastSeenAt: new Date().toISOString(),
      isOnline: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    markUserLoggedIn(newProfile);
    setIsAuthUser(true);
    setShowAuthForm(false);
    setErrorMsg(null);
    playKanshorBell(0.6);

    if (onUserSwitch) {
      onUserSwitch(newProfile);
    }
  };

  // Supabase Email Sign In / Sign Up
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.trim() || !authPassword.trim()) {
      setErrorMsg('Please enter email and password.');
      return;
    }

    setAuthLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUpMode) {
        const res = await signUpWithEmail(
          authEmail.trim(),
          authPassword.trim(),
          quickName.trim() || authEmail.split('@')[0],
          undefined,
          quickAvatar
        );
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          markUserLoggedIn(res.user);
          setIsAuthUser(true);
          setShowAuthForm(false);
          if (onUserSwitch) onUserSwitch(res.user);
        }
      } else {
        const res = await signInWithEmail(authEmail.trim(), authPassword.trim());
        if (res.error) {
          setErrorMsg(res.error);
        } else if (res.user) {
          markUserLoggedIn(res.user);
          setIsAuthUser(true);
          setShowAuthForm(false);
          if (onUserSwitch) onUserSwitch(res.user);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Switch demo user test function
  const handleSwitchUser = (demoId: string) => {
    const switched = switchDemoUser(demoId);
    markUserLoggedIn(switched);
    setIsAuthUser(true);
    setShowAuthForm(false);
    if (onUserSwitch) {
      onUserSwitch(switched);
    }
    playKanshorBell(0.4);
    // Re-verify code with new user session
    if (inviteCode) {
      verifyCode(inviteCode);
    }
  };

  const handleCopyProductionLink = () => {
    if (!previewSquad) return;
    const prodUrl = getSquadProductionInviteUrl(previewSquad.inviteCode);
    navigator.clipboard?.writeText(prodUrl);
    setCopiedLink(true);
    playKanshorBell(0.5);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Squad emblem
  const squadEmblem = previewSquad
    ? FESTIVE_AVATARS.find((a) => a.id === previewSquad.trip.emblem) || FESTIVE_AVATARS[0]
    : FESTIVE_AVATARS[0];

  return (
    <div
      id="join-squad-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-5 sm:p-6 border shadow-2xl space-y-4 my-auto max-h-[94vh] overflow-y-auto relative ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-[#FFFDF9] border-[#D97706]/30 text-stone-900'
        }`}
      >
        <AlpanaCorner
          position="top-right"
          size={36}
          color="#DC2626"
          className="absolute top-2 right-2 opacity-20 pointer-events-none"
        />

        {/* Top Header / Branding */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#DC2626]/10 flex items-center justify-center text-[#DC2626]">
              <DurgaThirdEye size={24} color="#DC2626" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#DC2626]">
                  PUJATRIP SQUAD INVITATION
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
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback banners */}
        {errorMsg && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-small font-semibold flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-small font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="flex-1">{successMsg}</span>
          </div>
        )}

        {/* VERIFIED SQUAD CARD PREVIEW */}
        {previewSquad ? (
          <div
            className={`p-4 rounded-3xl border space-y-3 animate-fadeIn relative overflow-hidden ${
              isDarkMode
                ? 'bg-gradient-to-br from-[#281A22] to-[#1E131A] border-[#F59E0B]/40'
                : 'bg-gradient-to-br from-amber-50/90 to-rose-50/70 border-amber-300'
            }`}
          >
            {/* "You're invited to join" banner */}
            <div className="text-center pb-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#DC2626] dark:text-[#FEF08A] block">
                ✨ YOU&apos;RE INVITED TO JOIN
              </span>
              <h4 className="font-display font-black text-2xl text-[#881337] dark:text-[#FEF08A] leading-tight mt-0.5">
                {previewSquad.trip.name}
              </h4>
              {previewSquad.trip.bengaliName && (
                <p className="font-bengali-serif text-small font-bold text-[#DC2626]">
                  {previewSquad.trip.bengaliName}
                </p>
              )}
            </div>

            {/* Host / Admin attribution */}
            <div className="flex items-center justify-between text-micro px-2 py-1.5 rounded-xl bg-white/70 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-1.5 font-bold text-stone-700 dark:text-stone-300">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>Hosted by</span>
                <span className="text-[#DC2626] dark:text-[#FEF08A] font-extrabold">{hostName}</span>
              </div>
              <div className="flex items-center gap-1 text-[#DC2626] font-black">
                <Users className="w-3.5 h-3.5" />
                <span>{previewSquad.members.length} {previewSquad.members.length === 1 ? 'member' : 'members'}</span>
              </div>
            </div>

            {/* Metrics Badges */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-micro">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-stone-900/80 border border-stone-200 dark:border-stone-800 text-center">
                <span className="text-stone-400 block text-[9px] uppercase font-bold">Region</span>
                <span className="font-black text-[#DC2626] dark:text-[#FEF08A] capitalize">
                  {previewSquad.trip.city}
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

            {/* Timing */}
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
        ) : (
          /* Manual Invite Code Input if not yet resolved */
          <form onSubmit={(e) => { e.preventDefault(); if (inviteCode) verifyCode(inviteCode); }} className="space-y-2">
            <label className="text-micro font-bold text-stone-600 dark:text-stone-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                <span>Squad Invite Code</span>
              </span>
              {isVerifying && (
                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Looking up Squad...</span>
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
                className="flex-1 px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-h3 font-mono font-black tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
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
        )}

        {/* AUTHENTICATION & IDENTITY SECTION */}
        <div
          className={`p-3.5 rounded-2xl border space-y-2.5 ${
            isDarkMode ? 'bg-[#22161E] border-stone-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-micro font-bold text-stone-500">
              Your Puja Identity:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>{isAuthUser ? 'Authenticated' : 'Session Ready'}</span>
              </span>
              {!showAuthForm && (
                <button
                  type="button"
                  onClick={() => setShowAuthForm(!showAuthForm)}
                  className="text-[10px] font-bold text-stone-500 hover:text-[#DC2626] underline cursor-pointer"
                >
                  Change
                </button>
              )}
            </div>
          </div>

          {/* Current User Card */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-[#DC2626] flex items-center justify-center text-sm font-bold text-white shadow-2xs shrink-0">
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

          {/* Inline Auth / Profile Form if requested or not yet logged in */}
          {showAuthForm && (
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-3 animate-fadeIn">
              <div className="flex rounded-xl bg-stone-200 dark:bg-stone-800 p-0.5 text-micro font-bold">
                <button
                  type="button"
                  onClick={() => setAuthTab('quick')}
                  className={`flex-1 py-1 rounded-lg transition-all ${
                    authTab === 'quick' ? 'bg-white dark:bg-stone-700 shadow-2xs text-[#DC2626]' : 'text-stone-500'
                  }`}
                >
                  Quick Profile
                </button>
                <button
                  type="button"
                  onClick={() => setAuthTab('email')}
                  className={`flex-1 py-1 rounded-lg transition-all ${
                    authTab === 'email' ? 'bg-white dark:bg-stone-700 shadow-2xs text-[#DC2626]' : 'text-stone-500'
                  }`}
                >
                  Supabase Auth
                </button>
              </div>

              {authTab === 'quick' ? (
                <form onSubmit={handleQuickJoinProfile} className="space-y-2">
                  <input
                    type="text"
                    required
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="Enter your name (e.g. Amit)"
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-bold"
                  />
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {FESTIVE_AVATARS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setQuickAvatar(av.id)}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center shrink-0 transition-transform ${
                          quickAvatar === av.id ? 'ring-2 ring-[#DC2626] scale-110' : 'opacity-70'
                        }`}
                      >
                        {av.emoji}
                      </button>
                    ))}
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-xl bg-[#DC2626] text-white text-micro font-bold hover:bg-[#B91C1C] cursor-pointer"
                  >
                    Save & Set Identity
                  </button>
                </form>
              ) : (
                <form onSubmit={handleEmailAuth} className="space-y-2">
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small"
                  />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small"
                  />
                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-2 rounded-xl bg-[#DC2626] text-white text-micro font-bold hover:bg-[#B91C1C] cursor-pointer flex items-center justify-center gap-1"
                  >
                    {authLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                    <span>{isSignUpMode ? 'Sign Up with Supabase' : 'Sign In with Supabase'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsSignUpMode(!isSignUpMode)}
                    className="text-[10px] text-stone-500 block text-center w-full hover:underline"
                  >
                    {isSignUpMode ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Quick Demo Switcher for Instant Multi-Device Simulation */}
          <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
            <span className="text-[10px] text-stone-500 block mb-1 font-bold">
              Multi-User Testing Switcher:
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

        {/* PRIMARY ACTIONS & STATUS RESOLUTION */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
          {previewSquad ? (
            isAlreadyMember ? (
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.removeItem(LOCAL_STORAGE_PENDING_INVITE);
                  } catch (e) {}
                  onJoined(previewSquad);
                  onClose();
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 active:scale-95 text-white font-bold text-base flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
              >
                <Check className="w-5 h-5" />
                <span>You&apos;re Already in this Squad • Open Squad</span>
              </button>
            ) : isPendingApproval ? (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-small text-center space-y-1 animate-fadeIn">
                <div className="font-bold flex items-center justify-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>Join Request Pending Admin Approval</span>
                </div>
                <p className="text-micro text-stone-500 dark:text-stone-400">
                  Waiting for <span className="font-bold text-amber-700 dark:text-amber-300">{hostName}</span> to review. This screen automatically updates as soon as you are approved!
                </p>
                <div className="flex items-center justify-center gap-1 pt-1 text-[10px] text-amber-600 font-bold">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Realtime Supabase Sync Active</span>
                </div>
              </div>
            ) : requestStatus === 'rejected' ? (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-small text-center space-y-2 animate-fadeIn">
                <div className="font-bold flex items-center justify-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>Join Request Declined</span>
                </div>
                <p className="text-micro text-stone-500 dark:text-stone-400">
                  Your previous join request was declined by the squad admin. You may submit a new request if needed.
                </p>
                <button
                  type="button"
                  onClick={handleJoinSquad}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-micro font-bold cursor-pointer"
                >
                  Submit Request Again
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
                    <span>JOIN SQUAD</span>
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
              <span>Verify Invite Code</span>
            </button>
          )}

          {/* Production Share Link action */}
          {previewSquad && (
            <div className="flex items-center justify-between text-micro text-stone-500 px-1 pt-1">
              <span className="truncate">Invite Link: {previewSquad.inviteCode}</span>
              <button
                type="button"
                onClick={handleCopyProductionLink}
                className="font-bold text-[#DC2626] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedLink ? 'Copied' : 'Copy Deployed Link'}</span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-micro font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer text-center"
          >
            Cancel / Close
          </button>
        </div>
      </div>
    </div>
  );
};
