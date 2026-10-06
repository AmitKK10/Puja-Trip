import { UserProfile, TripMember } from '../types';
import { DEMO_PROFILES } from '../services/friendGroupService';

/**
 * Safely resolves a human-readable display name for any user or profile.
 * Prevents "undefined", "null", "User", "Unknown User".
 */
export const getUserDisplayName = (
  profile?: Partial<UserProfile> | null,
  fallback: string = 'Puja Hopper'
): string => {
  if (!profile) return fallback;

  const rawName = profile.displayName?.trim();
  const invalidNames = ['undefined', 'null', 'user', 'unknown user', 'unknown', ''];

  if (rawName && !invalidNames.includes(rawName.toLowerCase())) {
    return rawName;
  }

  // Fallback to email username if available
  if (profile.email) {
    const emailPrefix = profile.email.split('@')[0]?.trim();
    if (emailPrefix && !invalidNames.includes(emailPrefix.toLowerCase())) {
      return emailPrefix
        .replace(/[._-]+/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
    }
  }

  return fallback;
};

/**
 * Resolves a full user profile for a squad member, guaranteeing safe fallbacks.
 */
export const resolveMemberProfile = (
  member: TripMember,
  currentUser?: UserProfile
): UserProfile => {
  // If current logged in user
  if (currentUser && member.userId === currentUser.id) {
    return {
      ...currentUser,
      displayName: getUserDisplayName(currentUser, 'Puja Hopper (You)'),
    };
  }

  // If member already has a populated profile
  if (member.profile && member.profile.displayName) {
    return {
      ...member.profile,
      displayName: getUserDisplayName(member.profile, 'Puja Hopper'),
    };
  }

  // Look up in DEMO_PROFILES / Known Users
  const matched = DEMO_PROFILES.find((p) => p.id === member.userId);
  if (matched) {
    return {
      ...matched,
      displayName: getUserDisplayName(matched, 'Puja Hopper'),
    };
  }

  // Generic fallback with valid identifier
  const safeName = member.userId.startsWith('user_')
    ? member.userId.replace('user_', '').replace(/_/g, ' ')
    : 'Puja Hopper';

  return {
    id: member.userId,
    displayName: getUserDisplayName({ displayName: safeName }, 'Puja Hopper'),
    avatarUrl: 'dhunuchi_dancer',
    isLocationSharingEnabled: true,
    lastSeenAt: member.lastActiveAt || new Date().toISOString(),
    isOnline: true,
    createdAt: member.joinedAt || new Date().toISOString(),
    updatedAt: member.lastActiveAt || new Date().toISOString(),
  };
};

/**
 * Returns 2-character initials for a member/user name.
 */
export const getInitials = (name?: string): string => {
  if (!name) return 'PT';
  const clean = name.trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'PT';
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Ensures any identifier is safely mapped to a valid RFC4122 UUID
 * so PostgreSQL and Supabase UUID columns never fail with syntax errors.
 */
export const ensureValidUuid = (val: string): string => {
  if (!val) return '00000000-0000-4000-8000-000000000001';
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(val)) return val.toLowerCase();

  // Deterministically hash the custom string into a valid UUID
  let hash1 = 0;
  let hash2 = 0;
  for (let i = 0; i < val.length; i++) {
    hash1 = (hash1 << 5) - hash1 + val.charCodeAt(i);
    hash1 |= 0;
    hash2 = (hash2 << 7) - hash2 + val.charCodeAt(i);
    hash2 |= 0;
  }
  const hex1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const hex2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const combined = (hex1 + hex2).padEnd(32, '0').substring(0, 32);
  
  // Format as 8-4-4-4-12 UUID (version 4 variant)
  return `${combined.substring(0, 8)}-${combined.substring(8, 12)}-4${combined.substring(13, 16)}-a${combined.substring(17, 20)}-${combined.substring(20, 32)}`;
};

/**
 * Generates a standard random UUID.
 */
export const generateCleanUuid = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
