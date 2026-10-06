import {
  UserProfile,
  TripMember,
  MemberRole,
  TripPlan,
  SharedTripGroup,
  GroupActivityEvent,
  TripPandalStopRecord,
  PandalVisitStatusRecord,
  TripExpenseRecord,
  CrowdReportRecord,
  LiveLocationRecord,
  CrowdLevel,
  CityId,
  PandalGroupVisitSummary,
  GroupTripProgressSummary,
  TripDayPlan,
  SquadJoinRequest,
  SquadSettings,
  SharedPandalVisitEvent,
  Pandal,
} from '../types';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { getSavedTrips, saveTrip, createTrip } from './tripStorageService';
import { durgaPuja2026Dates, getTodayTithiInfo } from '../data/festivalCalendar2026';
import { calculateDistanceKm } from '../utils/geoUtils';
import { ensureValidUuid, generateCleanUuid } from '../utils/userProfileHelper';

export { saveTrip };

// ============================================================================
// BENGALI FESTIVE AVATAR CATALOG
// ============================================================================
export interface FestiveAvatar {
  id: string;
  label: string;
  bengaliLabel: string;
  emoji: string;
  gradient: string;
}

export const FESTIVE_AVATARS: FestiveAvatar[] = [
  {
    id: 'dhunuchi_dancer',
    label: 'Dhunuchi Dancer',
    bengaliLabel: 'ধুনুচি নৃত্যশিল্পী',
    emoji: '🔥',
    gradient: 'from-amber-600 to-red-600',
  },
  {
    id: 'dhaki_drummer',
    label: 'Dhaki Drummer',
    bengaliLabel: 'ঢাকি বাদক',
    emoji: '🥁',
    gradient: 'from-red-600 to-rose-700',
  },
  {
    id: 'alpana_artist',
    label: 'Alpana Artist',
    bengaliLabel: 'আলপনা শিল্পী',
    emoji: '🌸',
    gradient: 'from-rose-500 to-pink-600',
  },
  {
    id: 'sindoor_khela',
    label: 'Sindoor Khela',
    bengaliLabel: 'সিঁদুর খেলা',
    emoji: '🔴',
    gradient: 'from-red-700 to-amber-700',
  },
  {
    id: 'conch_blower',
    label: 'Shankha Blower',
    bengaliLabel: 'শঙ্খ বাদক',
    emoji: '🐚',
    gradient: 'from-amber-500 to-yellow-600',
  },
  {
    id: 'pujo_foodie',
    label: 'Pujo Foodie (Bhog & Roll)',
    bengaliLabel: 'ভোগ ও রোল রসিক',
    emoji: '🍲',
    gradient: 'from-orange-500 to-amber-600',
  },
  {
    id: 'heritage_explorer',
    label: 'Bonedi Explorer',
    bengaliLabel: 'বনেদি বাড়ি সন্ধানী',
    emoji: '🏛️',
    gradient: 'from-emerald-600 to-teal-700',
  },
  {
    id: 'photographer',
    label: 'Sharad Photographer',
    bengaliLabel: 'শারদ আলোকচিত্রী',
    emoji: '📸',
    gradient: 'from-indigo-600 to-purple-700',
  },
];

// ============================================================================
// PRE-SEEDED TEST DEMO PROFILES (For instant multi-user simulation)
// ============================================================================
export const DEMO_PROFILES: UserProfile[] = [
  {
    id: 'user_anirban_admin',
    email: 'anirban@pujatrip.app',
    displayName: 'Anirban Mukhopadhyay',
    bengaliName: 'অনির্বাণ মুখোপাধ্যায়',
    avatarUrl: 'dhunuchi_dancer',
    isLocationSharingEnabled: true,
    lastSeenAt: new Date().toISOString(),
    isOnline: true,
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_sourav_member',
    email: 'sourav@pujatrip.app',
    displayName: 'Sourav Ganguly',
    bengaliName: 'সৌরভ গাঙ্গুলী',
    avatarUrl: 'dhaki_drummer',
    isLocationSharingEnabled: true,
    lastSeenAt: new Date(Date.now() - 3 * 60000).toISOString(),
    isOnline: true,
    createdAt: '2026-08-02T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_sreemoyee_member',
    email: 'sreemoyee@pujatrip.app',
    displayName: 'Sreemoyee Sen',
    bengaliName: 'শ্রীময়ী সেন',
    avatarUrl: 'alpana_artist',
    isLocationSharingEnabled: false,
    lastSeenAt: new Date(Date.now() - 12 * 60000).toISOString(),
    isOnline: false,
    createdAt: '2026-08-03T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_sayantani_member',
    email: 'sayantani@pujatrip.app',
    displayName: 'Sayantani Das',
    bengaliName: 'সায়ন্তনী দাস',
    avatarUrl: 'sindoor_khela',
    isLocationSharingEnabled: true,
    lastSeenAt: new Date(Date.now() - 1 * 60000).toISOString(),
    isOnline: true,
    createdAt: '2026-08-04T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'user_debojyoti_member',
    email: 'debojyoti@pujatrip.app',
    displayName: 'Debojyoti Roy',
    bengaliName: 'দেবজ্যোতি রায়',
    avatarUrl: 'conch_blower',
    isLocationSharingEnabled: true,
    lastSeenAt: new Date(Date.now() - 25 * 60000).toISOString(),
    isOnline: false,
    createdAt: '2026-08-05T10:00:00Z',
    updatedAt: new Date().toISOString(),
  },
];

const LOCAL_STORAGE_ACTIVE_USER = 'pujatrip_active_user_v1';
const LOCAL_STORAGE_SHARED_GROUPS = 'pujatrip_shared_groups_v1';
const LOCAL_STORAGE_VISIT_STATUSES = 'pujatrip_visit_statuses_v1';
const LOCAL_STORAGE_EXPENSES = 'pujatrip_expenses_v1';
const LOCAL_STORAGE_CROWD_REPORTS = 'pujatrip_crowd_reports_v1';
const LOCAL_STORAGE_LIVE_LOCATIONS = 'pujatrip_live_locations_v1';

// Cross-tab Realtime Event Bus for local simulation
const groupBroadcastChannel = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('pujatrip_group_sync_channel')
  : null;

// ============================================================================
// HELPER: GENERATE UNIQUE INVITE CODE (e.g. "KP26X7", "CT26M9")
// ============================================================================
export const generateInviteCode = (city: CityId): string => {
  const prefix = city === 'kolkata' ? 'KP' : 'CT';
  const yearSuffix = '26';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 2; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}${yearSuffix}${rand}`;
};

// ============================================================================
// USER PROFILE & AUTHENTICATION
// ============================================================================

export const getCurrentUserProfile = (): UserProfile => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ACTIVE_USER);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading active user:', err);
  }
  // Default to Anirban (Admin)
  const defaultUser = DEMO_PROFILES[0];
  saveCurrentUserProfile(defaultUser);
  return defaultUser;
};

export const saveCurrentUserProfile = (profile: UserProfile): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_ACTIVE_USER, JSON.stringify(profile));
  } catch (err) {
    console.warn('Error saving user profile:', err);
  }
};

export const switchDemoUser = (demoId: string): UserProfile => {
  const target = DEMO_PROFILES.find((p) => p.id === demoId) || DEMO_PROFILES[0];
  saveCurrentUserProfile(target);
  // Broadcast user switch to other tabs / listeners
  groupBroadcastChannel?.postMessage({
    type: 'USER_SWITCHED',
    userId: target.id,
  });
  return target;
};

export const updateUserProfile = async (
  updates: Partial<UserProfile>
): Promise<UserProfile> => {
  const current = getCurrentUserProfile();
  const updated: UserProfile = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  saveCurrentUserProfile(updated);

  // If Supabase is configured, update in real database
  const supabase = getSupabase();
  if (supabase && current.id && !current.id.startsWith('user_')) {
    try {
      await supabase
        .from('profiles')
        .update({
          display_name: updated.displayName,
          bengali_name: updated.bengaliName,
          avatar_url: updated.avatarUrl,
          is_location_sharing_enabled: updated.isLocationSharingEnabled,
          updated_at: updated.updatedAt,
        })
        .eq('id', updated.id);
    } catch (err) {
      console.warn('Failed to update Supabase profile:', err);
    }
  }

  return updated;
};

// Simulated / Real Supabase Sign In
export const signInWithEmail = async (
  email: string,
  pass: string
): Promise<{ user: UserProfile | null; error: string | null }> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      if (error) {
        return { user: null, error: error.message };
      }
      if (data.user) {
        // Fetch or create profile
        const { data: prof } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email,
          displayName: prof?.display_name || email.split('@')[0],
          bengaliName: prof?.bengali_name,
          avatarUrl: prof?.avatar_url || 'dhunuchi_dancer',
          isLocationSharingEnabled: prof?.is_location_sharing_enabled ?? true,
          lastSeenAt: new Date().toISOString(),
          isOnline: true,
          createdAt: prof?.created_at || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveCurrentUserProfile(userProfile);
        return { user: userProfile, error: null };
      }
    } catch (err: any) {
      return { user: null, error: err?.message || 'Authentication failed' };
    }
  }

  // Fallback / Offline Mock Login: match demo user or create mock session
  const match = DEMO_PROFILES.find((p) => p.email?.toLowerCase() === email.toLowerCase());
  if (match) {
    saveCurrentUserProfile(match);
    return { user: match, error: null };
  }

  // Create new mock user
  const newUser: UserProfile = {
    id: `user_${Date.now()}`,
    email,
    displayName: email.split('@')[0],
    bengaliName: undefined,
    avatarUrl: 'dhunuchi_dancer',
    isLocationSharingEnabled: true,
    lastSeenAt: new Date().toISOString(),
    isOnline: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveCurrentUserProfile(newUser);
  return { user: newUser, error: null };
};

// Simulated / Real Supabase Sign Up
export const signUpWithEmail = async (
  email: string,
  pass: string,
  displayName: string,
  bengaliName?: string,
  avatarUrl: string = 'dhunuchi_dancer'
): Promise<{ user: UserProfile | null; error: string | null }> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: {
            display_name: displayName,
            bengali_name: bengaliName,
            avatar_url: avatarUrl,
          },
        },
      });
      if (error) return { user: null, error: error.message };
      if (data.user) {
        const newProf: UserProfile = {
          id: data.user.id,
          email: data.user.email,
          displayName,
          bengaliName,
          avatarUrl,
          isLocationSharingEnabled: true,
          lastSeenAt: new Date().toISOString(),
          isOnline: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        saveCurrentUserProfile(newProf);
        return { user: newProf, error: null };
      }
    } catch (err: any) {
      return { user: null, error: err?.message || 'Signup failed' };
    }
  }

  // Fallback
  const newUser: UserProfile = {
    id: `user_${Date.now()}`,
    email,
    displayName,
    bengaliName,
    avatarUrl,
    isLocationSharingEnabled: true,
    lastSeenAt: new Date().toISOString(),
    isOnline: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  saveCurrentUserProfile(newUser);
  return { user: newUser, error: null };
};

export const signOutUser = async (): Promise<void> => {
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    }
  }
  // Revert to demo default
  saveCurrentUserProfile(DEMO_PROFILES[0]);
};

// ============================================================================
// SHARED TRIP GROUPS STORAGE & REPOSITORY
// ============================================================================

const getStoredGroups = (): SharedTripGroup[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_SHARED_GROUPS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Error reading stored groups:', err);
  }

  // Pre-seed realistic default shared groups for Kolkata and Contai
  const initialGroups: SharedTripGroup[] = [
    {
      trip: {
        id: 'group-kolkata-2026',
        name: 'Kolkata Maha Saptami Squad',
        bengaliName: 'কলকাতা মহাসপ্তমী শারদ স্কোয়াড',
        city: 'kolkata',
        date: '2026-10-19',
        startTime: '17:00',
        endTime: '23:30',
        startLocation: {
          id: 'shyambazar-crossing',
          name: 'Shyambazar Five-Point Crossing',
          bengaliName: 'শ্যামবাজার পাঁচমাথার মোড়',
          city: 'kolkata',
          latitude: 22.6038,
          longitude: 88.3703,
        },
        endLocation: {
          id: 'college-square-boipara',
          name: 'College Square & Boipara',
          bengaliName: 'কলেজ স্কোয়ার ও বইপাড়া',
          city: 'kolkata',
          latitude: 22.5765,
          longitude: 88.3636,
        },
        walkingPreference: 'normal',
        preferredTransport: 'metro',
        maxWalkingDistanceMeters: 6000,
        selectedPandalIds: [
          'shobhabazar-rajbari',
          'bagbazar-sarbojanin',
          'tala-park-prattyay',
          'college-square',
          'santosh-mitra-square',
        ],
        isCustomTrip: true,
        createdAt: '2026-08-10T12:00:00Z',
        updatedAt: '2026-08-10T12:00:00Z',
        notes: 'Annual friend group pandal trail across North & Central Kolkata.',
      },
      inviteCode: 'KP26X7',
      createdBy: DEMO_PROFILES[0].id,
      members: [
        {
          id: 'mem_1',
          tripId: 'group-kolkata-2026',
          userId: DEMO_PROFILES[0].id,
          role: 'admin',
          joinedAt: '2026-08-10T12:00:00Z',
          lastActiveAt: new Date().toISOString(),
          profile: DEMO_PROFILES[0],
        },
        {
          id: 'mem_2',
          tripId: 'group-kolkata-2026',
          userId: DEMO_PROFILES[1].id,
          role: 'member',
          joinedAt: '2026-08-10T12:30:00Z',
          lastActiveAt: new Date(Date.now() - 3 * 60000).toISOString(),
          profile: DEMO_PROFILES[1],
        },
        {
          id: 'mem_3',
          tripId: 'group-kolkata-2026',
          userId: DEMO_PROFILES[2].id,
          role: 'member',
          joinedAt: '2026-08-10T13:00:00Z',
          lastActiveAt: new Date(Date.now() - 12 * 60000).toISOString(),
          profile: DEMO_PROFILES[2],
        },
        {
          id: 'mem_4',
          tripId: 'group-kolkata-2026',
          userId: DEMO_PROFILES[3].id,
          role: 'member',
          joinedAt: '2026-08-10T14:15:00Z',
          lastActiveAt: new Date(Date.now() - 1 * 60000).toISOString(),
          profile: DEMO_PROFILES[3],
        },
      ],
      myRole: 'admin',
      isSupabaseSynced: true,
      recentActivities: [
        {
          id: 'act_1',
          tripId: 'group-kolkata-2026',
          type: 'member_joined',
          userId: DEMO_PROFILES[3].id,
          userName: DEMO_PROFILES[3].displayName,
          description: 'Sayantani joined the trip squad using invite code KP26X7',
          bengaliDescription: 'সায়ন্তনী কোড ব্যবহার করে ট্রিপে যুক্ত হয়েছেন',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
        },
        {
          id: 'act_2',
          tripId: 'group-kolkata-2026',
          type: 'darshan_completed',
          userId: DEMO_PROFILES[0].id,
          userName: DEMO_PROFILES[0].displayName,
          description: 'Anirban completed Darshan at Shobhabazar Rajbari',
          bengaliDescription: 'অনির্বাণ শোভাবাজার রাজবাড়ির দর্শন সম্পন্ন করেছেন',
          pandalId: 'shobhabazar-rajbari',
          pandalName: 'Shobhabazar Rajbari',
          timestamp: new Date(Date.now() - 55 * 60000).toISOString(),
        },
        {
          id: 'act_3',
          tripId: 'group-kolkata-2026',
          type: 'pandal_added',
          userId: DEMO_PROFILES[0].id,
          userName: DEMO_PROFILES[0].displayName,
          description: 'Added Santosh Mitra Square to itinerary',
          bengaliDescription: 'সন্তোষ মিত্র স্কোয়ার তালিকায় যোগ করা হয়েছে',
          pandalId: 'santosh-mitra-square',
          pandalName: 'Santosh Mitra Square',
          timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
        },
      ],
    },
    {
      trip: {
        id: 'group-contai-2026',
        name: 'Contai Coastal Terracotta Circuit',
        bengaliName: 'কাঁথি কোস্টাল পোড়ামাটি সার্কিট',
        city: 'contai',
        date: '2026-10-20',
        startTime: '16:30',
        endTime: '22:00',
        startLocation: {
          id: 'contai-bus-stand-anchor',
          name: 'Contai Central Bus Stand',
          bengaliName: 'কাঁথি কেন্দ্রীয় বাস স্ট্যান্ড',
          city: 'contai',
          latitude: 21.7781,
          longitude: 87.7516,
        },
        endLocation: {
          id: 'contai-sabuj-sangha-anchor',
          name: 'Contai Sabuj Sangha Ground',
          bengaliName: 'কাঁথি সবুজ সংঘ প্রাঙ্গণ',
          city: 'contai',
          latitude: 21.7825,
          longitude: 87.7468,
        },
        walkingPreference: 'low',
        preferredTransport: 'mixed',
        maxWalkingDistanceMeters: 4000,
        selectedPandalIds: [
          'contai-nandanik',
          'contai-youth',
          'contai-central-bus-stand',
          'contai-sabuj-sangha',
          'contai-highschool-math',
          'contai-junput-jubak',
        ],
        isCustomTrip: true,
        createdAt: '2026-08-11T10:00:00Z',
        updatedAt: '2026-08-11T10:00:00Z',
        notes: 'Coastal Contai and local town heritage circuit with friends.',
      },
      inviteCode: 'CT26M9',
      createdBy: DEMO_PROFILES[0].id,
      members: [
        {
          id: 'mem_c1',
          tripId: 'group-contai-2026',
          userId: DEMO_PROFILES[0].id,
          role: 'admin',
          joinedAt: '2026-08-11T10:00:00Z',
          lastActiveAt: new Date().toISOString(),
          profile: DEMO_PROFILES[0],
        },
        {
          id: 'mem_c2',
          tripId: 'group-contai-2026',
          userId: DEMO_PROFILES[4].id,
          role: 'member',
          joinedAt: '2026-08-11T11:00:00Z',
          lastActiveAt: new Date(Date.now() - 25 * 60000).toISOString(),
          profile: DEMO_PROFILES[4],
        },
      ],
      myRole: 'admin',
      isSupabaseSynced: true,
      recentActivities: [
        {
          id: 'act_c1',
          tripId: 'group-contai-2026',
          type: 'member_joined',
          userId: DEMO_PROFILES[4].id,
          userName: DEMO_PROFILES[4].displayName,
          description: 'Debojyoti joined the Contai trail',
          bengaliDescription: 'দেবজ্যোতি কাঁথি পরিক্রমায় যুক্ত হয়েছেন',
          timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
        },
      ],
    },
  ];

  saveStoredGroups(initialGroups);
  return initialGroups;
};

const saveStoredGroups = (groups: SharedTripGroup[]): void => {
  try {
    localStorage.setItem(LOCAL_STORAGE_SHARED_GROUPS, JSON.stringify(groups));
  } catch (err) {
    console.warn('Error saving groups to localStorage:', err);
  }
};

// ============================================================================
// SHARED TRIP GROUP OPERATIONS
// ============================================================================

export const getTripGroup = (tripId: string): SharedTripGroup | null => {
  const groups = getStoredGroups();
  const found = groups.find((g) => g.trip.id === tripId);
  if (!found) return null;

  const current = getCurrentUserProfile();
  const membership = found.members.find((m) => m.userId === current.id);
  const myRole = membership ? membership.role : 'member';

  return {
    ...found,
    myRole,
  };
};

export const getTripMembers = (tripId: string): TripMember[] => {
  const group = getTripGroup(tripId);
  if (group && group.members && group.members.length > 0) {
    return group.members;
  }
  // Fallback demo members if needed
  return DEMO_PROFILES.slice(0, 4).map((p, idx) => ({
    id: `mem_fallback_${p.id}`,
    tripId,
    userId: p.id,
    role: idx === 0 ? 'admin' : 'member',
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    profile: p,
  }));
};

export const getMyTripGroups = (userId?: string): SharedTripGroup[] => {
  const current = getCurrentUserProfile();
  const targetId = userId || current.id;
  const validUid = ensureValidUuid(targetId);
  const groups = getStoredGroups();
  return groups.filter(
    (g) =>
      g.createdBy === targetId ||
      g.createdBy === validUid ||
      g.members.some((m) => m.userId === targetId || m.userId === validUid)
  );
};

export const createSharedTripGroup = async (
  tripData: Omit<TripPlan, 'id' | 'createdAt' | 'updatedAt'>,
  creatorProfile: UserProfile
): Promise<SharedTripGroup> => {
  const inviteCode = generateInviteCode(tripData.city);
  const newTripId = generateCleanUuid();
  const validCreatorId = ensureValidUuid(creatorProfile.id);
  const now = new Date().toISOString();

  const newTrip: TripPlan = {
    ...tripData,
    id: newTripId,
    createdAt: now,
    updatedAt: now,
  };

  const newMember: TripMember = {
    id: `mem_${Date.now()}`,
    tripId: newTripId,
    userId: creatorProfile.id,
    role: 'admin',
    isOwner: true,
    joinedAt: now,
    lastActiveAt: now,
    profile: creatorProfile,
  };

  const initialActivity: GroupActivityEvent = {
    id: `act_${Date.now()}`,
    tripId: newTripId,
    type: 'member_joined',
    userId: creatorProfile.id,
    userName: creatorProfile.displayName,
    description: `${creatorProfile.displayName} created the group trip "${newTrip.name}"`,
    bengaliDescription: `${creatorProfile.displayName} নতুন পূজা গ্রুপ ট্রিপ তৈরি করেছেন`,
    timestamp: now,
  };

  const newGroup: SharedTripGroup = {
    trip: newTrip,
    inviteCode,
    createdBy: creatorProfile.id,
    members: [newMember],
    myRole: 'admin',
    isSupabaseSynced: isSupabaseConfigured,
    recentActivities: [initialActivity],
    joinRequests: [],
    settings: {
      joinApprovalMode: 'admin_approval',
      visitPermissionMode: 'everyone',
    },
  };

  // Save to local storage
  const groups = getStoredGroups();
  groups.unshift(newGroup);
  saveStoredGroups(groups);

  // Also save to tripStorageService so it's accessible everywhere
  saveTrip(newTrip);

  // If Supabase is connected, insert into Supabase database
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('trips').insert({
        id: newTripId,
        name: newTrip.name,
        bengali_name: newTrip.bengaliName,
        city: newTrip.city,
        date: newTrip.date,
        start_time: newTrip.startTime,
        end_time: newTrip.endTime,
        start_location: newTrip.startLocation,
        end_location: newTrip.endLocation,
        walking_preference: newTrip.walkingPreference,
        preferred_transport: newTrip.preferredTransport,
        max_walking_distance_meters: newTrip.maxWalkingDistanceMeters,
        invite_code: inviteCode,
        notes: newTrip.notes,
        description: newTrip.description,
        emblem: newTrip.emblem,
        created_by: validCreatorId,
      });

      await supabase.from('trip_members').insert({
        trip_id: newTripId,
        user_id: validCreatorId,
        role: 'admin',
        is_owner: true,
      });

      // Insert trip pandals
      if (newTrip.selectedPandalIds.length > 0) {
        const pandalRows = newTrip.selectedPandalIds.map((pId, idx) => ({
          trip_id: newTripId,
          pandal_id: pId,
          stop_order: idx + 1,
          added_by: validCreatorId,
        }));
        await supabase.from('trip_pandals').insert(pandalRows);
      }
    } catch (err) {
      console.warn('Supabase trip creation error:', err);
    }
  }

  // Notify listeners / other tabs
  groupBroadcastChannel?.postMessage({
    type: 'GROUP_CREATED',
    tripId: newTripId,
    group: newGroup,
  });

  return newGroup;
};

// Convert a local non-shared trip into a Supabase Shared Group Trip
export const convertLocalTripToSharedGroup = async (
  localTrip: TripPlan,
  creatorProfile: UserProfile
): Promise<SharedTripGroup> => {
  return createSharedTripGroup(
    {
      name: localTrip.name.startsWith('Shared') ? localTrip.name : `Shared: ${localTrip.name}`,
      bengaliName: localTrip.bengaliName,
      city: localTrip.city,
      date: localTrip.date,
      startTime: localTrip.startTime,
      endTime: localTrip.endTime,
      startLocation: localTrip.startLocation,
      endLocation: localTrip.endLocation,
      walkingPreference: localTrip.walkingPreference,
      preferredTransport: localTrip.preferredTransport,
      maxWalkingDistanceMeters: localTrip.maxWalkingDistanceMeters,
      selectedPandalIds: localTrip.selectedPandalIds,
      isCustomTrip: true,
      notes: localTrip.notes || 'Converted from local trip plan.',
    },
    creatorProfile
  );
};

// ============================================================================
// SQUAD INVITE CODE & SUPABASE QUERIES
// ============================================================================

/**
 * Fetches squad metadata and active member roster by invite code.
 * Queries Supabase first (source of truth), then falls back to local storage.
 */
export const fetchSquadByInviteCode = async (
  inviteCode: string
): Promise<{ group: SharedTripGroup | null; error: string | null }> => {
  const cleanCode = inviteCode.trim().toUpperCase();
  if (!cleanCode) return { group: null, error: 'Please enter a valid invite code.' };

  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data: dbTrip, error: fetchErr } = await supabase
        .from('trips')
        .select(`
          *,
          trip_pandals (*),
          trip_members (
            id,
            trip_id,
            user_id,
            role,
            is_owner,
            joined_at,
            last_active_at,
            profiles:user_id (
              id,
              display_name,
              bengali_name,
              avatar_url,
              email
            )
          ),
          trip_join_requests (*)
        `)
        .eq('invite_code', cleanCode)
        .maybeSingle();

      if (fetchErr) {
        console.warn('Supabase invite lookup error:', fetchErr);
      }

      if (dbTrip) {
        // Map members
        const members: TripMember[] = (dbTrip.trip_members || []).map((m: any) => {
          const prof = m.profiles || {};
          const isOwner = Boolean(m.is_owner || dbTrip.created_by === m.user_id);
          return {
            id: m.id || `mem_${m.user_id}`,
            tripId: dbTrip.id,
            userId: m.user_id,
            role: m.role || (isOwner ? 'admin' : 'member'),
            isOwner,
            joinedAt: m.joined_at || dbTrip.created_at || new Date().toISOString(),
            lastActiveAt: m.last_active_at || new Date().toISOString(),
            profile: {
              id: m.user_id,
              displayName: prof.display_name || 'Puja Hopper',
              bengaliName: prof.bengali_name,
              avatarUrl: prof.avatar_url || 'dhunuchi_dancer',
              email: prof.email,
              isLocationSharingEnabled: true,
              lastSeenAt: m.last_active_at || new Date().toISOString(),
              isOnline: true,
              createdAt: m.joined_at || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
        });

        // Map pandals
        const pandalIds = (dbTrip.trip_pandals || [])
          .sort((a: any, b: any) => (a.stop_order || 0) - (b.stop_order || 0))
          .map((tp: any) => tp.pandal_id);

        // Map join requests
        const joinRequests: SquadJoinRequest[] = (dbTrip.trip_join_requests || []).map((r: any) => ({
          id: r.id,
          tripId: r.trip_id,
          userId: r.user_id,
          userName: r.user_name || 'Member',
          userAvatar: r.user_avatar || 'dhunuchi_dancer',
          status: r.status,
          requestedAt: r.requested_at,
        }));

        const sharedTrip: TripPlan = {
          id: dbTrip.id,
          name: dbTrip.name,
          bengaliName: dbTrip.bengali_name,
          city: dbTrip.city,
          date: dbTrip.date || '2026-10-19',
          startTime: dbTrip.start_time || '17:00',
          endTime: dbTrip.end_time || '23:30',
          startLocation: dbTrip.start_location || { name: 'Shyambazar Crossing', latitude: 22.6038, longitude: 88.3703 },
          endLocation: dbTrip.end_location || { name: 'College Square', latitude: 22.5765, longitude: 88.3636 },
          walkingPreference: dbTrip.walking_preference || 'balanced',
          preferredTransport: dbTrip.preferred_transport || 'metro',
          maxWalkingDistanceMeters: dbTrip.max_walking_distance_meters || 5000,
          selectedPandalIds: pandalIds,
          isCustomTrip: true,
          notes: dbTrip.notes,
          description: dbTrip.description,
          emblem: dbTrip.emblem,
          createdAt: dbTrip.created_at,
          updatedAt: dbTrip.updated_at,
        };

        const group: SharedTripGroup = {
          trip: sharedTrip,
          inviteCode: cleanCode,
          createdBy: dbTrip.created_by,
          members: members.length > 0 ? members : [
            {
              id: `mem_${dbTrip.created_by}`,
              tripId: dbTrip.id,
              userId: dbTrip.created_by,
              role: 'admin',
              isOwner: true,
              joinedAt: dbTrip.created_at,
              lastActiveAt: new Date().toISOString(),
            }
          ],
          myRole: 'member',
          isSupabaseSynced: true,
          recentActivities: [],
          joinRequests,
          settings: {
            joinApprovalMode: 'admin_approval',
            visitPermissionMode: 'everyone',
          },
        };

        // Cache locally for snappy reloads
        const currentGroups = getStoredGroups();
        const existingIdx = currentGroups.findIndex(
          (g) => g.inviteCode.toUpperCase() === cleanCode || g.trip.id === dbTrip.id
        );
        if (existingIdx >= 0) {
          currentGroups[existingIdx] = {
            ...currentGroups[existingIdx],
            ...group,
            members: group.members.length > 0 ? group.members : currentGroups[existingIdx].members,
            joinRequests: group.joinRequests,
          };
        } else {
          currentGroups.unshift(group);
        }
        saveStoredGroups(currentGroups);
        saveTrip(sharedTrip);

        return { group, error: null };
      }
    } catch (err: any) {
      console.warn('Error querying Supabase for invite code:', err);
    }
  }

  // Fallback to local storage
  const groups = getStoredGroups();
  const found = groups.find((g) => g.inviteCode.toUpperCase() === cleanCode);
  if (found) {
    return { group: found, error: null };
  }

  return {
    group: null,
    error: `Invalid or expired squad invite code "${cleanCode}".`,
  };
};

/**
 * Loads all squads that the user belongs to or created from Supabase.
 * Merges with local storage and returns the updated squad list.
 */
export const fetchUserSquadsFromSupabase = async (
  userId?: string
): Promise<SharedTripGroup[]> => {
  const currentUserId = userId || getCurrentUserProfile().id;
  const supabase = getSupabase();
  const localGroups = getStoredGroups();

  if (!supabase || !currentUserId) {
    return localGroups;
  }

  try {
    const validUid = ensureValidUuid(currentUserId);
    // 1. Get trip IDs where user is member
    const { data: memRows } = await supabase
      .from('trip_members')
      .select('trip_id')
      .or(`user_id.eq.${currentUserId},user_id.eq.${validUid}`);

    // 2. Get trips created by user
    const { data: createdTrips } = await supabase
      .from('trips')
      .select('id')
      .or(`created_by.eq.${currentUserId},created_by.eq.${validUid}`);

    const memberTripIds = (memRows || []).map((m: any) => m.trip_id);
    const createdTripIds = (createdTrips || []).map((t: any) => t.id);
    const allTripIds = Array.from(new Set([...memberTripIds, ...createdTripIds]));

    if (allTripIds.length === 0) {
      return localGroups;
    }

    // 3. Fetch full squad records
    const { data: tripsData, error: tripsErr } = await supabase
      .from('trips')
      .select(`
        *,
        trip_pandals (*),
        trip_members (
          id,
          trip_id,
          user_id,
          role,
          is_owner,
          joined_at,
          last_active_at,
          profiles:user_id (
            id,
            display_name,
            bengali_name,
            avatar_url,
            email
          )
        ),
        trip_join_requests (*)
      `)
      .in('id', allTripIds);

    if (tripsErr) {
      console.warn('Error fetching user squads from Supabase:', tripsErr);
      return localGroups;
    }

    if (tripsData && tripsData.length > 0) {
      const syncedGroups: SharedTripGroup[] = tripsData.map((dbTrip: any) => {
        const members: TripMember[] = (dbTrip.trip_members || []).map((m: any) => {
          const prof = m.profiles || {};
          const isOwner = Boolean(m.is_owner || dbTrip.created_by === m.user_id);
          return {
            id: m.id || `mem_${m.user_id}`,
            tripId: dbTrip.id,
            userId: m.user_id,
            role: m.role || (isOwner ? 'admin' : 'member'),
            isOwner,
            joinedAt: m.joined_at || dbTrip.created_at || new Date().toISOString(),
            lastActiveAt: m.last_active_at || new Date().toISOString(),
            profile: {
              id: m.user_id,
              displayName: prof.display_name || 'Puja Hopper',
              bengaliName: prof.bengali_name,
              avatarUrl: prof.avatar_url || 'dhunuchi_dancer',
              email: prof.email,
              isLocationSharingEnabled: true,
              lastSeenAt: m.last_active_at || new Date().toISOString(),
              isOnline: true,
              createdAt: m.joined_at || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
        });

        const pandalIds = (dbTrip.trip_pandals || [])
          .sort((a: any, b: any) => (a.stop_order || 0) - (b.stop_order || 0))
          .map((tp: any) => tp.pandal_id);

        const joinRequests: SquadJoinRequest[] = (dbTrip.trip_join_requests || []).map((r: any) => ({
          id: r.id,
          tripId: r.trip_id,
          userId: r.user_id,
          userName: r.user_name || 'Member',
          userAvatar: r.user_avatar || 'dhunuchi_dancer',
          status: r.status,
          requestedAt: r.requested_at,
        }));

        const isOwner = dbTrip.created_by === currentUserId || dbTrip.created_by === validUid;
        const myMembership = members.find((m) => m.userId === currentUserId || m.userId === validUid);
        const myRole: MemberRole = isOwner || myMembership?.role === 'admin' ? 'admin' : 'member';

        const sharedTrip: TripPlan = {
          id: dbTrip.id,
          name: dbTrip.name,
          bengaliName: dbTrip.bengali_name,
          city: dbTrip.city,
          date: dbTrip.date || '2026-10-19',
          startTime: dbTrip.start_time || '17:00',
          endTime: dbTrip.end_time || '23:30',
          startLocation: dbTrip.start_location || { name: 'Shyambazar Crossing', latitude: 22.6038, longitude: 88.3703 },
          endLocation: dbTrip.end_location || { name: 'College Square', latitude: 22.5765, longitude: 88.3636 },
          walkingPreference: dbTrip.walking_preference || 'balanced',
          preferredTransport: dbTrip.preferred_transport || 'metro',
          maxWalkingDistanceMeters: dbTrip.max_walking_distance_meters || 5000,
          selectedPandalIds: pandalIds,
          isCustomTrip: true,
          notes: dbTrip.notes,
          description: dbTrip.description,
          emblem: dbTrip.emblem,
          createdAt: dbTrip.created_at,
          updatedAt: dbTrip.updated_at,
        };

        return {
          trip: sharedTrip,
          inviteCode: dbTrip.invite_code,
          createdBy: dbTrip.created_by,
          members: members.length > 0 ? members : [
            {
              id: `mem_${dbTrip.created_by}`,
              tripId: dbTrip.id,
              userId: dbTrip.created_by,
              role: 'admin',
              isOwner: true,
              joinedAt: dbTrip.created_at,
              lastActiveAt: new Date().toISOString(),
            }
          ],
          myRole,
          isSupabaseSynced: true,
          recentActivities: [],
          joinRequests,
          settings: {
            joinApprovalMode: 'admin_approval',
            visitPermissionMode: 'everyone',
          },
        };
      });

      // Merge into local cache
      const mergedMap = new Map<string, SharedTripGroup>();
      localGroups.forEach((g) => mergedMap.set(g.trip.id, g));
      syncedGroups.forEach((sg) => mergedMap.set(sg.trip.id, sg));

      const finalGroups = Array.from(mergedMap.values());
      saveStoredGroups(finalGroups);
      return finalGroups.filter(
        (g) =>
          g.createdBy === currentUserId ||
          g.createdBy === validUid ||
          g.members.some((m) => m.userId === currentUserId || m.userId === validUid)
      );
    }
  } catch (err) {
    console.warn('Error in fetchUserSquadsFromSupabase:', err);
  }

  return localGroups;
};

// Join Trip by unique 6-char Invite Code (e.g. "KP26X7")
export const joinTripByInviteCode = async (
  inviteCode: string,
  userProfile: UserProfile
): Promise<{ group: SharedTripGroup | null; error: string | null }> => {
  const cleanCode = inviteCode.trim().toUpperCase();
  const { group: target, error: lookupErr } = await fetchSquadByInviteCode(cleanCode);

  if (!target) {
    return { group: null, error: lookupErr || `Invalid invite code "${cleanCode}".` };
  }

  const validUid = ensureValidUuid(userProfile.id);

  // Check if user is already a member
  const alreadyMember = target.members.some(
    (m) => m.userId === userProfile.id || m.userId === validUid
  );

  if (!alreadyMember) {
    const newMember: TripMember = {
      id: `mem_${Date.now()}`,
      tripId: target.trip.id,
      userId: userProfile.id,
      role: 'member',
      isOwner: false,
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      profile: userProfile,
    };
    target.members.push(newMember);

    const joinActivity: GroupActivityEvent = {
      id: `act_${Date.now()}`,
      tripId: target.trip.id,
      type: 'member_joined',
      userId: userProfile.id,
      userName: userProfile.displayName,
      description: `${userProfile.displayName} joined the trip squad`,
      bengaliDescription: `${userProfile.displayName} ট্রিপে যুক্ত হয়েছেন`,
      timestamp: new Date().toISOString(),
    };
    target.recentActivities.unshift(joinActivity);

    const groups = getStoredGroups();
    const gIdx = groups.findIndex((g) => g.trip.id === target.trip.id);
    if (gIdx >= 0) groups[gIdx] = target;
    else groups.unshift(target);
    saveStoredGroups(groups);
    saveTrip(target.trip);

    // Sync to Supabase if available
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('trip_members').upsert({
          trip_id: target.trip.id,
          user_id: validUid,
          role: 'member',
          is_owner: false,
        });
      } catch (err) {
        console.warn('Error syncing member to Supabase:', err);
      }
    }

    groupBroadcastChannel?.postMessage({
      type: 'MEMBER_JOINED',
      tripId: target.trip.id,
      user: userProfile,
    });
  }

  return {
    group: {
      ...target,
      myRole: target.createdBy === userProfile.id || target.createdBy === validUid ? 'admin' : 'member',
    },
    error: null,
  };
};

// ============================================================================
// SQUAD MANAGEMENT OPERATIONS (Admin / Member Controls)
// ============================================================================

export interface AddMemberInput {
  name: string;
  emailOrPhone?: string;
  avatarUrl?: string;
  role?: MemberRole;
  userId?: string;
  bengaliName?: string;
}

/**
 * Searches for users/friends to add to a squad, identifying if they are already members
 */
export const searchSquadCandidates = (
  query: string,
  currentMemberUserIds: string[]
): Array<UserProfile & { isAlreadyMember: boolean }> => {
  const clean = query.trim().toLowerCase();
  const allProfiles = DEMO_PROFILES;

  const matches = clean
    ? allProfiles.filter(
        (p) =>
          p.displayName.toLowerCase().includes(clean) ||
          (p.bengaliName && p.bengaliName.toLowerCase().includes(clean)) ||
          (p.email && p.email.toLowerCase().includes(clean))
      )
    : allProfiles;

  return matches.map((p) => ({
    ...p,
    isAlreadyMember: currentMemberUserIds.includes(p.id),
  }));
};

// Add a member to the squad (Owner/Admin only)
export const addMemberToSquad = async (
  tripId: string,
  input: AddMemberInput,
  operatorUserId: string
): Promise<{ success: boolean; group?: SharedTripGroup; error?: string }> => {
  let groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  // Permission check: Operator must be admin or createdBy
  const operator = target.members.find((m) => m.userId === operatorUserId);
  const isOperatorAdmin = operator?.role === 'admin' || target.createdBy === operatorUserId;
  if (!isOperatorAdmin) {
    return { success: false, error: 'Only squad owner/admin can add members.' };
  }

  const cleanName = input.name.trim();
  if (!cleanName) {
    return { success: false, error: 'Member name cannot be empty.' };
  }

  // Check if existing profile matches by userId or email or displayName
  let existingProfile: UserProfile | undefined = undefined;
  if (input.userId) {
    existingProfile = DEMO_PROFILES.find((p) => p.id === input.userId);
  }
  if (!existingProfile && input.emailOrPhone) {
    existingProfile = DEMO_PROFILES.find(
      (p) => p.email?.toLowerCase() === input.emailOrPhone?.trim().toLowerCase()
    );
  }
  if (!existingProfile) {
    existingProfile = DEMO_PROFILES.find(
      (p) => p.displayName.toLowerCase() === cleanName.toLowerCase()
    );
  }

  // Prevent duplicate member by userId or display name or email
  const duplicate = target.members.some(
    (m) =>
      (existingProfile && m.userId === existingProfile.id) ||
      (input.userId && m.userId === input.userId) ||
      m.profile?.displayName.toLowerCase() === cleanName.toLowerCase() ||
      (input.emailOrPhone &&
        m.profile?.email &&
        m.profile.email.toLowerCase() === input.emailOrPhone.trim().toLowerCase())
  );
  if (duplicate) {
    return { success: false, error: 'Already a squad member' };
  }

  const newUserId = existingProfile
    ? existingProfile.id
    : input.userId || `user_member_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const avatar = input.avatarUrl || existingProfile?.avatarUrl || 'dhaki_drummer';

  const now = new Date().toISOString();
  const newProfile: UserProfile = existingProfile || {
    id: newUserId,
    displayName: cleanName,
    bengaliName: input.bengaliName,
    email: input.emailOrPhone?.trim() || `${cleanName.toLowerCase().replace(/\s+/g, '')}@pujatrip.app`,
    avatarUrl: avatar,
    isLocationSharingEnabled: true,
    lastSeenAt: now,
    isOnline: true,
    createdAt: now,
    updatedAt: now,
  };

  const newMember: TripMember = {
    id: `tm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    tripId: target.trip.id,
    userId: newUserId,
    role: input.role || 'member',
    joinedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    profile: newProfile,
  };

  target.members.push(newMember);

  // Add activity log
  const addActivity: GroupActivityEvent = {
    id: `act_${Date.now()}`,
    tripId: target.trip.id,
    type: 'member_joined',
    userId: newUserId,
    userName: cleanName,
    description: `${cleanName} joined the squad`,
    bengaliDescription: `${cleanName} স্কোয়াডে যোগ দিয়েছেন`,
    timestamp: now,
  };
  target.recentActivities.unshift(addActivity);

  saveStoredGroups(groups);

  // Sync to Supabase if configured
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('profiles').upsert({
        id: newUserId,
        display_name: cleanName,
        avatar_url: avatar,
        is_online: true,
        created_at: now,
        updated_at: now,
      });

      await supabase.from('trip_members').insert({
        trip_id: tripId,
        user_id: newUserId,
        role: newMember.role,
        joined_at: newMember.joinedAt,
      });

      await supabase.from('group_activity_log').insert({
        trip_id: tripId,
        type: 'member_joined',
        user_id: newUserId,
        description: `${cleanName} joined the squad`,
        bengali_description: `${cleanName} স্কোয়াডে যোগ দিয়েছেন`,
        created_at: now,
      });
    } catch (err) {
      console.warn('Error syncing new member to Supabase:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'MEMBER_JOINED',
    tripId,
    member: newMember,
  });

  return { success: true, group: target };
};

// Remove a member from the squad (Owner/Admin only)
export const removeMemberFromGroup = async (
  tripId: string,
  memberUserId: string,
  operatorUserId: string
): Promise<{ success: boolean; group?: SharedTripGroup; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  // Permission check: Operator must be admin or createdBy
  const operator = target.members.find((m) => m.userId === operatorUserId);
  const isOperatorAdmin = operator?.role === 'admin' || target.createdBy === operatorUserId;
  if (!isOperatorAdmin) {
    return { success: false, error: 'Only squad owner/admin can remove members.' };
  }

  if (memberUserId === operatorUserId) {
    return { success: false, error: 'You cannot remove yourself as admin. Use Leave Squad instead.' };
  }

  // Owner protection: The squad owner/creator cannot be removed by anyone
  if (memberUserId === target.createdBy) {
    return { success: false, error: 'The squad owner cannot be removed.' };
  }

  const memberToRemove = target.members.find((m) => m.userId === memberUserId);
  if (!memberToRemove) {
    return { success: false, error: 'Member not found in this squad.' };
  }

  if (memberToRemove.isOwner) {
    return { success: false, error: 'The squad owner cannot be removed.' };
  }

  const memberName = memberToRemove.profile?.displayName || 'Member';

  // Remove from members list
  target.members = target.members.filter((m) => m.userId !== memberUserId);

  // Add activity log
  const now = new Date().toISOString();
  const removeActivity: GroupActivityEvent = {
    id: `act_${Date.now()}`,
    tripId: target.trip.id,
    type: 'member_left',
    userId: memberUserId,
    userName: memberName,
    description: `${memberName} was removed from the squad`,
    bengaliDescription: `${memberName}-কে স্কোয়াড থেকে সরানো হয়েছে`,
    timestamp: now,
  };
  target.recentActivities.unshift(removeActivity);

  saveStoredGroups(groups);

  // Sync to Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('trip_members')
        .delete()
        .match({ trip_id: tripId, user_id: memberUserId });
    } catch (err) {
      console.warn('Error removing member from Supabase:', err);
    }
  }

  // Realtime notification
  groupBroadcastChannel?.postMessage({
    type: 'MEMBER_REMOVED',
    tripId,
    userId: memberUserId,
  });

  return { success: true, group: target };
};

// Leave the squad (Current user)
export const leaveGroup = async (
  tripId: string,
  userId: string
): Promise<{ success: boolean; nextActiveGroupId?: string; error?: string }> => {
  let groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const member = target.members.find((m) => m.userId === userId);
  const memberName = member?.profile?.displayName || 'A member';

  // Remove user
  target.members = target.members.filter((m) => m.userId !== userId);

  // If no members left in group, remove the group entirely
  if (target.members.length === 0) {
    groups = groups.filter((g) => g.trip.id !== tripId);
    saveStoredGroups(groups);

    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('trips').delete().eq('id', tripId);
      } catch (err) {
        console.warn('Error deleting empty trip from Supabase:', err);
      }
    }
  } else {
    // If leaving member was admin, promote next member to admin
    const hasAdmin = target.members.some((m) => m.role === 'admin');
    if (!hasAdmin && target.members.length > 0) {
      target.members[0].role = 'admin';
      target.createdBy = target.members[0].userId;
    }

    const leaveActivity: GroupActivityEvent = {
      id: `act_${Date.now()}`,
      tripId,
      type: 'member_left',
      userId,
      userName: memberName,
      description: `${memberName} left the squad`,
      bengaliDescription: `${memberName} স্কোয়াড ছেড়েছেন`,
      timestamp: new Date().toISOString(),
    };
    target.recentActivities.unshift(leaveActivity);
    saveStoredGroups(groups);
  }

  // Supabase sync
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('trip_members')
        .delete()
        .match({ trip_id: tripId, user_id: userId });
    } catch (err) {
      console.warn('Error leaving group in Supabase:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'MEMBER_LEFT',
    tripId,
    userId,
  });

  const remaining = getMyTripGroups(userId);
  return { success: true, nextActiveGroupId: remaining[0]?.trip.id };
};

// Update Squad details (Name, Bengali name, preferred transport)
export const updateGroupDetails = async (
  tripId: string,
  updates: { name?: string; bengaliName?: string; preferredTransport?: any },
  operatorUserId: string
): Promise<{ success: boolean; group?: SharedTripGroup; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const operator = target.members.find((m) => m.userId === operatorUserId);
  const isOperatorAdmin = operator?.role === 'admin' || target.createdBy === operatorUserId;
  if (!isOperatorAdmin) {
    return { success: false, error: 'Only squad owner/admin can edit squad details.' };
  }

  if (updates.name) target.trip.name = updates.name.trim();
  if (updates.bengaliName !== undefined) target.trip.bengaliName = updates.bengaliName.trim() || undefined;
  if (updates.preferredTransport) target.trip.preferredTransport = updates.preferredTransport;
  target.trip.updatedAt = new Date().toISOString();

  saveStoredGroups(groups);
  saveTrip(target.trip);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('trips')
        .update({
          name: target.trip.name,
          bengali_name: target.trip.bengaliName,
          preferred_transport: target.trip.preferredTransport,
          updated_at: target.trip.updatedAt,
        })
        .eq('id', tripId);
    } catch (err) {
      console.warn('Error updating trip in Supabase:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'GROUP_UPDATED',
    tripId,
  });

  return { success: true, group: target };
};

// Transfer admin ownership to another squad member
export const transferGroupAdmin = async (
  tripId: string,
  targetUserId: string,
  operatorUserId: string
): Promise<{ success: boolean; group?: SharedTripGroup; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin') ||
    target.createdBy === operatorUserId;
  if (!isOperatorAdmin) {
    return { success: false, error: 'Only squad owner/admin can transfer admin rights.' };
  }

  const targetMember = target.members.find((m) => m.userId === targetUserId);
  if (!targetMember) {
    return { success: false, error: 'Selected member is not part of this squad.' };
  }

  // Update roles
  target.members = target.members.map((m) => {
    if (m.userId === targetUserId) {
      return { ...m, role: 'admin' as MemberRole };
    }
    return m;
  });
  target.createdBy = targetUserId;

  const now = new Date().toISOString();
  const transferActivity: GroupActivityEvent = {
    id: `act_${Date.now()}`,
    tripId,
    type: 'member_joined',
    userId: targetUserId,
    userName: targetMember.profile?.displayName || 'Member',
    description: `${targetMember.profile?.displayName || 'Member'} is now Squad Admin`,
    bengaliDescription: `${targetMember.profile?.displayName || 'সদস্য'} এখন স্কোয়াড অ্যাডমিন`,
    timestamp: now,
  };
  target.recentActivities.unshift(transferActivity);

  saveStoredGroups(groups);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('trip_members')
        .update({ role: 'admin' })
        .match({ trip_id: tripId, user_id: targetUserId });
      await supabase.from('trips').update({ created_by: targetUserId }).eq('id', tripId);
    } catch (err) {
      console.warn('Error transferring admin in Supabase:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'ROLE_UPDATED',
    tripId,
    userId: targetUserId,
  });

  return { success: true, group: target };
};

// Delete entire squad (Owner/Admin only)
export const deleteTripGroup = async (
  tripId: string,
  operatorUserId: string
): Promise<{ success: boolean; nextActiveGroupId?: string; error?: string }> => {
  let groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin') ||
    target.createdBy === operatorUserId;
  if (!isOperatorAdmin) {
    return { success: false, error: 'Only squad owner/admin can delete this squad.' };
  }

  groups = groups.filter((g) => g.trip.id !== tripId);
  saveStoredGroups(groups);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('trips').delete().eq('id', tripId);
    } catch (err) {
      console.warn('Error deleting trip in Supabase:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'GROUP_DELETED',
    tripId,
  });

  const remaining = getMyTripGroups(operatorUserId);
  return { success: true, nextActiveGroupId: remaining[0]?.trip.id };
};

// Update group itinerary sequence (Reorder, add, or remove pandals)
export const updateGroupItinerary = async (
  tripId: string,
  newPandalIds: string[],
  userId: string,
  userRole: MemberRole,
  changeDescription?: string
): Promise<{ success: boolean; error?: string }> => {
  // Permission check: Admins have full rights; members can propose/add if permitted
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Trip not found' };

  if (userRole !== 'admin' && target.createdBy !== userId) {
    // If ordinary member tries to radically change itinerary, enforce admin permissions
    // But allow minor adds/reorders with notice
  }

  target.trip.selectedPandalIds = newPandalIds;
  target.trip.updatedAt = new Date().toISOString();

  const user = getCurrentUserProfile();
  const changeAct: GroupActivityEvent = {
    id: `act_${Date.now()}`,
    tripId,
    type: 'stop_reordered',
    userId,
    userName: user.displayName,
    description: changeDescription || `${user.displayName} updated the pandal sequence (${newPandalIds.length} stops)`,
    bengaliDescription: `${user.displayName} পরিক্রমা সূচি পরিবর্তন করেছেন`,
    timestamp: new Date().toISOString(),
  };
  target.recentActivities.unshift(changeAct);

  saveStoredGroups(groups);
  saveTrip(target.trip);

  // Sync to Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('trips')
        .update({ updated_at: target.trip.updatedAt })
        .eq('id', tripId);

      // Re-insert trip pandals
      await supabase.from('trip_pandals').delete().eq('trip_id', tripId);
      if (newPandalIds.length > 0) {
        const rows = newPandalIds.map((pId, idx) => ({
          trip_id: tripId,
          pandal_id: pId,
          stop_order: idx + 1,
          added_by: userId,
        }));
        await supabase.from('trip_pandals').insert(rows);
      }
    } catch (err) {
      console.warn('Supabase itinerary update error:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'ITINERARY_UPDATED',
    tripId,
    pandalIds: newPandalIds,
  });

  return { success: true };
};

// ============================================================================
// VISIT STATUS & CROWD REPORTING
// ============================================================================

export const getGroupVisitStatuses = (tripId: string): PandalVisitStatusRecord[] => {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_VISIT_STATUSES}_${tripId}`);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading visit statuses:', err);
  }
  return [];
};

/**
 * Returns comprehensive group visit summary for a specific pandal.
 */
export const getPandalGroupVisitSummary = (
  tripId: string,
  pandalId: string,
  currentUserId: string,
  pandalName: string = '',
  members?: TripMember[]
): PandalGroupVisitSummary => {
  const group = getTripGroup(tripId);
  const actualMembers = members || group?.members || [];
  const allStatuses = getGroupVisitStatuses(tripId);
  const pandalStatuses = allStatuses.filter((s) => s.pandalId === pandalId && s.isVisited);

  const visitedUserIds = new Set(pandalStatuses.map((s) => s.userId));

  const visitedMembers: {
    userId: string;
    userName: string;
    bengaliName?: string;
    avatarUrl: string;
    visitedAt: string;
  }[] = [];

  const notVisitedMembers: {
    userId: string;
    userName: string;
    bengaliName?: string;
    avatarUrl: string;
  }[] = [];

  actualMembers.forEach((m) => {
    const profile = m.profile;

    if (visitedUserIds.has(m.userId)) {
      const record = pandalStatuses.find((s) => s.userId === m.userId);
      visitedMembers.push({
        userId: m.userId,
        userName: profile?.displayName || record?.userName || 'Member',
        bengaliName: profile?.bengaliName,
        avatarUrl: profile?.avatarUrl || '🪔',
        visitedAt: record?.visitedAt || new Date().toISOString(),
      });
    } else {
      notVisitedMembers.push({
        userId: m.userId,
        userName: profile?.displayName || 'Member',
        bengaliName: profile?.bengaliName,
        avatarUrl: profile?.avatarUrl || '🪔',
      });
    }
  });

  const totalMembers = Math.max(1, actualMembers.length);
  const visitedCount = visitedMembers.length;
  const visitedPercentage = Math.round((visitedCount / totalMembers) * 100);
  const isCurrentUserVisited = visitedUserIds.has(currentUserId);

  return {
    pandalId,
    pandalName: pandalName || group?.trip.name || 'Pandal',
    totalMembers,
    visitedCount,
    visitedPercentage,
    visitedMembers,
    notVisitedMembers,
    isCurrentUserVisited,
  };
};

/**
 * Returns group-wide and per-member progress metrics for a trip.
 */
export const getGroupTripProgressSummary = (
  tripId: string,
  selectedPandalIds?: string[],
  members?: TripMember[]
): GroupTripProgressSummary => {
  const group = getTripGroup(tripId);
  const actualPandals = selectedPandalIds || group?.trip.selectedPandalIds || [];
  const actualMembers = members || group?.members || [];
  const allStatuses = getGroupVisitStatuses(tripId);
  const totalPandals = Math.max(1, actualPandals.length);

  // Group completed pandals (any member visited)
  const completedPandalSet = new Set<string>();
  allStatuses.forEach((s) => {
    if (s.isVisited && actualPandals.includes(s.pandalId)) {
      completedPandalSet.add(s.pandalId);
    }
  });

  const memberProgress = actualMembers.map((m) => {
    const profile = m.profile;
    const memberVisited = allStatuses.filter(
      (s) => s.userId === m.userId && s.isVisited && actualPandals.includes(s.pandalId)
    );
    const count = memberVisited.length;
    const percentage = Math.round((count / totalPandals) * 100);

    return {
      userId: m.userId,
      userName: profile?.displayName || 'Member',
      bengaliName: profile?.bengaliName,
      avatarUrl: profile?.avatarUrl || '🪔',
      visitedCount: count,
      totalCount: totalPandals,
      percentage,
    };
  });

  return {
    totalPandals,
    completedPandalsCount: completedPandalSet.size,
    percentage: Math.round((completedPandalSet.size / totalPandals) * 100),
    memberProgress,
  };
};

/**
 * Seeds initial demo visit statuses for the sample shared group trip so
 * the UI immediately illustrates multi-member visit tracking (e.g. 3/4 visited).
 */
export const seedDemoVisitStatusesIfEmpty = (
  tripId: string,
  selectedPandalIds?: string[],
  members?: TripMember[]
): void => {
  const existing = getGroupVisitStatuses(tripId);
  if (existing.length > 0) return;

  const group = getTripGroup(tripId);
  const actualPandals = selectedPandalIds || group?.trip.selectedPandalIds || [];
  const actualMembers = members || group?.members || [];

  const demoStatuses: PandalVisitStatusRecord[] = [];
  const now = new Date();

  actualPandals.forEach((pId, pIdx) => {
    actualMembers.forEach((m, mIdx) => {
      // Create a natural pattern: first pandals visited by most, later pandals by fewer
      const shouldBeVisited = pIdx === 0 ? mIdx < 3 : pIdx === 1 ? mIdx < 2 : false;
      if (shouldBeVisited) {
        demoStatuses.push({
          id: `vis_demo_${pId}_${m.userId}`,
          tripId,
          pandalId: pId,
          userId: m.userId,
          userName: m.profile?.displayName || 'Friend',
          isVisited: true,
          visitedAt: new Date(now.getTime() - (pIdx * 45 + mIdx * 5) * 60000).toISOString(),
        });
      }
    });
  });

  if (demoStatuses.length > 0) {
    localStorage.setItem(`${LOCAL_STORAGE_VISIT_STATUSES}_${tripId}`, JSON.stringify(demoStatuses));
  }
};


export const markGroupPandalDarshan = async (
  tripId: string,
  pandalId: string,
  pandalName: string,
  userId: string,
  isVisited: boolean
): Promise<void> => {
  const current = getGroupVisitStatuses(tripId);
  const existingIdx = current.findIndex(
    (v) => v.pandalId === pandalId && v.userId === userId
  );

  const user = getCurrentUserProfile();
  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    current[existingIdx].isVisited = isVisited;
    current[existingIdx].visitedAt = now;
  } else {
    current.push({
      id: `vis_${Date.now()}`,
      tripId,
      pandalId,
      userId,
      userName: user.displayName,
      isVisited,
      visitedAt: now,
    });
  }

  localStorage.setItem(`${LOCAL_STORAGE_VISIT_STATUSES}_${tripId}`, JSON.stringify(current));

  // Add activity log to group
  if (isVisited) {
    const groups = getStoredGroups();
    const group = groups.find((g) => g.trip.id === tripId);
    if (group) {
      group.recentActivities.unshift({
        id: `act_${Date.now()}`,
        tripId,
        type: 'darshan_completed',
        userId,
        userName: user.displayName,
        description: `${user.displayName} marked Darshan completed at ${pandalName}`,
        bengaliDescription: `${user.displayName} ${pandalName}-এ দর্শন সম্পন্ন করেছেন`,
        pandalId,
        pandalName,
        timestamp: now,
      });
      saveStoredGroups(groups);
    }
  }

  // Supabase sync
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('visit_status').upsert({
        trip_id: tripId,
        pandal_id: pandalId,
        user_id: userId,
        is_visited: isVisited,
        visited_at: now,
      });
    } catch (err) {
      console.warn('Supabase visit sync error:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'VISIT_UPDATED',
    tripId,
    pandalId,
    userId,
    isVisited,
  });
};

// Realtime subscription helper
export const subscribeToTripUpdates = (
  tripId: string,
  onUpdate: (event: { type: string; payload: any }) => void
): (() => void) => {
  const handler = (e: MessageEvent) => {
    if (e.data && e.data.tripId === tripId) {
      onUpdate(e.data);
    }
  };

  if (groupBroadcastChannel) {
    groupBroadcastChannel.addEventListener('message', handler);
  }

  // Also bind to Supabase Realtime channel if available
  const supabase = getSupabase();
  let supabaseChannel: any = null;
  if (supabase) {
    try {
      supabaseChannel = supabase
        .channel(`trip_realtime_${tripId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trip_join_requests', filter: `trip_id=eq.${tripId}` },
          (payload) => {
            onUpdate({ type: 'JOIN_REQUEST_SYNC', payload });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trip_members', filter: `trip_id=eq.${tripId}` },
          (payload) => {
            onUpdate({ type: 'MEMBER_SYNC', payload });
          }
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` },
          (payload) => {
            onUpdate({ type: 'TRIP_SYNC', payload });
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Failed to subscribe to Supabase Realtime channel:', err);
    }
  }

  return () => {
    if (groupBroadcastChannel) {
      groupBroadcastChannel.removeEventListener('message', handler);
    }
    if (supabase && supabaseChannel) {
      supabase.removeChannel(supabaseChannel);
    }
  };
};

// ============================================================================
// DAY-WISE PUJA PLANNING & SQUAD MANAGEMENT EXTENSIONS
// ============================================================================

export const ensureTripGroupState = (group: SharedTripGroup): SharedTripGroup => {
  if (!group.days || group.days.length === 0) {
    const tripDate = group.trip.date || '2026-10-18';
    const festivalDay = durgaPuja2026Dates[tripDate] || durgaPuja2026Dates['2026-10-18'] || {
      dayName: 'Maha Saptami',
      bengaliDayName: 'মহা সপ্তমী',
    };
    const initialDay: TripDayPlan = {
      id: `day_${group.trip.id}_1`,
      tripId: group.trip.id,
      date: tripDate,
      festivalDayName: festivalDay.dayName,
      bengaliFestivalDayName: festivalDay.bengaliDayName,
      title: `${festivalDay.dayName} Hopping`,
      bengaliTitle: `${festivalDay.bengaliDayName} পরিক্রমা`,
      transportPreference: group.trip.preferredTransport || 'metro',
      pandalIds: [...group.trip.selectedPandalIds],
      sortOrder: 1,
      notes: group.trip.notes,
    };
    group.days = [initialDay];
    group.trip.days = [initialDay];
  }

  if (!group.settings) {
    group.settings = {
      joinApprovalMode: 'admin_approval',
      visitPermissionMode: 'everyone',
      selectedVisitMemberIds: [],
      inviteToken: group.inviteToken || `sq_tok_${group.trip.city}_${group.inviteCode.toLowerCase()}`,
      isInviteRevoked: false,
    };
  }
  if (!group.joinRequests) {
    group.joinRequests = [];
  }
  if (!group.sharedVisits) {
    group.sharedVisits = getSharedPandalVisits(group.trip.id);
  }
  return group;
};

export const getPujaFestivalDays = () => {
  return Object.values(durgaPuja2026Dates).map((d) => ({
    dateStr: d.dateStr,
    displayDate: d.displayDate,
    dayName: d.dayName,
    bengaliDayName: d.bengaliDayName,
    description: d.description,
    bengaliDescription: d.bengaliDescription,
  }));
};

export const addDayToTrip = async (
  tripId: string,
  dayInput: Omit<TripDayPlan, 'id' | 'tripId'>,
  operatorUserId: string
): Promise<{ success: boolean; day?: TripDayPlan; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin');
  if (!isOperatorAdmin) return { success: false, error: 'Only squad owner or admin can add trip days.' };

  ensureTripGroupState(target);

  const newDayId = `day_${tripId}_${Date.now()}`;
  const newDay: TripDayPlan = {
    ...dayInput,
    id: newDayId,
    tripId,
    sortOrder: (target.days?.length || 0) + 1,
  };

  target.days = [...(target.days || []), newDay];
  target.trip.days = target.days;

  // Add any new pandals to trip.selectedPandalIds
  const updatedPandalIds = Array.from(new Set([...target.trip.selectedPandalIds, ...newDay.pandalIds]));
  target.trip.selectedPandalIds = updatedPandalIds;

  const now = new Date().toISOString();
  const user = getCurrentUserProfile();
  target.recentActivities.unshift({
    id: `act_${Date.now()}`,
    tripId,
    type: 'pandal_added',
    userId: operatorUserId,
    userName: user.displayName,
    description: `${user.displayName} added ${newDay.festivalDayName} (${newDay.bengaliFestivalDayName}) to the trip plan`,
    bengaliDescription: `${user.displayName} ট্রিপে ${newDay.bengaliFestivalDayName} যুক্ত করেছেন`,
    timestamp: now,
  });

  saveStoredGroups(groups);
  saveTrip(target.trip);

  groupBroadcastChannel?.postMessage({
    type: 'DAY_UPDATED',
    tripId,
    day: newDay,
  });

  return { success: true, day: newDay };
};

export const removeDayFromTrip = async (
  tripId: string,
  dayId: string,
  operatorUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin');
  if (!isOperatorAdmin) return { success: false, error: 'Only squad owner or admin can delete days.' };

  ensureTripGroupState(target);

  if ((target.days?.length || 0) <= 1) {
    return { success: false, error: 'Cannot remove the only day in the trip plan.' };
  }

  target.days = target.days?.filter((d) => d.id !== dayId) || [];
  target.trip.days = target.days;

  // Re-sync trip.selectedPandalIds
  const allDayPandalIds = Array.from(new Set(target.days.flatMap((d) => d.pandalIds)));
  target.trip.selectedPandalIds = allDayPandalIds;

  saveStoredGroups(groups);
  saveTrip(target.trip);

  groupBroadcastChannel?.postMessage({
    type: 'DAY_UPDATED',
    tripId,
  });

  return { success: true };
};

export const updateTripDay = async (
  tripId: string,
  dayId: string,
  updates: Partial<TripDayPlan>,
  operatorUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin');
  if (!isOperatorAdmin) return { success: false, error: 'Only squad owner or admin can update day plans.' };

  ensureTripGroupState(target);

  const day = target.days?.find((d) => d.id === dayId);
  if (!day) return { success: false, error: 'Trip day not found' };

  Object.assign(day, updates);
  target.trip.days = target.days;

  saveStoredGroups(groups);
  saveTrip(target.trip);

  groupBroadcastChannel?.postMessage({
    type: 'DAY_UPDATED',
    tripId,
    dayId,
  });

  return { success: true };
};

export const addPandalToDay = async (
  tripId: string,
  dayId: string,
  pandalId: string,
  pandalName: string,
  operatorUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin');
  if (!isOperatorAdmin) return { success: false, error: 'Only squad owner or admin can add pandals.' };

  ensureTripGroupState(target);

  const day = target.days?.find((d) => d.id === dayId);
  if (!day) return { success: false, error: 'Trip day not found' };

  if (day.pandalIds.includes(pandalId)) {
    return { success: false, error: 'This pandal is already added to this day.' };
  }

  day.pandalIds.push(pandalId);
  if (!target.trip.selectedPandalIds.includes(pandalId)) {
    target.trip.selectedPandalIds.push(pandalId);
  }

  const user = getCurrentUserProfile();
  target.recentActivities.unshift({
    id: `act_${Date.now()}`,
    tripId,
    type: 'pandal_added',
    userId: operatorUserId,
    userName: user.displayName,
    description: `${user.displayName} added ${pandalName} to ${day.bengaliFestivalDayName}`,
    bengaliDescription: `${user.displayName} ${day.bengaliFestivalDayName}-তে ${pandalName} যুক্ত করেছেন`,
    pandalId,
    pandalName,
    timestamp: new Date().toISOString(),
  });

  saveStoredGroups(groups);
  saveTrip(target.trip);

  groupBroadcastChannel?.postMessage({
    type: 'DAY_UPDATED',
    tripId,
    dayId,
    pandalId,
  });

  return { success: true };
};

export const removePandalFromDay = async (
  tripId: string,
  dayId: string,
  pandalId: string,
  operatorUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin');
  if (!isOperatorAdmin) return { success: false, error: 'Only squad owner or admin can remove pandals.' };

  ensureTripGroupState(target);

  const day = target.days?.find((d) => d.id === dayId);
  if (!day) return { success: false, error: 'Trip day not found' };

  day.pandalIds = day.pandalIds.filter((id) => id !== pandalId);

  // Update trip.selectedPandalIds (union of all days)
  const allDayPandalIds = Array.from(new Set(target.days?.flatMap((d) => d.pandalIds) || []));
  target.trip.selectedPandalIds = allDayPandalIds;

  saveStoredGroups(groups);
  saveTrip(target.trip);

  groupBroadcastChannel?.postMessage({
    type: 'DAY_UPDATED',
    tripId,
    dayId,
  });

  return { success: true };
};

export const reorderDayPandals = async (
  tripId: string,
  dayId: string,
  newPandalIds: string[],
  operatorUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin');
  if (!isOperatorAdmin) return { success: false, error: 'Only squad owner or admin can reorder pandals.' };

  ensureTripGroupState(target);

  const day = target.days?.find((d) => d.id === dayId);
  if (!day) return { success: false, error: 'Trip day not found' };

  day.pandalIds = newPandalIds;

  saveStoredGroups(groups);
  saveTrip(target.trip);

  groupBroadcastChannel?.postMessage({
    type: 'DAY_UPDATED',
    tripId,
    dayId,
    pandalIds: newPandalIds,
  });

  return { success: true };
};

export const optimizeDayPandalOrder = async (
  tripId: string,
  dayId: string,
  allPandals: Pandal[],
  operatorUserId: string
): Promise<{ success: boolean; newOrder?: string[]; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin');
  if (!isOperatorAdmin) return { success: false, error: 'Only squad owner or admin can optimize route order.' };

  ensureTripGroupState(target);
  const day = target.days?.find((d) => d.id === dayId);
  if (!day || day.pandalIds.length <= 2) {
    return { success: true, newOrder: day?.pandalIds };
  }

  // Nearest-neighbor sequencing starting from current first pandal
  const dayPandalObjects = day.pandalIds
    .map((id) => allPandals.find((p) => p.id === id))
    .filter(Boolean) as Pandal[];

  if (dayPandalObjects.length <= 2) {
    return { success: true, newOrder: day.pandalIds };
  }

  const optimizedIds: string[] = [dayPandalObjects[0].id];
  const remaining = dayPandalObjects.slice(1);

  while (remaining.length > 0) {
    const lastId = optimizedIds[optimizedIds.length - 1];
    const lastPandal = allPandals.find((p) => p.id === lastId);
    if (!lastPandal) break;

    let nearestIdx = 0;
    let shortestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistanceKm(
        lastPandal.latitude,
        lastPandal.longitude,
        remaining[i].latitude,
        remaining[i].longitude
      );
      if (dist < shortestDist) {
        shortestDist = dist;
        nearestIdx = i;
      }
    }

    optimizedIds.push(remaining[nearestIdx].id);
    remaining.splice(nearestIdx, 1);
  }

  day.pandalIds = optimizedIds;
  saveStoredGroups(groups);
  saveTrip(target.trip);

  groupBroadcastChannel?.postMessage({
    type: 'DAY_UPDATED',
    tripId,
    dayId,
    pandalIds: optimizedIds,
  });

  return { success: true, newOrder: optimizedIds };
};

// ============================================================================
// SHARED VISIT STATUS & VISIT CORRECTIONS
// ============================================================================

export const getSharedPandalVisits = (tripId: string): Record<string, SharedPandalVisitEvent> => {
  try {
    const raw = localStorage.getItem(`pujatrip_shared_visits_${tripId}`);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Error reading shared visits:', err);
  }
  return {};
};

export const saveSharedPandalVisits = (
  tripId: string,
  visits: Record<string, SharedPandalVisitEvent>
): void => {
  try {
    localStorage.setItem(`pujatrip_shared_visits_${tripId}`, JSON.stringify(visits));
  } catch (err) {
    console.warn('Error saving shared visits:', err);
  }
};

export const canUserMarkVisited = (group: SharedTripGroup, userId: string): boolean => {
  const mode = group.settings?.visitPermissionMode || 'everyone';
  if (mode === 'everyone') return true;
  const isOperatorAdmin =
    group.createdBy === userId || group.members.some((m) => m.userId === userId && m.role === 'admin');
  if (mode === 'admins_only') return isOperatorAdmin;
  if (mode === 'selected_members') {
    if (isOperatorAdmin) return true;
    return Boolean(group.settings?.selectedVisitMemberIds?.includes(userId));
  }
  return true;
};

export const markSharedPandalVisit = async (
  tripId: string,
  dayId: string | undefined,
  pandalId: string,
  pandalName: string,
  user: UserProfile,
  locationNote?: string
): Promise<{ success: boolean; event?: SharedPandalVisitEvent; error?: string }> => {
  const group = getTripGroup(tripId);
  if (!group) return { success: false, error: 'Squad not found' };

  if (!canUserMarkVisited(group, user.id)) {
    return {
      success: false,
      error: 'You do not have permission to mark pandals as visited in this squad.',
    };
  }

  const visits = getSharedPandalVisits(tripId);
  const now = new Date().toISOString();

  // Prevent duplicate visit clicks
  if (visits[pandalId] && visits[pandalId].status === 'visited') {
    return { success: false, error: `Already marked as visited by ${visits[pandalId].markedByUserName}` };
  }

  const visitEvent: SharedPandalVisitEvent = {
    id: `vis_event_${Date.now()}`,
    tripId,
    dayId,
    pandalId,
    pandalName,
    markedByUserId: user.id,
    markedByUserName: user.displayName,
    markedByUserAvatar: user.avatarUrl,
    markedAt: now,
    status: 'visited',
    locationNote,
  };

  visits[pandalId] = visitEvent;
  saveSharedPandalVisits(tripId, visits);

  // Sync to legacy per-user visit array for backwards compatibility
  await markGroupPandalDarshan(tripId, pandalId, pandalName, user.id, true);

  // Sync group
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (target) {
    if (!target.sharedVisits) target.sharedVisits = {};
    target.sharedVisits[pandalId] = visitEvent;
    target.recentActivities.unshift({
      id: `act_${Date.now()}`,
      tripId,
      type: 'darshan_completed',
      userId: user.id,
      userName: user.displayName,
      description: `${user.displayName} marked Darshan completed at ${pandalName}`,
      bengaliDescription: `${user.displayName} ${pandalName}-এ দর্শন সম্পন্ন করেছেন`,
      pandalId,
      pandalName,
      timestamp: now,
    });
    saveStoredGroups(groups);
  }

  // Supabase sync
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('visit_status').upsert({
        trip_id: tripId,
        pandal_id: pandalId,
        user_id: user.id,
        is_visited: true,
        visited_at: now,
      });
    } catch (err) {
      console.warn('Supabase visit sync error:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'SHARED_VISIT_MARKED',
    tripId,
    pandalId,
    event: visitEvent,
  });

  return { success: true, event: visitEvent };
};

export const undoSharedPandalVisit = async (
  tripId: string,
  dayId: string | undefined,
  pandalId: string,
  operatorUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const group = getTripGroup(tripId);
  if (!group) return { success: false, error: 'Squad not found' };

  const visits = getSharedPandalVisits(tripId);
  const existing = visits[pandalId];
  if (!existing) return { success: false, error: 'No visit record found to undo' };

  const isOperatorAdmin =
    group.createdBy === operatorUserId ||
    group.members.some((m) => m.userId === operatorUserId && m.role === 'admin');
  const isOriginalMarker = existing.markedByUserId === operatorUserId;

  if (!isOperatorAdmin && !isOriginalMarker) {
    return { success: false, error: 'Only admins or the member who marked this visit can undo it.' };
  }

  delete visits[pandalId];
  saveSharedPandalVisits(tripId, visits);

  // Sync to legacy visit status
  await markGroupPandalDarshan(tripId, pandalId, existing.pandalName, existing.markedByUserId, false);

  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (target) {
    if (target.sharedVisits) {
      delete target.sharedVisits[pandalId];
    }
    const user = getCurrentUserProfile();
    target.recentActivities.unshift({
      id: `act_${Date.now()}`,
      tripId,
      type: 'pandal_removed',
      userId: operatorUserId,
      userName: user.displayName,
      description: `${user.displayName} corrected and removed visit record for ${existing.pandalName}`,
      bengaliDescription: `${user.displayName} ${existing.pandalName}-এর দর্শন রেকর্ড সংশোধন করেছেন`,
      pandalId,
      pandalName: existing.pandalName,
      timestamp: new Date().toISOString(),
    });
    saveStoredGroups(groups);
  }

  // Supabase delete
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('visit_status').delete().match({ trip_id: tripId, pandal_id: pandalId });
    } catch (err) {
      console.warn('Supabase visit undo error:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'SHARED_VISIT_UNDONE',
    tripId,
    pandalId,
  });

  return { success: true };
};

export const getVisitHistory = (tripId: string): SharedPandalVisitEvent[] => {
  const visits = getSharedPandalVisits(tripId);
  return Object.values(visits).sort(
    (a, b) => new Date(b.markedAt).getTime() - new Date(a.markedAt).getTime()
  );
};

// ============================================================================
// SQUAD INVITE SYSTEM & ADMIN APPROVAL
// ============================================================================

export const requestToJoinSquad = async (
  inviteCodeOrToken: string,
  user: UserProfile
): Promise<{
  success: boolean;
  status: 'joined' | 'request_pending' | 'already_member' | 'revoked';
  group?: SharedTripGroup;
  error?: string;
}> => {
  const clean = inviteCodeOrToken.trim().toUpperCase();
  if (!clean) {
    return { success: false, status: 'request_pending', error: 'Please enter a valid squad invite code.' };
  }

  // 1. Fetch squad from Supabase or local cache
  const { group: target, error: lookupErr } = await fetchSquadByInviteCode(clean);

  if (!target) {
    return {
      success: false,
      status: 'request_pending',
      error: lookupErr || `Invalid or expired squad invite code "${clean}".`,
    };
  }

  ensureTripGroupState(target);

  if (target.settings?.isInviteRevoked) {
    return {
      success: false,
      status: 'revoked',
      error: 'This squad invite link has been revoked by the squad admin.',
    };
  }

  const validUid = ensureValidUuid(user.id);

  // 2. Check if user is already an active member or owner
  const isOwner = target.createdBy === user.id || target.createdBy === validUid;
  const isMember = target.members.some((m) => m.userId === user.id || m.userId === validUid);

  if (isOwner || isMember) {
    return { success: true, status: 'already_member', group: target };
  }

  // 3. Check if user already submitted a pending request
  if (!target.joinRequests) target.joinRequests = [];
  const existingPending = target.joinRequests.find(
    (r) => (r.userId === user.id || r.userId === validUid) && r.status === 'pending'
  );
  if (existingPending) {
    return { success: true, status: 'request_pending', group: target };
  }

  // 4. Check approval mode
  const approvalMode = target.settings?.joinApprovalMode || 'admin_approval';

  if (approvalMode === 'open_with_link') {
    // Instant direct join!
    const res = await joinTripByInviteCode(target.inviteCode, user);
    return {
      success: Boolean(res.group),
      status: 'joined',
      group: res.group || undefined,
      error: res.error || undefined,
    };
  }

  // 5. Admin approval required: Create real join request
  const requestId = generateCleanUuid();
  const newRequest: SquadJoinRequest = {
    id: requestId,
    tripId: target.trip.id,
    userId: user.id,
    userName: user.displayName,
    userEmail: user.email,
    userAvatar: user.avatarUrl,
    bengaliName: user.bengaliName,
    requestedAt: new Date().toISOString(),
    status: 'pending',
  };

  target.joinRequests.unshift(newRequest);

  const allGroups = getStoredGroups();
  const gIdx = allGroups.findIndex((g) => g.trip.id === target.trip.id);
  if (gIdx >= 0) allGroups[gIdx] = target;
  else allGroups.unshift(target);
  saveStoredGroups(allGroups);

  // Sync join request to Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('trip_join_requests').upsert({
        id: requestId,
        trip_id: target.trip.id,
        user_id: validUid,
        user_name: user.displayName,
        user_avatar: user.avatarUrl,
        status: 'pending',
        requested_at: newRequest.requestedAt,
      });
    } catch (err) {
      console.warn('Error saving join request to Supabase:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'JOIN_REQUEST_UPDATED',
    tripId: target.trip.id,
    request: newRequest,
  });

  return { success: true, status: 'request_pending', group: target };
};

export const approveJoinRequest = async (
  tripId: string,
  requestId: string,
  operatorUserId: string
): Promise<{ success: boolean; group?: SharedTripGroup; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const validOpId = ensureValidUuid(operatorUserId);
  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.createdBy === validOpId ||
    target.members.some((m) => (m.userId === operatorUserId || m.userId === validOpId) && m.role === 'admin');
  if (!isOperatorAdmin) {
    return { success: false, error: 'Only squad owner or admin can approve join requests.' };
  }

  const req = target.joinRequests?.find((r) => r.id === requestId);
  if (!req) return { success: false, error: 'Join request not found' };

  req.status = 'accepted';

  // Add member
  const addRes = await addMemberToSquad(
    tripId,
    {
      userId: req.userId,
      name: req.userName,
      bengaliName: req.bengaliName,
      emailOrPhone: req.userEmail,
      avatarUrl: req.userAvatar,
      role: 'member',
    },
    operatorUserId
  );

  const updatedGroup = addRes.group || target;

  saveStoredGroups(groups);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('trip_join_requests').update({ status: 'accepted' }).eq('id', requestId);
      await supabase.from('trip_members').upsert({
        trip_id: tripId,
        user_id: ensureValidUuid(req.userId),
        role: 'member',
        is_owner: false,
      });
    } catch (err) {
      console.warn('Error updating join request in Supabase:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'JOIN_REQUEST_ACCEPTED',
    tripId,
    requestId,
    userId: req.userId,
  });

  return { success: true, group: updatedGroup };
};

export const rejectJoinRequest = async (
  tripId: string,
  requestId: string,
  operatorUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const validOpId = ensureValidUuid(operatorUserId);
  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.createdBy === validOpId ||
    target.members.some((m) => (m.userId === operatorUserId || m.userId === validOpId) && m.role === 'admin');
  if (!isOperatorAdmin) {
    return { success: false, error: 'Only squad owner or admin can reject join requests.' };
  }

  const req = target.joinRequests?.find((r) => r.id === requestId);
  if (req) {
    req.status = 'rejected';
  }
  saveStoredGroups(groups);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('trip_join_requests').update({ status: 'rejected' }).eq('id', requestId);
    } catch (err) {
      console.warn('Error updating join request in Supabase:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'JOIN_REQUEST_REJECTED',
    tripId,
    requestId,
  });

  return { success: true };
};


export const regenerateSquadInviteToken = async (
  tripId: string,
  operatorUserId: string
): Promise<{ success: boolean; inviteCode?: string; inviteToken?: string; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin');
  if (!isOperatorAdmin) return { success: false, error: 'Only squad owner or admin can regenerate invite links.' };

  const newCode = generateInviteCode(target.trip.city);
  const newToken = `sq_tok_${target.trip.city}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .substring(2, 7)}`;

  target.inviteCode = newCode;
  target.inviteToken = newToken;
  if (!target.settings) {
    target.settings = {
      joinApprovalMode: 'admin_approval',
      visitPermissionMode: 'everyone',
      selectedVisitMemberIds: [],
      inviteToken: newToken,
      isInviteRevoked: false,
    };
  } else {
    target.settings.inviteToken = newToken;
    target.settings.isInviteRevoked = false;
  }

  saveStoredGroups(groups);

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('trips').update({ invite_code: newCode }).eq('id', tripId);
    } catch (err) {
      console.warn('Error updating invite code in Supabase:', err);
    }
  }

  groupBroadcastChannel?.postMessage({
    type: 'INVITE_REGENERATED',
    tripId,
    newCode,
    newToken,
  });

  return { success: true, inviteCode: newCode, inviteToken: newToken };
};

export const revokeSquadInviteToken = async (
  tripId: string,
  operatorUserId: string
): Promise<{ success: boolean; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin');
  if (!isOperatorAdmin) return { success: false, error: 'Only squad owner or admin can revoke invite links.' };

  if (!target.settings) {
    target.settings = {
      joinApprovalMode: 'admin_approval',
      visitPermissionMode: 'everyone',
      selectedVisitMemberIds: [],
      isInviteRevoked: true,
    };
  } else {
    target.settings.isInviteRevoked = true;
  }

  saveStoredGroups(groups);

  groupBroadcastChannel?.postMessage({
    type: 'INVITE_REVOKED',
    tripId,
  });

  return { success: true };
};

export const updateSquadSettings = async (
  tripId: string,
  updates: Partial<SquadSettings>,
  operatorUserId: string
): Promise<{ success: boolean; settings?: SquadSettings; error?: string }> => {
  const groups = getStoredGroups();
  const target = groups.find((g) => g.trip.id === tripId);
  if (!target) return { success: false, error: 'Squad not found' };

  const isOperatorAdmin =
    target.createdBy === operatorUserId ||
    target.members.some((m) => m.userId === operatorUserId && m.role === 'admin');
  if (!isOperatorAdmin) return { success: false, error: 'Only squad owner or admin can update settings.' };

  ensureTripGroupState(target);

  target.settings = {
    ...target.settings!,
    ...updates,
  };

  saveStoredGroups(groups);

  groupBroadcastChannel?.postMessage({
    type: 'SETTINGS_UPDATED',
    tripId,
    settings: target.settings,
  });

  return { success: true, settings: target.settings };
};

export const generateWhatsAppInviteMessage = (group: SharedTripGroup): string => {
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://pujatrip.app';
  const joinUrl = `${baseUrl}?invite=${group.inviteCode}`;
  return `🪔 PujaTrip Squad Invitation\n\nYou have been invited to join:\n[${group.trip.name}]\n\n📍 ${group.trip.city.toUpperCase()}\n\nJoin the squad:\n${joinUrl}\n\nLet's explore Puja together! 🌺`;
};
