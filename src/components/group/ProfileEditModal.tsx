import React, { useState } from 'react';
import { UserProfile, UserPreferences } from '../../types';
import { FESTIVE_AVATARS, FestiveAvatar } from '../../services/friendGroupService';
import { DurgaThirdEye } from '../common/BengaliMotifs';
import { X, Check, User, MapPin, Sparkles, Shield, Bell } from 'lucide-react';
import { playKanshorBell } from '../../utils/audioSynth';

interface ProfileEditModalProps {
  currentProfile: UserProfile;
  onSave: (updates: Partial<UserProfile>) => Promise<void>;
  onClose: () => void;
  userPrefs: UserPreferences;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  currentProfile,
  onSave,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [displayName, setDisplayName] = useState(currentProfile.displayName);
  const [bengaliName, setBengaliName] = useState(currentProfile.bengaliName || '');
  const [selectedAvatar, setSelectedAvatar] = useState(currentProfile.avatarUrl);
  const [locationSharing, setLocationSharing] = useState(currentProfile.isLocationSharingEnabled);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setIsSaving(true);
    playKanshorBell(0.7);
    await onSave({
      displayName: displayName.trim(),
      bengaliName: bengaliName.trim() || undefined,
      avatarUrl: selectedAvatar,
      isLocationSharingEnabled: locationSharing,
    });
    setIsSaving(false);
    onClose();
  };

  return (
    <div
      id="profile-edit-modal"
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
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                Friend Profile & Avatar
              </h3>
              <p className="font-bengali-serif text-small text-[#DC2626] font-bold">
                ব্যবহারকারী প্রোফাইল ও শারদীয় অবতার
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

        <form onSubmit={handleSave} className="space-y-4">
          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-small font-bold text-stone-700 dark:text-stone-300">
              Display Name (English) *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Anirban Mukhopadhyay"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-semibold focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            />
          </div>

          {/* Bengali Name Input */}
          <div className="space-y-1.5">
            <label className="text-small font-bold text-stone-700 dark:text-stone-300 flex items-center justify-between">
              <span>Bengali Name (বাংলা নাম)</span>
              <span className="text-micro font-normal text-stone-500">Optional</span>
            </label>
            <input
              type="text"
              value={bengaliName}
              onChange={(e) => setBengaliName(e.target.value)}
              placeholder="যেমন: অনির্বাণ মুখোপাধ্যায়"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-bengali focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            />
          </div>

          {/* Festive Avatar Selector */}
          <div className="space-y-2">
            <label className="text-small font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Choose Your Festive Avatar (শারদ অবতার)</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {FESTIVE_AVATARS.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatar(avatar.id);
                      playKanshorBell(0.4);
                    }}
                    className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-1 relative ${
                      isSelected
                        ? 'border-[#DC2626] bg-[#DC2626]/10 ring-2 ring-[#DC2626]/30 shadow-xs'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-tr ${avatar.gradient} flex items-center justify-center text-xl shadow-xs`}
                    >
                      {avatar.emoji}
                    </div>
                    <span className="text-[10px] font-bold line-clamp-1 leading-tight">
                      {avatar.label}
                    </span>
                    {isSelected && (
                      <span className="absolute -top-1 -right-1 bg-[#DC2626] text-white rounded-full p-0.5 shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Location Sharing Privacy Toggle */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isDarkMode
                ? 'bg-[#281B23] border-[#F59E0B]/20'
                : 'bg-amber-50/60 border-amber-200'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  locationSharing
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
                }`}
              >
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-small font-bold text-stone-800 dark:text-stone-200">
                  Share Live Location with Friends
                </p>
                <p className="text-micro text-stone-500 font-bengali">
                  বন্ধুদের সাথে লাইভ লোকেশন শেয়ার করুন
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLocationSharing(!locationSharing)}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                locationSharing ? 'bg-emerald-600' : 'bg-stone-300 dark:bg-stone-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  locationSharing ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-small font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !displayName.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white text-small font-bold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
            >
              {isSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
