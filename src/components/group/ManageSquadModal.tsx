import React, { useState, useMemo } from 'react';
import {
  SharedTripGroup,
  UserProfile,
  TripMember,
  MemberRole,
} from '../../types';
import {
  addMemberToSquad,
  removeMemberFromGroup,
  leaveGroup,
  updateGroupDetails,
  transferGroupAdmin,
  deleteTripGroup,
  FESTIVE_AVATARS,
  DEMO_PROFILES,
  searchSquadCandidates,
  approveJoinRequest,
  rejectJoinRequest,
} from '../../services/friendGroupService';
import {
  getUserDisplayName,
  resolveMemberProfile,
  getInitials,
} from '../../utils/userProfileHelper';
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
  Sparkles,
  UserPlus,
  Plus,
  Search,
  MapPin,
  Train,
  Footprints,
  Bus,
  CheckCircle2,
  Shield,
  Compass,
  Clock,
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

  const isOwner = group.createdBy === currentUser.id;

  // Edit squad details state
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editedName, setEditedName] = useState(group.trip.name);
  const [editedBengaliName, setEditedBengaliName] = useState(group.trip.bengaliName || '');
  const [editedNotes, setEditedNotes] = useState(group.trip.notes || group.trip.description || '');
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Copy states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Add Member State
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMode, setAddMode] = useState<'search' | 'custom'>('search');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberAvatar, setNewMemberAvatar] = useState('dhunuchi_dancer');
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState<string | null>(null);

  // Confirmation dialog states
  const [confirmAction, setConfirmAction] = useState<{
    type: 'remove_member' | 'leave_squad' | 'delete_squad' | 'transfer_admin' | 'owner_leave_warning';
    targetMember?: TripMember;
  } | null>(null);

  const [isActionLoading, setIsActionLoading] = useState(false);

  // Squad emblem
  const squadEmblemId = group.trip.emblem || 'dhunuchi_dancer';
  const emblemAvatar = FESTIVE_AVATARS.find((a) => a.id === squadEmblemId) || FESTIVE_AVATARS[0];

  // Pending Join Requests
  const pendingRequests = useMemo(() => {
    return (group.joinRequests || []).filter((r) => r.status === 'pending');
  }, [group.joinRequests]);

  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);

  const handleApprove = async (requestId: string, reqName: string) => {
    setProcessingRequestId(requestId);
    try {
      const res = await approveJoinRequest(group.trip.id, requestId, currentUser.id);
      if (res.success && res.group) {
        onGroupUpdated(res.group);
        playKanshorBell(0.8);
        playDhakHit('dha', 0.9);
        onShowToast(`✓ ${reqName} approved and added to the squad!`);
      } else {
        onShowToast(res.error || 'Failed to approve request.');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Error approving request.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setProcessingRequestId(requestId);
    try {
      const res = await rejectJoinRequest(group.trip.id, requestId, currentUser.id);
      if (res.success) {
        const updatedRequests = (group.joinRequests || []).map((r) =>
          r.id === requestId ? { ...r, status: 'rejected' as const } : r
        );
        onGroupUpdated({
          ...group,
          joinRequests: updatedRequests,
        });
        onShowToast('Join request rejected.');
      }
    } catch (err: any) {
      onShowToast(err?.message || 'Error rejecting request.');
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Candidates for search
  const currentMemberIds = useMemo(
    () => group.members.map((m) => m.userId),
    [group.members]
  );

  const searchResults = useMemo(() => {
    return searchSquadCandidates(memberSearchQuery, currentMemberIds);
  }, [memberSearchQuery, currentMemberIds]);

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

  // Save edited squad details
  const handleSaveInfo = async () => {
    if (!editedName.trim()) return;
    setIsSavingInfo(true);
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
        setIsEditingInfo(false);
        playKanshorBell(0.7);
        onShowToast('Squad details updated successfully!');
      } else {
        alert(res.error || 'Failed to update squad details.');
      }
    } catch (err: any) {
      alert(err?.message || 'Error updating squad details');
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Add Member handler (from search or custom input)
  const handleAddCandidate = async (candidate: {
    id: string;
    displayName: string;
    bengaliName?: string;
    email?: string;
    avatarUrl?: string;
  }) => {
    setIsAddingMember(true);
    setAddMemberError(null);

    try {
      const res = await addMemberToSquad(
        group.trip.id,
        {
          userId: candidate.id,
          name: candidate.displayName,
          bengaliName: candidate.bengaliName,
          emailOrPhone: candidate.email,
          avatarUrl: candidate.avatarUrl || 'dhaki_drummer',
          role: 'member',
        },
        currentUser.id
      );

      if (res.success && res.group) {
        onGroupUpdated(res.group);
        playKanshorBell(0.8);
        onShowToast(`✓ ${candidate.displayName} added to the squad!`);
        setShowAddMemberModal(false);
        setMemberSearchQuery('');
      } else {
        setAddMemberError(res.error || 'Failed to add member.');
      }
    } catch (err: any) {
      setAddMemberError(err?.message || 'Failed to add member.');
    } finally {
      setIsAddingMember(false);
    }
  };

  // Custom Member Form submit
  const handleAddCustomMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) {
      setAddMemberError('Please enter a member name.');
      return;
    }
    setIsAddingMember(true);
    setAddMemberError(null);

    try {
      const res = await addMemberToSquad(
        group.trip.id,
        {
          name: newMemberName.trim(),
          emailOrPhone: newMemberEmail.trim() || undefined,
          avatarUrl: newMemberAvatar,
          role: 'member',
        },
        currentUser.id
      );

      if (res.success && res.group) {
        onGroupUpdated(res.group);
        setNewMemberName('');
        setNewMemberEmail('');
        setShowAddMemberModal(false);
        playKanshorBell(0.8);
        onShowToast(`✓ ${newMemberName.trim()} added to the squad!`);
      } else {
        setAddMemberError(res.error || 'Failed to add member.');
      }
    } catch (err: any) {
      setAddMemberError(err?.message || 'Failed to add member.');
    } finally {
      setIsAddingMember(false);
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
          const memberDisplayName = getUserDisplayName(confirmAction.targetMember.profile, 'member');
          onShowToast(`Removed ${memberDisplayName} from squad.`);
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
          const memberDisplayName = getUserDisplayName(confirmAction.targetMember.profile, 'member');
          onShowToast(`Transferred Admin rights to ${memberDisplayName}.`);
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

  // Safe handler for leaving squad
  const handleInitiateLeaveSquad = () => {
    if (isOwner) {
      setConfirmAction({ type: 'owner_leave_warning' });
    } else {
      setConfirmAction({ type: 'leave_squad' });
    }
  };

  return (
    <div
      id="manage-squad-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        className={`w-full max-w-lg rounded-3xl p-4 sm:p-5 border shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-[#FFFDF9] border-[#D97706]/30 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${emblemAvatar.gradient} flex items-center justify-center text-xl shadow-xs`}>
              {emblemAvatar.emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                  Manage Squad
                </h3>
                {isOperatorAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[10px] font-black flex items-center gap-0.5">
                    <Crown className="w-2.5 h-2.5 text-amber-500" />
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

        {/* Squad Information Card (Editable by Admin) */}
        <div
          className={`p-3.5 rounded-2xl border ${
            isDarkMode ? 'bg-[#281B23] border-stone-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          {isEditingInfo && isOperatorAdmin ? (
            <div className="space-y-2.5">
              <div>
                <label className="text-micro font-bold text-stone-500 block mb-0.5">
                  Squad Title
                </label>
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-bold text-stone-900 dark:text-white"
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
                  className="w-full px-3 py-1.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-bengali font-bold text-stone-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditingInfo(false)}
                  className="px-3 py-1 rounded-xl text-micro font-bold bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveInfo}
                  disabled={isSavingInfo}
                  className="px-3.5 py-1 rounded-xl text-micro font-bold bg-[#DC2626] text-white flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSavingInfo ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                      Active Squad
                    </span>
                    <span className="px-2 py-0.2 rounded-md bg-[#DC2626]/10 text-[#DC2626] text-[10px] font-black uppercase">
                      {group.trip.city.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="font-display font-black text-h3 text-stone-900 dark:text-white">
                    {group.trip.name}
                  </h4>
                  {group.trip.bengaliName && (
                    <p className="font-bengali text-small text-[#DC2626] font-semibold">
                      {group.trip.bengaliName}
                    </p>
                  )}
                </div>

                {isOperatorAdmin && (
                  <button
                    onClick={() => setIsEditingInfo(true)}
                    className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-micro font-bold flex items-center gap-1 hover:border-[#DC2626] cursor-pointer"
                    title="Edit Squad Name"
                  >
                    <Edit2 className="w-3 h-3 text-[#DC2626]" />
                    <span>Edit</span>
                  </button>
                )}
              </div>

              {/* Itinerary & Transport Overview */}
              <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800/70 grid grid-cols-2 sm:grid-cols-3 gap-2 text-micro">
                <div className="p-2 rounded-xl bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-400 block text-[9px] uppercase font-bold">Transport</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200 capitalize flex items-center gap-1">
                    {group.trip.preferredTransport === 'metro' && <Train className="w-3 h-3 text-[#DC2626]" />}
                    {group.trip.preferredTransport === 'bus' && <Bus className="w-3 h-3 text-amber-500" />}
                    {group.trip.preferredTransport === 'walking' && <Footprints className="w-3 h-3 text-emerald-500" />}
                    <span>{group.trip.preferredTransport}</span>
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-400 block text-[9px] uppercase font-bold">Pandals</span>
                  <span className="font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-amber-500" />
                    <span>{group.trip.selectedPandalIds.length} Stops</span>
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-white dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800 col-span-2 sm:col-span-1">
                  <span className="text-stone-400 block text-[9px] uppercase font-bold">Total Hoppers</span>
                  <span className="font-bold text-[#DC2626] dark:text-[#FEF08A] flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{group.members.length} Members</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Invite Code & Share Bar */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#DC2626]/10 to-[#881337]/15 border border-amber-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <KeyRound className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h4 className="font-display font-bold text-small text-[#881337] dark:text-[#FEF08A]">
                Squad Invite Code
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Realtime Sync</span>
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 bg-white dark:bg-stone-900 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800">
            <div>
              <span className="text-[9px] uppercase font-bold text-stone-400 block">
                6-Digit Code
              </span>
              <span className="font-mono font-black text-xl text-[#DC2626] tracking-widest leading-none">
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
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={handleNativeShare}
                className="px-3 py-1.5 rounded-xl bg-[#881337] hover:bg-[#991B1B] text-white text-micro font-bold shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
              >
                <Share2 className="w-3.5 h-3.5 text-[#FEF08A]" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        {/* Pending Join Requests (Visible to Admin) */}
        {isOperatorAdmin && pendingRequests.length > 0 && (
          <div
            className={`p-3.5 rounded-2xl border space-y-3 animate-fadeIn ${
              isDarkMode ? 'bg-[#2D1B22] border-amber-500/40' : 'bg-amber-50/90 border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500 animate-pulse" />
                <h4 className="font-display font-black text-small uppercase tracking-wider text-[#881337] dark:text-[#FEF08A]">
                  Pending Join Requests ({pendingRequests.length})
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200">
                Action Required
              </span>
            </div>

            <div className="space-y-2">
              {pendingRequests.map((req) => {
                const av = FESTIVE_AVATARS.find((a) => a.id === req.userAvatar) || FESTIVE_AVATARS[0];
                const isBusy = processingRequestId === req.id;
                return (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-tr ${av.gradient} flex items-center justify-center text-sm shadow-2xs shrink-0`}>
                        {av.emoji}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-small text-stone-900 dark:text-white truncate">
                          {req.userName}
                        </div>
                        <div className="text-[10px] text-stone-500 truncate flex items-center gap-1">
                          <span>{req.userEmail || 'Requested to join'}</span>
                          <span>•</span>
                          <span className="tabular-nums">
                            {new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleApprove(req.id, req.userName)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-micro font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                      >
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleReject(req.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-stone-200 hover:bg-rose-100 dark:bg-stone-800 dark:hover:bg-rose-900/40 text-stone-700 hover:text-rose-700 dark:text-stone-300 dark:hover:text-rose-300 disabled:opacity-50 text-micro font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <X className="w-3 h-3" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Squad Members Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#DC2626]" />
              <h4 className="font-display font-black text-small uppercase tracking-wider text-stone-900 dark:text-white">
                Squad Members ({group.members.length})
              </h4>
            </div>

            {isOperatorAdmin && (
              <button
                type="button"
                id="btn-open-add-member"
                onClick={() => {
                  setShowAddMemberModal((prev) => !prev);
                  setAddMemberError(null);
                  setMemberSearchQuery('');
                }}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#DC2626] hover:brightness-110 active:scale-95 text-white text-micro font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                title="Add a friend to this squad"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#FEF08A]" />
                <span>+ Add Member</span>
              </button>
            )}
          </div>

          {/* Add Squad Member Interface (Admin Only) */}
          {showAddMemberModal && isOperatorAdmin && (
            <div
              className={`p-3.5 rounded-2xl border space-y-3 animate-fadeIn ${
                isDarkMode ? 'bg-[#281B23] border-[#F59E0B]/30' : 'bg-amber-50/80 border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between border-b border-amber-300/40 pb-2">
                <div className="flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#DC2626]" />
                  <span className="font-display font-bold text-small text-stone-900 dark:text-white">
                    Add Squad Member
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-white/70 dark:bg-stone-900 p-0.5 rounded-xl border border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setAddMode('search')}
                    className={`px-2 py-0.5 rounded-lg text-micro font-bold transition-all ${
                      addMode === 'search'
                        ? 'bg-[#DC2626] text-white'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    Search Friends
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddMode('custom')}
                    className={`px-2 py-0.5 rounded-lg text-micro font-bold transition-all ${
                      addMode === 'custom'
                        ? 'bg-[#DC2626] text-white'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    Manual Entry
                  </button>
                </div>
              </div>

              {addMemberError && (
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-micro font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{addMemberError}</span>
                </div>
              )}

              {/* MODE 1: Search Users & Friends */}
              {addMode === 'search' ? (
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      placeholder="Search friends by name or email..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                    />
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {searchResults.length === 0 ? (
                      <div className="py-6 text-center text-stone-500 text-micro">
                        No users found matching &ldquo;{memberSearchQuery}&rdquo;
                      </div>
                    ) : (
                      searchResults.map((cand) => {
                        const av = FESTIVE_AVATARS.find((a) => a.id === cand.avatarUrl) || FESTIVE_AVATARS[0];
                        const initials = getInitials(cand.displayName);
                        const isAlreadyMember = cand.isAlreadyMember;

                        return (
                          <div
                            key={cand.id}
                            className={`p-2 rounded-xl border flex items-center justify-between gap-2 ${
                              isAlreadyMember
                                ? 'bg-stone-100/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-60'
                                : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:border-[#DC2626]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${av.gradient} flex items-center justify-center text-sm shrink-0 shadow-2xs`}>
                                {av.emoji || initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs truncate text-stone-900 dark:text-white">
                                  {cand.displayName}
                                </p>
                                <p className="text-[10px] text-stone-500 truncate">
                                  {cand.email || (cand.bengaliName ? cand.bengaliName : 'User')}
                                </p>
                              </div>
                            </div>

                            <div>
                              {isAlreadyMember ? (
                                <span className="px-2 py-1 rounded-lg bg-stone-200 dark:bg-stone-800 text-stone-500 text-[10px] font-bold">
                                  Already in squad
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  disabled={isAddingMember}
                                  onClick={() => handleAddCandidate(cand)}
                                  className="px-3 py-1 rounded-lg bg-[#DC2626] hover:bg-[#991B1B] text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95 transition-transform"
                                >
                                  <Plus className="w-3 h-3 text-[#FEF08A]" />
                                  <span>Add</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* MODE 2: Manual Custom Entry */
                <form onSubmit={handleAddCustomMemberSubmit} className="space-y-2.5">
                  <div>
                    <label className="text-micro font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Friend&apos;s Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g. Poulami Sen / সৌরভ ব্যানার্জি"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-medium text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                    />
                  </div>

                  <div>
                    <label className="text-micro font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Email or Identifier <span className="text-stone-400 text-micro">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      placeholder="e.g. poulami@gmail.com"
                      className="w-full px-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-medium text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
                    />
                  </div>

                  <div>
                    <label className="text-micro font-bold text-stone-600 dark:text-stone-300 block mb-1">
                      Pick Avatar
                    </label>
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      {FESTIVE_AVATARS.map((av) => (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setNewMemberAvatar(av.id)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 transition-transform cursor-pointer ${
                            newMemberAvatar === av.id
                              ? 'ring-2 ring-[#DC2626] scale-110 shadow-sm'
                              : 'opacity-70 hover:opacity-100'
                          } bg-gradient-to-tr ${av.gradient}`}
                          title={av.label}
                        >
                          {av.emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="px-3 py-1.5 rounded-xl text-micro font-bold bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingMember}
                      className="px-4 py-1.5 rounded-xl text-micro font-bold bg-gradient-to-r from-[#DC2626] to-[#991B1B] text-white flex items-center gap-1 shadow-sm hover:brightness-110 active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#FEF08A]" />
                      <span>{isAddingMember ? 'Adding...' : 'Add to Squad'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Persistent Squad Members Roster */}
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {group.members.map((member) => {
              const isMe = member.userId === currentUser.id;
              const isSquadOwner = member.userId === group.createdBy || Boolean(member.isOwner);
              const isAdmin = member.role === 'admin' || isSquadOwner;
              const profile = resolveMemberProfile(member, isMe ? currentUser : undefined);
              const avatar = FESTIVE_AVATARS.find((a) => a.id === profile.avatarUrl) || FESTIVE_AVATARS[0];
              const initials = getInitials(profile.displayName);

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
                      className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${avatar.gradient} flex items-center justify-center text-lg shrink-0 shadow-2xs font-bold text-white`}
                    >
                      {avatar.emoji || initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-display font-bold text-xs sm:text-small truncate text-stone-900 dark:text-white">
                          {profile.displayName}
                        </span>

                        {/* Owner / Admin / Member badges */}
                        {isSquadOwner ? (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-500 text-stone-950 text-[9px] font-black flex items-center gap-0.5 shadow-2xs">
                            <Crown className="w-2.5 h-2.5 text-stone-950 fill-stone-950" />
                            <span>Owner • Admin</span>
                          </span>
                        ) : isAdmin ? (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[9px] font-black flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5 text-amber-500" />
                            <span>Admin</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-md bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-[9px] font-semibold flex items-center gap-0.5">
                            <span>Member</span>
                          </span>
                        )}

                        {isMe && (
                          <span className="px-1.5 py-0.2 rounded-md bg-[#DC2626] text-white text-[9px] font-bold">
                            YOU
                          </span>
                        )}
                      </div>

                      {profile.bengaliName && (
                        <p className="font-bengali text-micro text-[#DC2626] truncate">
                          {profile.bengaliName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Member Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Admin actions on OTHER members */}
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

                        {/* Owner protection: Owner CANNOT be removed */}
                        {!isSquadOwner && (
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
                        )}
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
              onClick={handleInitiateLeaveSquad}
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

        {/* Action Confirmation Dialog Modal */}
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
                    : confirmAction.type === 'owner_leave_warning'
                    ? 'Owner Cannot Leave Directly'
                    : 'Delete Squad Permanently?'}
                </h4>
              </div>

              <p className="text-small text-stone-600 dark:text-stone-300 leading-snug">
                {confirmAction.type === 'remove_member' &&
                  `Remove ${getUserDisplayName(confirmAction.targetMember?.profile, 'this member')} from this squad?`}
                {confirmAction.type === 'transfer_admin' &&
                  `Make "${getUserDisplayName(confirmAction.targetMember?.profile, 'this member')}" an Admin of "${group.trip.name}"?`}
                {confirmAction.type === 'leave_squad' &&
                  `Are you sure you want to leave "${group.trip.name}"? You can re-join anytime using the invite code.`}
                {confirmAction.type === 'owner_leave_warning' &&
                  `You are the creator and owner of this squad. To leave safely, please transfer Admin rights to another member first, or Delete the squad if it is no longer needed.`}
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
                  {confirmAction.type === 'owner_leave_warning' ? 'Understood' : 'Cancel'}
                </button>
                {confirmAction.type !== 'owner_leave_warning' && (
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={handleExecuteConfirmedAction}
                    className="px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-micro font-bold shadow-xs cursor-pointer flex items-center gap-1"
                  >
                    {isActionLoading
                      ? 'Processing...'
                      : confirmAction.type === 'remove_member'
                      ? 'Remove'
                      : 'Confirm'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
