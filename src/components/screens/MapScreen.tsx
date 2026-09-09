import React, { useState, useMemo, useEffect } from 'react';
import {
  CityId,
  Pandal,
  UserPreferences,
  AnchorLocation,
  GroupMemberLocation,
  SuggestedMeetingPoint,
  UserProfile,
  EssentialPlaceRecord,
  EssentialPlaceCategory,
  TripSOSAlert,
  TripLostAlert,
} from '../../types';
import { DurgaThirdEye, ShankhaIcon, DhakIcon, AlpanaCorner } from '../common/BengaliMotifs';
import {
  DEFAULT_ANCHORS,
  getWorthwhileNearbyPandals,
  WorthwhilePandalResult,
} from '../../services/pandalRecommendationService';
import {
  getCurrentUserProfile,
  getMyTripGroups,
  getTripGroup,
  markGroupPandalDarshan,
  getGroupVisitStatuses,
  subscribeToTripUpdates,
  FESTIVE_AVATARS,
} from '../../services/friendGroupService';
import {
  getAllGroupMemberLocations,
  detectNearbyPandalForDarshan,
  getLocationSharingSettings,
  subscribeToLiveLocationBroadcasts,
  seedDemoSquadLocationsIfEmpty,
} from '../../services/groupLocationService';
import {
  getActiveSOSAlerts,
  getActiveLostAlerts,
  computeEnhancedMeetingPoint,
  getAllEssentialPlaces,
  findNearestEssentialPlaces,
} from '../../services/safetyAndUtilitiesService';
import { ESSENTIAL_CATEGORY_CONFIG } from '../../data/essentialPlacesData';
import { latLngToMapCoordinates } from '../../utils/geoUtils';
import { LocationSharingBar } from '../group/LocationSharingBar';
import { FriendDetailModal } from '../group/FriendDetailModal';
import { SuggestedMeetingPointCard } from '../group/SuggestedMeetingPointCard';
import { PandalProximityBanner } from '../group/PandalProximityBanner';
import { ActiveSOSAlertBanner } from '../common/ActiveSOSAlertBanner';
import { ActiveLostAlertBanner } from '../common/ActiveLostAlertBanner';
import { TripQuickToolsArea } from '../trip/TripQuickToolsArea';
import { SOSModal } from '../common/SOSModal';
import { LostGroupModal } from '../common/LostGroupModal';
import { EmergencyInformationModal } from '../common/EmergencyInformationModal';
import { CrowdDensityVisualIndicator, getCrowdDensityInfo } from '../pandal/CrowdDensityVisualIndicator';
import { playKanshorBell } from '../../utils/audioSynth';
import {
  MapPin,
  Navigation,
  Layers,
  Sparkles,
  Clock,
  Star,
  ChevronRight,
  ArrowRight,
  Train,
  Flame,
  ZoomIn,
  ZoomOut,
  Crosshair,
  Compass,
  Award,
  ListFilter,
  Eye,
  Info,
  Users,
  Radio,
  Target,
  LocateFixed,
  Phone,
  Shield,
  ShieldAlert,
  HelpCircle,
  X,
} from 'lucide-react';

interface MapScreenProps {
  activeCity: CityId;
  pandals: Pandal[];
  activeTripPandalIds: string[];
  onSelectPandal: (pandal: Pandal) => void;
  userPrefs: UserPreferences;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  activeCity,
  pandals,
  activeTripPandalIds,
  onSelectPandal,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const cityPandals = useMemo(() => pandals.filter((p) => p.city === activeCity), [pandals, activeCity]);
  const cityAnchors = useMemo(() => DEFAULT_ANCHORS.filter((a) => a.city === activeCity), [activeCity]);

  // Current User & Active Shared Group
  const [currentUser] = useState<UserProfile>(() => getCurrentUserProfile());
  const myGroups = useMemo(() => getMyTripGroups(), []);
  const activeGroup = useMemo(() => {
    const forCity = myGroups.find((g) => g.trip.city === activeCity);
    return forCity || myGroups[0] || null;
  }, [myGroups, activeCity]);

  const activeTripId = activeGroup?.trip.id || `trip-${activeCity}-2026`;

  // Selected Anchor Location state (defaults to Tala Park for Kolkata, Sabuj Sangha for Contai)
  const [selectedAnchorId, setSelectedAnchorId] = useState<string>(cityAnchors[0]?.id || 'tala-park');
  const activeAnchor = useMemo(() => {
    return cityAnchors.find((a) => a.id === selectedAnchorId) || cityAnchors[0];
  }, [cityAnchors, selectedAnchorId]);

  const [selectedPandalId, setSelectedPandalId] = useState<string>(cityPandals[0]?.id || '');
  const [showMetroLines, setShowMetroLines] = useState(true);
  const [showFriendsOnMap, setShowFriendsOnMap] = useState(true);
  const [mapFilter, setMapFilter] = useState<'all' | 'must_visit' | 'low_queue'>('all');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapCenter, setMapCenter] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [rankingSortBy, setRankingSortBy] = useState<'worth_score' | 'distance' | 'overall_quality'>('worth_score');

  // Essential Nearby Places Category Layer State
  const [activeEssentialCategories, setActiveEssentialCategories] = useState<EssentialPlaceCategory[]>([
    'public_toilet',
    'hospital',
    'police',
  ]);
  const [selectedEssentialPlace, setSelectedEssentialPlace] = useState<EssentialPlaceRecord | null>(null);
  const [showEssentialLayersMenu, setShowEssentialLayersMenu] = useState(false);

  // Safety & Utility Modals State
  const [isSOSModalOpen, setIsSOSModalOpen] = useState(false);
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isEmergencyInfoOpen, setIsEmergencyInfoOpen] = useState(false);

  // Active Realtime Alerts
  const [activeSOSAlerts, setActiveSOSAlerts] = useState<TripSOSAlert[]>(() => getActiveSOSAlerts(activeTripId));
  const [activeLostAlerts, setActiveLostAlerts] = useState<TripLostAlert[]>(() => getActiveLostAlerts(activeTripId));

  // Seed demo locations for other friends if empty
  useEffect(() => {
    if (activeGroup) {
      seedDemoSquadLocationsIfEmpty(activeGroup.trip.id, activeGroup.members, activeCity);
    }
  }, [activeGroup, activeCity]);

  // Realtime Group Locations State
  const [memberLocations, setMemberLocations] = useState<GroupMemberLocation[]>(() =>
    getAllGroupMemberLocations(
      activeTripId,
      activeGroup?.members,
      currentUser,
      cityPandals,
      activeCity
    )
  );

  // Selected friend for detail modal
  const [selectedFriend, setSelectedFriend] = useState<GroupMemberLocation | null>(null);

  // GPS Proximity Detection banner
  const [proximityAlert, setProximityAlert] = useState<{ pandal: Pandal; distanceMeters: number } | null>(null);
  const [dismissedPandalIds, setDismissedPandalIds] = useState<string[]>([]);

  // Periodically refresh member locations and safety alerts
  useEffect(() => {
    const refreshData = () => {
      const locs = getAllGroupMemberLocations(
        activeTripId,
        activeGroup?.members,
        currentUser,
        cityPandals,
        activeCity
      );
      setMemberLocations(locs);
      setActiveSOSAlerts(getActiveSOSAlerts(activeTripId));
      setActiveLostAlerts(getActiveLostAlerts(activeTripId));

      // Check proximity for current user's location
      const myLoc = locs.find((l) => l.isCurrentUser && l.isSharing && l.latitude !== 0);
      if (myLoc && myLoc.latitude && myLoc.longitude) {
        const visitedStatuses = getGroupVisitStatuses(activeTripId);
        const myVisitedIds = visitedStatuses
          .filter((s) => s.userId === currentUser.id && s.isVisited)
          .map((s) => s.pandalId);

        const nearby = detectNearbyPandalForDarshan(
          myLoc.latitude,
          myLoc.longitude,
          cityPandals,
          myVisitedIds.concat(dismissedPandalIds)
        );
        if (nearby) {
          setProximityAlert(nearby);
        }
      }
    };

    refreshData();
    const interval = setInterval(refreshData, 4000);

    const unsubscribeBroadcast = subscribeToLiveLocationBroadcasts(activeTripId, () => {
      refreshData();
    });

    const unsubscribeTrip = subscribeToTripUpdates(activeTripId, () => {
      refreshData();
    });

    return () => {
      clearInterval(interval);
      unsubscribeBroadcast();
      unsubscribeTrip();
    };
  }, [activeTripId, activeGroup, currentUser, cityPandals, activeCity, dismissedPandalIds]);

  // Enhanced Suggested Meeting Point
  const suggestedMeetingPoint: SuggestedMeetingPoint | null = useMemo(() => {
    return computeEnhancedMeetingPoint(activeTripId, activeCity, cityPandals);
  }, [activeTripId, activeCity, cityPandals, memberLocations]);

  // Essential places matching active filters
  const displayedEssentialPlaces = useMemo(() => {
    return getAllEssentialPlaces(activeCity, activeEssentialCategories);
  }, [activeCity, activeEssentialCategories]);

  // Compute worthwhile nearby ranking from active anchor
  const nearbyRankings: WorthwhilePandalResult[] = useMemo(() => {
    if (!activeAnchor) return [];
    return getWorthwhileNearbyPandals({
      anchorLat: activeAnchor.latitude,
      anchorLng: activeAnchor.longitude,
      anchorName: activeAnchor.name,
      pandals: cityPandals,
      city: activeCity,
      sortBy: rankingSortBy,
    });
  }, [activeAnchor, cityPandals, activeCity, rankingSortBy]);

  const activePandal = useMemo(() => {
    return cityPandals.find((p) => p.id === selectedPandalId) || cityPandals[0];
  }, [cityPandals, selectedPandalId]);

  // Active Pandal's exact distance & direction relative to active anchor
  const activePandalRank = useMemo(() => {
    return nearbyRankings.find((r) => r.pandal.id === activePandal?.id);
  }, [nearbyRankings, activePandal]);

  const displayedPandals = useMemo(() => {
    return cityPandals.filter((p) => {
      if (mapFilter === 'must_visit') return p.recommendationLevel === 'Must Visit';
      if (mapFilter === 'low_queue') return p.queueWaitMinutes <= 30;
      return true;
    });
  }, [cityPandals, mapFilter]);

  // Active squad members with valid live GPS
  const activeFriendsOnMap = useMemo(() => {
    return memberLocations.filter(
      (m) => m.isSharing && m.status !== 'disabled' && m.latitude !== 0 && m.longitude !== 0
    );
  }, [memberLocations]);

  // Handle Find Friend: Center Map on Friend
  const handleFindFriend = (friend: GroupMemberLocation) => {
    if (friend.latitude && friend.longitude) {
      const coords = latLngToMapCoordinates(friend.latitude, friend.longitude, activeCity);
      setMapCenter({ x: coords.mapX, y: coords.mapY });
      setZoomLevel(1.35);
      playKanshorBell(0.6);
    }
  };

  // Handler to navigate/center map on coordinates
  const handleNavigateToCoords = (lat: number, lng: number) => {
    const coords = latLngToMapCoordinates(lat, lng, activeCity);
    setMapCenter({ x: coords.mapX, y: coords.mapY });
    setZoomLevel(1.4);
    playKanshorBell(0.6);
  };

  const handleToggleEssentialCategory = (cat: EssentialPlaceCategory) => {
    setActiveEssentialCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Handle Proximity Visit Confirmation
  const handleConfirmProximityVisit = async (pandal: Pandal) => {
    await markGroupPandalDarshan(activeTripId, pandal.id, pandal.name, currentUser.id, true);
    setDismissedPandalIds((prev) => [...prev, pandal.id]);
    setProximityAlert(null);
  };

  return (
    <div id="interactive-map-screen" className="relative flex flex-col min-h-[620px] pb-12 animate-fadeIn space-y-3">
      {/* 0. Live Emergency & Lost Alerts Banners */}
      <ActiveSOSAlertBanner
        alerts={activeSOSAlerts}
        tripId={activeTripId}
        onOpenSOSModal={() => setIsSOSModalOpen(true)}
        onNavigateToCoords={handleNavigateToCoords}
        userPrefs={userPrefs}
      />

      <ActiveLostAlertBanner
        alerts={activeLostAlerts}
        tripId={activeTripId}
        onOpenLostModal={() => setIsLostModalOpen(true)}
        onNavigateToPoint={handleNavigateToCoords}
        userPrefs={userPrefs}
      />

      {/* 0.1 Live GPS Location Sharing Control Bar */}
      <LocationSharingBar
        tripId={activeTripId}
        currentUser={currentUser}
        activeCity={activeCity}
        isDarkMode={isDarkMode}
      />

      {/* 0.2 Proximity Alert Banner if user is near a pandal */}
      {proximityAlert && (
        <PandalProximityBanner
          pandal={proximityAlert.pandal}
          distanceMeters={proximityAlert.distanceMeters}
          onConfirmVisit={handleConfirmProximityVisit}
          onDismiss={() => {
            setDismissedPandalIds((prev) => [...prev, proximityAlert.pandal.id]);
            setProximityAlert(null);
          }}
          isDarkMode={isDarkMode}
        />
      )}

      {/* 0.3 Suggested Central Meeting Point Card */}
      {suggestedMeetingPoint && (
        <SuggestedMeetingPointCard
          meetingPoint={suggestedMeetingPoint}
          onLocateOnMap={() => handleNavigateToCoords(suggestedMeetingPoint.latitude, suggestedMeetingPoint.longitude)}
          onNavigateToPoint={handleNavigateToCoords}
          isDarkMode={isDarkMode}
        />
      )}

      {/* 0.4 Trip Quick Tools Area */}
      <TripQuickToolsArea
        activeCity={activeCity}
        onOpenSOS={() => setIsSOSModalOpen(true)}
        onOpenLost={() => setIsLostModalOpen(true)}
        onOpenMeetingPoint={() => {
          if (suggestedMeetingPoint) {
            handleNavigateToCoords(suggestedMeetingPoint.latitude, suggestedMeetingPoint.longitude);
          }
        }}
        onFindFriend={() => {
          const otherFriend = memberLocations.find((m) => !m.isCurrentUser && m.isSharing && m.latitude !== 0);
          if (otherFriend) {
            handleFindFriend(otherFriend);
          }
        }}
        onFindNearbyMetro={() => {
          setActiveEssentialCategories((prev) => (prev.includes('metro') ? prev : [...prev, 'metro']));
          const firstMetro = displayedEssentialPlaces.find((p) => p.category === 'metro');
          if (firstMetro) {
            setSelectedEssentialPlace(firstMetro);
            handleNavigateToCoords(firstMetro.latitude, firstMetro.longitude);
          }
        }}
        onFindNearbyToilet={() => {
          setActiveEssentialCategories((prev) => (prev.includes('public_toilet') ? prev : [...prev, 'public_toilet']));
          const firstToilet = displayedEssentialPlaces.find((p) => p.category === 'public_toilet');
          if (firstToilet) {
            setSelectedEssentialPlace(firstToilet);
            handleNavigateToCoords(firstToilet.latitude, firstToilet.longitude);
          }
        }}
        onFindNearbyFood={() => {
          setActiveEssentialCategories((prev) => (prev.includes('food') ? prev : [...prev, 'food', 'tea_snacks']));
          const firstFood = displayedEssentialPlaces.find((p) => p.category === 'food' || p.category === 'tea_snacks');
          if (firstFood) {
            setSelectedEssentialPlace(firstFood);
            handleNavigateToCoords(firstFood.latitude, firstFood.longitude);
          }
        }}
        onOpenEmergencyInfo={() => setIsEmergencyInfoOpen(true)}
        userPrefs={userPrefs}
      />

      {/* 1. Anchor / "I am currently at..." Bar */}
      <div
        className={`p-3 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/30 text-white'
            : 'bg-white border-[#D97706]/30 text-stone-900'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
            <Crosshair className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-micro text-stone-500 font-bold uppercase tracking-wider block">
              Reference Point / Anchor
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-display font-black text-small sm:text-h4 text-[#881337] dark:text-[#FEF08A] truncate">
                {activeAnchor.name}
              </span>
              <span className="font-bengali text-micro text-[#DC2626] font-bold">
                ({activeAnchor.bengaliName})
              </span>
            </div>
          </div>
        </div>

        {/* Anchor Quick Switcher Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {cityAnchors.map((anchor) => (
            <button
              key={anchor.id}
              onClick={() => setSelectedAnchorId(anchor.id)}
              className={`px-2.5 py-1.5 rounded-xl text-micro font-bold transition-all shrink-0 ${
                anchor.id === selectedAnchorId
                  ? 'bg-[#991B1B] text-white shadow-xs'
                  : isDarkMode
                  ? 'bg-[#3B1324] text-stone-300 hover:bg-[#522030]'
                  : 'bg-stone-100 text-stone-700 hover:bg-amber-100'
              }`}
            >
              {anchor.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Interactive SVG Map Canvas */}
      <div
        id="svg-map-canvas-container"
        className={`relative w-full h-[400px] sm:h-[460px] rounded-3xl overflow-hidden border shadow-inner transition-colors duration-300 ${
          isDarkMode ? 'border-[#F59E0B]/30 bg-[#1C1418]' : 'border-[#D97706]/30 bg-[#FFFDF9]'
        }`}
      >
        {/* Floating Controls Overlay */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-2 pointer-events-none">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 pointer-events-auto bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs p-1 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <button
              onClick={() => setMapFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold transition-all ${
                mapFilter === 'all'
                  ? 'bg-[#DC2626] text-white'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              All ({cityPandals.length})
            </button>
            <button
              onClick={() => setMapFilter('must_visit')}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold transition-all flex items-center gap-1 ${
                mapFilter === 'must_visit'
                  ? 'bg-[#DC2626] text-white'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Award className="w-3 h-3 text-amber-500" />
              <span>Must Visit</span>
            </button>
            <button
              onClick={() => setMapFilter('low_queue')}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold transition-all ${
                mapFilter === 'low_queue'
                  ? 'bg-[#DC2626] text-white'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              ⚡ Fast Queue
            </button>
          </div>

          {/* Map Layer Controls (Metro, Utilities, Friends, Zoom) */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            {/* Essential Places Layer Selector Button */}
            <button
              id="essential-places-layer-toggle"
              onClick={() => setShowEssentialLayersMenu(!showEssentialLayersMenu)}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold flex items-center gap-1 border shadow-xs transition-all ${
                activeEssentialCategories.length > 0
                  ? 'bg-[#991B1B] text-white border-red-700'
                  : 'bg-white/90 dark:bg-stone-900/90 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800'
              }`}
              title="Toggle Essential Utility Layers"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Utilities ({activeEssentialCategories.length})</span>
            </button>

            {/* Squad Friends Layer Toggle */}
            <button
              onClick={() => setShowFriendsOnMap(!showFriendsOnMap)}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold flex items-center gap-1 border shadow-xs transition-all ${
                showFriendsOnMap
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-white/90 dark:bg-stone-900/90 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800'
              }`}
              title="Toggle Live Squad Friends on Map"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Squad ({activeFriendsOnMap.length})</span>
            </button>

            {activeCity === 'kolkata' && (
              <button
                onClick={() => setShowMetroLines(!showMetroLines)}
                className={`p-1.5 rounded-xl border shadow-xs transition-all ${
                  showMetroLines
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-white/90 dark:bg-stone-900/90 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800'
                }`}
                title="Toggle Metro Blue Line"
              >
                <Train className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center bg-white/90 dark:bg-stone-900/90 backdrop-blur-xs rounded-xl border border-stone-200 dark:border-stone-800 p-0.5 shadow-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg text-stone-700 dark:text-stone-300"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setMapCenter({ x: 50, y: 50 });
                }}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg text-stone-700 dark:text-stone-300"
                title="Reset View"
              >
                <Crosshair className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.15))}
                className="p-1 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-lg text-stone-700 dark:text-stone-300"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Essential Layers Selector Dropdown Menu */}
        {showEssentialLayersMenu && (
          <div
            id="essential-places-category-popover"
            className="absolute top-14 right-3 z-30 w-72 p-3 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200 dark:border-stone-700 shadow-2xl space-y-2 animate-scaleUp"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-stone-200 dark:border-stone-800">
              <span className="font-display font-bold text-small text-stone-900 dark:text-stone-100">
                Essential Map Layers
              </span>
              <button
                onClick={() => setShowEssentialLayersMenu(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-60 overflow-y-auto no-scrollbar pt-1">
              {(
                [
                  'public_toilet',
                  'hospital',
                  'police',
                  'metro',
                  'bus_stop',
                  'food',
                  'tea_snacks',
                  'petrol_pump',
                  'rest_spot',
                ] as EssentialPlaceCategory[]
              ).map((cat) => {
                const config = ESSENTIAL_CATEGORY_CONFIG[cat];
                const isActive = activeEssentialCategories.includes(cat);

                return (
                  <button
                    key={cat}
                    onClick={() => handleToggleEssentialCategory(cat)}
                    className={`p-2 rounded-xl text-left text-micro font-bold border transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-red-500/15 border-red-500 text-red-700 dark:text-red-300'
                        : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100'
                    }`}
                  >
                    <span className="text-sm">{config.icon}</span>
                    <span className="truncate">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Real-time Crowd Density Color-Coded Legend Overlay */}
        <div
          id="map-crowd-density-legend"
          className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/95 dark:bg-stone-900/95 backdrop-blur-md border border-stone-200 dark:border-stone-800 shadow-md text-micro font-bold select-none"
        >
          <span className="text-stone-500 pl-1 hidden xs:inline">Crowd:</span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Green (Low)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Yellow (Mod)</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-300 border border-red-500/30">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Red (High)</span>
          </span>
        </div>

        {/* Vector SVG Map */}
        <div
          className={`w-full h-full transition-colors duration-300 ${
            isDarkMode ? 'bg-[#181115]' : 'bg-[#F4EFE6]'
          }`}
          style={{ touchAction: 'none' }}
        >
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full select-none"
            style={{
              transform: `scale(${zoomLevel}) translate(${50 - mapCenter.x}%, ${50 - mapCenter.y}%)`,
              transformOrigin: 'center center',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* Background Grid Pattern */}
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke={isDarkMode ? '#3B1324' : '#E7DFD5'}
                  strokeWidth="0.3"
                />
              </pattern>
              <linearGradient id="riverGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="seaGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.5" />
              </linearGradient>
            </defs>

            <rect width="100" height="100" fill="url(#grid)" />

            {/* Kolkata Geography */}
            {activeCity === 'kolkata' && (
              <g id="kolkata-landmarks">
                {/* Hooghly River */}
                <path
                  d="M 28 0 C 26 20, 20 40, 18 65 C 16 80, 12 90, 8 100 L 0 100 L 0 0 Z"
                  fill="url(#riverGrad)"
                />
                <text x="6" y="45" fill="#0284C7" fontSize="2.8" fontStyle="italic" opacity="0.7">
                  Hooghly River (গঙ্গা)
                </text>
                <text x="6" y="22" fill="#0284C7" fontSize="2" opacity="0.6">
                  Bagbazar Ghat ⛵
                </text>

                {/* Major Roads */}
                <path
                  d="M 42 10 L 42 90"
                  stroke={isDarkMode ? '#522030' : '#D1C7B7'}
                  strokeWidth="1.2"
                  strokeDasharray="2 1"
                />
                <text x="44" y="55" fill={isDarkMode ? '#A8A29E' : '#78716C'} fontSize="2">
                  Central Avenue / CR Avenue
                </text>

                {/* VIP Road */}
                <path
                  d="M 45 20 C 60 22, 75 28, 90 32"
                  stroke={isDarkMode ? '#522030' : '#D1C7B7'}
                  strokeWidth="1.5"
                />
                <text x="70" y="24" fill={isDarkMode ? '#A8A29E' : '#78716C'} fontSize="2">
                  VIP Road (Lake Town)
                </text>

                {/* Gariahat / Rashbehari Avenue */}
                <path
                  d="M 20 70 L 80 70"
                  stroke={isDarkMode ? '#522030' : '#D1C7B7'}
                  strokeWidth="1.4"
                />
                <text x="56" y="68" fill={isDarkMode ? '#A8A29E' : '#78716C'} fontSize="2">
                  Rashbehari Ave / Gariahat
                </text>

                {/* Metro Blue Line Overlay */}
                {showMetroLines && (
                  <g id="metro-blue-line">
                    <path
                      d="M 42 12 L 42 42 L 38 60 L 36 85"
                      stroke="#2563EB"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                    <circle cx="42" cy="18" r="1.2" fill="#FFFFFF" stroke="#2563EB" strokeWidth="0.8" />
                    <text x="44" y="19" fill="#2563EB" fontSize="1.8" fontWeight="bold">Shyambazar</text>

                    <circle cx="42" cy="45" r="1.2" fill="#FFFFFF" stroke="#2563EB" strokeWidth="0.8" />
                    <text x="44" y="46" fill="#2563EB" fontSize="1.8" fontWeight="bold">Central / MG Rd</text>

                    <circle cx="38" cy="65" r="1.2" fill="#FFFFFF" stroke="#2563EB" strokeWidth="0.8" />
                    <text x="24" y="66" fill="#2563EB" fontSize="1.8" fontWeight="bold">Kalighat Metro</text>
                  </g>
                )}
              </g>
            )}

            {/* Contai Geography */}
            {activeCity === 'contai' && (
              <g id="contai-landmarks">
                <path
                  d="M 65 100 C 72 80, 80 65, 100 55 L 100 100 Z"
                  fill="url(#seaGrad)"
                />
                <text x="75" y="88" fill="#0284C7" fontSize="2.8" fontStyle="italic" opacity="0.8">
                  Bay of Bengal 🌊
                </text>

                <path
                  d="M 42 38 C 50 48, 60 58, 80 75"
                  stroke={isDarkMode ? '#522030' : '#D1C7B7'}
                  strokeWidth="1.5"
                />
                <text x="52" y="52" fill={isDarkMode ? '#A8A29E' : '#78716C'} fontSize="2">
                  Junput Coastal Road
                </text>

                <path
                  d="M 10 30 L 90 42"
                  stroke={isDarkMode ? '#522030' : '#D1C7B7'}
                  strokeWidth="1.6"
                />
                <text x="20" y="28" fill={isDarkMode ? '#A8A29E' : '#78716C'} fontSize="2">
                  NH-116B (Contai - Digha)
                </text>
              </g>
            )}

            {/* Active Anchor Pin */}
            {activeAnchor && (
              <g id="anchor-pin" className="animate-bounce">
                <circle
                  cx={activeAnchor.city === 'kolkata' ? 47 : 48}
                  cy={activeAnchor.city === 'kolkata' ? 17 : 44}
                  r="3.5"
                  fill="#991B1B"
                  stroke="#FDE68A"
                  strokeWidth="1.2"
                />
                <circle
                  cx={activeAnchor.city === 'kolkata' ? 47 : 48}
                  cy={activeAnchor.city === 'kolkata' ? 17 : 44}
                  r="1.2"
                  fill="#FFFDF9"
                />
              </g>
            )}

            {/* Connected Trip Polyline if Active Route exists */}
            {activeTripPandalIds.length > 1 && (
              <polyline
                points={displayedPandals
                  .filter((p) => activeTripPandalIds.includes(p.id))
                  .map((p) => `${p.coordinates.mapX},${p.coordinates.mapY}`)
                  .join(' ')}
                fill="none"
                stroke="#DC2626"
                strokeWidth="1.5"
                strokeDasharray="2.5 1.5"
                className="animate-pulse"
              />
            )}

            {/* Essential Places Layer Markers */}
            {displayedEssentialPlaces.map((place) => {
              const config = ESSENTIAL_CATEGORY_CONFIG[place.category];
              const isSelected = selectedEssentialPlace?.id === place.id;

              return (
                <g
                  key={place.id}
                  id={`place-pin-${place.id}`}
                  onClick={() => setSelectedEssentialPlace(place)}
                  className="cursor-pointer transition-transform duration-200 hover:scale-125"
                  style={{ transformOrigin: `${place.mapX}px ${place.mapY}px` }}
                >
                  <circle
                    cx={place.mapX}
                    cy={place.mapY}
                    r={isSelected ? 3.8 : 2.5}
                    fill={config.color}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? 1.2 : 0.6}
                    className="shadow-sm"
                  />
                  <text
                    x={place.mapX}
                    y={place.mapY + 0.9}
                    textAnchor="middle"
                    fontSize={isSelected ? '2.2' : '1.6'}
                  >
                    {config.icon}
                  </text>
                  {isSelected && (
                    <text
                      x={place.mapX}
                      y={place.mapY - 3.8}
                      textAnchor="middle"
                      fill={config.color}
                      fontSize="1.9"
                      fontWeight="bold"
                    >
                      {place.name.split(' ')[0]}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Suggested Central Meeting Point Pin on Map */}
            {suggestedMeetingPoint && (
              <g
                id="suggested-meeting-point-pin"
                className="cursor-pointer"
                onClick={() => {
                  setMapCenter({ x: suggestedMeetingPoint.mapX, y: suggestedMeetingPoint.mapY });
                  playKanshorBell(0.6);
                }}
              >
                <circle
                  cx={suggestedMeetingPoint.mapX}
                  cy={suggestedMeetingPoint.mapY}
                  r={6}
                  fill="#D97706"
                  opacity="0.25"
                  className="animate-ping"
                />
                <circle
                  cx={suggestedMeetingPoint.mapX}
                  cy={suggestedMeetingPoint.mapY}
                  r={3.6}
                  fill="#D97706"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />
                <text
                  x={suggestedMeetingPoint.mapX}
                  y={suggestedMeetingPoint.mapY + 1.2}
                  textAnchor="middle"
                  fontSize="2.4"
                >
                  🎯
                </text>
                <text
                  x={suggestedMeetingPoint.mapX}
                  y={suggestedMeetingPoint.mapY - 4.5}
                  textAnchor="middle"
                  fill="#D97706"
                  fontSize="1.9"
                  fontWeight="bold"
                >
                  Meeting Point
                </text>
              </g>
            )}

            {/* Interactive Pandal Pins */}
            {displayedPandals.map((pandal) => {
              const isSelected = pandal.id === activePandal?.id;
              const isMustVisit = pandal.recommendationLevel === 'Must Visit';
              const densityInfo = getCrowdDensityInfo(pandal);
              const pinColor = densityInfo.colorHex;

              return (
                <g
                  key={pandal.id}
                  onClick={() => {
                    setSelectedPandalId(pandal.id);
                    setSelectedEssentialPlace(null);
                  }}
                  className="cursor-pointer transition-transform duration-200"
                  style={{ transformOrigin: `${pandal.coordinates.mapX}px ${pandal.coordinates.mapY}px` }}
                >
                  {/* Pulsing ring for Selected or Must Visit */}
                  {(isMustVisit || isSelected) && (
                    <circle
                      cx={pandal.coordinates.mapX}
                      cy={pandal.coordinates.mapY}
                      r={isSelected ? 6 : 4}
                      fill={pinColor}
                      opacity="0.3"
                      className="animate-ping"
                    />
                  )}

                  {/* Outer Pin Body with Color-Coded Green/Yellow/Red Density */}
                  <circle
                    cx={pandal.coordinates.mapX}
                    cy={pandal.coordinates.mapY}
                    r={isSelected ? 4.6 : 3.4}
                    fill={pinColor}
                    stroke={isSelected ? '#FDE68A' : '#FFFFFF'}
                    strokeWidth={isSelected ? 1.4 : 0.9}
                    className="shadow-md"
                  />

                  {/* Inner Eye / Star Dot */}
                  <circle
                    cx={pandal.coordinates.mapX}
                    cy={pandal.coordinates.mapY}
                    r={isSelected ? 1.8 : 1.2}
                    fill="#FFFDF9"
                  />

                  {/* Traffic Light Mini Beacon Dot */}
                  <circle
                    cx={pandal.coordinates.mapX + (isSelected ? 3.4 : 2.5)}
                    cy={pandal.coordinates.mapY - (isSelected ? 3.4 : 2.5)}
                    r={isSelected ? 1.5 : 1.1}
                    fill={pinColor}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                  />

                  {/* Label text */}
                  <text
                    x={pandal.coordinates.mapX}
                    y={pandal.coordinates.mapY - 4.8}
                    textAnchor="middle"
                    fill={isDarkMode ? '#FEF08A' : '#78350F'}
                    fontSize={isSelected ? '2.8' : '2.1'}
                    fontWeight="bold"
                    className="drop-shadow-sm select-none"
                  >
                    {pandal.name.split(' ')[0]}
                  </text>
                </g>
              );
            })}

            {/* Real-time Group Member Pins on SVG Map (with SOS/Lost visual cues) */}
            {showFriendsOnMap &&
              activeFriendsOnMap.map((friend) => {
                const isMe = friend.userId === currentUser.id;
                const coords = latLngToMapCoordinates(friend.latitude, friend.longitude, activeCity);
                const avatar =
                  FESTIVE_AVATARS.find((a) => a.id === (friend.userAvatar || friend.profile?.avatarUrl)) ||
                  FESTIVE_AVATARS[0];

                const isFriendSOS = activeSOSAlerts.some((s) => s.userId === friend.userId);
                const isFriendLost = activeLostAlerts.some((l) => l.userId === friend.userId);

                return (
                  <g
                    key={`friend-pin-${friend.userId}`}
                    onClick={() => setSelectedFriend(friend)}
                    className="cursor-pointer transition-transform duration-300 hover:scale-125"
                    style={{ transformOrigin: `${coords.mapX}px ${coords.mapY}px` }}
                  >
                    {/* Pulsing halo ring */}
                    <circle
                      cx={coords.mapX}
                      cy={coords.mapY}
                      r={isFriendSOS ? 9 : isFriendLost ? 7.5 : isMe ? 6.5 : 5.5}
                      fill={isFriendSOS ? '#DC2626' : isFriendLost ? '#D97706' : isMe ? '#3B82F6' : '#10B981'}
                      opacity={isFriendSOS ? '0.6' : '0.35'}
                      className="animate-ping"
                    />

                    {/* Outer Circle Container */}
                    <circle
                      cx={coords.mapX}
                      cy={coords.mapY}
                      r={isMe ? 4.6 : 3.8}
                      fill={isFriendSOS ? '#DC2626' : isFriendLost ? '#D97706' : isMe ? '#2563EB' : '#059669'}
                      stroke={isFriendSOS ? '#FDE68A' : '#FFFFFF'}
                      strokeWidth={isFriendSOS ? 1.8 : 1.2}
                      className="shadow-lg"
                    />

                    {/* Emoji Icon */}
                    <text
                      x={coords.mapX}
                      y={coords.mapY + 1.2}
                      textAnchor="middle"
                      fontSize={isMe ? '2.8' : '2.3'}
                    >
                      {isFriendSOS ? '🚨' : isFriendLost ? '🧭' : avatar.emoji}
                    </text>

                    {/* Friend Name Label */}
                    <rect
                      x={coords.mapX - 8}
                      y={coords.mapY + 5}
                      width="16"
                      height="3.6"
                      rx="1.5"
                      fill={isDarkMode ? '#1C1418' : '#FFFFFF'}
                      stroke={
                        isFriendSOS
                          ? '#DC2626'
                          : isFriendLost
                          ? '#D97706'
                          : isMe
                          ? '#2563EB'
                          : friend.isStationary
                          ? '#0D9488'
                          : '#059669'
                      }
                      strokeWidth="0.5"
                      opacity="0.95"
                    />
                    <text
                      x={coords.mapX}
                      y={coords.mapY + 7.5}
                      textAnchor="middle"
                      fill={isFriendSOS ? '#DC2626' : isDarkMode ? '#FFFFFF' : '#1C1418'}
                      fontSize="1.8"
                      fontWeight="bold"
                    >
                      {isFriendSOS
                        ? '🆘 SOS'
                        : isFriendLost
                        ? 'LOST'
                        : isMe
                        ? 'YOU'
                        : `${friend.userName.split(' ')[0]}${friend.isStationary ? ' 💤' : ''}`}
                    </text>
                  </g>
                );
              })}
          </svg>
        </div>
      </div>

      {/* 2.1 Quick Squad Location Strip (Members with Distance, Status & SOS/Lost badge) */}
      {memberLocations.length > 0 && (
        <div
          className={`p-3 rounded-2xl border flex items-center justify-between gap-2 overflow-x-auto no-scrollbar transition-all ${
            isDarkMode ? 'bg-[#22161E] border-stone-800' : 'bg-stone-50 border-stone-200'
          }`}
        >
          <div className="flex items-center gap-1.5 shrink-0 text-micro font-bold text-stone-500">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Squad Radar:</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {memberLocations.map((m) => {
              const isMe = m.userId === currentUser.id;
              const isSharing = m.isSharing && m.status !== 'disabled';
              const isStationary = m.isStationary;
              const isSOS = activeSOSAlerts.some((s) => s.userId === m.userId);
              const isLost = activeLostAlerts.some((l) => l.userId === m.userId);

              const avatar =
                FESTIVE_AVATARS.find((a) => a.id === (m.userAvatar || m.profile?.avatarUrl)) ||
                FESTIVE_AVATARS[0];

              return (
                <button
                  key={`radar-${m.userId}`}
                  onClick={() => setSelectedFriend(m)}
                  className={`px-2.5 py-1.5 rounded-xl border text-micro font-bold flex items-center gap-1.5 transition-all ${
                    isSOS
                      ? 'bg-red-500 text-white border-red-600 animate-pulse'
                      : isLost
                      ? 'bg-amber-500 text-white border-amber-600'
                      : isMe
                      ? 'bg-blue-500/15 border-blue-500/30 text-blue-900 dark:text-blue-200'
                      : isSharing
                      ? isStationary
                        ? 'bg-teal-500/15 border-teal-500/30 text-teal-900 dark:text-teal-200 hover:scale-105'
                        : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 hover:scale-105'
                      : 'bg-stone-200/60 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 opacity-80'
                  }`}
                  title={`${m.userName} • ${
                    isSOS
                      ? '🚨 EMERGENCY SOS ACTIVE'
                      : isLost
                      ? '🧭 Marked as Separated/Lost'
                      : isSharing
                      ? isStationary
                        ? `Stationary in queue (${m.stationaryDurationMinutes || 5}m)`
                        : `${m.formattedDistance || 'Nearby'} (${m.direction})`
                      : 'Location Off'
                  }`}
                >
                  <span className="text-base">{avatar.emoji}</span>
                  <div className="text-left leading-tight">
                    <span className="block truncate max-w-[80px]">
                      {isMe ? 'You' : m.userName.split(' ')[0]}
                    </span>
                    <span className="text-[9px] block opacity-85">
                      {isSOS
                        ? '🆘 SOS'
                        : isLost
                        ? '🧭 Separated'
                        : isSharing
                        ? isStationary
                          ? `💤 Queue (${m.stationaryDurationMinutes || 5}m)`
                          : m.formattedDistance || 'Nearby'
                        : 'Off'}
                    </span>
                  </div>
                  {isSharing && !isSOS && !isLost && (
                    <span className={isStationary ? 'text-teal-600 font-bold' : 'text-emerald-600 font-bold'}>
                      {isStationary ? '💤' : '📍'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2.2 Selected Essential Place Details Popup Card */}
      {selectedEssentialPlace && (
        <div
          id="selected-essential-place-card"
          className={`p-4 rounded-3xl border shadow-lg transition-all animate-scaleUp ${
            isDarkMode
              ? 'bg-[#2A1C22] border-stone-700 text-white'
              : 'bg-white border-stone-200 text-stone-900'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
                style={{
                  backgroundColor: `${ESSENTIAL_CATEGORY_CONFIG[selectedEssentialPlace.category].color}20`,
                }}
              >
                {ESSENTIAL_CATEGORY_CONFIG[selectedEssentialPlace.category].icon}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-micro font-bold px-2 py-0.5 rounded-full text-white"
                    style={{
                      backgroundColor: ESSENTIAL_CATEGORY_CONFIG[selectedEssentialPlace.category].color,
                    }}
                  >
                    {ESSENTIAL_CATEGORY_CONFIG[selectedEssentialPlace.category].label}
                  </span>
                  {selectedEssentialPlace.is24Hours && (
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-micro font-bold">
                      24 Hours Open
                    </span>
                  )}
                </div>

                <h4 className="font-display font-bold text-h4 mt-1">
                  {selectedEssentialPlace.name}
                </h4>
                <p className="font-bengali text-small text-[#991B1B] dark:text-amber-300 font-medium">
                  {selectedEssentialPlace.bengaliName}
                </p>

                <p className="text-micro text-stone-500 dark:text-stone-400 mt-1">
                  📍 {selectedEssentialPlace.address}
                </p>
                {selectedEssentialPlace.landmark && (
                  <p className="text-micro text-stone-600 dark:text-stone-300 font-medium">
                    Landmark: {selectedEssentialPlace.landmark}
                  </p>
                )}
                {selectedEssentialPlace.details && (
                  <p className="text-micro opacity-85 mt-0.5">
                    {selectedEssentialPlace.details}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
              <button
                onClick={() => setSelectedEssentialPlace(null)}
                className="self-end p-1 text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>

              {selectedEssentialPlace.phone && (
                <a
                  href={`tel:${selectedEssentialPlace.phone}`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-micro flex items-center justify-center gap-1 shadow-sm"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>
              )}

              <button
                onClick={() =>
                  handleNavigateToCoords(
                    selectedEssentialPlace.latitude,
                    selectedEssentialPlace.longitude
                  )
                }
                className="px-3.5 py-2 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-small flex items-center gap-1 shadow-sm"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Bottom Card for Selected Pandal with Live Proximity & Bearing */}
      {activePandal && (
        <div
          id="map-pandal-sheet"
          className={`p-3.5 rounded-3xl border shadow-lg transition-all ${
            isDarkMode
              ? 'bg-[#281B23] border-[#F59E0B]/30 text-white'
              : 'bg-white border-[#D97706]/30 text-stone-900'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            {/* Image Thumbnail */}
            <div
              onClick={() => onSelectPandal(activePandal)}
              className="w-18 h-18 rounded-2xl overflow-hidden shrink-0 relative shadow-md cursor-pointer group"
            >
              <img
                src={activePandal.heroImage}
                alt={activePandal.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                referrerPolicy="no-referrer"
              />
              <span className="absolute bottom-1 left-1 text-micro font-bold text-white bg-black/70 px-1 rounded tabular-nums">
                ⭐ {activePandal.overallQualityScore.toFixed(1)}
              </span>
            </div>

            {/* Middle Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`text-micro font-bold px-2 py-0.5 rounded-full ${
                    activePandal.recommendationLevel === 'Must Visit'
                      ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                      : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  }`}
                >
                  {activePandal.recommendationLevel}
                </span>

                {/* Proximity & Direction to active Anchor */}
                {activePandalRank && (
                  <span className="text-micro font-bold text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full tabular-nums flex items-center gap-1">
                    <span>{activePandalRank.arrowIcon}</span>
                    <span>{activePandalRank.direction}</span>
                    <span className="text-stone-400">•</span>
                    <span>{activePandalRank.formattedStraightDistance}</span>
                  </span>
                )}
              </div>

              <h4
                onClick={() => onSelectPandal(activePandal)}
                className="font-display font-bold text-h4 text-stone-900 dark:text-white truncate mt-0.5 cursor-pointer hover:text-[#DC2626]"
              >
                {activePandal.name}
              </h4>
              <p className="font-bengali-serif text-small text-[#DC2626] font-bold truncate">
                {activePandal.bengaliName}
              </p>

              {/* Transit / Walking badge */}
              {activePandalRank && (
                <div className="text-micro text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-1">
                  <span>🚶 Est. Walk: ~{activePandalRank.estimatedWalkingMinutes} mins ({activePandalRank.formattedWalkingDistance})</span>
                  <span>•</span>
                  <span className="text-amber-600 font-semibold">{activePandal.queueWaitMinutes}m wait</span>
                </div>
              )}
            </div>

            {/* View Button */}
            <button
              onClick={() => onSelectPandal(activePandal)}
              className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white font-bold text-btn shadow-md flex items-center gap-1 hover:brightness-110 active:scale-95 transition-all shrink-0 self-center"
            >
              <span>View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Color-Coded Green/Yellow/Red Crowd Density Indicator for Selected Pandal */}
          <CrowdDensityVisualIndicator
            pandal={activePandal}
            variant="compact"
            isDarkMode={isDarkMode}
            className="mt-2.5"
          />
        </div>
      )}

      {/* 4. Ranked "Nearby Worthwhile Pandals" Drawer Panel */}
      <section
        id="nearby-worthwhile-section"
        className={`p-4 rounded-3xl border shadow-sm space-y-3 ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/25 text-white'
            : 'bg-white border-[#D97706]/25 text-stone-900'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D97706]" />
            <div>
              <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                Nearby Worthwhile Pandals
              </h3>
              <p className="text-micro text-stone-500 font-medium">
                Ranked for quality & proximity from <strong>{activeAnchor?.name.split('(')[0]}</strong>
              </p>
            </div>
          </div>

          {/* Sort selection */}
          <div className="flex items-center gap-1 text-micro">
            <span className="text-stone-400 hidden sm:inline">Sort:</span>
            <select
              value={rankingSortBy}
              onChange={(e) => setRankingSortBy(e.target.value as any)}
              className={`px-2 py-1 rounded-lg border text-micro font-bold focus:outline-none ${
                isDarkMode ? 'bg-[#3B1324] border-stone-700 text-white' : 'bg-stone-50 border-stone-200 text-stone-800'
              }`}
            >
              <option value="worth_score">Worth Score 🏆</option>
              <option value="distance">Nearest Distance 📍</option>
              <option value="overall_quality">Highest Quality ⭐</option>
            </select>
          </div>
        </div>

        {/* Ranked List */}
        <div className="space-y-2">
          {nearbyRankings.slice(0, 5).map((rankResult, idx) => {
            const isTarget = rankResult.pandal.id === activePandal?.id;

            return (
              <div
                key={rankResult.pandal.id}
                onClick={() => setSelectedPandalId(rankResult.pandal.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isTarget
                    ? 'border-[#DC2626] bg-[#DC2626]/10 shadow-sm'
                    : isDarkMode
                    ? 'border-stone-800 bg-[#1C1418] hover:bg-[#3B1324]/60'
                    : 'border-stone-100 bg-stone-50 hover:bg-[#FEF3C7]/50'
                }`}
              >
                {/* Rank Number + Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-btn shrink-0 tabular-nums ${
                      idx === 0
                        ? 'bg-[#DC2626] text-white shadow-sm'
                        : idx === 1
                        ? 'bg-[#D97706] text-white'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    #{idx + 1}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-micro font-bold px-1.5 py-0.2 rounded ${
                          rankResult.recommendationLevel === 'Must Visit'
                            ? 'bg-red-500/20 text-red-600 dark:text-red-400 font-bold'
                            : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {rankResult.recommendationLevel}
                      </span>
                      <span className="text-micro text-stone-400 font-medium truncate">
                        • {rankResult.pandal.area}
                      </span>
                    </div>

                    <h4 className="font-display font-bold text-small text-stone-900 dark:text-white truncate">
                      {rankResult.pandal.name}
                    </h4>
                    <p className="text-micro text-stone-500 dark:text-stone-400 flex items-center gap-1.5 tabular-nums">
                      <span>{rankResult.arrowIcon} {rankResult.direction}</span>
                      <span>•</span>
                      <span>{rankResult.formattedStraightDistance}</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        ~{rankResult.estimatedWalkingMinutes}m walk
                      </span>
                    </p>
                  </div>
                </div>

                {/* Worth Score & Crowd Density Indicator Badge */}
                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <CrowdDensityVisualIndicator
                    pandal={rankResult.pandal}
                    variant="badge"
                    isDarkMode={isDarkMode}
                  />
                  <div className="text-small font-black text-[#991B1B] dark:text-[#FEF08A] tabular-nums">
                    ⭐ {rankResult.pandal.overallQualityScore.toFixed(1)}
                  </div>
                  <span className="text-[10px] font-bold text-stone-400 block tabular-nums">
                    Score {rankResult.worthScore}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demo Notice */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-micro text-stone-500">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3 text-stone-400" />
            <span>Sample calculation based on composite quality & urban walking model</span>
          </span>
          <button
            onClick={() => onSelectPandal(activePandal)}
            className="text-[#DC2626] font-bold hover:underline"
          >
            Explore Pandal Details →
          </button>
        </div>
      </section>

      {/* Safety & Utilities Modals */}
      <SOSModal
        isOpen={isSOSModalOpen}
        onClose={() => setIsSOSModalOpen(false)}
        tripId={activeTripId}
        activeCity={activeCity}
        pandals={cityPandals}
        userPrefs={userPrefs}
        onOpenEmergencyNumbers={() => setIsEmergencyInfoOpen(true)}
        onNavigateToCoords={handleNavigateToCoords}
      />

      <LostGroupModal
        isOpen={isLostModalOpen}
        onClose={() => setIsLostModalOpen(false)}
        tripId={activeTripId}
        activeCity={activeCity}
        pandals={cityPandals}
        userPrefs={userPrefs}
        onNavigateToPoint={handleNavigateToCoords}
      />

      <EmergencyInformationModal
        isOpen={isEmergencyInfoOpen}
        onClose={() => setIsEmergencyInfoOpen(false)}
        activeCity={activeCity}
        userPrefs={userPrefs}
      />

      {/* Friend Detail Modal */}
      {selectedFriend && (
        <FriendDetailModal
          memberLocation={selectedFriend}
          totalTripPandals={cityPandals.length}
          visitedPandalsCount={5}
          onFindFriend={handleFindFriend}
          onClose={() => setSelectedFriend(null)}
          userPrefs={userPrefs}
        />
      )}
    </div>
  );
};
