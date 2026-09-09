import React, { useState } from 'react';
import { UserProfile, UserPreferences, SharedTripGroup } from '../../types';
import { joinTripByInviteCode } from '../../services/friendGroupService';
import { DurgaThirdEye } from '../common/BengaliMotifs';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import { X, Users, KeyRound, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

interface JoinGroupModalProps {
  currentUser: UserProfile;
  onJoined: (group: SharedTripGroup) => void;
  onClose: () => void;
  userPrefs: UserPreferences;
}

export const JoinGroupModal: React.FC<JoinGroupModalProps> = ({
  currentUser,
  onJoined,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [inviteCode, setInviteCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = inviteCode.trim().toUpperCase();
    if (!clean) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const result = await joinTripByInviteCode(clean, currentUser);
      if (result.error || !result.group) {
        setErrorMsg(result.error || 'Failed to join group. Please check the code.');
        setIsSubmitting(false);
        return;
      }

      playKanshorBell(0.8);
      playDhakHit('dha', 0.9);
      onJoined(result.group);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error joining group');
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (code: string) => {
    setInviteCode(code);
    setErrorMsg(null);
    playKanshorBell(0.4);
  };

  return (
    <div
      id="join-group-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-5 border shadow-2xl space-y-4 my-auto ${
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
              <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                Join Friend Group
              </h3>
              <p className="font-bengali-serif text-small text-[#DC2626] font-bold">
                ইনভাইট কোড দিয়ে আড্ডায় যোগ দিন
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-small font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-small font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>Enter 6-Character Trip Invite Code</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength={10}
                value={inviteCode}
                onChange={(e) => {
                  setInviteCode(e.target.value.toUpperCase());
                  setErrorMsg(null);
                }}
                placeholder="e.g. KP26X7"
                className="w-full px-4 py-3 rounded-2xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-h3 font-mono font-black tracking-widest text-center uppercase focus:outline-none focus:ring-2 focus:ring-[#DC2626] placeholder:text-stone-400 placeholder:tracking-normal placeholder:text-base placeholder:font-sans"
              />
            </div>
            <p className="text-micro text-stone-500">
              Ask your trip organizer/admin for their 6-digit PujaTrip invite code.
            </p>
          </div>

          {/* Quick Demo Codes for Testing */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <p className="text-micro font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Sample Active Friend Squad Codes (Click to try):</span>
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('KP26X7')}
                className="flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:border-[#DC2626] text-small font-mono font-bold text-[#DC2626] flex items-center justify-center gap-1 transition-all"
              >
                <span>KP26X7</span>
                <span className="text-[10px] font-sans text-stone-500">(Kolkata)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('CT26M9')}
                className="flex-1 py-1.5 px-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 hover:border-[#DC2626] text-small font-mono font-bold text-[#DC2626] flex items-center justify-center gap-1 transition-all"
              >
                <span>CT26M9</span>
                <span className="text-[10px] font-sans text-stone-500">(Contai)</span>
              </button>
            </div>
          </div>

          {/* Joining as user notice */}
          <div className="flex items-center gap-2 text-micro text-stone-500 border-t border-stone-200 dark:border-stone-800 pt-2">
            <span>Joining as:</span>
            <strong className="text-stone-800 dark:text-stone-200">{currentUser.displayName}</strong>
            {currentUser.bengaliName && <span>({currentUser.bengaliName})</span>}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-small font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !inviteCode.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white text-small font-bold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? 'Joining Squad...' : 'Join Squad'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
