import React, { useState, useEffect, useMemo } from 'react';
import {
  CityId,
  Pandal,
  UserPreferences,
  UserProfile,
  SharedTripGroup,
  TripMember,
  MemberRole,
  GroupActivityEvent,
  CrowdLevel,
} from '../../types';
import {
  getCurrentUserProfile,
  saveCurrentUserProfile,
  switchDemoUser,
  updateUserProfile,
  getTripGroup,
  getMyTripGroups,
  createSharedTripGroup,
  joinTripByInviteCode,
  updateGroupItinerary,
  markGroupPandalDarshan,
  getGroupVisitStatuses,
  subscribeToTripUpdates,
  DEMO_PROFILES,
  FESTIVE_AVATARS,
} from '../../services/friendGroupService';
import { getTripExpenses } from '../../services/groupExpenseService';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { getSavedTrips } from '../../services/tripStorageService';
import { ProfileEditModal } from '../group/ProfileEditModal';
import { JoinGroupModal } from '../group/JoinGroupModal';
import { CrowdReportModal } from '../group/CrowdReportModal';
import { GroupExpenseDashboard } from '../group/GroupExpenseDashboard';
import { ExpenseSplitter } from '../group/ExpenseSplitter';
import { GroupWalkingEnergyCard } from '../group/GroupWalkingEnergyCard';
import { DurgaThirdEye, ShankhaIcon, DhakIcon, AlpanaDivider } from '../common/BengaliMotifs';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  Users,
  UserCheck,
  Crown,
  KeyRound,
  Copy,
  Check,
  Share2,
  Plus,
  Compass,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Flame,
  Radio,
  RefreshCw,
  Eye,
  ShieldCheck,
  MessageSquare,
  Activity,
  User,
  ArrowRight,
  Database,
  Info,
  LogOut,
  ChevronRight,
  Receipt,
  Layers,
  Calculator,
  Split,
} from 'lucide-react';

interface GroupScreenProps {
  activeCity: CityId;
  pandals: Pandal[];
  visitedList: string[];
  onToggleVisited: (id: string) => void;
  onSelectPandal: (pandal: Pandal) => void;
  onNavigateToRoute: () => void;
  userPrefs: UserPreferences;
}

export const GroupScreen: React.FC<GroupScreenProps> = ({
  activeCity,
  pandals,
  visitedList,
  onToggleVisited,
  onSelectPandal,
  onNavigateToRoute,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';

  // Current active user profile
  const [currentUser, setCurrentUser] = useState<UserProfile>(() => getCurrentUserProfile());

  // User's groups
  const [myGroups, setMyGroups] = useState<SharedTripGroup[]>(() => getMyTripGroups());
  const [activeGroupId, setActiveGroupId] = useState<string>(() => {
    const groups = getMyTripGroups();
    const forCity = groups.find((g) => g.trip.city === activeCity);
    return forCity ? forCity.trip.id : groups[0]?.trip.id || 'group-kolkata-2026';
  });

  // Active Group Details
  const activeGroup = useMemo(() => {
    return getTripGroup(activeGroupId) || myGroups[0] || null;
  }, [activeGroupId, myGroups]);

  // Per-member visit statuses for active group
  const [visitStatuses, setVisitStatuses] = useState(() =>
    activeGroup ? getGroupVisitStatuses(activeGroup.trip.id) : []
  );

  // Modals state
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCrowdModal, setShowCrowdModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeGroupSubTab, setActiveGroupSubTab] = useState<'squad' | 'splitter' | 'expenses'>('squad');
  const [expenseRefreshKey, setExpenseRefreshKey] = useState(0);

  // Count active group expenses for tab badge
  const activeGroupExpenseCount = useMemo(() => {
    if (!activeGroup) return 0;
    return getTripExpenses(activeGroup.trip.id).length;
  }, [activeGroup, expenseRefreshKey]);

  // Sync state when activeGroup changes or city changes
  useEffect(() => {
    if (activeGroup) {
      setVisitStatuses(getGroupVisitStatuses(activeGroup.trip.id));
    }
  }, [activeGroupId]);

  // Realtime subscription to active group updates
  useEffect(() => {
    if (!activeGroup) return;

    const unsubscribe = subscribeToTripUpdates(activeGroup.trip.id, (event) => {
      // Refresh group and visit state
      setMyGroups(getMyTripGroups());
      setVisitStatuses(getGroupVisitStatuses(activeGroup.trip.id));
      setIsSyncing(true);
      setTimeout(() => setIsSyncing(false), 600);
    });

    return () => unsubscribe();
  }, [activeGroup?.trip.id]);

  // Switch demo user test function
  const handleSwitchUser = (demoId: string) => {
    const nextUser = switchDemoUser(demoId);
    setCurrentUser(nextUser);
    setMyGroups(getMyTripGroups(nextUser.id));
    playKanshorBell(0.5);
  };

  // Copy 6-char Invite Code
  const handleCopyCode = () => {
    if (!activeGroup) return;
    navigator.clipboard?.writeText(activeGroup.inviteCode);
    setCopiedCode(true);
    playKanshorBell(0.6);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Copy full invite link
  const handleCopyShareLink = () => {
    if (!activeGroup) return;
    const url = `${window.location.origin}${window.location.pathname}?invite=${activeGroup.inviteCode}`;
    const text = `🎉 Join our Durga Puja hopping squad "${activeGroup.trip.name}" on PujaTrip!\nUse invite code: ${activeGroup.inviteCode}\nDirect Link: ${url}`;
    navigator.clipboard?.writeText(text);
    setCopiedLink(true);
    playKanshorBell(0.6);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Mark group darshan
  const handleToggleDarshan = async (pandalId: string, pandalName: string) => {
    if (!activeGroup) return;
    const userVisit = visitStatuses.find(
      (v) => v.pandalId === pandalId && v.userId === currentUser.id
    );
    const nextStatus = !userVisit?.isVisited;

    playKanshorBell(0.7);
    if (nextStatus) playDhakHit('dha', 0.8);

    await markGroupPandalDarshan(
      activeGroup.trip.id,
      pandalId,
      pandalName,
      currentUser.id,
      nextStatus
    );

    // Also update parent visitedList if needed
    onToggleVisited(pandalId);

    // Refresh visit statuses
    setVisitStatuses(getGroupVisitStatuses(activeGroup.trip.id));
    setMyGroups(getMyTripGroups());
  };

  // Submit Crowd Report
  const handleSubmitCrowdReport = async (
    pandalId: string,
    crowdLevel: CrowdLevel,
    waitMinutes: number,
    notes: string
  ) => {
    if (!activeGroup) return;
    const pandal = pandals.find((p) => p.id === pandalId);
    const pandalName = pandal ? pandal.name : pandalId;

    // Add activity log to group
    const updated = getTripGroup(activeGroup.trip.id);
    if (updated) {
      updated.recentActivities.unshift({
        id: `act_${Date.now()}`,
        tripId: activeGroup.trip.id,
        type: 'crowd_reported',
        userId: currentUser.id,
        userName: currentUser.displayName,
        description: `${currentUser.displayName} reported ${crowdLevel.toUpperCase()} rush (~${waitMinutes}m wait) at ${pandalName}`,
        bengaliDescription: `${currentUser.displayName} ${pandalName}-এ ভিড়ের তথ্য রিপোর্ট করেছেন`,
        pandalId,
        pandalName,
        timestamp: new Date().toISOString(),
      });
      setMyGroups(getMyTripGroups());
    }
  };

  // Resolve pandal records for group itinerary
  const groupPandals = useMemo(() => {
    if (!activeGroup) return [];
    return activeGroup.trip.selectedPandalIds
      .map((id) => pandals.find((p) => p.id === id))
      .filter((p): p is Pandal => p !== undefined);
  }, [activeGroup, pandals]);

  // Current user's avatar object
  const currentAvatar = FESTIVE_AVATARS.find((a) => a.id === currentUser.avatarUrl) || FESTIVE_AVATARS[0];

  return (
    <div id="friend-group-screen" className="space-y-4 pb-12 animate-fadeIn">
      {/* Top Banner & Profile Header */}
      <div
        className={`p-4 rounded-3xl border shadow-sm relative overflow-hidden transition-colors ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#281B23] via-[#1C1418] to-[#171014] border-[#F59E0B]/25'
            : 'bg-gradient-to-br from-[#FFF9F2] via-[#FFFDF9] to-[#FEF3C7]/40 border-[#D97706]/20'
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* User Profile Info Pill */}
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentAvatar.gradient} flex items-center justify-center text-2xl shadow-md ring-2 ring-white/20`}
            >
              {currentAvatar.emoji}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A] leading-tight">
                  {currentUser.displayName}
                </h2>
                {activeGroup?.myRole === 'admin' ? (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 text-[10px] font-black flex items-center gap-0.5">
                    <Crown className="w-3 h-3 text-amber-500" />
                    <span>Admin</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-900 dark:text-blue-200 text-[10px] font-bold">
                    Squad Member
                  </span>
                )}
              </div>
              <p className="font-bengali-serif text-small text-[#DC2626] font-bold">
                {currentUser.bengaliName || currentAvatar.bengaliLabel}
              </p>
              <div className="flex items-center gap-2 mt-0.5 text-micro text-stone-500">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Online now</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-stone-400" />
                  <span>
                    {currentUser.isLocationSharingEnabled ? 'Live Location On' : 'Location Hidden'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Profile Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-3 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 text-micro font-bold border border-stone-300 dark:border-stone-700 transition-all flex items-center gap-1"
            >
              <User className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#991B1B] hover:bg-[#DC2626] text-white text-micro font-bold shadow-sm transition-all flex items-center gap-1"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Enter Code</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Friend Switcher Bar */}
        <div className="mt-3.5 pt-3 border-t border-stone-200/80 dark:border-stone-800/80 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-stone-500 shrink-0 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Switch Test Friend:</span>
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {DEMO_PROFILES.map((p) => {
              const isSelected = p.id === currentUser.id;
              const av = FESTIVE_AVATARS.find((a) => a.id === p.avatarUrl) || FESTIVE_AVATARS[0];
              return (
                <button
                  key={p.id}
                  onClick={() => handleSwitchUser(p.id)}
                  className={`px-2 py-1 rounded-xl text-micro font-bold flex items-center gap-1 transition-all ${
                    isSelected
                      ? 'bg-[#DC2626] text-white shadow-xs'
                      : 'bg-white/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:border-[#DC2626]'
                  }`}
                  title={`${p.displayName} (${p.bengaliName})`}
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

      {/* Backend & Realtime Status Indicator */}
      <div
        className={`px-3.5 py-2 rounded-2xl border flex items-center justify-between text-micro font-semibold ${
          isDarkMode
            ? 'bg-[#1F171C] border-[#F59E0B]/20 text-stone-300'
            : 'bg-stone-50 border-stone-200 text-stone-700'
        }`}
      >
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>
            {isSupabaseConfigured ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                Supabase Realtime Cloud Connected
              </span>
            ) : (
              <span className="text-stone-600 dark:text-stone-400">
                Supabase Engine Active (Dual-Mode Realtime)
              </span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-stone-500 font-mono">Channel: trip_group_sync</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      {/* Active Trip Squad Card */}
      {activeGroup ? (
        <div
          className={`p-4 rounded-3xl border shadow-sm space-y-4 ${
            isDarkMode
              ? 'bg-[#1C1418] border-[#F59E0B]/30 text-white'
              : 'bg-white border-[#D97706]/20 text-stone-900'
          }`}
        >
          {/* Header of Active Group */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-lg bg-[#DC2626]/15 text-[#DC2626] font-black text-micro uppercase tracking-wider">
                  {activeGroup.trip.city.toUpperCase()} TRIP
                </span>
                <span className="text-micro text-stone-500 tabular-nums">
                  📅 {activeGroup.trip.date} • ⏰ {activeGroup.trip.startTime} - {activeGroup.trip.endTime}
                </span>
              </div>
              <h3 className="font-display font-black text-h2 text-[#881337] dark:text-[#FEF08A] mt-1">
                {activeGroup.trip.name}
              </h3>
              {activeGroup.trip.bengaliName && (
                <p className="font-bengali-serif text-small text-[#DC2626] font-bold">
                  {activeGroup.trip.bengaliName}
                </p>
              )}
            </div>

            {/* Invite Code Badge with 1-Click Copy */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1.5 p-1.5 px-3 rounded-2xl bg-amber-500/15 border border-amber-500/30">
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300 block">
                    Invite Code
                  </span>
                  <span className="font-mono font-black text-base text-[#DC2626] tracking-wider leading-none">
                    {activeGroup.inviteCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className="p-1.5 rounded-xl bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 shadow-xs transition-transform active:scale-95"
                  title="Copy Invite Code"
                >
                  {copiedCode ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-[#DC2626]" />
                  )}
                </button>
              </div>

              <button
                onClick={handleCopyShareLink}
                className="text-micro font-bold text-[#DC2626] hover:underline flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" />
                <span>{copiedLink ? 'Link Copied!' : 'Share Squad Link'}</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div
              className={`p-2.5 rounded-2xl border text-center ${
                isDarkMode ? 'bg-[#281B23] border-stone-800' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <span className="text-micro text-stone-500 block font-semibold">Squad Members</span>
              <span className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A] tabular-nums">
                {activeGroup.members.length} Friends
              </span>
            </div>

            <div
              className={`p-2.5 rounded-2xl border text-center ${
                isDarkMode ? 'bg-[#281B23] border-stone-800' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <span className="text-micro text-stone-500 block font-semibold">Selected Pandals</span>
              <span className="font-display font-black text-h3 text-[#DC2626] tabular-nums">
                {groupPandals.length} Stops
              </span>
            </div>

            <div
              className={`p-2.5 rounded-2xl border text-center ${
                isDarkMode ? 'bg-[#281B23] border-stone-800' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <span className="text-micro text-stone-500 block font-semibold">Transport Mode</span>
              <span className="font-display font-black text-h3 text-amber-600 capitalize">
                {activeGroup.trip.preferredTransport}
              </span>
            </div>
          </div>

          {/* Sub-navigation Switcher: Squad vs Splitter vs Full Ledger */}
          <div className="p-1 rounded-2xl bg-stone-200/70 dark:bg-stone-800/80 grid grid-cols-3 gap-1">
            <button
              id="subtab-squad-btn"
              onClick={() => {
                setActiveGroupSubTab('squad');
                playKanshorBell(0.4);
              }}
              className={`py-2 px-2 sm:px-3 rounded-xl text-micro sm:text-small font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeGroupSubTab === 'squad'
                  ? 'bg-white dark:bg-stone-900 text-[#881337] dark:text-[#FEF08A] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#DC2626]" />
              <span className="truncate">Squad & Darshan</span>
            </button>

            <button
              id="subtab-splitter-btn"
              onClick={() => {
                setActiveGroupSubTab('splitter');
                playKanshorBell(0.4);
              }}
              className={`py-2 px-2 sm:px-3 rounded-xl text-micro sm:text-small font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeGroupSubTab === 'splitter'
                  ? 'bg-gradient-to-r from-amber-600 to-[#DC2626] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-[#FEF08A]" />
              <span className="truncate">Expense Splitter</span>
            </button>

            <button
              id="subtab-expenses-btn"
              onClick={() => {
                setActiveGroupSubTab('expenses');
                playKanshorBell(0.4);
              }}
              className={`py-2 px-2 sm:px-3 rounded-xl text-micro sm:text-small font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeGroupSubTab === 'expenses'
                  ? 'bg-white dark:bg-stone-900 text-[#881337] dark:text-[#FEF08A] shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate">Full Ledger</span>
              {activeGroupExpenseCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#DC2626] text-white text-[10px] font-black">
                  {activeGroupExpenseCount}
                </span>
              )}
            </button>
          </div>

          {/* Render Active Sub-View */}
          {activeGroupSubTab === 'splitter' ? (
            <ExpenseSplitter
              trip={activeGroup.trip}
              members={activeGroup.members}
              currentUser={currentUser}
              isDarkMode={isDarkMode}
              onExpenseAdded={() => {
                setExpenseRefreshKey((k) => k + 1);
              }}
            />
          ) : activeGroupSubTab === 'expenses' ? (
            <GroupExpenseDashboard
              key={expenseRefreshKey}
              trip={activeGroup.trip}
              members={activeGroup.members}
              tripPandals={groupPandals}
              userPrefs={userPrefs}
              onNavigateToPandal={onSelectPandal}
            />
          ) : (
            <>
              {/* Member Roster List */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#DC2626]" />
                    <h4 className="font-display font-bold text-h4 text-[#881337] dark:text-[#FEF08A]">
                      Squad Roster & Darshan Progress ({activeGroup.members.length})
                    </h4>
                  </div>
                  <span className="text-micro text-stone-500 font-bengali font-bold">যাত্রী তালিকা</span>
                </div>

                <div className="space-y-2">
                  {activeGroup.members.map((member) => {
                    const isCurrent = member.userId === currentUser.id;
                    const memberProfile = member.profile || DEMO_PROFILES.find((p) => p.id === member.userId) || currentUser;
                    const memberAvatar = FESTIVE_AVATARS.find((a) => a.id === memberProfile.avatarUrl) || FESTIVE_AVATARS[0];

                    // Calculate member's completed pandal darshans
                    const completedCount = visitStatuses.filter(
                      (v) => v.userId === member.userId && v.isVisited
                    ).length;
                    const totalStops = groupPandals.length || 1;
                    const progressPct = Math.round((completedCount / totalStops) * 100);

                    return (
                      <div
                        key={member.id}
                        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                          isCurrent
                            ? isDarkMode
                              ? 'bg-[#2D1B25] border-[#DC2626]/40 ring-1 ring-[#DC2626]/30'
                              : 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-400/30'
                            : isDarkMode
                            ? 'bg-[#22161E] border-stone-800'
                            : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        {/* Avatar & Names */}
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${memberAvatar.gradient} flex items-center justify-center text-xl shrink-0 shadow-xs`}
                          >
                            {memberAvatar.emoji}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-display font-bold text-small truncate">
                                {memberProfile.displayName}
                              </span>
                              {member.role === 'admin' && (
                                <span title="Trip Admin">
                                  <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                </span>
                              )}
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded-md bg-[#DC2626] text-white text-[9px] font-bold">
                                  YOU
                                </span>
                              )}
                            </div>
                            {memberProfile.bengaliName && (
                              <p className="font-bengali text-micro text-[#DC2626] font-semibold truncate">
                                {memberProfile.bengaliName}
                              </p>
                            )}
                            <div className="flex items-center gap-2 text-[10px] text-stone-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    memberProfile.isOnline ? 'bg-emerald-500' : 'bg-stone-400'
                                  }`}
                                />
                                <span>{memberProfile.isOnline ? 'Active' : 'Offline'}</span>
                              </span>
                              <span>•</span>
                              <span>
                                {memberProfile.isLocationSharingEnabled ? '📍 Sharing' : '🔕 Off'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar & Status */}
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-micro font-bold text-stone-700 dark:text-stone-300 tabular-nums">
                            {completedCount} / {groupPandals.length} Darshan
                          </span>
                          <div className="w-24 h-2 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-amber-500 to-[#DC2626] transition-all duration-300"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-stone-500 font-semibold tabular-nums">
                            {progressPct}% Completed
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Group Walking & Energy Activity View (Requirement 7) */}
              <GroupWalkingEnergyCard
                members={activeGroup.members}
                currentUserId={currentUser.id}
                tripId={activeGroup.trip.id}
                userPrefs={userPrefs}
              />

              {/* Shared Pandal Darshan Quick Checklist */}
              <div className="pt-2 space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <div className="flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-[#DC2626]" />
                    <h4 className="font-display font-bold text-h4 text-[#881337] dark:text-[#FEF08A]">
                      Shared Itinerary Stops ({groupPandals.length})
                    </h4>
                  </div>
                  <button
                    onClick={onNavigateToRoute}
                    className="text-micro font-bold text-[#DC2626] hover:underline flex items-center gap-0.5"
                  >
                    <span>Full Timeline Planner</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5">
                  {groupPandals.map((pandal, idx) => {
                    const userVisit = visitStatuses.find(
                      (v) => v.pandalId === pandal.id && v.userId === currentUser.id
                    );
                    const isVisited = userVisit ? userVisit.isVisited : visitedList.includes(pandal.id);

                    return (
                      <div
                        key={pandal.id}
                        className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 transition-all ${
                          isVisited
                            ? 'bg-emerald-500/10 border-emerald-500/30'
                            : isDarkMode
                            ? 'bg-[#241720] border-stone-800'
                            : 'bg-white border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-micro font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <button
                              onClick={() => onSelectPandal(pandal)}
                              className="font-display font-bold text-small text-left hover:text-[#DC2626] truncate block"
                            >
                              {pandal.name}
                            </button>
                            <p className="text-micro text-stone-500 truncate">
                              {pandal.bengaliName} • {pandal.area}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleDarshan(pandal.id, pandal.name)}
                          className={`px-3 py-1 rounded-xl text-micro font-bold transition-all flex items-center gap-1 ${
                            isVisited
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-stone-200 dark:bg-stone-700 hover:bg-[#DC2626] hover:text-white text-stone-700 dark:text-stone-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{isVisited ? 'Darshan Done' : 'Mark Visited'}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Quick Crowd Reporting & Live Alert Button */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                  isDarkMode
                    ? 'bg-gradient-to-r from-amber-950/40 to-[#281B23] border-amber-500/30'
                    : 'bg-gradient-to-r from-amber-50 to-orange-50/60 border-amber-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-small font-bold text-stone-800 dark:text-stone-200">
                      See Long Queue at a Pandal?
                    </p>
                    <p className="text-micro text-stone-500 font-bengali">
                      বন্ধুদের জন্য লাইভ ভিড় রিপোর্ট করুন
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowCrowdModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#991B1B] text-white text-micro font-bold shadow-sm transition-all flex items-center gap-1 shrink-0"
                >
                  <Radio className="w-3.5 h-3.5 animate-pulse" />
                  <span>Report Crowd</span>
                </button>
              </div>

              {/* Live Group Activity Feed */}
              {activeGroup.recentActivities && activeGroup.recentActivities.length > 0 && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center justify-between px-0.5">
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#DC2626]" />
                      <h4 className="font-display font-bold text-h4 text-[#881337] dark:text-[#FEF08A]">
                        Live Squad Activity Feed
                      </h4>
                    </div>
                    <span className="text-micro text-stone-500 font-mono">Realtime Log</span>
                  </div>

                  <div className="space-y-1.5">
                    {activeGroup.recentActivities.slice(0, 5).map((act) => (
                      <div
                        key={act.id}
                        className={`p-2.5 rounded-xl border text-micro flex items-center justify-between gap-2 ${
                          isDarkMode ? 'bg-[#22161E] border-stone-800' : 'bg-stone-50 border-stone-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                          <span className="text-stone-700 dark:text-stone-300 truncate">
                            {act.description}
                          </span>
                        </div>
                        <span className="text-[10px] text-stone-500 shrink-0 font-mono">
                          {new Date(act.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        /* Empty State: Create or Join Group */
        <div className="py-12 text-center space-y-4 bg-stone-50 dark:bg-stone-900/50 rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 p-6">
          <div className="w-14 h-14 rounded-full bg-[#DC2626]/10 flex items-center justify-center mx-auto text-[#DC2626]">
            <Users size={32} />
          </div>
          <h3 className="font-display font-bold text-h3 text-stone-800 dark:text-stone-200">
            No Shared Squad Joined Yet
          </h3>
          <p className="text-small text-stone-500 max-w-xs mx-auto font-bengali">
            বন্ধুদের সাথে একসাথে বের হতে ইনভাইট কোড দিয়ে যুক্ত হন অথবা নতুন শারদ ট্রিপ শুরু করুন।
          </p>
          <div className="flex justify-center gap-2 pt-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white text-btn font-bold shadow-md"
            >
              Enter Squad Invite Code
            </button>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileModal && (
        <ProfileEditModal
          currentProfile={currentUser}
          onSave={async (updates) => {
            const updated = await updateUserProfile(updates);
            setCurrentUser(updated);
            setMyGroups(getMyTripGroups(updated.id));
          }}
          onClose={() => setShowProfileModal(false)}
          userPrefs={userPrefs}
        />
      )}

      {/* Join Group Modal */}
      {showJoinModal && (
        <JoinGroupModal
          currentUser={currentUser}
          onJoined={(group) => {
            setActiveGroupId(group.trip.id);
            setMyGroups(getMyTripGroups());
          }}
          onClose={() => setShowJoinModal(false)}
          userPrefs={userPrefs}
        />
      )}

      {/* Crowd Report Modal */}
      {showCrowdModal && (
        <CrowdReportModal
          pandals={groupPandals.length > 0 ? groupPandals : pandals.filter((p) => p.city === activeCity)}
          currentUser={currentUser}
          onSubmitReport={handleSubmitCrowdReport}
          onClose={() => setShowCrowdModal(false)}
          userPrefs={userPrefs}
        />
      )}
    </div>
  );
};
