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
import { handleImageError } from '../../utils/imageFallback';
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
  Check,
  Plus,
} from 'lucide-react';

interface MapScreenProps {
  activeCity: CityId;
  pandals: Pandal[];
  activeTripPandalIds: string[];
  onSelectPandal: (pandal: Pandal) => void;
  onToggleTripPandal?: (id: string) => void;
  userPrefs: UserPreferences;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  activeCity,
  pandals,
  activeTripPandalIds,
  onSelectPandal,
  onToggleTripPandal,
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

  // Selected Pandal state
  const [selectedPandalId, setSelectedPandalId] = useState<string>(cityPandals[0]?.id || '');
  const [showPandalSheet, setShowPandalSheet] = useState<boolean>(true);

  // Layer toggles
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

  // Smart Collision Avoidance & Micro-Offset
  const positionedPandals = useMemo(() => {
    const placed: Array<{
      pandal: Pandal;
      x: number;
      y: number;
      isMustVisit: boolean;
      isInRoute: boolean;
      routeIndex: number;
    }> = [];

    displayedPandals.forEach((pandal, idx) => {
      let x = pandal.coordinates.mapX;
      let y = pandal.coordinates.mapY;
      const isMustVisit = pandal.recommendationLevel === 'Must Visit';
      const routeIndex = activeTripPandalIds.indexOf(pandal.id);
      const isInRoute = routeIndex !== -1;

      // Detect collisions with previously positioned pandals
      for (let i = 0; i < placed.length; i++) {
        const prev = placed[i];
        const dist = Math.hypot(x - prev.x, y - prev.y);
        if (dist < 3.8) {
          // Micro-offset radially
          const angle = (idx + 1) * 1.57;
          x += Math.cos(angle) * 2.4;
          y += Math.sin(angle) * 2.4;
          break;
        }
      }

      placed.push({ pandal, x, y, isMustVisit, isInRoute, routeIndex });
    });

    return placed;
  }, [displayedPandals, activeTripPandalIds]);

  // Active squad members with valid live GPS
  const activeFriendsOnMap = useMemo(() => {
    return memberLocations.filter(
      (m) => m.isSharing && m.status !== 'disabled' && m.latitude !== 0 && m.longitude !== 0
    );
  }, [memberLocations]);

  // Route directional segments
  const routeSegments = useMemo(() => {
    const routePandals = activeTripPandalIds
      .map((id) => cityPandals.find((p) => p.id === id))
      .filter(Boolean) as Pandal[];

    if (routePandals.length < 2) return [];

    const segments: Array<{
      fromX: number;
      fromY: number;
      toX: number;
      toY: number;
      midX: number;
      midY: number;
      angleDeg: number;
      index: number;
    }> = [];

    for (let i = 0; i < routePandals.length - 1; i++) {
      const from = routePandals[i].coordinates;
      const to = routePandals[i + 1].coordinates;
      const midX = (from.mapX + to.mapX) / 2;
      const midY = (from.mapY + to.mapY) / 2;
      const angleDeg = (Math.atan2(to.mapY - from.mapY, to.mapX - from.mapX) * 180) / Math.PI;

      segments.push({
        fromX: from.mapX,
        fromY: from.mapY,
        toX: to.mapX,
        toY: to.mapY,
        midX,
        midY,
        angleDeg,
        index: i,
      });
    }

    return segments;
  }, [activeTripPandalIds, cityPandals]);

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
    setZoomLevel(1.35);
    playKanshorBell(0.6);
  };

  // Recenter on active route bounds
  const handleRecenterRoute = () => {
    const routePandals = cityPandals.filter((p) => activeTripPandalIds.includes(p.id));
    if (routePandals.length > 0) {
      const avgX = routePandals.reduce((sum, p) => sum + p.coordinates.mapX, 0) / routePandals.length;
      const avgY = routePandals.reduce((sum, p) => sum + p.coordinates.mapY, 0) / routePandals.length;
      setMapCenter({ x: avgX, y: avgY });
      setZoomLevel(1.15);
      playKanshorBell(0.5);
    } else {
      setMapCenter({ x: 50, y: 50 });
      setZoomLevel(1);
    }
  };

  // Center on user's current GPS location
  const handleCenterMyLocation = () => {
    const myLoc = memberLocations.find((l) => l.isCurrentUser && l.latitude !== 0);
    if (myLoc && myLoc.latitude && myLoc.longitude) {
      const coords = latLngToMapCoordinates(myLoc.latitude, myLoc.longitude, activeCity);
      setMapCenter({ x: coords.mapX, y: coords.mapY });
      setZoomLevel(1.35);
      playKanshorBell(0.6);
    } else if (activeAnchor) {
      const anchorX = activeAnchor.city === 'kolkata' ? 47 : 48;
      const anchorY = activeAnchor.city === 'kolkata' ? 17 : 44;
      setMapCenter({ x: anchorX, y: anchorY });
      setZoomLevel(1.2);
      playKanshorBell(0.5);
    }
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

  // Label display logic with smart hierarchy
  const shouldRenderLabel = (item: {
    pandal: Pandal;
    isMustVisit: boolean;
    isInRoute: boolean;
  }) => {
    const isSelected = item.pandal.id === activePandal?.id;
    if (isSelected) return true;
    if (zoomLevel >= 1.25) return true;
    if (item.isInRoute && zoomLevel >= 0.95) return true;
    if (item.isMustVisit && zoomLevel >= 0.85) return true;
    return false;
  };

  const isCurrentPandalInRoute = activePandal ? activeTripPandalIds.includes(activePandal.id) : false;

  return (
    <div id="interactive-map-screen" className="relative flex flex-col min-h-[620px] pb-24 animate-fadeIn space-y-3">
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

      {/* 1. Compact Anchor / Reference Point Bar */}
      <div
        className={`px-3 py-2 rounded-2xl border shadow-xs flex items-center justify-between gap-2.5 transition-all ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/25 text-white'
            : 'bg-white border-amber-900/15 text-stone-900'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 shrink-0">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-amber-200 flex items-center justify-center shrink-0 shadow-xs">
            <Crosshair className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-stone-500 font-bold uppercase tracking-wider">
                Anchor:
              </span>
              <span className="font-display font-black text-small text-[#881337] dark:text-[#FEF08A] truncate">
                {activeAnchor.name}
              </span>
              <span className="font-bengali text-micro text-[#DC2626] font-bold hidden xs:inline">
                ({activeAnchor.bengaliName})
              </span>
            </div>
          </div>
        </div>

        {/* Quick Horizontal Scrollable Anchor Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {cityAnchors.map((anchor) => {
            const isSelected = anchor.id === selectedAnchorId;
            return (
              <button
                key={anchor.id}
                onClick={() => setSelectedAnchorId(anchor.id)}
                className={`px-2.5 py-1 rounded-xl text-micro font-bold transition-all whitespace-nowrap shrink-0 ${
                  isSelected
                    ? 'bg-[#991B1B] text-amber-100 shadow-xs font-black'
                    : isDarkMode
                    ? 'bg-stone-800/80 text-stone-300 hover:bg-stone-700'
                    : 'bg-stone-100 text-stone-700 hover:bg-amber-100/70'
                }`}
              >
                {anchor.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Interactive Premium Map Canvas */}
      <div
        id="svg-map-canvas-container"
        className={`relative w-full h-[470px] sm:h-[530px] rounded-3xl overflow-hidden border shadow-md transition-colors duration-300 select-none ${
          isDarkMode ? 'border-stone-800 bg-[#140F13]' : 'border-stone-200 bg-[#FAF7F2]'
        }`}
      >
        {/* Floating Top Filters Bar (Horizontally scrollable, compact) */}
        <div className="absolute top-3 left-3 right-16 z-20 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-1.5 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-sm overflow-x-auto no-scrollbar">
            <button
              onClick={() => setMapFilter('all')}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold transition-all whitespace-nowrap shrink-0 ${
                mapFilter === 'all'
                  ? 'bg-[#991B1B] text-white shadow-xs'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              All ({cityPandals.length})
            </button>
            <button
              onClick={() => setMapFilter('must_visit')}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
                mapFilter === 'must_visit'
                  ? 'bg-[#991B1B] text-white shadow-xs'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Award className="w-3 h-3 text-amber-400" />
              <span>Must Visit</span>
            </button>
            <button
              onClick={() => setMapFilter('low_queue')}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold transition-all whitespace-nowrap shrink-0 ${
                mapFilter === 'low_queue'
                  ? 'bg-[#991B1B] text-white shadow-xs'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              ⚡ Fast Queue
            </button>

            {/* Utilities Filter Toggle */}
            <button
              onClick={() => setShowEssentialLayersMenu(!showEssentialLayersMenu)}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold flex items-center gap-1 whitespace-nowrap shrink-0 transition-all ${
                activeEssentialCategories.length > 0
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Utilities ({activeEssentialCategories.length})</span>
            </button>

            {/* Squad Friends Toggle */}
            <button
              onClick={() => setShowFriendsOnMap(!showFriendsOnMap)}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold flex items-center gap-1 whitespace-nowrap shrink-0 transition-all ${
                showFriendsOnMap
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              <Users className="w-3 h-3" />
              <span>Squad ({activeFriendsOnMap.length})</span>
            </button>

            {/* Metro Toggle (Kolkata Only) */}
            {activeCity === 'kolkata' && (
              <button
                onClick={() => setShowMetroLines(!showMetroLines)}
                className={`px-2.5 py-1 rounded-xl text-micro font-bold flex items-center gap-1 whitespace-nowrap shrink-0 transition-all ${
                  showMetroLines
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Train className="w-3 h-3" />
                <span>Metro</span>
              </button>
            )}
          </div>
        </div>

        {/* Floating Right-Side Controls Stack (My Location, Zoom, Recenter, Layers) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
          <button
            onClick={handleCenterMyLocation}
            className="w-9 h-9 rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-md border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            title="My Location / Anchor"
          >
            <LocateFixed className="w-4 h-4 text-[#DC2626]" />
          </button>

          <button
            onClick={handleRecenterRoute}
            className="w-9 h-9 rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-md border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            title="Recenter Route"
          >
            <Navigation className="w-4 h-4 text-amber-600" />
          </button>

          <button
            onClick={() => setZoomLevel((z) => Math.min(1.8, Math.round((z + 0.2) * 100) / 100))}
            className="w-9 h-9 rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-md border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setZoomLevel((z) => Math.max(0.8, Math.round((z - 0.2) * 100) / 100))}
            className="w-9 h-9 rounded-full bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-md border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-200 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
        </div>

        {/* Essential Layers Selector Dropdown Menu */}
        {showEssentialLayersMenu && (
          <div
            id="essential-places-category-popover"
            className="absolute top-14 left-3 right-3 sm:right-auto sm:w-80 z-30 p-3.5 rounded-2xl bg-white/98 dark:bg-stone-900/98 backdrop-blur-md border border-stone-200 dark:border-stone-700 shadow-xl space-y-2.5 animate-scaleUp"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100 dark:border-stone-800">
              <span className="font-display font-bold text-small text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Utility & Safety Layers</span>
              </span>
              <button
                onClick={() => setShowEssentialLayersMenu(false)}
                className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto no-scrollbar">
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
                    className={`p-2 rounded-xl text-micro font-bold flex items-center gap-2 border transition-all text-left ${
                      isActive
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-200'
                        : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200/60 dark:border-stone-700/60 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    <span className="text-base">{config.icon}</span>
                    <span className="truncate">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Clean Vector SVG Map */}
        <div
          className="w-full h-full cursor-grab active:cursor-grabbing"
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
            <defs>
              {/* Soft Grid Pattern for Real Map Texture */}
              <pattern id="city-grid" width="12" height="12" patternUnits="userSpaceOnUse">
                <rect width="12" height="12" fill={isDarkMode ? '#171116' : '#FBF9F5'} />
                <path
                  d="M 12 0 L 0 0 0 12"
                  fill="none"
                  stroke={isDarkMode ? '#231821' : '#F1ECE3'}
                  strokeWidth="0.4"
                />
              </pattern>

              {/* Natural River Gradient */}
              <linearGradient id="hooghlyWater" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={isDarkMode ? '#0369A1' : '#BAE6FD'} stopOpacity={isDarkMode ? '0.7' : '0.85'} />
                <stop offset="100%" stopColor={isDarkMode ? '#0284C7' : '#7DD3FC'} stopOpacity={isDarkMode ? '0.8' : '0.95'} />
              </linearGradient>

              {/* Natural Sea Gradient */}
              <linearGradient id="contaiSea" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={isDarkMode ? '#0284C7' : '#7DD3FC'} stopOpacity="0.75" />
                <stop offset="100%" stopColor={isDarkMode ? '#0369A1' : '#38BDF8'} stopOpacity="0.9" />
              </linearGradient>

              {/* Directional Chevron Marker for Route */}
              <marker
                id="route-arrow"
                viewBox="0 0 10 10"
                refX="5"
                refY="5"
                markerWidth="3.5"
                markerHeight="3.5"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#DC2626" />
              </marker>
            </defs>

            {/* Base Background */}
            <rect width="100" height="100" fill="url(#city-grid)" />

            {/* Kolkata Real Geography & Soft Roads */}
            {activeCity === 'kolkata' && (
              <g id="kolkata-base-geography">
                {/* Hooghly River Curving Flow */}
                <path
                  d="M 28 0 C 26 22, 19 42, 18 64 C 17 80, 13 90, 8 100 L 0 100 L 0 0 Z"
                  fill="url(#hooghlyWater)"
                  stroke={isDarkMode ? '#0284C7' : '#93C5FD'}
                  strokeWidth="0.5"
                />
                <text
                  x="5"
                  y="46"
                  fill={isDarkMode ? '#38BDF8' : '#0284C7'}
                  fontSize="2.2"
                  fontStyle="italic"
                  opacity="0.85"
                  fontWeight="bold"
                >
                  Hooghly River (গঙ্গা)
                </text>
                <text
                  x="5"
                  y="20"
                  fill={isDarkMode ? '#7DD3FC' : '#0369A1'}
                  fontSize="1.6"
                  opacity="0.75"
                >
                  Bagbazar Ghat ⛵
                </text>

                {/* Major Arteries - Clean Highway Casing & Fill */}
                {/* Central Avenue / Chittaranjan Ave */}
                <path d="M 42 6 L 42 94" stroke={isDarkMode ? '#2F1B27' : '#FFFFFF'} strokeWidth="2.0" strokeLinecap="round" />
                <path d="M 42 6 L 42 94" stroke={isDarkMode ? '#4A1D33' : '#E2D9CC'} strokeWidth="1.2" strokeLinecap="round" />
                <text x="44" y="52" fill={isDarkMode ? '#9CA3AF' : '#8A8175'} fontSize="1.5" fontWeight="500">
                  Central Avenue
                </text>

                {/* VIP Road / Ultadanga / Lake Town */}
                <path d="M 45 18 C 60 21, 74 27, 94 32" stroke={isDarkMode ? '#2F1B27' : '#FFFFFF'} strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 45 18 C 60 21, 74 27, 94 32" stroke={isDarkMode ? '#4A1D33' : '#E2D9CC'} strokeWidth="1.3" strokeLinecap="round" />
                <text x="68" y="23" fill={isDarkMode ? '#9CA3AF' : '#8A8175'} fontSize="1.5" fontWeight="500">
                  VIP Road • Lake Town
                </text>

                {/* Rashbehari Avenue / Gariahat */}
                <path d="M 18 69 L 85 69" stroke={isDarkMode ? '#2F1B27' : '#FFFFFF'} strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 18 69 L 85 69" stroke={isDarkMode ? '#4A1D33' : '#E2D9CC'} strokeWidth="1.3" strokeLinecap="round" />
                <text x="56" y="67" fill={isDarkMode ? '#9CA3AF' : '#8A8175'} fontSize="1.5" fontWeight="500">
                  Rashbehari Ave • Gariahat
                </text>

                {/* Shyambazar Five-Point Junction Marker */}
                <circle cx="42" cy="18" r="1.4" fill={isDarkMode ? '#374151' : '#E5E7EB'} stroke="#9CA3AF" strokeWidth="0.4" />
                <text x="44" y="16.5" fill={isDarkMode ? '#D1D5DB' : '#6B7280'} fontSize="1.4">
                  Shyambazar 5-Point
                </text>

                {/* Metro Blue Line (Transit Layer) */}
                {showMetroLines && (
                  <g id="metro-blue-line-layer">
                    {/* Outer Casing */}
                    <path
                      d="M 42 10 L 42 42 L 38 60 L 36 86"
                      stroke="#FFFFFF"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      opacity={isDarkMode ? '0.2' : '0.8'}
                    />
                    {/* Blue Core Track */}
                    <path
                      d="M 42 10 L 42 42 L 38 60 L 36 86"
                      stroke="#2563EB"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                    />
                    {/* Station Nodes */}
                    <circle cx="42" cy="18" r="1.0" fill="#FFFFFF" stroke="#2563EB" strokeWidth="0.6" />
                    <circle cx="42" cy="46" r="1.0" fill="#FFFFFF" stroke="#2563EB" strokeWidth="0.6" />
                    <circle cx="38" cy="65" r="1.0" fill="#FFFFFF" stroke="#2563EB" strokeWidth="0.6" />
                    <text x="25" y="66" fill="#2563EB" fontSize="1.5" fontWeight="bold">
                      Kalighat Metro
                    </text>
                  </g>
                )}
              </g>
            )}

            {/* Contai Real Geography & Coastline */}
            {activeCity === 'contai' && (
              <g id="contai-base-geography">
                {/* Bay of Bengal Coastline */}
                <path
                  d="M 64 100 C 72 82, 80 66, 100 54 L 100 100 Z"
                  fill="url(#contaiSea)"
                  stroke={isDarkMode ? '#0284C7' : '#7DD3FC'}
                  strokeWidth="0.6"
                />
                <text
                  x="74"
                  y="86"
                  fill={isDarkMode ? '#38BDF8' : '#0284C7'}
                  fontSize="2.4"
                  fontStyle="italic"
                  fontWeight="bold"
                  opacity="0.85"
                >
                  Bay of Bengal 🌊
                </text>

                {/* Major Highways */}
                {/* Junput Coastal Road */}
                <path d="M 42 38 C 50 48, 60 58, 80 75" stroke={isDarkMode ? '#2F1B27' : '#FFFFFF'} strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 42 38 C 50 48, 60 58, 80 75" stroke={isDarkMode ? '#4A1D33' : '#E2D9CC'} strokeWidth="1.3" strokeLinecap="round" />
                <text x="52" y="52" fill={isDarkMode ? '#9CA3AF' : '#8A8175'} fontSize="1.5" fontWeight="500">
                  Junput Coastal Road
                </text>

                {/* NH-116B (Contai - Digha Highway) */}
                <path d="M 12 30 L 92 42" stroke={isDarkMode ? '#2F1B27' : '#FFFFFF'} strokeWidth="2.4" strokeLinecap="round" />
                <path d="M 12 30 L 92 42" stroke={isDarkMode ? '#4A1D33' : '#E2D9CC'} strokeWidth="1.4" strokeLinecap="round" />
                <text x="20" y="27" fill={isDarkMode ? '#9CA3AF' : '#8A8175'} fontSize="1.5" fontWeight="500">
                  NH-116B (Contai - Digha)
                </text>

                {/* Contai Central Bus Stand Hub */}
                <circle cx="42" cy="38" r="1.4" fill={isDarkMode ? '#374151' : '#E5E7EB'} stroke="#9CA3AF" strokeWidth="0.4" />
                <text x="44" y="37" fill={isDarkMode ? '#D1D5DB' : '#6B7280'} fontSize="1.4">
                  Town Bus Hub
                </text>
              </g>
            )}

            {/* Active Anchor Pin (Pulsing Center Marker) */}
            {activeAnchor && (
              <g id="anchor-pin" className="transition-all duration-300">
                <circle
                  cx={activeAnchor.city === 'kolkata' ? 47 : 48}
                  cy={activeAnchor.city === 'kolkata' ? 17 : 44}
                  r="4.2"
                  fill="#991B1B"
                  opacity="0.18"
                  className="animate-ping"
                />
                <circle
                  cx={activeAnchor.city === 'kolkata' ? 47 : 48}
                  cy={activeAnchor.city === 'kolkata' ? 17 : 44}
                  r="2.6"
                  fill="#991B1B"
                  stroke="#FEF08A"
                  strokeWidth="0.9"
                />
                <circle
                  cx={activeAnchor.city === 'kolkata' ? 47 : 48}
                  cy={activeAnchor.city === 'kolkata' ? 17 : 44}
                  r="1.0"
                  fill="#FFFFFF"
                />
              </g>
            )}

            {/* Active Route Polyline with Casing & Flow Direction */}
            {routeSegments.length > 0 && (
              <g id="active-route-trail">
                {/* 1. Outer contrast casing to prevent road/water clashes */}
                {routeSegments.map((seg, idx) => (
                  <line
                    key={`casing-${idx}`}
                    x1={seg.fromX}
                    y1={seg.fromY}
                    x2={seg.toX}
                    y2={seg.toY}
                    stroke={isDarkMode ? '#1C1418' : '#FFFFFF'}
                    strokeWidth="3.4"
                    strokeLinecap="round"
                  />
                ))}

                {/* 2. Core Route Path Line */}
                {routeSegments.map((seg, idx) => (
                  <line
                    key={`core-${idx}`}
                    x1={seg.fromX}
                    y1={seg.fromY}
                    x2={seg.toX}
                    y2={seg.toY}
                    stroke="#DC2626"
                    strokeWidth="1.9"
                    strokeLinecap="round"
                    strokeDasharray="4 1"
                  />
                ))}

                {/* 3. Directional Chevrons along Route */}
                {routeSegments.map((seg, idx) => (
                  <g
                    key={`arrow-${idx}`}
                    transform={`translate(${seg.midX}, ${seg.midY}) rotate(${seg.angleDeg})`}
                  >
                    <path
                      d="M -1.2 -1.0 L 1.2 0 L -1.2 1.0 Z"
                      fill="#DC2626"
                      stroke="#FFFFFF"
                      strokeWidth="0.3"
                    />
                  </g>
                ))}
              </g>
            )}

            {/* Essential Utility Places Markers (Secondary Icons) */}
            {displayedEssentialPlaces.map((place) => {
              const config = ESSENTIAL_CATEGORY_CONFIG[place.category];
              const isSelected = selectedEssentialPlace?.id === place.id;

              return (
                <g
                  key={place.id}
                  onClick={() => {
                    setSelectedEssentialPlace(place);
                    setSelectedPandalId('');
                  }}
                  className="cursor-pointer transition-transform duration-200 hover:scale-125"
                  style={{ transformOrigin: `${place.mapX}px ${place.mapY}px` }}
                >
                  <circle
                    cx={place.mapX}
                    cy={place.mapY}
                    r={isSelected ? 3.0 : 1.9}
                    fill={config.color}
                    stroke="#FFFFFF"
                    strokeWidth={isSelected ? 1.0 : 0.5}
                    className="shadow-xs"
                  />
                  <text
                    x={place.mapX}
                    y={place.mapY + 0.7}
                    textAnchor="middle"
                    fontSize={isSelected ? '2.0' : '1.3'}
                  >
                    {config.icon}
                  </text>
                  {isSelected && (
                    <g>
                      <rect
                        x={place.mapX - 9}
                        y={place.mapY - 4.8}
                        width="18"
                        height="3.0"
                        rx="1.0"
                        fill={isDarkMode ? '#1E171D' : '#FFFFFF'}
                        stroke={config.color}
                        strokeWidth="0.4"
                      />
                      <text
                        x={place.mapX}
                        y={place.mapY - 2.8}
                        textAnchor="middle"
                        fill={config.color}
                        fontSize="1.6"
                        fontWeight="bold"
                      >
                        {place.name.split(' ')[0]}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Suggested Central Meeting Point Pin */}
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
                  r={5.0}
                  fill="#D97706"
                  opacity="0.2"
                  className="animate-ping"
                />
                <circle
                  cx={suggestedMeetingPoint.mapX}
                  cy={suggestedMeetingPoint.mapY}
                  r={2.8}
                  fill="#D97706"
                  stroke="#FFFFFF"
                  strokeWidth="0.8"
                />
                <text
                  x={suggestedMeetingPoint.mapX}
                  y={suggestedMeetingPoint.mapY + 1.0}
                  textAnchor="middle"
                  fontSize="1.8"
                >
                  🎯
                </text>
              </g>
            )}

            {/* Pandal Markers with Distinct Hierarchy & Collision Avoidance */}
            {positionedPandals.map(({ pandal, x, y, isMustVisit, isInRoute, routeIndex }) => {
              const isSelected = pandal.id === activePandal?.id;
              const recLevel = pandal.recommendationLevel;

              // Marker hierarchy styling
              let pinBg = '#64748B'; // default
              let pinBorder = '#FFFFFF';
              let pinRadius = 2.4;
              let iconChar = '•';

              if (recLevel === 'Must Visit') {
                pinBg = '#991B1B'; // PujaTrip royal crimson
                pinBorder = isSelected ? '#FDE68A' : '#FEF08A';
                pinRadius = isSelected ? 3.6 : 3.0;
                iconChar = '✦';
              } else if (recLevel === 'Highly Recommended') {
                pinBg = '#D97706'; // warm gold
                pinBorder = isSelected ? '#FDE68A' : '#FFFFFF';
                pinRadius = isSelected ? 3.3 : 2.7;
                iconChar = '★';
              } else if (recLevel === 'Good') {
                pinBg = '#059669'; // emerald
                pinBorder = '#FFFFFF';
                pinRadius = isSelected ? 3.0 : 2.4;
                iconChar = '✓';
              }

              // Route stops show sequence number
              const stopNumber = isInRoute ? routeIndex + 1 : null;
              const showLabel = shouldRenderLabel({ pandal, isMustVisit, isInRoute });

              return (
                <g
                  key={pandal.id}
                  onClick={() => {
                    setSelectedPandalId(pandal.id);
                    setShowPandalSheet(true);
                    setSelectedEssentialPlace(null);
                    playKanshorBell(0.4);
                  }}
                  className="cursor-pointer transition-transform duration-200"
                  style={{ transformOrigin: `${x}px ${y}px` }}
                >
                  {/* Outer pulse aura for Selected Pandal */}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="5.8"
                      fill="#991B1B"
                      opacity="0.3"
                      className="animate-ping"
                    />
                  )}

                  {/* Marker Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={pinRadius}
                    fill={pinBg}
                    stroke={isSelected ? '#FDE68A' : pinBorder}
                    strokeWidth={isSelected ? 1.2 : 0.8}
                    className="shadow-sm"
                  />

                  {/* Inner Symbol / Stop Number */}
                  {stopNumber ? (
                    <text
                      x={x}
                      y={y + 0.9}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="2.1"
                      fontWeight="900"
                    >
                      {stopNumber}
                    </text>
                  ) : (
                    <text
                      x={x}
                      y={y + 0.8}
                      textAnchor="middle"
                      fill={isMustVisit ? '#FEF08A' : '#FFFFFF'}
                      fontSize={isMustVisit ? '2.1' : '1.8'}
                      fontWeight="bold"
                    >
                      {iconChar}
                    </text>
                  )}

                  {/* Smart Label (Rendered only when priority matches to avoid clutter) */}
                  {showLabel && (
                    <g>
                      {/* Label Card Casing */}
                      <rect
                        x={x - 11}
                        y={y - 5.5}
                        width="22"
                        height="3.3"
                        rx="1.2"
                        fill={isSelected ? (isDarkMode ? '#2A1B24' : '#FFFFFF') : (isDarkMode ? '#1E171D' : '#FFFFFF')}
                        stroke={isSelected ? '#DC2626' : (isDarkMode ? '#472236' : '#E5E7EB')}
                        strokeWidth={isSelected ? 0.8 : 0.4}
                        className="shadow-xs"
                      />
                      <text
                        x={x}
                        y={y - 3.2}
                        textAnchor="middle"
                        fill={isSelected ? '#991B1B' : (isDarkMode ? '#FEF08A' : '#451A03')}
                        fontSize="1.8"
                        fontWeight={isSelected ? '900' : 'bold'}
                        className="select-none"
                      >
                        {pandal.name.split(' ')[0]}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Live Squad Friends Layer (Visually distinct avatar markers) */}
            {showFriendsOnMap &&
              activeFriendsOnMap.map((friend) => {
                const isMe = friend.userId === currentUser.id;
                const coords = latLngToMapCoordinates(friend.latitude, friend.longitude, activeCity);
                const avatar =
                  FESTIVE_AVATARS.find((a) => a.id === (friend.userAvatar || friend.profile?.avatarUrl)) ||
                  FESTIVE_AVATARS[0];

                const isFriendSOS = activeSOSAlerts.some((s) => s.userId === friend.userId);
                const isFriendLost = activeLostAlerts.some((l) => l.userId === friend.userId);

                const ringColor = isFriendSOS
                  ? '#DC2626'
                  : isFriendLost
                  ? '#D97706'
                  : isMe
                  ? '#2563EB'
                  : friend.isStationary
                  ? '#0D9488'
                  : '#10B981';

                return (
                  <g
                    key={`friend-pin-${friend.userId}`}
                    onClick={() => setSelectedFriend(friend)}
                    className="cursor-pointer transition-transform duration-200 hover:scale-125"
                    style={{ transformOrigin: `${coords.mapX}px ${coords.mapY}px` }}
                  >
                    {/* Pulsing ring for active tracking */}
                    <circle
                      cx={coords.mapX}
                      cy={coords.mapY}
                      r="4.8"
                      fill={ringColor}
                      opacity={isFriendSOS ? '0.6' : '0.25'}
                      className="animate-ping"
                    />

                    {/* Outer Circle Container */}
                    <circle
                      cx={coords.mapX}
                      cy={coords.mapY}
                      r="3.2"
                      fill={ringColor}
                      stroke="#FFFFFF"
                      strokeWidth="0.9"
                    />

                    {/* Emoji / Indicator */}
                    <text
                      x={coords.mapX}
                      y={coords.mapY + 1.0}
                      textAnchor="middle"
                      fontSize="2.1"
                    >
                      {isFriendSOS ? '🚨' : isFriendLost ? '🧭' : avatar.emoji}
                    </text>

                    {/* Compact Friend Name Pill with Status Dot */}
                    <rect
                      x={coords.mapX - 7.5}
                      y={coords.mapY + 4.0}
                      width="15"
                      height="2.8"
                      rx="1.0"
                      fill={isDarkMode ? '#1E171D' : '#FFFFFF'}
                      stroke={ringColor}
                      strokeWidth="0.4"
                    />
                    <text
                      x={coords.mapX}
                      y={coords.mapY + 6.0}
                      textAnchor="middle"
                      fill={isFriendSOS ? '#DC2626' : (isDarkMode ? '#FFFFFF' : '#1C1418')}
                      fontSize="1.5"
                      fontWeight="bold"
                    >
                      {isMe ? 'You' : friend.userName.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
          </svg>
        </div>

        {/* 3. Selected Pandal Floating Information Card (Clean, compact bottom sheet) */}
        {activePandal && showPandalSheet && (
          <div
            id="map-pandal-floating-card"
            className="absolute bottom-3 left-3 right-3 z-30 animate-slideUp pointer-events-auto"
          >
            <div
              className={`p-3 rounded-2xl border shadow-xl backdrop-blur-md flex flex-col gap-2.5 transition-all ${
                isDarkMode
                  ? 'bg-stone-900/98 border-stone-700/80 text-white'
                  : 'bg-white/98 border-stone-200/90 text-stone-900'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Pandal Thumbnail Image with Rating Tag */}
                <div
                  onClick={() => onSelectPandal(activePandal)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 relative shadow-sm cursor-pointer group bg-stone-200"
                >
                  <img
                    src={activePandal.heroImage}
                    alt={activePandal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    referrerPolicy="no-referrer"
                    onError={handleImageError}
                  />
                  <span className="absolute bottom-1 left-1 text-[10px] font-bold text-white bg-black/75 px-1 rounded tabular-nums flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                    <span>{activePandal.overallQualityScore.toFixed(1)}</span>
                  </span>
                </div>

                {/* Middle Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-micro font-bold px-2 py-0.5 rounded-full ${
                        activePandal.recommendationLevel === 'Must Visit'
                          ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25'
                          : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {activePandal.recommendationLevel}
                    </span>

                    {/* Proximity / Direction from Active Anchor */}
                    {activePandalRank && (
                      <span className="text-[11px] font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-full tabular-nums">
                        {activePandalRank.arrowIcon} {activePandalRank.direction} • {activePandalRank.formattedStraightDistance}
                      </span>
                    )}
                  </div>

                  <h4
                    onClick={() => onSelectPandal(activePandal)}
                    className="font-display font-black text-small sm:text-h4 text-stone-900 dark:text-white truncate mt-0.5 cursor-pointer hover:text-[#DC2626]"
                  >
                    {activePandal.name}
                  </h4>
                  <p className="font-bengali text-micro text-[#DC2626] font-bold truncate">
                    {activePandal.bengaliName}
                  </p>

                  {/* Transit & Queue */}
                  <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-1">
                    <span>🚶 ~{activePandalRank?.estimatedWalkingMinutes || 8}m walk</span>
                    <span>•</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      {activePandal.queueWaitMinutes}m wait
                    </span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowPandalSheet(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors shrink-0"
                  title="Dismiss Card"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Action Buttons Row (Explore, Add to Route, Navigate) */}
              <div className="flex items-center gap-2 pt-1 border-t border-stone-100 dark:border-stone-800/80">
                <button
                  onClick={() => onSelectPandal(activePandal)}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white font-bold text-micro shadow-sm flex items-center justify-center gap-1 hover:brightness-110 active:scale-95 transition-all"
                >
                  <span>Explore Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {onToggleTripPandal && (
                  <button
                    onClick={() => onToggleTripPandal(activePandal.id)}
                    className={`py-1.5 px-3 rounded-xl font-bold text-micro border flex items-center justify-center gap-1 transition-all ${
                      isCurrentPandalInRoute
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                        : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-amber-100/60'
                    }`}
                  >
                    {isCurrentPandalInRoute ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>In Route</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add to Route</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  onClick={() => handleNavigateToCoords(activePandal.latitude, activePandal.longitude)}
                  className="py-1.5 px-3 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-micro flex items-center justify-center gap-1 transition-colors"
                >
                  <Navigation className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>Navigate</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2.1 Quick Squad Location Strip */}
      {memberLocations.length > 0 && (
        <div
          className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2 overflow-x-auto no-scrollbar transition-all ${
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
          className={`p-3.5 rounded-2xl border shadow-lg transition-all animate-scaleUp ${
            isDarkMode
              ? 'bg-[#2A1C22] border-stone-700 text-white'
              : 'bg-white border-stone-200 text-stone-900'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs"
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
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-micro flex items-center justify-center gap-1 shadow-xs"
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
                className="px-3 py-1.5 rounded-xl bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold text-micro flex items-center gap-1 shadow-xs"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Navigate</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Ranked Nearby Worthwhile Pandals Drawer */}
      <section
        id="nearby-worthwhile-section"
        className={`p-4 rounded-3xl border shadow-xs space-y-3 ${
          isDarkMode
            ? 'bg-[#281B23] border-[#F59E0B]/25 text-white'
            : 'bg-white border-[#D97706]/20 text-stone-900'
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
                Ranked from <strong>{activeAnchor?.name.split('(')[0]}</strong>
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
                onClick={() => {
                  setSelectedPandalId(rankResult.pandal.id);
                  setShowPandalSheet(true);
                  handleNavigateToCoords(rankResult.pandal.latitude, rankResult.pandal.longitude);
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isTarget
                    ? 'border-[#DC2626] bg-[#DC2626]/10 shadow-xs'
                    : isDarkMode
                    ? 'border-stone-800 bg-[#1C1418] hover:bg-[#3B1324]/60'
                    : 'border-stone-100 bg-stone-50 hover:bg-[#FEF3C7]/40'
                }`}
              >
                {/* Rank Number + Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-btn shrink-0 tabular-nums ${
                      idx === 0
                        ? 'bg-[#DC2626] text-white shadow-xs'
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
            <span>Composite quality & walking model</span>
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
