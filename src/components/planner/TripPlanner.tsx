import React, { useState, useEffect, useMemo } from 'react';
import {
  TripPlan,
  TripMember,
  UserProfile,
  Pandal,
  TripDayPlan,
  TransportPreference,
} from '../../types';
import {
  fetchTripDays,
  fetchTripDayPandals,
  addTripDay,
  deleteTripDay,
  addPandalToTripDay,
  removePandalFromTripDay,
  reorderTripDayPandals,
  updateDayPandalStatus,
  updateDayPandalNotes,
  getAvailableFestivalDayOptions,
  TripDayPandalItem,
} from '../../services/tripDayService';
import { isSupabaseConfigured, getSupabase } from '../../services/supabaseClient';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  Calendar,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  CheckCircle2,
  Clock,
  MapPin,
  Compass,
  Search,
  Filter,
  Check,
  X,
  AlertCircle,
  Footprints,
  Train,
  Bus,
  Car,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Database,
  Cloud,
  CheckSquare,
  Square,
  FileText,
  RotateCcw,
} from 'lucide-react';

export interface TripPlannerProps {
  trip: TripPlan;
  members: TripMember[];
  currentUser: UserProfile;
  allPandals: Pandal[];
  isDarkMode?: boolean;
  onNavigateToPandal?: (pandalId: string) => void;
  onPlanUpdated?: (updatedDays: TripDayPlan[]) => void;
}

export const TripPlanner: React.FC<TripPlannerProps> = ({
  trip,
  members,
  currentUser,
  allPandals,
  isDarkMode = false,
  onNavigateToPandal,
  onPlanUpdated,
}) => {
  // Days state
  const [days, setDays] = useState<TripDayPlan[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [dayPandalsMap, setDayPandalsMap] = useState<Record<string, TripDayPandalItem[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  // Add Day modal state
  const [showAddDayModal, setShowAddDayModal] = useState<boolean>(false);
  const [newDayDate, setNewDayDate] = useState<string>('2026-10-18');
  const [newDayTitle, setNewDayTitle] = useState<string>('');
  const [newDayBengaliTitle, setNewDayBengaliTitle] = useState<string>('');
  const [newDayTransport, setNewDayTransport] = useState<TransportPreference>('mixed');
  const [newDayNotes, setNewDayNotes] = useState<string>('');
  const [isSubmittingDay, setIsSubmittingDay] = useState<boolean>(false);

  // Add Pandal modal / panel state
  const [showAddPandalModal, setShowAddPandalModal] = useState<boolean>(false);
  const [pandalSearchQuery, setPandalSearchQuery] = useState<string>('');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [isAddingPandal, setIsAddingPandal] = useState<boolean>(false);

  // Note editor popover
  const [editingNotesPandalId, setEditingNotesPandalId] = useState<string | null>(null);
  const [tempNotesText, setTempNotesText] = useState<string>('');

  const isOperatorAdmin = useMemo(() => {
    return (
      (trip as any).created_by === currentUser.id ||
      members.some((m) => m.userId === currentUser.id && (m.role === 'admin' || m.isOwner))
    );
  }, [(trip as any).created_by, members, currentUser.id]);

  const festivalOptions = useMemo(() => getAvailableFestivalDayOptions(), []);

  // Load Days on Mount or Trip change
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        let loadedDays = await fetchTripDays(trip.id);

        // If no days exist yet, seed initial festival day from trip or Maha Saptami
        if (!loadedDays || loadedDays.length === 0) {
          const initialDate = trip.date || '2026-10-18';
          const fest = festivalOptions.find((f) => f.date === initialDate) || festivalOptions[8]; // Saptami
          const seeded = await addTripDay(
            trip.id,
            {
              date: fest.date,
              festivalDayName: fest.englishName,
              bengaliFestivalDayName: fest.bengaliName,
              title: `${fest.englishName} Trail`,
              bengaliTitle: `${fest.bengaliName} পরিক্রমা`,
              transportPreference: trip.preferredTransport || 'mixed',
              pandalIds: trip.selectedPandalIds || [],
              sortOrder: 1,
              notes: trip.notes,
            },
            currentUser.id
          );
          if (seeded.success && seeded.day) {
            loadedDays = [seeded.day];
          }
        }

        if (isMounted) {
          setDays(loadedDays);
          if (loadedDays.length > 0) {
            setSelectedDayId(loadedDays[0].id);
            // Load pandal items for first day
            const items = await fetchTripDayPandals(trip.id, loadedDays[0].id);
            setDayPandalsMap((prev) => ({ ...prev, [loadedDays[0].id]: items }));
          }
        }
      } catch (err) {
        console.error('Failed to load trip days:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [trip.id]);

  // Load pandal records whenever selected day changes
  useEffect(() => {
    if (!selectedDayId) return;
    let isMounted = true;

    async function loadDayItems() {
      const items = await fetchTripDayPandals(trip.id, selectedDayId);
      if (isMounted) {
        setDayPandalsMap((prev) => ({ ...prev, [selectedDayId]: items }));
      }
    }

    loadDayItems();

    return () => {
      isMounted = false;
    };
  }, [selectedDayId, trip.id]);

  // Realtime subscription to `trip_days` and `trip_day_pandals`
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel(`planner_sync_${trip.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_days', filter: `trip_id=eq.${trip.id}` },
        async () => {
          const freshDays = await fetchTripDays(trip.id);
          setDays(freshDays);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trip_day_pandals', filter: `trip_id=eq.${trip.id}` },
        async () => {
          if (selectedDayId) {
            const freshItems = await fetchTripDayPandals(trip.id, selectedDayId);
            setDayPandalsMap((prev) => ({ ...prev, [selectedDayId]: freshItems }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [trip.id, selectedDayId]);

  const activeDay = useMemo(() => {
    return days.find((d) => d.id === selectedDayId) || days[0];
  }, [days, selectedDayId]);

  const currentDayPandals = useMemo(() => {
    if (!activeDay) return [];
    const items = dayPandalsMap[activeDay.id] || [];

    // Map ordered list with pandal object details
    return activeDay.pandalIds
      .map((pId, idx) => {
        const pObj = allPandals.find((p) => p.id === pId);
        const itemData = items.find((it) => it.pandalId === pId);
        return {
          pandalId: pId,
          order: idx + 1,
          pandal: pObj,
          itemData,
          status: itemData?.status || 'planned',
          customNotes: itemData?.customNotes,
        };
      })
      .filter((entry) => Boolean(entry.pandal));
  }, [activeDay, dayPandalsMap, allPandals]);

  // Add Day Handler
  const handleAddDay = async () => {
    const fest = festivalOptions.find((f) => f.date === newDayDate) || {
      englishName: 'Festival Day',
      bengaliName: 'উৎসবের দিন',
      date: newDayDate,
    };

    setIsSubmittingDay(true);
    setSyncStatusMsg('Saving day to Supabase...');

    try {
      const res = await addTripDay(
        trip.id,
        {
          date: newDayDate,
          festivalDayName: fest.englishName,
          bengaliFestivalDayName: fest.bengaliName,
          title: newDayTitle.trim() || `${fest.englishName} Trail`,
          bengaliTitle: newDayBengaliTitle.trim() || `${fest.bengaliName} পরিক্রমা`,
          transportPreference: newDayTransport,
          sortOrder: days.length + 1,
          pandalIds: [],
          notes: newDayNotes.trim() || undefined,
        },
        currentUser.id
      );

      if (res.success && res.day) {
        const updated = [...days, res.day];
        setDays(updated);
        setSelectedDayId(res.day.id);
        setShowAddDayModal(false);
        setNewDayTitle('');
        setNewDayBengaliTitle('');
        setNewDayNotes('');

        playKanshorBell(0.8);
        playDhakHit('dha', 0.9);
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });

        onPlanUpdated?.(updated);
        setSyncStatusMsg('Day plan successfully saved!');
        setTimeout(() => setSyncStatusMsg(null), 3000);
      }
    } catch (err: any) {
      console.error('Error adding trip day:', err);
      setSyncStatusMsg('Failed to save day.');
    } finally {
      setIsSubmittingDay(false);
    }
  };

  // Delete Day Handler
  const handleDeleteDay = async (dayId: string) => {
    if (days.length <= 1) {
      alert('A trip must have at least one planned festival day.');
      return;
    }
    if (!confirm('Are you sure you want to remove this festival day from your trip plan?')) {
      return;
    }

    setIsSyncing(true);
    try {
      await deleteTripDay(trip.id, dayId);
      const remaining = days.filter((d) => d.id !== dayId);
      setDays(remaining);
      if (selectedDayId === dayId && remaining.length > 0) {
        setSelectedDayId(remaining[0].id);
      }
      onPlanUpdated?.(remaining);
    } catch (err) {
      console.error('Error deleting day:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Add Pandal to active Day
  const handleAddPandal = async (pandalId: string) => {
    if (!activeDay) return;
    setIsAddingPandal(true);

    try {
      const res = await addPandalToTripDay(trip.id, activeDay.id, pandalId, currentUser.id);
      if (res.success) {
        const nextIds = [...activeDay.pandalIds, pandalId];
        const updatedDays = days.map((d) =>
          d.id === activeDay.id ? { ...d, pandalIds: nextIds } : d
        );
        setDays(updatedDays);

        // Refresh day pandal items
        const freshItems = await fetchTripDayPandals(trip.id, activeDay.id);
        setDayPandalsMap((prev) => ({ ...prev, [activeDay.id]: freshItems }));

        playKanshorBell(0.5);
        onPlanUpdated?.(updatedDays);
      } else {
        alert(res.error || 'Could not add pandal');
      }
    } catch (err) {
      console.error('Error adding pandal to day:', err);
    } finally {
      setIsAddingPandal(false);
    }
  };

  // Remove Pandal from active Day
  const handleRemovePandal = async (pandalId: string) => {
    if (!activeDay) return;

    try {
      await removePandalFromTripDay(trip.id, activeDay.id, pandalId);
      const nextIds = activeDay.pandalIds.filter((id) => id !== pandalId);
      const updatedDays = days.map((d) =>
        d.id === activeDay.id ? { ...d, pandalIds: nextIds } : d
      );
      setDays(updatedDays);

      const freshItems = await fetchTripDayPandals(trip.id, activeDay.id);
      setDayPandalsMap((prev) => ({ ...prev, [activeDay.id]: freshItems }));

      onPlanUpdated?.(updatedDays);
    } catch (err) {
      console.error('Error removing pandal from day:', err);
    }
  };

  // Reorder pandal (Move Up / Down)
  const handleMovePandal = async (index: number, direction: 'up' | 'down') => {
    if (!activeDay) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activeDay.pandalIds.length) return;

    const nextIds = [...activeDay.pandalIds];
    const [moved] = nextIds.splice(index, 1);
    nextIds.splice(targetIdx, 0, moved);

    // Optimistic UI update
    const updatedDays = days.map((d) =>
      d.id === activeDay.id ? { ...d, pandalIds: nextIds } : d
    );
    setDays(updatedDays);

    playKanshorBell(0.3);

    // Persist to Supabase `trip_day_pandals`
    await reorderTripDayPandals(trip.id, activeDay.id, nextIds);
    onPlanUpdated?.(updatedDays);
  };

  // Toggle Pandal Visit Status ('planned' <-> 'visited')
  const handleToggleStatus = async (pandalId: string, currentStatus: string) => {
    if (!activeDay) return;
    const nextStatus = currentStatus === 'visited' ? 'planned' : 'visited';

    if (nextStatus === 'visited') {
      playKanshorBell(0.7);
      playDhakHit('dha', 0.8);
    }

    // Local update
    setDayPandalsMap((prev) => {
      const list = prev[activeDay.id] || [];
      const updated = list.map((item) =>
        item.pandalId === pandalId
          ? {
              ...item,
              status: nextStatus as 'planned' | 'visited',
              visitedAt: nextStatus === 'visited' ? new Date().toISOString() : undefined,
              visitedByUserId: nextStatus === 'visited' ? currentUser.id : undefined,
            }
          : item
      );
      return { ...prev, [activeDay.id]: updated };
    });

    // Supabase persist
    await updateDayPandalStatus(trip.id, activeDay.id, pandalId, nextStatus, currentUser.id);
  };

  // Save notes on a pandal stop
  const handleSaveNotes = async (pandalId: string) => {
    if (!activeDay) return;
    await updateDayPandalNotes(trip.id, activeDay.id, pandalId, tempNotesText);
    setDayPandalsMap((prev) => {
      const list = prev[activeDay.id] || [];
      const updated = list.map((item) =>
        item.pandalId === pandalId ? { ...item, customNotes: tempNotesText } : item
      );
      return { ...prev, [activeDay.id]: updated };
    });
    setEditingNotesPandalId(null);
    setTempNotesText('');
  };

  // Filtered pandals for search picker
  const filteredCandidates = useMemo(() => {
    if (!activeDay) return [];
    const query = pandalSearchQuery.toLowerCase().trim();
    const existing = new Set(activeDay.pandalIds);

    return allPandals.filter((p) => {
      if (trip.city && p.city !== trip.city) return false;
      if (zoneFilter !== 'all' && p.zone !== zoneFilter) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.bengaliName?.toLowerCase().includes(query) ||
        p.area.toLowerCase().includes(query) ||
        p.categoryLabel?.toLowerCase().includes(query)
      );
    });
  }, [allPandals, trip.city, zoneFilter, pandalSearchQuery, activeDay]);

  const completedCount = useMemo(() => {
    return currentDayPandals.filter((p) => p.status === 'visited').length;
  }, [currentDayPandals]);

  const progressPercent = currentDayPandals.length > 0
    ? Math.round((completedCount / currentDayPandals.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-small text-stone-600 dark:text-stone-300 font-medium">
          Loading festival day itinerary...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner: Supabase Sync Indicator & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          <span className="text-small font-bold text-[#881337] dark:text-[#FEF08A]">
            Day-Wise Planner & Itinerary
          </span>
          {isSupabaseConfigured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
              <Cloud className="w-3 h-3" />
              <span>Supabase Connected</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {syncStatusMsg && (
            <span className="text-micro text-amber-700 dark:text-amber-300 animate-pulse font-medium">
              {syncStatusMsg}
            </span>
          )}
          <button
            onClick={() => setShowAddDayModal(true)}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-[#DC2626] text-white hover:brightness-110 active:scale-95 text-small font-bold flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-[#FEF08A]" />
            <span>Add Day</span>
            <span className="text-micro font-bengali opacity-85 hidden sm:inline">(দিন যোগ)</span>
          </button>
        </div>
      </div>

      {/* Days Horizontal Tab Selector */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
        <div className="flex items-center gap-2 min-w-max">
          {days.map((day) => {
            const isSelected = day.id === activeDay?.id;
            const dayPCount = day.pandalIds?.length || 0;
            const dayItems = dayPandalsMap[day.id] || [];
            const dayVisited = dayItems.filter((i) => i.status === 'visited').length;

            return (
              <button
                key={day.id}
                onClick={() => {
                  setSelectedDayId(day.id);
                  playKanshorBell(0.4);
                }}
                className={`group p-3 rounded-2xl border text-left transition-all min-w-[150px] sm:min-w-[170px] relative cursor-pointer ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-gradient-to-br from-[#381A25] to-[#25131C] border-[#DC2626] ring-2 ring-[#DC2626]/40 shadow-sm'
                      : 'bg-white border-[#DC2626] ring-2 ring-[#DC2626]/20 shadow-sm'
                    : isDarkMode
                    ? 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                    : 'bg-stone-100/80 border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    {day.date}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-pulse" />
                  )}
                </div>

                <div className="font-display font-bold text-small text-stone-900 dark:text-stone-100 truncate">
                  {day.festivalDayName}
                </div>
                <div className="font-bengali text-micro text-[#DC2626] font-semibold truncate">
                  {day.bengaliFestivalDayName}
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-stone-500">
                  <span>{dayPCount} Pandals</span>
                  {dayPCount > 0 && (
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {dayVisited}/{dayPCount} Visited
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Active Dashboard */}
      {activeDay && (
        <div
          className={`p-4 rounded-3xl border transition-all ${
            isDarkMode ? 'bg-[#251720] border-stone-800' : 'bg-white border-stone-200 shadow-sm'
          }`}
        >
          {/* Day Header Info & Control */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#DC2626]" />
                <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                  {activeDay.title || activeDay.festivalDayName}
                </h3>
              </div>
              <p className="font-bengali text-small text-[#DC2626] font-bold mt-0.5">
                {activeDay.bengaliTitle || activeDay.bengaliFestivalDayName} • {activeDay.date}
              </p>
              {activeDay.notes && (
                <p className="text-micro text-stone-500 mt-1 max-w-xl">{activeDay.notes}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAddPandalModal(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-small flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Pandal</span>
              </button>

              {days.length > 1 && isOperatorAdmin && (
                <button
                  onClick={() => handleDeleteDay(activeDay.id)}
                  disabled={isSyncing}
                  className="p-2 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-all"
                  title="Remove this day plan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Day Progress Summary Bar */}
          <div className="py-3 flex flex-wrap items-center justify-between gap-3 text-small">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-700 dark:text-stone-300">
                {completedCount} of {currentDayPandals.length} Stops Completed
              </span>
              <span className="text-micro font-bold text-stone-500">
                ({progressPercent}%)
              </span>
            </div>

            <div className="w-full sm:w-48 h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-[#DC2626] transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Pandals Order List */}
          {currentDayPandals.length === 0 ? (
            <div className="py-10 text-center space-y-3 border-2 border-dashed border-stone-200 dark:border-stone-800 rounded-2xl my-2">
              <Compass className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto" />
              <div>
                <p className="font-bold text-stone-800 dark:text-stone-200">
                  No pandals scheduled for {activeDay.festivalDayName} yet
                </p>
                <p className="text-small text-stone-500 mt-0.5">
                  Click &ldquo;Add Pandal&rdquo; to browse and build your custom route.
                </p>
              </div>
              <button
                onClick={() => setShowAddPandalModal(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-[#DC2626] text-white font-bold text-small inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:brightness-110"
              >
                <Plus className="w-4 h-4 text-[#FEF08A]" />
                <span>Select Pandals</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 pt-2">
              {currentDayPandals.map((item, index) => {
                const isVisited = item.status === 'visited';
                const isEditingThisNote = editingNotesPandalId === item.pandalId;

                return (
                  <div
                    key={item.pandalId}
                    className={`p-3 rounded-2xl border transition-all ${
                      isVisited
                        ? isDarkMode
                          ? 'bg-emerald-950/20 border-emerald-800/40'
                          : 'bg-emerald-50/70 border-emerald-200'
                        : isDarkMode
                        ? 'bg-stone-900/50 border-stone-800 hover:border-stone-700'
                        : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Reorder & Number */}
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => handleMovePandal(index, 'up')}
                            disabled={index === 0}
                            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 cursor-pointer"
                            title="Move Up"
                          >
                            <MoveUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMovePandal(index, 'down')}
                            disabled={index === currentDayPandals.length - 1}
                            className="p-1 rounded-md text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 disabled:opacity-20 cursor-pointer"
                            title="Move Down"
                          >
                            <MoveDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-display font-black text-small text-amber-700 dark:text-amber-400">
                          {item.order}
                        </div>

                        {/* Pandal Info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              onClick={() => onNavigateToPandal?.(item.pandalId)}
                              className="font-display font-bold text-small text-stone-900 dark:text-stone-100 hover:text-[#DC2626] cursor-pointer truncate"
                            >
                              {item.pandal.name}
                            </span>
                            {item.pandal.bengaliName && (
                              <span className="font-bengali text-micro text-[#DC2626] font-semibold truncate hidden sm:inline">
                                {item.pandal.bengaliName}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-micro text-stone-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-stone-400" />
                              <span>{item.pandal.area}</span>
                            </span>
                            <span>•</span>
                            <span>{item.pandal.zoneLabel || item.pandal.zone}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Status Toggle & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {/* Status Button */}
                        <button
                          onClick={() => handleToggleStatus(item.pandalId, item.status)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-micro flex items-center gap-1.5 transition-all cursor-pointer ${
                            isVisited
                              ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                              : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                          }`}
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${
                              isVisited ? 'text-white' : 'text-stone-400'
                            }`}
                          />
                          <span>{isVisited ? 'Visited' : 'Mark Visited'}</span>
                        </button>

                        {/* Note toggle */}
                        <button
                          onClick={() => {
                            if (isEditingThisNote) {
                              setEditingNotesPandalId(null);
                            } else {
                              setEditingNotesPandalId(item.pandalId);
                              setTempNotesText(item.customNotes || '');
                            }
                          }}
                          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                            item.customNotes
                              ? 'text-amber-600 bg-amber-500/10'
                              : 'text-stone-400 hover:text-stone-600'
                          }`}
                          title="Custom Stop Notes"
                        >
                          <FileText className="w-4 h-4" />
                        </button>

                        {/* Remove */}
                        <button
                          onClick={() => handleRemovePandal(item.pandalId)}
                          className="p-1.5 rounded-xl text-stone-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-all"
                          title="Remove from this day"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Inline Note Editor */}
                    {isEditingThisNote && (
                      <div className="mt-2.5 pt-2.5 border-t border-stone-200 dark:border-stone-800 flex items-center gap-2">
                        <input
                          type="text"
                          value={tempNotesText}
                          onChange={(e) => setTempNotesText(e.target.value)}
                          placeholder="e.g. Try rolls here, meet Sourav at 7 PM"
                          className="flex-1 px-3 py-1.5 rounded-xl text-small border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          onClick={() => handleSaveNotes(item.pandalId)}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-small hover:bg-amber-600 cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNotesPandalId(null)}
                          className="px-2 py-1.5 text-stone-400 hover:text-stone-600 text-small cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {/* Saved Notes display */}
                    {!isEditingThisNote && item.customNotes && (
                      <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-800 text-micro text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <span className="font-bold">Note:</span>
                        <span>{item.customNotes}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Day */}
      {showAddDayModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-md rounded-3xl p-6 border shadow-2xl space-y-4 ${
              isDarkMode ? 'bg-[#251720] border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#DC2626]" />
                <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                  Add Festival Day
                </h3>
              </div>
              <button
                onClick={() => setShowAddDayModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-small text-stone-500">
              Select an official Durga Puja 2026 festival day to create a separate day itinerary.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-micro font-bold text-stone-600 dark:text-stone-300 block mb-1">
                  Festival Date & Tithi
                </label>
                <select
                  value={newDayDate}
                  onChange={(e) => setNewDayDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-medium"
                >
                  {festivalOptions.map((f) => (
                    <option key={f.date} value={f.date}>
                      {f.date} — {f.englishName} ({f.bengaliName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-micro font-bold text-stone-600 dark:text-stone-300 block mb-1">
                  Day Title (Optional)
                </label>
                <input
                  type="text"
                  value={newDayTitle}
                  onChange={(e) => setNewDayTitle(e.target.value)}
                  placeholder="e.g. North Kolkata Heritage Walk"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small"
                />
              </div>

              <div>
                <label className="text-micro font-bold text-stone-600 dark:text-stone-300 block mb-1">
                  Bengali Title (বাংলা শিরোনাম)
                </label>
                <input
                  type="text"
                  value={newDayBengaliTitle}
                  onChange={(e) => setNewDayBengaliTitle(e.target.value)}
                  placeholder="e.g. উত্তর কলকাতা বনেদি পরিক্রমা"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-bengali"
                />
              </div>

              <div>
                <label className="text-micro font-bold text-stone-600 dark:text-stone-300 block mb-1">
                  Primary Day Transport
                </label>
                <select
                  value={newDayTransport}
                  onChange={(e) => setNewDayTransport(e.target.value as TransportPreference)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small"
                >
                  <option value="metro">🚇 Metro Transit (Green/Blue line)</option>
                  <option value="walking">🚶 Walking & Heritage Stroll</option>
                  <option value="bus">🚌 Public Bus & Shuttle</option>
                  <option value="mixed">🚗 Mixed / Cab & Auto</option>
                </select>
              </div>

              <div>
                <label className="text-micro font-bold text-stone-600 dark:text-stone-300 block mb-1">
                  Notes & Squad Target
                </label>
                <textarea
                  value={newDayNotes}
                  onChange={(e) => setNewDayNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Evening Kumari Puja darshan followed by adda"
                  className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddDayModal(false)}
                className="px-4 py-2 rounded-xl text-stone-500 hover:text-stone-700 text-small font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDay}
                disabled={isSubmittingDay}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-[#DC2626] text-white font-bold text-small shadow-xs cursor-pointer hover:brightness-110 disabled:opacity-50"
              >
                {isSubmittingDay ? 'Saving...' : 'Add to Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Select & Add Pandal */}
      {showAddPandalModal && activeDay && (
        <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg rounded-3xl p-6 border shadow-2xl flex flex-col max-h-[85vh] ${
              isDarkMode ? 'bg-[#251720] border-stone-800 text-white' : 'bg-white border-stone-200 text-stone-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800 shrink-0">
              <div>
                <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                  Add Pandal to {activeDay.festivalDayName}
                </h3>
                <p className="text-micro text-stone-500 font-bengali">
                  {activeDay.bengaliFestivalDayName}-এর জন্য মণ্ডপ নির্বাচন করুন
                </p>
              </div>
              <button
                onClick={() => setShowAddPandalModal(false)}
                className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filters */}
            <div className="py-3 space-y-2 shrink-0">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={pandalSearchQuery}
                  onChange={(e) => setPandalSearchQuery(e.target.value)}
                  placeholder="Search pandal name, area, or theme..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-micro">
                <button
                  onClick={() => setZoneFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    zoneFilter === 'all'
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                  }`}
                >
                  All Zones
                </button>
                <button
                  onClick={() => setZoneFilter('north_kolkata')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    zoneFilter === 'north_kolkata'
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                  }`}
                >
                  North Kolkata
                </button>
                <button
                  onClick={() => setZoneFilter('south_kolkata')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    zoneFilter === 'south_kolkata'
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                  }`}
                >
                  South Kolkata
                </button>
                <button
                  onClick={() => setZoneFilter('central_kolkata')}
                  className={`px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-all ${
                    zoneFilter === 'central_kolkata'
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                  }`}
                >
                  Central
                </button>
              </div>
            </div>

            {/* List of candidates */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredCandidates.map((pandal) => {
                const isAlreadyInDay = activeDay.pandalIds.includes(pandal.id);

                return (
                  <div
                    key={pandal.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
                      isAlreadyInDay
                        ? isDarkMode
                          ? 'bg-stone-900/40 border-stone-800 opacity-60'
                          : 'bg-stone-100 border-stone-200 opacity-60'
                        : isDarkMode
                        ? 'bg-stone-900 border-stone-800 hover:border-amber-500/50'
                        : 'bg-stone-50 border-stone-200 hover:border-amber-400'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-small text-stone-900 dark:text-stone-100 truncate">
                          {pandal.name}
                        </span>
                        {pandal.bengaliName && (
                          <span className="font-bengali text-micro text-[#DC2626] font-semibold truncate hidden sm:inline">
                            {pandal.bengaliName}
                          </span>
                        )}
                      </div>
                      <div className="text-micro text-stone-500 mt-0.5">
                        {pandal.area} • {pandal.categoryLabel || 'Heritage'}
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddPandal(pandal.id)}
                      disabled={isAlreadyInDay || isAddingPandal}
                      className={`px-3 py-1.5 rounded-xl font-bold text-micro shrink-0 flex items-center gap-1 cursor-pointer transition-all ${
                        isAlreadyInDay
                          ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-600 to-[#DC2626] text-white hover:brightness-110'
                      }`}
                    >
                      {isAlreadyInDay ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Added</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5 text-[#FEF08A]" />
                          <span>Add</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-stone-200 dark:border-stone-800 shrink-0 text-right">
              <button
                onClick={() => setShowAddPandalModal(false)}
                className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-small cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
