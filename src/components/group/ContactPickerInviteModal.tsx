import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Phone,
  Share2,
  Copy,
  Check,
  AlertCircle,
  X,
  Shield,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { getSquadProductionInviteUrl } from '../../services/friendGroupService';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';

interface ContactPickerInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  squadName: string;
  inviteCode: string;
  isDarkMode?: boolean;
  onShowToast?: (msg: string) => void;
}

interface SelectedContact {
  name: string;
  phoneNumber: string;
}

export const ContactPickerInviteModal: React.FC<ContactPickerInviteModalProps> = ({
  isOpen,
  onClose,
  squadName,
  inviteCode,
  isDarkMode = false,
  onShowToast,
}) => {
  // Check Contact Picker API support
  const isContactPickerSupported =
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    'ContactsManager' in window;

  const [showConsentPrompt, setShowConsentPrompt] = useState(false);
  const [selectedContact, setSelectedContact] = useState<SelectedContact | null>(null);
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen) return null;

  const inviteUrl = getSquadProductionInviteUrl(inviteCode);

  // Trigger Contact Picker with explicit user consent first
  const handleOpenContactPicker = async () => {
    setPickerError(null);
    try {
      if (!isContactPickerSupported) {
        setPickerError("Contacts aren't supported on this device/browser.");
        return;
      }

      setShowConsentPrompt(false);
      // Select name and tel from device contacts
      const contacts = await (navigator as any).contacts.select(['name', 'tel'], {
        multiple: false,
      });

      if (contacts && contacts.length > 0) {
        const contact = contacts[0];
        const name = contact.name && contact.name.length > 0 ? contact.name[0] : 'Friend';
        const tel = contact.tel && contact.tel.length > 0 ? contact.tel[0] : '';

        setSelectedContact({
          name: String(name).trim(),
          phoneNumber: String(tel).trim(),
        });
      }
    } catch (err: any) {
      console.warn('Contact picker error:', err);
      // If user cancelled, don't show a harsh error
      if (err?.name !== 'AbortError') {
        setPickerError(err?.message || 'Unable to access device contacts.');
      }
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    setSelectedContact({
      name: manualName.trim(),
      phoneNumber: manualPhone.trim(),
    });
  };

  // Execute Web Share API or Fallback
  const handleInviteToSquad = async () => {
    if (!selectedContact) return;

    setIsSharing(true);
    const shareTitle = `Join my PujaTrip Squad for Durga Puja 2026`;
    const shareText = `🎉 Hey ${selectedContact.name}, join my PujaTrip Squad "${squadName}" for Durga Puja 2026! Use invite code: ${inviteCode}\n${inviteUrl}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: inviteUrl,
        });
        playDhakHit('dha', 0.8);
        onShowToast?.(`✓ Invitation shared with ${selectedContact.name}!`);
      } else {
        // Fallback: Copy link & provide SMS link
        await navigator.clipboard.writeText(shareText);
        setIsCopied(true);
        playKanshorBell(0.6);
        onShowToast?.(`✓ Invite copied to clipboard for ${selectedContact.name}!`);
        setTimeout(() => setIsCopied(false), 3000);
      }
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareText);
          setIsCopied(true);
          onShowToast?.(`✓ Invite copied to clipboard!`);
          setTimeout(() => setIsCopied(false), 3000);
        } catch {
          // ignore
        }
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLinkOnly = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      playKanshorBell(0.6);
      onShowToast?.('✓ Invite link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      onShowToast?.('Failed to copy link.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all transform animate-scaleUp ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-white border-[#D97706]/30 text-stone-900'
        }`}
      >
        {/* Top Header */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-[#DC2626] to-[#881337]" />

        <div className="p-5 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Title Row */}
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#DC2626]/15 text-[#DC2626] flex items-center justify-center font-bold">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-display font-black text-h3 text-stone-900 dark:text-white leading-tight">
                  + Add Squad Member
                </h3>
                <p className="text-micro text-stone-500">
                  Invite friends to {squadName}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* STEP 1: Consent Prompt (Before invoking navigator.contacts) */}
          {showConsentPrompt ? (
            <div
              className={`p-4 rounded-2xl border space-y-3 animate-fadeIn ${
                isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/30' : 'bg-amber-50/80 border-amber-300'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-small space-y-1">
                  <p className="font-bold text-stone-900 dark:text-white">
                    Access Device Contacts?
                  </p>
                  <p className="text-micro text-stone-600 dark:text-stone-300 leading-relaxed">
                    PujaTrip uses your contacts only to help you select people to invite to your Squad.
                  </p>
                  <p className="text-[11px] text-stone-400">
                    We never upload or store your address book. Only the single contact you pick is used for this invite.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  id="btn-allow-contacts-permission"
                  onClick={handleOpenContactPicker}
                  className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white font-bold text-micro shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Allow Contacts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowConsentPrompt(false)}
                  className="py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-micro cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          {/* Contact Picker Primary Action */}
          {!selectedContact && !showConsentPrompt && (
            <div className="space-y-3">
              {isContactPickerSupported ? (
                <button
                  type="button"
                  id="btn-add-from-contacts"
                  onClick={() => setShowConsentPrompt(true)}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-[#DC2626] hover:brightness-110 active:scale-98 text-white font-bold text-small shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-[#FEF08A]" />
                  <span>[ Add from Contacts ]</span>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 text-center space-y-1">
                  <p className="text-micro font-bold text-stone-600 dark:text-stone-400">
                    Contacts aren&apos;t supported on this device/browser.
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Use the manual entry form below to invite anyone by name &amp; phone number.
                  </p>
                </div>
              )}

              {pickerError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-micro flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pickerError}</span>
                </div>
              )}

              {/* Manual Input Fallback Form */}
              <div className="pt-2">
                <div className="flex items-center gap-2 my-2">
                  <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1" />
                  <span className="text-[10px] uppercase font-bold text-stone-400">
                    {isContactPickerSupported ? 'Or Enter Manually' : 'Manual Invitation'}
                  </span>
                  <div className="h-px bg-stone-200 dark:bg-stone-800 flex-1" />
                </div>

                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <div>
                    <label className="text-micro font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Friend&apos;s Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="input-contact-name"
                      required
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      placeholder="[ Enter Name ] e.g. Rahul Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                    />
                  </div>

                  <div>
                    <label className="text-micro font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Phone Number <span className="text-stone-400 text-micro">(Optional for calling)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        id="input-contact-phone"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        placeholder="[ Enter Phone Number ] e.g. +91 98300 12345"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 text-white font-bold text-micro transition-colors cursor-pointer"
                  >
                    Select Contact Details →
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* STEP 2: Selected Contact Card & Invite Action (Requirement 10) */}
          {selectedContact && (
            <div
              className={`p-4 rounded-2xl border space-y-3.5 animate-fadeIn ${
                isDarkMode ? 'bg-[#241820] border-[#F59E0B]/30' : 'bg-amber-50/70 border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between border-b border-amber-200/50 dark:border-stone-800 pb-2">
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400">
                  Selected Contact
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedContact(null)}
                  className="text-micro text-[#DC2626] font-bold hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div className="space-y-1">
                <div className="text-small text-stone-500 font-medium">Contact Name:</div>
                <div className="font-display font-black text-h3 text-stone-900 dark:text-white">
                  {selectedContact.name}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-small text-stone-500 font-medium">Phone Number:</div>
                <div className="font-mono text-small font-bold text-stone-800 dark:text-stone-200">
                  {selectedContact.phoneNumber || 'Not provided'}
                </div>
              </div>

              {/* Real Production PujaTrip Invite Link Preview */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-micro">
                <span className="text-[10px] text-stone-400 font-bold block mb-0.5">
                  Production Invite URL:
                </span>
                <span className="font-mono text-[11px] text-[#DC2626] break-all select-all font-semibold">
                  {inviteUrl}
                </span>
              </div>

              {/* [ INVITE TO SQUAD ] Button */}
              <button
                type="button"
                id="btn-invite-to-squad"
                disabled={isSharing}
                onClick={handleInviteToSquad}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 active:scale-98 text-white font-bold text-btn shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>[ INVITE TO SQUAD ]</span>
              </button>

              {/* Copy Invite Link fallback */}
              <button
                type="button"
                id="btn-copy-invite-link"
                onClick={handleCopyLinkOnly}
                className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-micro border border-stone-200 dark:border-stone-700 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Link Copied to Clipboard!' : '[ Copy Invite Link ]'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
