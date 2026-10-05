import React, { useState } from 'react';
import {
  SharedTripGroup,
  UserProfile,
  TripMember,
  MemberRole,
} from '../../types';
import {
  removeMemberFromGroup,
  leaveGroup,
  updateGroupDetails,
  transferGroupAdmin,
  deleteTripGroup,
  FESTIVE_AVATARS,
  DEMO_PROFILES,
} from '../../services/friendGroupService';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import {
  X,
  Users,
  Crown,
  KeyRound,
  Copy,
  Check,
  Share2,
  Trash2,
  LogOut,
  Edit2,
  Save,
  AlertTriangle,
  UserX,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

interface ManageSquadModalProps {
  group: SharedTripGroup;
  currentUser: UserProfile;
  isDarkMode?: boolean;
  onClose: () => void;
  onGroupUpdated: (group: SharedTripGroup) => void;
  onGroupLeftOrDeleted: (nextGroupId?: string) => void;
  onShowToast: (message: string) => void;
}

export const ManageSquadModal: React.FC<ManageSquadModalProps> = ({
  group,
  currentUser,
  isDarkMode = false,
  onClose,
  onGroupUpdated,
  onGroupLeftOrDeleted,
  onShowToast,
}) => {
  const isOperatorAdmin =
    group.myRole === 'admin' ||
    group.createdBy === currentUser.id ||
    group.members.some((m) => m.userId === currentUser.id && m.role === 'admin');

  // Edit squad name state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(group.trip.name);
  const [editedBengaliName, setEditedBengaliName] = useState(group.trip.bengaliName || '');
  const [isSavingName, setIsSavingName] = useState(false);

  // Copy states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Confirmation dialog states
  const [confirmAction, setConfirmAction] = useState<{
    type: 'remove_member' | 'leave_squad' | 'delete_squad' | 'transfer_admin';
    targetMember?: TripMember;
  } | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);

  // Copy invite code
  const handleCopyCode = () => {
    navigator.clipboard?.writeText(group.inviteCode);
    setCopiedCode(true);
    playKanshorBell(0.6);
    onShowToast(`Invite code ${group.inviteCode} copied!`);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy invite link
  const handleCopyLink = () => {
    const url = `${window.location.origin}${window.location.pathname}?invite=${group.inviteCode}`;
    const text = `🎉 Join our Durga Puja hopping squad "${group.trip.name}" on PujaTrip!\nUse invite code: ${group.inviteCode}\nDirect Link: ${url}`;
    navigator.clipboard?.writeText(text);
    setCopiedLink(true);
    playKanshorBell(0.6);
    onShowToast('Squad invite link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    const url = `${window.location.origin}${window.location.pathname}?invite=${group.inviteCode}`;
    const shareData = {
      title: `${group.trip.name} • PujaTrip Squad`,
      text: `🎉 Join our Durga Puja hopping squad "${group.trip.name}" on PujaTrip!\nInvite code: ${group.inviteCode}`,
      url,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        playKanshorBell(0.8);
        onShowToast('Squad invitation shared!');
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  // Save edited squad name
  const handleSaveName = async () => {
    if (!editedName.trim()) return;
    setIsSavingName(true);
    try {
      const res = await updateGroupDetails(
        group.trip.id,
        {
          name: editedName.trim(),
          bengaliName: editedBengaliName.trim() || undefined,
        },
        currentUser.id
      );

      if (res.success && res.group) {
        onGroupUpdated(res.group);
        setIsEditingName(false);
        playKanshorBell(0.7);
        onShowToast('Squad details updated successfully!');
      } else {
        alert(res.error || 'Failed to update squad details.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating squad details');
    } finally {
      setIsSavingName(false);
    }
  };

  // Execute confirmed actions
  const handleExecuteConfirmedAction = async () => {
    if (!confirmAction) return;
    setIsActionLoading(true);

    try {
      if (confirmAction.type === 'remove_member' && confirmAction.targetMember) {
        const res = await removeMemberFromGroup(
          group.trip.id,
          confirmAction.targetMember.userId,
          currentUser.id
        );

        if (res.success && res.group) {
          playDhakHit('tin', 0.6);
          onGroupUpdated(res.group);
          onShowToast(`Removed ${confirmAction.targetMember.profile?.displayName || 'member'} from squad.`);
          setConfirmAction(null);
        } else {
          alert(res.error || 'Failed to remove member.');
        }
      } else if (confirmAction.type === 'transfer_admin' && confirmAction.targetMember) {
        const res = await transferGroupAdmin(
          group.trip.id,
          confirmAction.targetMember.userId,
          currentUser.id
        );

        if (res.success && res.group) {
          playKanshorBell(0.8);
          onGroupUpdated(res.group);
          onShowToast(`Transferred Admin rights to ${confirmAction.targetMember.profile?.displayName || 'member'}.`);
          setConfirmAction(null);
        } else {
          alert(res.error || 'Failed to transfer admin rights.');
        }
      } else if (confirmAction.type === 'leave_squad') {
        const res = await leaveGroup(group.trip.id, currentUser.id);
        if (res.success) {
          playKanshorBell(0.5);
          onShowToast('You left the squad.');
          onGroupLeftOrDeleted(res.nextActiveGroupId);
          onClose();
        } else {
          alert(res.error || 'Failed to leave squad.');
        }
      } else if (confirmAction.type === 'delete_squad') {
        const res = await deleteTripGroup(group.trip.id, currentUser.id);
        if (res.success) {
          playDhakHit('dha', 0.8);
          onShowToast('Squad deleted successfully.');
          onGroupLeftOrDeleted(res.nextActiveGroupId);
          onClose();
        } else {
          alert(res.error || 'Failed to delete squad.');
        }
      }
    } catch (err: any) {
      alert(err?.message || 'Action failed.');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div
      id="manage-squad-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        className={`w-full max-w-lg rounded-3xl p-5 border shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-[#FFFDF9] border-[#D97706]/30 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#881337] text-[#FEF08A] flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                  Manage Squad
                </h3>
                {isOperatorAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5" />
                    <span>Admin Settings</span>
                  </span>
                )}
              </div>
              <p className="font-bengali-serif text-small text-[#DC2626] font-bold">
                স্কোয়াড সেটিংস ও সদস্য পরিচালনা
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Squad Name Card with Inline Edit for Admin */}
        <div
          className={`p-3.5 rounded-2xl border ${
            isDarkMode ? 'bg-[#281B23] border-stone-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          {isEditingName && isOperatorAdmin ? (
            <div className="space-y-2.5">
              <div>
                <label className="text-micro font-bold text-stone-500 block mb-0.5">
                  Squad Title
                </label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-bold"
                />
              </div>
              <div>
                <label className="text-micro font-bold text-stone-500 block mb-0.5">
                  Bengali Title
                </label>
                <input
                  type="text"
                  value={editedBengaliName}
                  onChange={(e) => setEditedBengaliName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-bengali font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-3 py-1 rounded-xl text-micro font-bold bg-stone-200 dark:bg-stone-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveName}
                  disabled={isSavingName}
                  className="px-3.5 py-1 rounded-xl text-micro font-bold bg-[#DC2626] text-white flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingName ? 'Saving...' : 'Save Name'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider block">
                  Active Squad
                </span>
                <h4 className="font-display font-black text-h3 text-stone-900 dark:text-white">
                  {group.trip.name}
                </h4>
                {group.trip.bengaliName && (
                  <p className="font-bengali text-small text-[#DC2626] font-semibold">
                    {group.trip.bengaliName}
                  </p>
                )}
                <p className="text-micro text-stone-500 mt-1">
                  Region: {group.trip.city.toUpperCase()} • {group.members.length} Members
                </p>
              </div>
              {isOperatorAdmin && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-micro font-bold flex items-center gap-1 hover:border-[#DC2626] cursor-pointer"
                  title="Edit Squad Name"
                >
                  <Edit2 className="w-3 h-3 text-[#DC2626]" />
                  <span>Edit</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Invite & Add Member Hub */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#DC2626]/10 to-[#881337]/15 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="font-display font-bold text-small text-[#881337] dark:text-[#FEF08A]">
                Invite Code & Share Link
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full">
              Realtime Sync
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                6-Digit Invite Code
              </span>
              <span className="font-mono font-black text-xl text-[#DC2626] tracking-widest">
                {group.inviteCode}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-900 text-micro font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied!' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="px-3 py-1.5 rounded-xl bg-[#881337] hover:bg-[#991B1B] text-white text-micro font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-[#FEF08A]" />
                <span>Share Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Squad Members Management Roster */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h4 className="font-display font-bold text-small text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#DC2626]" />
              <span>Squad Members ({group.members.length})</span>
            </h4>
            <span className="text-micro text-stone-500 font-bengali">সদস্য তালিকা</span>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {group.members.map((member) => {
              const isMe = member.userId === currentUser.id;
              const profile =
                member.profile ||
                DEMO_PROFILES.find((p) => p.id === member.userId) ||
                (isMe ? currentUser : { id: member.userId, displayName: 'Puja Hopper', avatarUrl: 'dhunuchi_dancer', isOnline: true });
              const avatar = FESTIVE_AVATARS.find((a) => a.id === profile.avatarUrl) || FESTIVE_AVATARS[0];
              const isAdmin = member.role === 'admin' || group.createdBy === member.userId;

              return (
                <div
                  key={member.id || member.userId}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                    isMe
                      ? isDarkMode
                        ? 'bg-[#2D1B25] border-[#DC2626]/40'
                        : 'bg-amber-50/70 border-amber-300'
                      : isDarkMode
                      ? 'bg-[#22161E] border-stone-800'
                      : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${avatar.gradient} flex items-center justify-center text-lg shrink-0 shadow-2xs`}
                    >
                      {avatar.emoji}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-display font-bold text-xs sm:text-small truncate text-stone-900 dark:text-white">
                          {profile.displayName}
                        </span>
                        {isAdmin && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[9px] font-black flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" />
                            <span>Admin</span>
                          </span>
                        )}
                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded-md bg-[#DC2626] text-white text-[9px] font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      {'bengaliName' in profile && Boolean(profile.bengaliName) && (
                        <p className="font-bengali text-micro text-[#DC2626] truncate">
                          {(profile as UserProfile).bengaliName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions for this member */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Admin management actions on other members */}
                    {isOperatorAdmin && !isMe && (
                      <>
                        {!isAdmin && (
                          <button
                            type="button"
                            onClick={() =>
                              setConfirmAction({
                                type: 'transfer_admin',
                                targetMember: member,
                              })
                            }
                            className="p-1.5 rounded-xl bg-stone-100 hover:bg-amber-100 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 text-[10px] font-bold border border-stone-200 dark:border-stone-700 transition-colors cursor-pointer"
                            title="Make Admin"
                          >
                            <Crown className="w-3 h-3 text-amber-500" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              type: 'remove_member',
                              targetMember: member,
                            })
                          }
                          className="px-2 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-micro font-bold border border-red-500/20 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Remove from squad"
                        >
                          <UserX className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Danger Zone: Leave Squad & Delete Squad */}
        <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setConfirmAction({ type: 'leave_squad' })}
              className="px-3.5 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-micro font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-stone-500" />
              <span>Leave Squad</span>
            </button>

            {isOperatorAdmin && (
              <button
                type="button"
                onClick={() => setConfirmAction({ type: 'delete_squad' })}
                className="px-3.5 py-2 rounded-xl bg-red-600/15 hover:bg-red-600/25 text-red-600 dark:text-red-400 text-micro font-bold border border-red-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Squad</span>
              </button>
            )}
          </div>
        </div>

        {/* Inline Confirmation Dialog Modal */}
        {confirmAction && (
          <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div
              className={`w-full max-w-sm rounded-3xl p-5 border shadow-2xl space-y-3 ${
                isDarkMode ? 'bg-[#22161E] border-stone-700 text-white' : 'bg-white border-stone-300 text-stone-900'
              }`}
            >
              <div className="flex items-center gap-2 text-rose-500">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h4 className="font-display font-black text-small">
                  {confirmAction.type === 'remove_member'
                    ? 'Remove Member?'
                    : confirmAction.type === 'transfer_admin'
                    ? 'Transfer Admin?'
                    : confirmAction.type === 'leave_squad'
                    ? 'Leave Squad?'
                    : 'Delete Squad Permanently?'}
                </h4>
              </div>

              <p className="text-small text-stone-600 dark:text-stone-300 leading-snug">
                {confirmAction.type === 'remove_member' &&
                  `Are you sure you want to remove "${confirmAction.targetMember?.profile?.displayName || 'this member'}" from the squad? Their historical expenses and visit records will be preserved.`}
                {confirmAction.type === 'transfer_admin' &&
                  `Make "${confirmAction.targetMember?.profile?.displayName || 'this member'}" an Admin of "${group.trip.name}"?`}
                {confirmAction.type === 'leave_squad' &&
                  `Are you sure you want to leave "${group.trip.name}"? You can re-join anytime using the invite code.`}
                {confirmAction.type === 'delete_squad' &&
                  `Are you sure you want to delete "${group.trip.name}"? This action cannot be undone and will remove the squad for all members.`}
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={() => setConfirmAction(null)}
                  className="px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-micro font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isActionLoading}
                  onClick={handleExecuteConfirmedAction}
                  className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-micro font-bold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  {isActionLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
