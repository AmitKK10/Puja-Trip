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
} from '../types';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { getSavedTrips, saveTrip, createTrip } from './tripStorageService';

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
  const targetId = userId || getCurrentUserProfile().id;
  const groups = getStoredGroups();
  return groups.filter((g) => g.members.some((m) => m.userId === targetId));
};

export const createSharedTripGroup = async (
  tripData: Omit<TripPlan, 'id' | 'createdAt' | 'updatedAt'>,
  creatorProfile: UserProfile
): Promise<SharedTripGroup> => {
  const inviteCode = generateInviteCode(tripData.city);
  const newTripId = `group_${tripData.city}_${Date.now()}`;
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
        created_by: creatorProfile.id,
      });

      await supabase.from('trip_members').insert({
        trip_id: newTripId,
        user_id: creatorProfile.id,
        role: 'admin',
      });

      // Insert trip pandals
      if (newTrip.selectedPandalIds.length > 0) {
        const pandalRows = newTrip.selectedPandalIds.map((pId, idx) => ({
          trip_id: newTripId,
          pandal_id: pId,
          stop_order: idx + 1,
          added_by: creatorProfile.id,
        }));
        await supabase.from('trip_pandals').insert(pandalRows);
      }
    } catch (err) {
      console.warn('Error creating trip in Supabase:', err);
    }
  }

  // Notify listeners / other tabs
  groupBroadcastChannel?.postMessage({
    type: 'GROUP_CREATED',
    tripId: newTripId,
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

// Join Trip by unique 6-char Invite Code (e.g. "KP26X7")
export const joinTripByInviteCode = async (
  inviteCode: string,
  userProfile: UserProfile
): Promise<{ group: SharedTripGroup | null; error: string | null }> => {
  const cleanCode = inviteCode.trim().toUpperCase();
  const groups = getStoredGroups();
  const target = groups.find((g) => g.inviteCode.toUpperCase() === cleanCode);

  if (!target) {
    // Check in Supabase if live
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data: dbTrip } = await supabase
          .from('trips')
          .select('*, trip_pandals(*)')
          .eq('invite_code', cleanCode)
          .single();

        if (dbTrip) {
          // Join on Supabase
          await supabase.from('trip_members').upsert({
            trip_id: dbTrip.id,
            user_id: userProfile.id,
            role: 'member',
          });

          // Fetch full group
          const sharedTrip: TripPlan = {
            id: dbTrip.id,
            name: dbTrip.name,
            bengaliName: dbTrip.bengali_name,
            city: dbTrip.city,
            date: dbTrip.date,
            startTime: dbTrip.start_time,
            endTime: dbTrip.end_time,
            startLocation: dbTrip.start_location,
            endLocation: dbTrip.end_location,
            walkingPreference: dbTrip.walking_preference,
            preferredTransport: dbTrip.preferred_transport,
            maxWalkingDistanceMeters: dbTrip.max_walking_distance_meters,
            selectedPandalIds: (dbTrip.trip_pandals || [])
              .sort((a: any, b: any) => a.stop_order - b.stop_order)
              .map((tp: any) => tp.pandal_id),
            isCustomTrip: true,
            createdAt: dbTrip.created_at,
            updatedAt: dbTrip.updated_at,
          };

          const newGroup: SharedTripGroup = {
            trip: sharedTrip,
            inviteCode: cleanCode,
            createdBy: dbTrip.created_by,
            members: [
              {
                id: `mem_${Date.now()}`,
                tripId: dbTrip.id,
                userId: userProfile.id,
                role: 'member',
                joinedAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
                profile: userProfile,
              },
            ],
            myRole: 'member',
            isSupabaseSynced: true,
            recentActivities: [],
          };
          groups.push(newGroup);
          saveStoredGroups(groups);
          saveTrip(sharedTrip);
          return { group: newGroup, error: null };
        }
      } catch (err: any) {
        console.warn('Supabase join lookup error:', err);
      }
    }

    return { group: null, error: `Invalid invite code "${cleanCode}". Please check with your trip friend.` };
  }

  // Check if user is already a member
  const alreadyMember = target.members.some((m) => m.userId === userProfile.id);
  if (!alreadyMember) {
    const newMember: TripMember = {
      id: `mem_${Date.now()}`,
      tripId: target.trip.id,
      userId: userProfile.id,
      role: 'member',
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

    saveStoredGroups(groups);
    saveTrip(target.trip);

    // Sync to Supabase if available
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('trip_members').upsert({
          trip_id: target.trip.id,
          user_id: userProfile.id,
          role: 'member',
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
      myRole: target.createdBy === userProfile.id ? 'admin' : 'member',
    },
    error: null,
  };
};

// ============================================================================
// SQUAD MANAGEMENT OPERATIONS (Admin / Member Controls)
// ============================================================================

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

  const memberToRemove = target.members.find((m) => m.userId === memberUserId);
  if (!memberToRemove) {
    return { success: false, error: 'Member not found in this squad.' };
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
        .channel(`trip_${tripId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', filter: `trip_id=eq.${tripId}` },
          (payload) => {
            onUpdate({ type: 'SUPABASE_REALTIME', payload });
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
