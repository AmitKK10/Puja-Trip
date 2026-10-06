import { Pandal, CityId, ZoneId, PandalCategory, UserProfile } from '../types';
import { getSupabase, isSupabaseConfigured } from './supabaseClient';
import { DEFAULT_DURGA_DEVI_IMAGE, getPandalImageSrc } from '../utils/imageFallback';

export interface CreatePandalInput {
  name: string;
  bengaliName?: string;
  address: string;
  area?: string;
  city: CityId;
  zone?: ZoneId;
  description?: string;
  themeConcept?: string;
  tags?: string[];
  imageUrl?: string;
  latitude?: number;
  longitude?: number;
}

const LOCAL_STORAGE_USER_PANDALS_KEY = 'pujatrip_user_pandals_v1';

/**
 * Reads local cached user-created pandals.
 */
function getLocalCommunityPandals(): Pandal[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_USER_PANDALS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[CommunityPandalService] Failed to read local user pandals:', err);
    return [];
  }
}

/**
 * Saves local cached user-created pandals.
 */
function saveLocalCommunityPandals(pandals: Pandal[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_USER_PANDALS_KEY, JSON.stringify(pandals));
  } catch (err) {
    console.warn('[CommunityPandalService] Failed to cache user pandals:', err);
  }
}

/**
 * Transforms a database row or input into a fully qualified Pandal entity.
 */
function mapToPandalEntity(row: any, currentUser?: UserProfile): Pandal {
  const city: CityId = row.city === 'contai' ? 'contai' : 'kolkata';
  const defaultZone: ZoneId = city === 'contai' ? 'contai_central' : 'north_kolkata';
  const lat = typeof row.latitude === 'number' && !isNaN(row.latitude) ? row.latitude : (city === 'kolkata' ? 22.595 : 21.780);
  const lng = typeof row.longitude === 'number' && !isNaN(row.longitude) ? row.longitude : (city === 'kolkata' ? 88.370 : 87.750);
  const finalImage = getPandalImageSrc(row.imageUrl || row.heroImage || row.image_url);

  return {
    id: row.id,
    name: row.name,
    bengaliName: row.bengaliName || row.bengali_name || row.name,
    tagline: row.tagline || 'Community Durga Puja Darshan',
    city,
    area: row.area || (city === 'kolkata' ? 'Neighborhood / Locality' : 'Contai Central'),
    bengaliArea: row.bengaliArea || row.bengali_area || 'পাড়োয়ারী অঞ্চল',
    zone: row.zone || defaultZone,
    zoneLabel: row.zoneLabel || row.zone_label || (city === 'kolkata' ? 'North Kolkata' : 'Contai Town'),
    bengaliZoneLabel: row.bengaliZoneLabel || row.bengali_zone_label || (city === 'kolkata' ? 'উত্তর কলকাতা' : 'কাঁথি শহর'),
    address: row.address || 'Kolkata, West Bengal',
    latitude: lat,
    longitude: lng,
    coordinates: {
      lat,
      lng,
      mapX: typeof row.coordinates?.mapX === 'number' ? row.coordinates.mapX : 45,
      mapY: typeof row.coordinates?.mapY === 'number' ? row.coordinates.mapY : 50,
    },
    category: (row.category as PandalCategory) || 'traditional_sabeki',
    categoryLabel: row.categoryLabel || 'Community Pandal',
    yearEstablished: row.yearEstablished || 2026,
    idolQualityScore: row.idolQualityScore || 9.2,
    themeQualityScore: row.themeQualityScore || 9.0,
    popularityScore: row.popularityScore || 9.0,
    overallQualityScore: row.overallQualityScore || 9.1,
    recommendationLevel: row.recommendationLevel || 'Highly Recommended',
    estimatedVisitDuration: row.estimatedVisitDuration || 30,
    typicalCrowdLevel: row.typicalCrowdLevel || 'moderate',
    tags: Array.isArray(row.tags) && row.tags.length > 0 ? row.tags : ['Community', 'Traditional', 'Family Friendly'],
    isDemoRecord: false,
    crowdLevel: row.crowdLevel || 'moderate',
    queueWaitMinutes: row.queueWaitMinutes || 20,
    peakHours: row.peakHours || '7:00 PM – 11:00 PM',
    bestTimeToVisit: row.bestTimeToVisit || 'Morning 9:00 AM or Late Night 11:30 PM',
    idolArtisan: row.idolArtisan || 'Local Sculptor & Community Artisans',
    pandalArchitect: row.pandalArchitect || 'Community Volunteers',
    themeConcept: row.themeConcept || row.theme || 'Traditional Bengali Durgotsav',
    themeDescription: row.themeDescription || row.description || 'Community organized Sharadotsav with traditional rituals.',
    bengaliTheme: row.bengaliTheme || 'ঐতিহ্যবাহী শারদোৎসব',
    description: row.description || 'Community Durga Puja pandal organized with devotion and neighborhood participation.',
    fullHistory: row.fullHistory || 'Organized annually by local residents and youth clubs to celebrate the homecoming of Maa Durga.',
    photos: [finalImage],
    images: [finalImage],
    heroImage: finalImage,
    audioDurationSeconds: row.audioDurationSeconds || 90,
    highlights: Array.isArray(row.highlights) && row.highlights.length > 0 ? row.highlights : [
      'Community Bhog & Cultural Evenings',
      'Traditional Ekchala Pratima',
      'Warm Neighborhood Hospitality'
    ],
    transit: row.transit || {
      nearestMetro: city === 'kolkata' ? { station: 'Shyambazar', line: 'Blue Line', walkingMins: 8 } : undefined,
      parkingAvailability: 'limited',
      wheelchairAccessible: true,
    },
    foodNearby: row.foodNearby || [
      { name: 'Community Food Stalls & Rolls', cuisine: 'Bengali Street Food', famousDish: 'Egg Roll & Phuchka', distance: '50m', icon: '🌯' }
    ],
    rating: row.rating || 4.8,
    reviewCount: row.reviewCount || 12,
    isVIPPassAvailable: false,
    isOpen24Hours: true,
    tithiAartiTimes: row.tithiAartiTimes || {
      sandhiPuja: 'Asthami Evening 7:45 PM',
      dhunuchiAarti: 'Daily 7:00 PM',
      bhogDistribution: 'Daily 1:30 PM',
    },
    // User Created metadata
    isUserCreated: true,
    createdBy: row.createdBy || row.created_by || currentUser?.id,
    creatorName: row.creatorName || row.creator_name || currentUser?.displayName || 'Community Member',
    createdAt: row.createdAt || row.created_at || new Date().toISOString(),
    updatedAt: row.updatedAt || row.updated_at || new Date().toISOString(),
  };
}

/**
 * Fetches all community pandals from Supabase (or localStorage fallback).
 */
export async function getCommunityPandals(): Promise<Pandal[]> {
  const localPandals = getLocalCommunityPandals();
  const supabase = getSupabase();

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('community_pandals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[CommunityPandalService] Supabase query failed, using local cache:', error.message);
        return localPandals;
      }

      if (data && Array.isArray(data)) {
        const remotePandals = data.map((row) => mapToPandalEntity(row));
        // Merge with any local ones that might not be synced yet
        const mergedMap = new Map<string, Pandal>();
        remotePandals.forEach((p) => mergedMap.set(p.id, p));
        localPandals.forEach((p) => {
          if (!mergedMap.has(p.id)) mergedMap.set(p.id, p);
        });
        const combined = Array.from(mergedMap.values());
        saveLocalCommunityPandals(combined);
        return combined;
      }
    } catch (err) {
      console.warn('[CommunityPandalService] Exception fetching from Supabase:', err);
    }
  }

  return localPandals;
}

/**
 * Creates a new community pandal, saves to Supabase and local cache.
 */
export async function createCommunityPandal(
  input: CreatePandalInput,
  currentUser: UserProfile
): Promise<Pandal> {
  const pandalId = `pandal_user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  // If user does NOT select an image, automatically use Durga Devi asset
  const finalImage = getPandalImageSrc(input.imageUrl);

  const newPandal = mapToPandalEntity(
    {
      id: pandalId,
      name: input.name.trim(),
      bengaliName: input.bengaliName?.trim() || input.name.trim(),
      address: input.address.trim(),
      area: input.area?.trim() || (input.city === 'contai' ? 'Contai Town' : 'Kolkata Locality'),
      city: input.city,
      zone: input.zone,
      description: input.description?.trim() || 'Neighborhood Durga Puja celebrations organized with devotion and community spirit.',
      themeConcept: input.themeConcept?.trim() || 'Traditional Sharadotsav',
      tags: input.tags && input.tags.length > 0 ? input.tags : ['Community', 'Traditional'],
      imageUrl: finalImage,
      heroImage: finalImage,
      latitude: input.latitude,
      longitude: input.longitude,
      createdBy: currentUser.id,
      creatorName: currentUser.displayName,
      createdAt: now,
      updatedAt: now,
    },
    currentUser
  );

  // 1. Cache immediately to local storage
  const currentList = getLocalCommunityPandals();
  const updatedList = [newPandal, ...currentList.filter((p) => p.id !== pandalId)];
  saveLocalCommunityPandals(updatedList);

  // 2. Persist to Supabase if configured
  const supabase = getSupabase();
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('community_pandals').insert({
        id: newPandal.id,
        name: newPandal.name,
        bengali_name: newPandal.bengaliName,
        address: newPandal.address,
        area: newPandal.area,
        city: newPandal.city,
        zone: newPandal.zone,
        description: newPandal.description,
        theme: newPandal.themeConcept,
        tags: newPandal.tags,
        image_url: finalImage,
        latitude: newPandal.latitude,
        longitude: newPandal.longitude,
        created_by: currentUser.id,
        creator_name: currentUser.displayName,
        is_user_created: true,
        created_at: now,
        updated_at: now,
      });

      if (error) {
        console.warn('[CommunityPandalService] Supabase insert notice:', error.message);
      }
    } catch (err) {
      console.warn('[CommunityPandalService] Supabase insert error:', err);
    }
  }

  return newPandal;
}

/**
 * Updates an existing community pandal (permitted only for creator or admin).
 */
export async function updateCommunityPandal(
  pandalId: string,
  updates: Partial<CreatePandalInput>,
  currentUser: UserProfile
): Promise<Pandal> {
  const currentList = getLocalCommunityPandals();
  const existing = currentList.find((p) => p.id === pandalId);

  if (!existing) {
    throw new Error('Pandal not found.');
  }

  if (!canEditPandal(existing, currentUser)) {
    throw new Error('Unauthorized: You can only edit pandals you created.');
  }

  // If image was explicitly cleared or set to empty, revert to Goddess Durga visual
  const newImageUrl = updates.imageUrl !== undefined
    ? getPandalImageSrc(updates.imageUrl)
    : existing.heroImage;

  const updatedPandal: Pandal = {
    ...existing,
    name: updates.name !== undefined ? updates.name.trim() : existing.name,
    bengaliName: updates.bengaliName !== undefined ? updates.bengaliName.trim() : existing.bengaliName,
    address: updates.address !== undefined ? updates.address.trim() : existing.address,
    area: updates.area !== undefined ? updates.area.trim() : existing.area,
    city: updates.city || existing.city,
    zone: updates.zone || existing.zone,
    description: updates.description !== undefined ? updates.description.trim() : existing.description,
    themeConcept: updates.themeConcept !== undefined ? updates.themeConcept.trim() : existing.themeConcept,
    tags: updates.tags || existing.tags,
    heroImage: newImageUrl,
    photos: [newImageUrl],
    images: [newImageUrl],
    updatedAt: new Date().toISOString(),
  };

  // 1. Update local storage
  const newList = currentList.map((p) => (p.id === pandalId ? updatedPandal : p));
  saveLocalCommunityPandals(newList);

  // 2. Update Supabase
  const supabase = getSupabase();
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('community_pandals')
        .update({
          name: updatedPandal.name,
          bengali_name: updatedPandal.bengaliName,
          address: updatedPandal.address,
          area: updatedPandal.area,
          city: updatedPandal.city,
          zone: updatedPandal.zone,
          description: updatedPandal.description,
          theme: updatedPandal.themeConcept,
          tags: updatedPandal.tags,
          image_url: newImageUrl,
          updated_at: updatedPandal.updatedAt,
        })
        .eq('id', pandalId)
        .eq('created_by', currentUser.id);

      if (error) {
        console.warn('[CommunityPandalService] Supabase update notice:', error.message);
      }
    } catch (err) {
      console.warn('[CommunityPandalService] Supabase update exception:', err);
    }
  }

  return updatedPandal;
}

/**
 * Deletes a community pandal (permitted only for creator or admin).
 */
export async function deleteCommunityPandal(
  pandalId: string,
  currentUser: UserProfile
): Promise<boolean> {
  const currentList = getLocalCommunityPandals();
  const existing = currentList.find((p) => p.id === pandalId);

  if (!existing) {
    return true; // Already gone
  }

  if (!canEditPandal(existing, currentUser)) {
    throw new Error('Unauthorized: You can only delete pandals you created.');
  }

  // 1. Remove from local cache
  const updatedList = currentList.filter((p) => p.id !== pandalId);
  saveLocalCommunityPandals(updatedList);

  // 2. Remove from Supabase
  const supabase = getSupabase();
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('community_pandals')
        .delete()
        .eq('id', pandalId)
        .eq('created_by', currentUser.id);

      if (error) {
        console.warn('[CommunityPandalService] Supabase delete notice:', error.message);
      }
    } catch (err) {
      console.warn('[CommunityPandalService] Supabase delete exception:', err);
    }
  }

  return true;
}

/**
 * Checks if the current user is authorized to edit or delete this pandal.
 */
export function canEditPandal(pandal: Pandal, currentUser?: UserProfile | null): boolean {
  if (!pandal.isUserCreated) return false;
  if (!currentUser) return false;
  if (pandal.createdBy === currentUser.id) return true;
  // Super admin / demo admin override
  if (currentUser.id === 'user_anirban_admin') return true;
  return false;
}
