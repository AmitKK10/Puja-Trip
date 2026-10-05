import React, { useState, useEffect, useMemo } from 'react';
import {
  CityId,
  Pandal,
  CuratedRoute,
  UserPreferences,
  TripPlan,
  PlannedItinerary,
  ItineraryOptimizationSuggestion,
  LocationWeather,
  DynamicReplanningOption,
  RunningLateStatus,
} from '../../types';
import { CURATED_ROUTES } from '../../data/curatedRoutes';
import { DurgaThirdEye, ShankhaIcon, DhakIcon, AlpanaCorner, AlpanaDivider } from '../common/BengaliMotifs';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import {
  generatePlannedItinerary,
  optimizePandalSequence,
} from '../../services/tripPlanningEngine';
import {
  getSavedTrips,
  createTrip,
  updateTrip,
  deleteTrip,
  duplicateTrip,
  getDefaultLocationsForCity,
} from '../../services/tripStorageService';
import {
  convertLocalTripToSharedGroup,
  getCurrentUserProfile,
  getTripGroup,
  generateInviteCode,
} from '../../services/friendGroupService';
import { TripSummaryCard } from '../trip/TripSummaryCard';
import { CoordinateTripSummarySection } from '../trip/CoordinateTripSummarySection';
import { ItineraryTimeline } from '../trip/ItineraryTimeline';
import { CreateTripModal } from '../trip/CreateTripModal';
import { SavedTripsDrawer } from '../trip/SavedTripsDrawer';
import { PandalPickerModal } from '../trip/PandalPickerModal';
import { WhatShouldWeDoNowCard } from '../common/WhatShouldWeDoNowCard';
import { WeatherTicker } from '../common/WeatherTicker';
import { DynamicReplanningCard } from '../trip/DynamicReplanningCard';
import { TripEndFeasibilityCard } from '../trip/TripEndFeasibilityCard';
import { CompactTripExpenseCard } from '../trip/CompactTripExpenseCard';
import { PersonalWalkingCard } from '../common/PersonalWalkingCard';
import { RouteOptimizationModal } from '../trip/RouteOptimizationModal';
import { PandalChecklist } from '../trip/PandalChecklist';
import { FestiveCameraModal } from '../pandal/FestiveCameraModal';
import { RouteShareModal } from '../trip/RouteShareModal';
import { DarshanCompletionTracker } from '../trip/DarshanCompletionTracker';
import { evaluateDynamicReplanning, evaluateRunningLateAndFeasibility } from '../../services/dynamicRouteReplanner';
import { getCachedWeatherSync } from '../../services/weatherService';
import confetti from 'canvas-confetti';
import {
  Route as RouteIcon,
  Sparkles,
  Clock,
  MapPin,
  Train,
  ArrowUp,
  ArrowDown,
  Trash2,
  Share2,
  CheckCircle2,
  CheckCheck,
  Camera,
  Plus,
  Compass,
  ArrowRight,
  ShieldCheck,
  Footprints,
  RefreshCw,
  FolderHeart,
  Sliders,
  Edit,
  Flame,
  Calendar,
  Navigation,
} from 'lucide-react';

interface RouteScreenProps {
  activeCity: CityId;
  pandals: Pandal[];
  activeTripPandalIds: string[];
  visitedList: string[];
  onUpdateTripPandals: (ids: string[]) => void;
  onToggleVisited: (id: string) => void;
  onSelectPandal: (pandal: Pandal) => void;
  onNavigateToGroup?: () => void;
  userPrefs: UserPreferences;
}

export const RouteScreen: React.FC<RouteScreenProps> = ({
  activeCity,
  pandals,
  activeTripPandalIds,
  visitedList,
  onUpdateTripPandals,
  onToggleVisited,
  onSelectPandal,
  onNavigateToGroup,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const cityRoutes = CURATED_ROUTES.filter((r) => r.city === activeCity);

  // Trips from Local Storage
  const [allTrips, setAllTrips] = useState<TripPlan[]>(() => getSavedTrips());
  const [currentWeather, setCurrentWeather] = useState<LocationWeather>(() => getCachedWeatherSync(activeCity));
  const [dismissedReplanId, setDismissedReplanId] = useState<string | null>(null);

  // Active Trip Plan
  const [activeTrip, setActiveTrip] = useState<TripPlan>(() => {
    const cityTrips = getSavedTrips(activeCity);
    if (cityTrips.length > 0) {
      return cityTrips[0];
    }
    const defLocs = getDefaultLocationsForCity(activeCity);
    return {
      id: `default-${activeCity}`,
      name: activeCity === 'kolkata' ? 'Kolkata Puja Itinerary' : 'Contai Town Circuit',
      bengaliName: activeCity === 'kolkata' ? 'কলকাতা শারদ পরিক্রমা' : 'কাঁথি শহর পরিক্রমা',
      city: activeCity,
      date: '2026-10-18',
      startTime: '17:00',
      endTime: '22:30',
      startLocation: defLocs.start,
      endLocation: defLocs.end,
      walkingPreference: 'normal',
      preferredTransport: activeCity === 'kolkata' ? 'metro' : 'mixed',
      maxWalkingDistanceMeters: 5000,
      selectedPandalIds: activeTripPandalIds,
      isCustomTrip: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });

  // Custom ordering of pandals in active trip (preserves user reordering)
  const [orderedPandalIds, setOrderedPandalIds] = useState<string[]>(activeTripPandalIds);

  // Modals & Drawers state
  const [showCreateTripModal, setShowCreateTripModal] = useState(false);
  const [editingTrip, setEditingTrip] = useState<TripPlan | null>(null);
  const [showSavedTripsDrawer, setShowSavedTripsDrawer] = useState(false);
  const [showPandalPickerModal, setShowPandalPickerModal] = useState(false);
  const [showRouteOptimizationModal, setShowRouteOptimizationModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [generatedDeepLink, setGeneratedDeepLink] = useState('');
  const [copiedDeepLinkToast, setCopiedDeepLinkToast] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'checklist'>('timeline');
  const [cameraPandal, setCameraPandal] = useState<Pandal | null>(null);

  // Generate shareable deep-link URL for the active trip pandals
  const generateTripDeepLink = (): string => {
    try {
      const url = new URL(window.location.origin + window.location.pathname);
      url.searchParams.set('tab', 'route');
      url.searchParams.set('city', activeCity);
      url.searchParams.set('tripName', activeTrip.name);
      if (orderedPandalIds.length > 0) {
        url.searchParams.set('pandals', orderedPandalIds.join(','));
      }
      return url.toString();
    } catch {
      return `${window.location.href}?pandals=${orderedPandalIds.join(',')}`;
    }
  };

  // Share button handler: Opens RouteShareModal with WhatsApp & Shareable Image generator
  const handleShareDeepLink = () => {
    const shareUrl = generateTripDeepLink();
    setGeneratedDeepLink(shareUrl);
    playKanshorBell(0.6);
    setShowShareModal(true);
  };

  // When city changes, update active trip to city's first trip
  useEffect(() => {
    const cityTrips = getSavedTrips(activeCity);
    if (cityTrips.length > 0) {
      const first = cityTrips[0];
      setActiveTrip(first);
      setOrderedPandalIds(first.selectedPandalIds);
      onUpdateTripPandals(first.selectedPandalIds);
    } else {
      const defLocs = getDefaultLocationsForCity(activeCity);
      const newPlan: TripPlan = {
        id: `default-${activeCity}`,
        name: activeCity === 'kolkata' ? 'Kolkata Puja Itinerary' : 'Contai Town Circuit',
        bengaliName: activeCity === 'kolkata' ? 'কলকাতা শারদ পরিক্রমা' : 'কাঁথি শহর পরিক্রমা',
        city: activeCity,
        date: '2026-10-18',
        startTime: '17:00',
        endTime: '22:30',
        startLocation: defLocs.start,
        endLocation: defLocs.end,
        walkingPreference: 'normal',
        preferredTransport: activeCity === 'kolkata' ? 'metro' : 'mixed',
        maxWalkingDistanceMeters: 5000,
        selectedPandalIds: activeTripPandalIds,
        isCustomTrip: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setActiveTrip(newPlan);
      setOrderedPandalIds(activeTripPandalIds);
    }
  }, [activeCity]);

  // Keep orderedPandalIds in sync if external activeTripPandalIds change
  useEffect(() => {
    const areEqual =
      activeTripPandalIds.length === orderedPandalIds.length &&
      activeTripPandalIds.every((id, idx) => orderedPandalIds[idx] === id);

    if (!areEqual) {
      setOrderedPandalIds(activeTripPandalIds);
      setActiveTrip((prev) => ({
        ...prev,
        selectedPandalIds: activeTripPandalIds,
      }));
    }
  }, [activeTripPandalIds]);

  // Resolve pandal objects for custom sequence
  const sequencePandals = useMemo(() => {
    const pandalsMap = new Map<string, Pandal>();
    pandals.forEach((p) => pandalsMap.set(p.id, p));

    return orderedPandalIds
      .map((id) => pandalsMap.get(id))
      .filter((p): p is Pandal => p !== undefined);
  }, [orderedPandalIds, pandals]);

  // Generate Timed Itinerary & Feasibility Analysis
  const plannedItinerary: PlannedItinerary = useMemo(() => {
    const tripToPlan: TripPlan = {
      ...activeTrip,
      selectedPandalIds: orderedPandalIds,
    };
    return generatePlannedItinerary(tripToPlan, pandals, sequencePandals);
  }, [activeTrip, orderedPandalIds, pandals, sequencePandals]);

  // Evaluated Dynamic Route Replanning Opportunity
  const replanOption = useMemo(() => {
    const visitedSet = new Set(visitedList);
    const option = evaluateDynamicReplanning(
      activeTrip,
      pandals,
      plannedItinerary,
      visitedSet,
      currentWeather
    );
    if (option && option.id !== dismissedReplanId) {
      return option;
    }
    return null;
  }, [activeTrip, pandals, plannedItinerary, visitedList, currentWeather, dismissedReplanId]);

  // Evaluated Running-Late Status & End-Feasibility
  const runningLateStatus: RunningLateStatus = useMemo(() => {
    const visitedSet = new Set(visitedList);
    return evaluateRunningLateAndFeasibility(activeTrip, pandals, plannedItinerary, visitedSet);
  }, [activeTrip, pandals, plannedItinerary, visitedList]);

  // Handle Dynamic Replan apply
  const handleApplyReplan = (newIds: string[]) => {
    setOrderedPandalIds(newIds);
    onUpdateTripPandals(newIds);
    updateTrip(activeTrip.id, { selectedPandalIds: newIds });
    setDismissedReplanId(replanOption?.id || null);
    playKanshorBell(0.9);
    playDhakHit('dha', 0.8);
  };

  // Recalculate & Smart Optimize sequence
  const handleRecalculatePlan = () => {
    setIsRecalculating(true);
    playKanshorBell(0.6);

    setTimeout(() => {
      const rawPandals = orderedPandalIds
        .map((id) => pandals.find((p) => p.id === id))
        .filter((p): p is Pandal => p !== undefined);

      const optimized = optimizePandalSequence(
        activeTrip.startLocation,
        activeTrip.endLocation,
        rawPandals,
        activeTrip.walkingPreference,
        activeTrip.preferredTransport
      );

      const newIds = optimized.map((p) => p.id);
      setOrderedPandalIds(newIds);
      onUpdateTripPandals(newIds);
      updateTrip(activeTrip.id, { selectedPandalIds: newIds });

      setIsRecalculating(false);
    }, 250);
  };

  // Reorder stop up
  const handleMoveUp = (pandalIndex: number) => {
    if (pandalIndex === 0) return;
    const newArr = [...orderedPandalIds];
    const temp = newArr[pandalIndex];
    newArr[pandalIndex] = newArr[pandalIndex - 1];
    newArr[pandalIndex - 1] = temp;
    setOrderedPandalIds(newArr);
    onUpdateTripPandals(newArr);
    updateTrip(activeTrip.id, { selectedPandalIds: newArr });
  };

  // Reorder stop down
  const handleMoveDown = (pandalIndex: number) => {
    if (pandalIndex === orderedPandalIds.length - 1) return;
    const newArr = [...orderedPandalIds];
    const temp = newArr[pandalIndex];
    newArr[pandalIndex] = newArr[pandalIndex + 1];
    newArr[pandalIndex + 1] = temp;
    setOrderedPandalIds(newArr);
    onUpdateTripPandals(newArr);
    updateTrip(activeTrip.id, { selectedPandalIds: newArr });
  };

  // Remove pandal from active trip
  const handleRemovePandal = (id: string) => {
    const newIds = orderedPandalIds.filter((item) => item !== id);
    setOrderedPandalIds(newIds);
    onUpdateTripPandals(newIds);
    updateTrip(activeTrip.id, { selectedPandalIds: newIds });
  };

  // Add single pandal to active trip
  const handleAddPandalToTrip = (id: string) => {
    if (!orderedPandalIds.includes(id)) {
      const newIds = [...orderedPandalIds, id];
      setOrderedPandalIds(newIds);
      onUpdateTripPandals(newIds);
      updateTrip(activeTrip.id, { selectedPandalIds: newIds });
      playKanshorBell(0.6);
    }
  };

  // Apply suggestion (e.g. remove lowest priority pandal to save time)
  const handleApplySuggestion = (suggestion: ItineraryOptimizationSuggestion) => {
    if (suggestion.action === 'remove_pandal' && suggestion.pandalId) {
      handleRemovePandal(suggestion.pandalId);
      playKanshorBell(0.5);
    } else if (suggestion.action === 'change_transport') {
      const updated = { ...activeTrip, preferredTransport: 'mixed' as const };
      setActiveTrip(updated);
      updateTrip(activeTrip.id, { preferredTransport: 'mixed' });
      playKanshorBell(0.5);
    }
  };

  // Save new trip from modal
  const handleSaveNewTrip = (tripData: Omit<TripPlan, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTrip) {
      const updated = updateTrip(editingTrip.id, tripData);
      if (updated) {
        setActiveTrip(updated);
        setOrderedPandalIds(updated.selectedPandalIds);
        onUpdateTripPandals(updated.selectedPandalIds);
      }
    } else {
      const created = createTrip(tripData);
      setActiveTrip(created);
      setOrderedPandalIds(created.selectedPandalIds);
      onUpdateTripPandals(created.selectedPandalIds);
    }

    setAllTrips(getSavedTrips());
    setShowCreateTripModal(false);
    setEditingTrip(null);
    playKanshorBell(0.8);
    playDhakHit('dha', 0.8);
  };

  // Load curated route into trip
  const handleLoadCuratedRoute = (route: CuratedRoute) => {
    const newIds = route.pandalIds;
    setOrderedPandalIds(newIds);
    onUpdateTripPandals(newIds);
    setActiveTrip((prev) => ({
      ...prev,
      name: route.title,
      bengaliName: route.bengaliTitle,
      selectedPandalIds: newIds,
    }));
    updateTrip(activeTrip.id, {
      name: route.title,
      bengaliName: route.bengaliTitle,
      selectedPandalIds: newIds,
    });
    playKanshorBell(0.6);
  };

  // Switch active trip
  const handleSelectTrip = (trip: TripPlan) => {
    setActiveTrip(trip);
    setOrderedPandalIds(trip.selectedPandalIds);
    onUpdateTripPandals(trip.selectedPandalIds);
    setShowSavedTripsDrawer(false);
    playKanshorBell(0.5);
  };

  // Duplicate trip
  const handleDuplicateTrip = (tripId: string) => {
    const dup = duplicateTrip(tripId);
    if (dup) {
      setAllTrips(getSavedTrips());
      setActiveTrip(dup);
      setOrderedPandalIds(dup.selectedPandalIds);
      onUpdateTripPandals(dup.selectedPandalIds);
      setShowSavedTripsDrawer(false);
      playKanshorBell(0.5);
    }
  };

  // Delete trip
  const handleDeleteTrip = (tripId: string) => {
    deleteTrip(tripId);
    const refreshed = getSavedTrips();
    setAllTrips(refreshed);
    if (activeTrip.id === tripId) {
      const fallback = refreshed.find((t) => t.city === activeCity) || refreshed[0];
      if (fallback) {
        setActiveTrip(fallback);
        setOrderedPandalIds(fallback.selectedPandalIds);
        onUpdateTripPandals(fallback.selectedPandalIds);
      }
    }
  };

  // Complete all stops celebration
  const handleCompleteAll = () => {
    sequencePandals.forEach((p) => {
      if (!visitedList.includes(p.id)) {
        onToggleVisited(p.id);
      }
    });
    playKanshorBell(0.8);
    playDhakHit('dha', 0.9);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#DC2626', '#F59E0B', '#FDE68A', '#7F1D1D'],
    });
  };

  return (
    <div id="route-planner-screen" className="space-y-5 pb-12 animate-fadeIn">
      {/* 1. Live Weather & 2-Hour Route Outlook Ticker */}
      <WeatherTicker
        activeCity={activeCity}
        onWeatherChange={(w) => setCurrentWeather(w)}
      />

      {/* 2. Top Action Bar */}
      <div className="flex items-center justify-between gap-2 flex-wrap px-1">
        <div>
          <div className="flex items-center gap-2">
            <RouteIcon className="w-5 h-5 text-[#DC2626]" />
            <h2 className="font-display font-black text-h2 sm:text-h1 text-[#881337] dark:text-[#FEF08A]">
              {activeTrip.name}
            </h2>
          </div>
          {activeTrip.bengaliName && (
            <p className="font-bengali-serif text-small text-[#DC2626] font-bold mt-0.5">
              {activeTrip.bengaliName}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => {
              setEditingTrip(null);
              setShowCreateTripModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-[#991B1B] hover:bg-[#DC2626] text-white text-micro font-bold shadow-sm transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Trip</span>
          </button>

          <button
            onClick={() => setShowSavedTripsDrawer(true)}
            className="px-2.5 py-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-micro font-bold border border-stone-300 dark:border-stone-700 transition-all flex items-center gap-1"
          >
            <FolderHeart className="w-3.5 h-3.5 text-amber-500" />
            <span>Saved Trips ({allTrips.filter((t) => t.city === activeCity).length})</span>
          </button>

          <button
            id="btn-share-route-screen"
            onClick={handleShareDeepLink}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 via-[#DC2626] to-[#991B1B] hover:brightness-110 active:scale-95 text-white text-micro font-bold shadow-sm transition-all flex items-center gap-1.5"
            title="Share deep-link with friends using Navigator Share API"
          >
            <Share2 className="w-3.5 h-3.5 text-[#FEF08A]" />
            <span>Share</span>
          </button>
        </div>
      </div>

      {/* 3. Dynamic Route Replanning Card (Triggered by queue surges, rain or faster sequences) */}
      {replanOption && (
        <DynamicReplanningCard
          replanOption={replanOption}
          onApplyPlan={handleApplyReplan}
          onDismiss={() => setDismissedReplanId(replanOption.id)}
        />
      )}

      {/* 4. Trip-End Feasibility & Running-Late Detection */}
      {orderedPandalIds.length > 0 && (
        <TripEndFeasibilityCard
          status={runningLateStatus}
          trip={activeTrip}
          onRemovePandal={handleRemovePandal}
          onSwitchTransportToMetro={() => {
            const updated = { ...activeTrip, preferredTransport: 'metro' as const };
            setActiveTrip(updated);
            updateTrip(activeTrip.id, { preferredTransport: 'metro' });
          }}
          onRecalculateRoute={handleRecalculatePlan}
        />
      )}

      {/* 5. Trip Configuration & Metadata Summary Pill */}
      <div
        className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-micro font-semibold flex-wrap ${
          isDarkMode
            ? 'bg-[#281B23]/90 border-[#F59E0B]/20 text-stone-300'
            : 'bg-white border-stone-200 text-stone-700 shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3 flex-wrap tabular-nums">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>{activeTrip.date}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>{activeTrip.startTime} - {activeTrip.endTime}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Footprints className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Walk: {activeTrip.walkingPreference}</span>
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Transport: {activeTrip.preferredTransport}</span>
          </span>
        </div>

        <button
          onClick={() => {
            setEditingTrip(activeTrip);
            setShowCreateTripModal(true);
          }}
          className="text-[#DC2626] hover:underline font-bold flex items-center gap-1"
        >
          <Edit className="w-3 h-3" />
          <span>Edit Params</span>
        </button>
      </div>

      {/* 5B. Dedicated Darshan Completion Progress Bar & Percentage Tracker */}
      <DarshanCompletionTracker
        trip={activeTrip}
        pandals={sequencePandals}
        visitedList={visitedList}
        onToggleVisited={onToggleVisited}
        onOpenSharePoster={handleShareDeepLink}
        isDarkMode={isDarkMode}
      />

      {/* 6A. Dedicated Trip Summary Section (WGS-84 Coordinate Distance & Travel Time Engine) */}
      <CoordinateTripSummarySection
        pandals={sequencePandals}
        activeCity={activeCity}
        isDarkMode={isDarkMode}
        onShareDeepLink={handleShareDeepLink}
      />

      {/* 6B. Top Itinerary Metrics & Feasibility Summary Banner */}
      <TripSummaryCard
        summary={plannedItinerary.summary}
        userPrefs={userPrefs}
        onApplySuggestion={handleApplySuggestion}
        onRecalculate={handleRecalculatePlan}
      />

      {/* 6B. Personal Walking Progress & Fatigue Card */}
      <PersonalWalkingCard
        tripId={activeTrip.id}
        userPrefs={userPrefs}
      />

      {/* 6C. Group Expense Quick Summary Card */}
      <CompactTripExpenseCard
        tripId={activeTrip.id}
        onOpenExpenses={() => {
          if (onNavigateToGroup) {
            onNavigateToGroup();
          }
        }}
        userPrefs={userPrefs}
      />

      {/* 6D. View Mode Switcher: Timeline vs Checklist */}
      <div className="flex items-center justify-between p-1 bg-stone-100 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700">
        <button
          id="tab-view-timeline"
          onClick={() => setViewMode('timeline')}
          className={`flex-1 py-2 px-3 rounded-xl text-small font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            viewMode === 'timeline'
              ? 'bg-white dark:bg-stone-700 text-[#DC2626] dark:text-[#FEF08A] shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <RouteIcon className="w-4 h-4" />
          <span>Timeline Route</span>
        </button>

        <button
          id="tab-view-checklist"
          onClick={() => setViewMode('checklist')}
          className={`flex-1 py-2 px-3 rounded-xl text-small font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            viewMode === 'checklist'
              ? 'bg-gradient-to-r from-amber-600 to-[#DC2626] text-white shadow-xs'
              : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
          }`}
        >
          <CheckCheck className="w-4 h-4" />
          <span>Pandal Checklist</span>
          <span
            className={`text-micro px-2 py-0.5 rounded-full font-bold tabular-nums ${
              viewMode === 'checklist'
                ? 'bg-black/25 text-[#FEF08A]'
                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
            }`}
          >
            {sequencePandals.filter((p) => visitedList.includes(p.id)).length}/{sequencePandals.length}
          </span>
        </button>
      </div>

      {viewMode === 'checklist' ? (
        /* 7A. Integrated Pandal Checklist with Satisfying Strike-Through Animation */
        <PandalChecklist
          pandals={sequencePandals}
          visitedList={visitedList}
          activeCity={activeCity}
          onToggleVisited={onToggleVisited}
          onSelectPandal={onSelectPandal}
          onSnapPhoto={(pandal) => setCameraPandal(pandal)}
          isDarkMode={isDarkMode}
        />
      ) : (
        /* 7B. Sequential Timeline Mode */
        <>
          {/* Sequence Optimizer Controls & Add Pandals */}
          <div className="flex items-center justify-between px-1 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Footprints className="w-4 h-4 text-[#DC2626]" />
              <h3 className="font-display font-black text-h3 sm:text-h2 text-[#881337] dark:text-[#FEF08A]">
                Sequential Stops ({orderedPandalIds.length})
              </h3>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Dedicated Route Optimization Button */}
              <button
                id="btn-route-optimization"
                disabled={orderedPandalIds.length <= 1}
                onClick={() => setShowRouteOptimizationModal(true)}
                className={`px-3 py-1.5 rounded-xl border text-micro font-bold shadow-xs transition-all flex items-center gap-1.5 ${
                  orderedPandalIds.length <= 1
                    ? 'opacity-50 cursor-not-allowed bg-stone-100 dark:bg-stone-800 text-stone-400 border-stone-200 dark:border-stone-700'
                    : 'bg-gradient-to-r from-amber-600 via-[#DC2626] to-[#991B1B] text-white border-transparent hover:brightness-110 active:scale-95 shadow-sm'
                }`}
                title="Suggest efficient visiting order based on geographic proximity"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#FEF08A] animate-pulse" />
                <span>Route Optimization</span>
              </button>

              {/* Recalculate / Optimize Sequence Button */}
              <button
                disabled={orderedPandalIds.length <= 1 || isRecalculating}
                onClick={handleRecalculatePlan}
                className={`px-2.5 py-1.5 rounded-xl border text-micro font-bold shadow-xs transition-all flex items-center gap-1.5 ${
                  isRecalculating
                    ? 'bg-stone-200 text-stone-500'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200 hover:bg-amber-500/25'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isRecalculating ? 'animate-spin' : ''}`} />
                <span>{isRecalculating ? 'Optimizing...' : 'Recalculate Plan'}</span>
              </button>

              {/* Add Pandal Button */}
              <button
                onClick={() => setShowPandalPickerModal(true)}
                className="px-3 py-1.5 rounded-xl bg-[#991B1B] hover:bg-[#DC2626] text-white text-micro font-bold shadow-xs transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Pandals</span>
              </button>

              {/* Mark All Visited */}
              {orderedPandalIds.length > 0 && (
                <button
                  onClick={handleCompleteAll}
                  className="px-2.5 py-1.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-micro font-bold shadow-xs transition-all flex items-center gap-1"
                  title="Mark all pandals as completed"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Finish All</span>
                </button>
              )}
            </div>
          </div>

          {/* 8. Itinerary Timeline */}
          {orderedPandalIds.length === 0 ? (
            <div className="py-12 text-center space-y-3 bg-stone-50 dark:bg-stone-900/50 rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 p-6">
              <div className="w-14 h-14 rounded-full bg-[#DC2626]/10 flex items-center justify-center mx-auto text-[#DC2626]">
                <RouteIcon size={30} />
              </div>
              <h4 className="font-display font-bold text-h3 text-stone-800 dark:text-stone-200">
                No pandals selected for this itinerary
              </h4>
              <p className="text-small text-stone-500 max-w-xs mx-auto font-bengali">
                মণ্ডপ তালিকা থেকে আপনার পছন্দের পূজা মণ্ডপ যোগ করুন অথবা নীচের তৈরি রুট লোড করুন।
              </p>
              <button
                onClick={() => setShowPandalPickerModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white text-btn font-bold shadow-md"
              >
                Select Pandals from Database
              </button>
            </div>
          ) : (
            <ItineraryTimeline
              stops={plannedItinerary.stops}
              visitedList={visitedList}
              onToggleVisited={onToggleVisited}
              onSelectPandal={onSelectPandal}
              onRemovePandal={handleRemovePandal}
              onMoveUp={handleMoveUp}
              onMoveDown={handleMoveDown}
              userPrefs={userPrefs}
            />
          )}
        </>
      )}

      {/* 9. Bottom Summary & Upgraded Next Decision Engine */}
      {orderedPandalIds.length > 0 && (
        <div className="pt-2 space-y-4">
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-small ${
              isDarkMode
                ? 'bg-[#281B23] border-[#F59E0B]/20 text-stone-300'
                : 'bg-stone-50 border-stone-200 text-stone-700'
            }`}
          >
            <div className="font-semibold tabular-nums">
              Trip summary: <strong>{plannedItinerary.summary.pandalCount} stops</strong> (
              {plannedItinerary.summary.formattedTotalDuration} total,{' '}
              {plannedItinerary.summary.formattedTotalWalkingDistance} walking)
            </div>

            <button
              onClick={() => {
                setOrderedPandalIds([]);
                onUpdateTripPandals([]);
                updateTrip(activeTrip.id, { selectedPandalIds: [] });
              }}
              className="text-micro font-bold text-red-600 hover:underline flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>

          {/* Smart Next Decision Engine */}
          <WhatShouldWeDoNowCard
            activeCity={activeCity}
            pandals={pandals}
            visitedList={visitedList}
            activeTrip={activeTrip}
            onSelectPandal={onSelectPandal}
            onAddPandalToTrip={handleAddPandalToTrip}
            userPrefs={userPrefs}
            weather={currentWeather}
          />
        </div>
      )}

      {/* 10. Curated Pre-Built Routes Carousel */}
      <div className="pt-4 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-display font-bold text-h3 text-[#881337] dark:text-[#FEF08A]">
            Ready-Made Curated Trails
          </h3>
          <span className="text-small text-stone-500 font-bengali font-semibold">বাছাই করা রুট</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
          {cityRoutes.map((route) => (
            <div
              key={route.id}
              className={`min-w-[250px] p-3.5 rounded-2xl border flex flex-col justify-between shrink-0 shadow-sm ${
                isDarkMode
                  ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
                  : 'bg-white border-[#D97706]/20 text-stone-800'
              }`}
            >
              <div>
                <span className="text-micro font-bold px-2 py-0.5 rounded-md bg-[#DC2626]/10 text-[#DC2626] uppercase tracking-wider">
                  {route.badge}
                </span>
                <h4 className="font-display font-bold text-h4 mt-1.5 leading-snug line-clamp-1">
                  {route.title}
                </h4>
                <p className="font-bengali-serif text-small text-[#DC2626] font-bold line-clamp-1">
                  {route.bengaliTitle}
                </p>
                <p className="text-small text-stone-500 line-clamp-2 mt-1">{route.subtitle}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-small">
                <span className="text-micro font-semibold text-stone-500 tabular-nums">
                  {route.pandalIds.length} stops • {route.estimatedHours}h
                </span>
                <button
                  onClick={() => handleLoadCuratedRoute(route)}
                  className="px-2.5 py-1 rounded-xl bg-[#991B1B] hover:bg-[#DC2626] text-white text-btn font-bold shadow-sm transition-all"
                >
                  Load Route
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create / Edit Trip Modal */}
      {showCreateTripModal && (
        <CreateTripModal
          initialTrip={editingTrip || undefined}
          activeCity={activeCity}
          allPandals={pandals}
          onSaveTrip={handleSaveNewTrip}
          onClose={() => {
            setShowCreateTripModal(false);
            setEditingTrip(null);
          }}
          userPrefs={userPrefs}
        />
      )}

      {/* Saved Trips Drawer */}
      {showSavedTripsDrawer && (
        <SavedTripsDrawer
          activeCity={activeCity}
          trips={allTrips}
          activeTripId={activeTrip.id}
          onSelectTrip={handleSelectTrip}
          onOpenCreateTrip={() => {
            setShowSavedTripsDrawer(false);
            setEditingTrip(null);
            setShowCreateTripModal(true);
          }}
          onOpenEditTrip={(trip) => {
            setShowSavedTripsDrawer(false);
            setEditingTrip(trip);
            setShowCreateTripModal(true);
          }}
          onDuplicateTrip={handleDuplicateTrip}
          onDeleteTrip={handleDeleteTrip}
          onClose={() => setShowSavedTripsDrawer(false)}
          userPrefs={userPrefs}
        />
      )}

      {/* Pandal Picker Modal */}
      {showPandalPickerModal && (
        <PandalPickerModal
          city={activeCity}
          allPandals={pandals}
          selectedPandalIds={orderedPandalIds}
          onTogglePandal={(id) => {
            const next = orderedPandalIds.includes(id)
              ? orderedPandalIds.filter((pId) => pId !== id)
              : [...orderedPandalIds, id];
            setOrderedPandalIds(next);
            onUpdateTripPandals(next);
            updateTrip(activeTrip.id, { selectedPandalIds: next });
          }}
          onSelectAllMustVisit={() => {
            const mustVisit = pandals
              .filter((p) => p.city === activeCity && p.recommendationLevel === 'Must Visit')
              .map((p) => p.id);
            const combined = Array.from(new Set([...orderedPandalIds, ...mustVisit]));
            setOrderedPandalIds(combined);
            onUpdateTripPandals(combined);
            updateTrip(activeTrip.id, { selectedPandalIds: combined });
          }}
          onSelectTop5={() => {
            const top5 = pandals
              .filter((p) => p.city === activeCity)
              .sort((a, b) => b.overallQualityScore - a.overallQualityScore)
              .slice(0, 5)
              .map((p) => p.id);
            setOrderedPandalIds(top5);
            onUpdateTripPandals(top5);
            updateTrip(activeTrip.id, { selectedPandalIds: top5 });
          }}
          onClearAll={() => {
            setOrderedPandalIds([]);
            onUpdateTripPandals([]);
            updateTrip(activeTrip.id, { selectedPandalIds: [] });
          }}
          onClose={() => setShowPandalPickerModal(false)}
          userPrefs={userPrefs}
        />
      )}

      {/* 5. Route Share Modal (WhatsApp & Festive Image Poster) */}
      <RouteShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        trip={activeTrip}
        sequencePandals={sequencePandals}
        plannedItinerary={plannedItinerary}
        activeCity={activeCity}
        visitedList={visitedList}
        isDarkMode={isDarkMode}
      />

      {/* 6. Route Optimization Modal */}
      <RouteOptimizationModal
        isOpen={showRouteOptimizationModal}
        onClose={() => setShowRouteOptimizationModal(false)}
        activeTrip={activeTrip}
        currentPandals={sequencePandals}
        onApplyOptimization={(newIds) => {
          setOrderedPandalIds(newIds);
          onUpdateTripPandals(newIds);
          updateTrip(activeTrip.id, { selectedPandalIds: newIds });
        }}
        isDarkMode={isDarkMode}
      />

      {/* 7. Festive Camera Modal for Snapping Branded Photos */}
      {cameraPandal && (
        <FestiveCameraModal
          pandal={cameraPandal}
          isOpen={!!cameraPandal}
          onClose={() => setCameraPandal(null)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

