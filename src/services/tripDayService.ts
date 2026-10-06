import { TripDayPlan, TransportPreference } from '../types';
import { getSupabase } from './supabaseClient';
import { durgaPuja2026Dates } from '../data/festivalCalendar2026';
import { pujaCalendar2026 } from '../data/pujaCalendar2026';

export interface TripDayPandalItem {
  id: string;
  tripDayId: string;
  pandalId: string;
  stopOrder: number;
  customNotes?: string;
  status: 'planned' | 'visited' | 'skipped';
  visitedAt?: string;
  visitedByUserId?: string;
  addedByUserId?: string;
  createdAt?: string;
}

export interface TripDayWithPandals extends TripDayPlan {
  pandalsData?: TripDayPandalItem[];
}

const LOCAL_STORAGE_TRIP_DAYS_KEY = 'pujatrip_trip_days_v1';
const LOCAL_STORAGE_TRIP_DAY_PANDALS_KEY = 'pujatrip_trip_day_pandals_v1';

// Helper to access local cache
function getStoredTripDays(): Record<string, TripDayPlan[]> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRIP_DAYS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Failed to parse trip days from localStorage', err);
    return {};
  }
}

function saveStoredTripDays(data: Record<string, TripDayPlan[]>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TRIP_DAYS_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save trip days to localStorage', err);
  }
}

function getStoredDayPandals(): Record<string, TripDayPandalItem[]> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TRIP_DAY_PANDALS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.warn('Failed to parse trip day pandals from localStorage', err);
    return {};
  }
}

function saveStoredDayPandals(data: Record<string, TripDayPandalItem[]>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TRIP_DAY_PANDALS_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save trip day pandals to localStorage', err);
  }
}

/**
 * Fetch all days and their ordered pandals for a given trip.
 * Queries Supabase `trip_days` and `trip_day_pandals` if available,
 * falling back seamlessly to localStorage cache.
 */
export async function fetchTripDays(tripId: string): Promise<TripDayPlan[]> {
  const supabase = getSupabase();
  const allStored = getStoredTripDays();
  let localDays = allStored[tripId] || [];

  if (supabase) {
    try {
      const { data: daysData, error: daysError } = await supabase
        .from('trip_days')
        .select('*')
        .eq('trip_id', tripId)
        .order('sort_order', { ascending: true });

      if (!daysError && daysData && daysData.length > 0) {
        // Fetch day pandals
        const { data: pandalsData, error: pandalsError } = await supabase
          .from('trip_day_pandals')
          .select('*')
          .eq('trip_id', tripId)
          .order('stop_order', { ascending: true });

        const pandalsByDay: Record<string, string[]> = {};
        const allDayPandalsMap = getStoredDayPandals();

        if (!pandalsError && pandalsData) {
          pandalsData.forEach((row: any) => {
            const dayId = row.trip_day_id || row.day_id;
            if (!pandalsByDay[dayId]) pandalsByDay[dayId] = [];
            pandalsByDay[dayId].push(row.pandal_id);

            // Cache items
            if (!allDayPandalsMap[dayId]) allDayPandalsMap[dayId] = [];
            const existingIdx = allDayPandalsMap[dayId].findIndex((p) => p.pandalId === row.pandal_id);
            const item: TripDayPandalItem = {
              id: row.id,
              tripDayId: dayId,
              pandalId: row.pandal_id,
              stopOrder: row.stop_order ?? 0,
              customNotes: row.custom_notes || undefined,
              status: row.status || (row.is_visited ? 'visited' : 'planned'),
              visitedAt: row.visited_at || undefined,
              visitedByUserId: row.visited_by_user_id || undefined,
              addedByUserId: row.added_by || undefined,
              createdAt: row.created_at || undefined,
            };
            if (existingIdx >= 0) {
              allDayPandalsMap[dayId][existingIdx] = item;
            } else {
              allDayPandalsMap[dayId].push(item);
            }
          });
          saveStoredDayPandals(allDayPandalsMap);
        }

        const mappedDays: TripDayPlan[] = daysData.map((d: any) => ({
          id: d.id,
          tripId: d.trip_id,
          date: d.date,
          festivalDayName: d.festival_day_name,
          bengaliFestivalDayName: d.bengali_festival_day_name,
          title: d.title || undefined,
          bengaliTitle: d.bengali_title || undefined,
          transportPreference: (d.transport_preference as TransportPreference) || 'mixed',
          sortOrder: d.sort_order ?? 1,
          notes: d.notes || undefined,
          startTime: d.start_time || undefined,
          endTime: d.end_time || undefined,
          pandalIds: pandalsByDay[d.id] || (Array.isArray(d.pandal_ids) ? d.pandal_ids : []),
        }));

        // Cache locally
        allStored[tripId] = mappedDays;
        saveStoredTripDays(allStored);
        return mappedDays;
      }
    } catch (err) {
      console.warn('Supabase fetchTripDays error (falling back to cache):', err);
    }
  }

  return localDays;
}

/**
 * Fetch pandal items (with status, stopOrder, notes) for a specific trip day.
 */
export async function fetchTripDayPandals(
  tripId: string,
  tripDayId: string
): Promise<TripDayPandalItem[]> {
  const supabase = getSupabase();
  const allStored = getStoredDayPandals();
  const localItems = allStored[tripDayId] || [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('trip_day_pandals')
        .select('*')
        .eq('trip_day_id', tripDayId)
        .order('stop_order', { ascending: true });

      if (!error && data) {
        const mapped: TripDayPandalItem[] = data.map((row: any) => ({
          id: row.id,
          tripDayId: row.trip_day_id || tripDayId,
          pandalId: row.pandal_id,
          stopOrder: row.stop_order ?? 0,
          customNotes: row.custom_notes || undefined,
          status: row.status || (row.is_visited ? 'visited' : 'planned'),
          visitedAt: row.visited_at || undefined,
          visitedByUserId: row.visited_by_user_id || undefined,
          addedByUserId: row.added_by || undefined,
          createdAt: row.created_at || undefined,
        }));
        allStored[tripDayId] = mapped;
        saveStoredDayPandals(allStored);
        return mapped;
      }
    } catch (err) {
      console.warn('Supabase fetchTripDayPandals error (using cache):', err);
    }
  }

  return localItems;
}

/**
 * Add a new day to a trip in `trip_days`.
 */
export async function addTripDay(
  tripId: string,
  dayInput: Omit<TripDayPlan, 'id' | 'tripId'>,
  userId?: string
): Promise<{ success: boolean; day?: TripDayPlan; error?: string }> {
  const dayId = `day_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newDay: TripDayPlan = {
    id: dayId,
    tripId,
    ...dayInput,
    pandalIds: dayInput.pandalIds || [],
  };

  // Local storage update
  const allDays = getStoredTripDays();
  if (!allDays[tripId]) allDays[tripId] = [];
  allDays[tripId].push(newDay);
  allDays[tripId].sort((a, b) => a.sortOrder - b.sortOrder);
  saveStoredTripDays(allDays);

  // If day has initial pandal IDs, initialize trip_day_pandals in cache
  if (newDay.pandalIds.length > 0) {
    const allPandals = getStoredDayPandals();
    allPandals[dayId] = newDay.pandalIds.map((pId, idx) => ({
      id: `p_${dayId}_${pId}`,
      tripDayId: dayId,
      pandalId: pId,
      stopOrder: idx + 1,
      status: 'planned',
      addedByUserId: userId,
      createdAt: new Date().toISOString(),
    }));
    saveStoredDayPandals(allPandals);
  }

  // Supabase persist
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('trip_days')
        .insert({
          id: dayId,
          trip_id: tripId,
          date: newDay.date,
          festival_day_name: newDay.festivalDayName,
          bengali_festival_day_name: newDay.bengaliFestivalDayName,
          title: newDay.title || null,
          bengali_title: newDay.bengaliTitle || null,
          transport_preference: newDay.transportPreference,
          sort_order: newDay.sortOrder,
          notes: newDay.notes || null,
          start_time: newDay.startTime || null,
          end_time: newDay.endTime || null,
        })
        .select()
        .single();

      if (error) {
        console.warn('Supabase insert trip_days notice:', error.message);
      } else if (data) {
        newDay.id = data.id;
      }

      // Insert any initial pandals
      if (newDay.pandalIds.length > 0) {
        const rows = newDay.pandalIds.map((pId, idx) => ({
          trip_id: tripId,
          trip_day_id: newDay.id,
          pandal_id: pId,
          stop_order: idx + 1,
          status: 'planned',
          added_by: userId || null,
        }));
        await supabase.from('trip_day_pandals').insert(rows);
      }
    } catch (err: any) {
      console.warn('Supabase addTripDay sync fallback:', err?.message || err);
    }
  }

  return { success: true, day: newDay };
}

/**
 * Delete a trip day and its associated pandals from `trip_days` and `trip_day_pandals`.
 */
export async function deleteTripDay(
  tripId: string,
  dayId: string
): Promise<{ success: boolean; error?: string }> {
  // Local cache update
  const allDays = getStoredTripDays();
  if (allDays[tripId]) {
    allDays[tripId] = allDays[tripId].filter((d) => d.id !== dayId);
    saveStoredTripDays(allDays);
  }

  const allPandals = getStoredDayPandals();
  delete allPandals[dayId];
  saveStoredDayPandals(allPandals);

  // Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('trip_day_pandals').delete().eq('trip_day_id', dayId);
      await supabase.from('trip_days').delete().eq('id', dayId);
    } catch (err: any) {
      console.warn('Supabase deleteTripDay sync notice:', err?.message || err);
    }
  }

  return { success: true };
}

/**
 * Add a pandal to a specific trip day.
 */
export async function addPandalToTripDay(
  tripId: string,
  dayId: string,
  pandalId: string,
  userId?: string
): Promise<{ success: boolean; item?: TripDayPandalItem; error?: string }> {
  const allDays = getStoredTripDays();
  const days = allDays[tripId] || [];
  const targetDay = days.find((d) => d.id === dayId);

  if (targetDay && targetDay.pandalIds.includes(pandalId)) {
    return { success: false, error: 'Pandal is already included in this day' };
  }

  const allPandals = getStoredDayPandals();
  const dayPandals = allPandals[dayId] || [];
  const newOrder = dayPandals.length + 1;

  const newItem: TripDayPandalItem = {
    id: `p_${dayId}_${pandalId}_${Date.now()}`,
    tripDayId: dayId,
    pandalId,
    stopOrder: newOrder,
    status: 'planned',
    addedByUserId: userId,
    createdAt: new Date().toISOString(),
  };

  dayPandals.push(newItem);
  allPandals[dayId] = dayPandals;
  saveStoredDayPandals(allPandals);

  if (targetDay) {
    targetDay.pandalIds.push(pandalId);
    saveStoredTripDays(allDays);
  }

  // Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('trip_day_pandals')
        .insert({
          trip_id: tripId,
          trip_day_id: dayId,
          pandal_id: pandalId,
          stop_order: newOrder,
          status: 'planned',
          added_by: userId || null,
        })
        .select()
        .single();

      if (!error && data) {
        newItem.id = data.id;
      }
    } catch (err: any) {
      console.warn('Supabase addPandalToTripDay notice:', err?.message || err);
    }
  }

  return { success: true, item: newItem };
}

/**
 * Remove a pandal from a specific trip day.
 */
export async function removePandalFromTripDay(
  tripId: string,
  dayId: string,
  pandalId: string
): Promise<{ success: boolean; error?: string }> {
  // Local cache
  const allDays = getStoredTripDays();
  const days = allDays[tripId] || [];
  const targetDay = days.find((d) => d.id === dayId);
  if (targetDay) {
    targetDay.pandalIds = targetDay.pandalIds.filter((id) => id !== pandalId);
    saveStoredTripDays(allDays);
  }

  const allPandals = getStoredDayPandals();
  let dayPandals = allPandals[dayId] || [];
  dayPandals = dayPandals.filter((item) => item.pandalId !== pandalId);
  // Re-index stopOrder
  dayPandals.forEach((item, idx) => {
    item.stopOrder = idx + 1;
  });
  allPandals[dayId] = dayPandals;
  saveStoredDayPandals(allPandals);

  // Supabase
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('trip_day_pandals')
        .delete()
        .eq('trip_day_id', dayId)
        .eq('pandal_id', pandalId);

      // Update remaining stop orders
      for (const item of dayPandals) {
        await supabase
          .from('trip_day_pandals')
          .update({ stop_order: item.stopOrder })
          .eq('trip_day_id', dayId)
          .eq('pandal_id', item.pandalId);
      }
    } catch (err: any) {
      console.warn('Supabase removePandalFromTripDay notice:', err?.message || err);
    }
  }

  return { success: true };
}

/**
 * Reorder pandals within a specific trip day and persist new sequence to Supabase `trip_day_pandals`.
 */
export async function reorderTripDayPandals(
  tripId: string,
  dayId: string,
  newPandalIds: string[]
): Promise<{ success: boolean; error?: string }> {
  // Update day plan's pandalIds
  const allDays = getStoredTripDays();
  const days = allDays[tripId] || [];
  const targetDay = days.find((d) => d.id === dayId);
  if (targetDay) {
    targetDay.pandalIds = newPandalIds;
    saveStoredTripDays(allDays);
  }

  // Update day pandals stopOrder
  const allPandals = getStoredDayPandals();
  const existingItems = allPandals[dayId] || [];
  const reorderedItems: TripDayPandalItem[] = newPandalIds.map((pId, idx) => {
    const existing = existingItems.find((p) => p.pandalId === pId);
    if (existing) {
      return { ...existing, stopOrder: idx + 1 };
    }
    return {
      id: `p_${dayId}_${pId}`,
      tripDayId: dayId,
      pandalId: pId,
      stopOrder: idx + 1,
      status: 'planned',
    };
  });

  allPandals[dayId] = reorderedItems;
  saveStoredDayPandals(allPandals);

  // Supabase persist
  const supabase = getSupabase();
  if (supabase) {
    try {
      // Update each item's stop_order
      for (let i = 0; i < newPandalIds.length; i++) {
        const pandalId = newPandalIds[i];
        await supabase
          .from('trip_day_pandals')
          .update({ stop_order: i + 1 })
          .eq('trip_day_id', dayId)
          .eq('pandal_id', pandalId);
      }
    } catch (err: any) {
      console.warn('Supabase reorderTripDayPandals notice:', err?.message || err);
    }
  }

  return { success: true };
}

/**
 * Persist visit status of a pandal in `trip_day_pandals` ('planned' | 'visited' | 'skipped').
 */
export async function updateDayPandalStatus(
  tripId: string,
  dayId: string,
  pandalId: string,
  status: 'planned' | 'visited' | 'skipped',
  userId?: string
): Promise<{ success: boolean; error?: string }> {
  const allPandals = getStoredDayPandals();
  const dayPandals = allPandals[dayId] || [];
  const item = dayPandals.find((p) => p.pandalId === pandalId);
  const now = new Date().toISOString();

  if (item) {
    item.status = status;
    if (status === 'visited') {
      item.visitedAt = now;
      item.visitedByUserId = userId;
    } else {
      item.visitedAt = undefined;
      item.visitedByUserId = undefined;
    }
    saveStoredDayPandals(allPandals);
  }

  // Supabase persist
  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('trip_day_pandals')
        .update({
          status,
          visited_at: status === 'visited' ? now : null,
          visited_by_user_id: status === 'visited' ? (userId || null) : null,
          is_visited: status === 'visited',
        })
        .eq('trip_day_id', dayId)
        .eq('pandal_id', pandalId);
    } catch (err: any) {
      console.warn('Supabase updateDayPandalStatus notice:', err?.message || err);
    }
  }

  return { success: true };
}

/**
 * Update custom notes on a specific stop in `trip_day_pandals`.
 */
export async function updateDayPandalNotes(
  tripId: string,
  dayId: string,
  pandalId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  const allPandals = getStoredDayPandals();
  const dayPandals = allPandals[dayId] || [];
  const item = dayPandals.find((p) => p.pandalId === pandalId);

  if (item) {
    item.customNotes = notes;
    saveStoredDayPandals(allPandals);
  }

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase
        .from('trip_day_pandals')
        .update({ custom_notes: notes })
        .eq('trip_day_id', dayId)
        .eq('pandal_id', pandalId);
    } catch (err: any) {
      console.warn('Supabase updateDayPandalNotes notice:', err?.message || err);
    }
  }

  return { success: true };
}

/**
 * Standard festival days helper for quick selection during "+ Add Day" flow.
 */
export function getAvailableFestivalDayOptions() {
  return pujaCalendar2026.map((cal) => {
    const festInfo = durgaPuja2026Dates[cal.date] || {
      dayName: cal.englishName,
      bengaliDayName: cal.bengaliName,
    };
    return {
      date: cal.date,
      englishName: cal.englishName,
      bengaliName: cal.bengaliName,
      description: cal.description,
      dayOfWeek: cal.dayOfWeek || '',
      ritualHighlight: cal.ritualHighlight || '',
      tithiTag: festInfo.bengaliDayName,
    };
  });
}
