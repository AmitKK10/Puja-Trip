import React, { useState, useEffect } from 'react';
import { CityId, Pandal, CuratedRoute, UserPreferences, SharedTripGroup } from './types';
import { SAMPLE_PANDALS } from './data/pandalData';
import { getCommunityPandals } from './services/communityPandalService';
import {
  getCurrentUserProfile,
  fetchUserSquadsFromSupabase,
} from './services/friendGroupService';
import { Header } from './components/common/Header';
import { BottomNav, ScreenTab } from './components/common/BottomNav';
import { PWAInstallBanner } from './components/common/PWAInstallBanner';
import { SplashScreen } from './components/screens/SplashScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { DiscoveryScreen } from './components/screens/DiscoveryScreen';
import { PandalDetailScreen } from './components/screens/PandalDetailScreen';
import { MapScreen } from './components/screens/MapScreen';
import { RouteScreen } from './components/screens/RouteScreen';
import { FavoritesScreen } from './components/screens/FavoritesScreen';
import { GroupScreen } from './components/screens/GroupScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';
import { AboutDeveloperScreen } from './components/screens/AboutDeveloperScreen';
import { JoinSquadModal } from './components/group/JoinSquadModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ScreenTab>('splash');
  const [activeCity, setActiveCity] = useState<CityId>('kolkata');
  const [pandals, setPandals] = useState<Pandal[]>(SAMPLE_PANDALS);
  const [selectedPandal, setSelectedPandal] = useState<Pandal | null>(null);

  // Load user-created / community pandals from Supabase & local cache on mount
  useEffect(() => {
    let isMounted = true;
    async function loadPandals() {
      try {
        const communityPandals = await getCommunityPandals();
        if (isMounted && communityPandals.length > 0) {
          setPandals((prev) => {
            const existingIds = new Set(prev.map((p) => p.id));
            const newCommunity = communityPandals.filter((cp) => !existingIds.has(cp.id));
            return [...newCommunity, ...prev];
          });
        }
      } catch (err) {
        console.warn('Error loading community pandals:', err);
      }
    }
    loadPandals();
    return () => {
      isMounted = false;
    };
  }, []);

  // Persistent-like client state for hopping favorites, visited checklist & trip route
  const [favorites, setFavorites] = useState<string[]>([
    'bagbazar-sarbojanin',
    'maddox-square',
    'contai-sabuj-sangha',
  ]);

  const [visitedList, setVisitedList] = useState<string[]>([
    'shobhabazar-rajbari',
  ]);

  const [activeTripPandalIds, setActiveTripPandalIds] = useState<string[]>([
    'shobhabazar-rajbari',
    'bagbazar-sarbojanin',
    'college-square',
  ]);

  const [userPrefs, setUserPrefs] = useState<UserPreferences>({
    activeCity: 'kolkata',
    themeMode: 'festive_vermilion',
    language: 'en',
    soundEnabled: true,
    dhakVolume: 0.8,
    notificationsEnabled: true,
    offlineMode: false,
    vipPasses: [],
  });

  // Dedicated Squad Invite state
  const [pendingInviteCode, setPendingInviteCode] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Ingest shareable deep-link & invite code if opened via URL query parameters
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);

      // 1. Detect and parse squad invite parameter (?invite=KP26RY or ?code=KP26RY or ?join=KP26RY)
      const rawInvite =
        searchParams.get('invite') || searchParams.get('code') || searchParams.get('join');
      if (rawInvite) {
        const clean = rawInvite.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (clean.length >= 4) {
          setPendingInviteCode(clean);
          setShowInviteModal(true);
        }
      }

      // 2. Load squads from Supabase in background to ensure sync
      fetchUserSquadsFromSupabase(getCurrentUserProfile().id).catch(() => {});

      // 3. Route deep links
      const deepLinkPandals = searchParams.get('pandals');
      const deepLinkCity = searchParams.get('city') as CityId | null;
      const deepLinkTab = searchParams.get('tab') as ScreenTab | null;

      if (deepLinkPandals) {
        const parsedIds = deepLinkPandals.split(',').filter(Boolean);
        if (parsedIds.length > 0) {
          setActiveTripPandalIds(parsedIds);
          if (deepLinkCity && (deepLinkCity === 'kolkata' || deepLinkCity === 'contai')) {
            setActiveCity(deepLinkCity);
            setUserPrefs((prev) => ({ ...prev, activeCity: deepLinkCity }));
          }
          setCurrentTab(deepLinkTab || 'route');
          return;
        }
      }
    } catch (e) {
      console.warn('Could not parse route or invite deep-link', e);
    }
  }, []);

  const handleSquadJoined = (group: SharedTripGroup) => {
    setShowInviteModal(false);
    setPendingInviteCode(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      url.searchParams.delete('code');
      url.searchParams.delete('join');
      window.history.replaceState({}, document.title, url.toString());
    } catch (e) {
      // ignore
    }
    if (group.trip.city && (group.trip.city === 'kolkata' || group.trip.city === 'contai')) {
      handleCityChange(group.trip.city);
    }
    setCurrentTab('group');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      url.searchParams.delete('code');
      url.searchParams.delete('join');
      window.history.replaceState({}, document.title, url.toString());
    } catch (e) {
      // ignore
    }
  };

  // Handle City Change
  const handleCityChange = (newCity: CityId) => {
    setActiveCity(newCity);
    setUserPrefs((prev) => ({ ...prev, activeCity: newCity }));

    // If active trip is empty for new city, set appropriate defaults
    if (newCity === 'contai') {
      setActiveTripPandalIds(['contai-nandanik', 'contai-youth', 'contai-sabuj-sangha']);
    } else {
      setActiveTripPandalIds(['shobhabazar-rajbari', 'bagbazar-sarbojanin', 'college-square']);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Visited
  const handleToggleVisited = (id: string) => {
    setVisitedList((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle in Active Trip
  const handleToggleTripPandal = (id: string) => {
    setActiveTripPandalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select Pandal to view details
  const handleSelectPandal = (pandal: Pandal) => {
    setSelectedPandal(pandal);
    setCurrentTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle user-created custom pandal
  const handlePandalCreated = (newPandal: Pandal) => {
    setPandals((prev) => [newPandal, ...prev.filter((p) => p.id !== newPandal.id)]);
    setSelectedPandal(newPandal);
    setCurrentTab('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select Curated Route
  const handleSelectRoute = (route: CuratedRoute) => {
    setActiveTripPandalIds(route.pandalIds);
    setCurrentTab('route');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Start app from Splash
  const handleStartFromSplash = (chosenCity: CityId) => {
    handleCityChange(chosenCity);
    setCurrentTab('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';

  // Explicitly sync `.dark` class to document root based on user preference
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  if (currentTab === 'splash') {
    return <SplashScreen onStartApp={handleStartFromSplash} />;
  }

  return (
    <div
      id="pujatrip-root-app"
      className={`min-h-screen transition-colors duration-300 ${
        isDarkMode
          ? 'bg-[#181115] text-[#FFFDF9] bg-festive-dark-pattern'
          : 'bg-[#FFFCF7] text-[#1C1917] bg-alpana-pattern'
      }`}
    >
      {/* Top Fixed Header */}
      <Header
        activeCity={activeCity}
        onCityChange={handleCityChange}
        userPrefs={userPrefs}
        onUpdatePrefs={setUserPrefs}
        onOpenSettings={() => setCurrentTab('settings')}
        onOpenEmergency={() => {
          setCurrentTab('settings');
          setTimeout(() => {
            document.getElementById('emergency-contacts-section')?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }}
        isViewingPandalDetail={currentTab === 'detail'}
      />

      {/* Main Content Area framed for mobile-first comfort */}
      <main className="max-w-md mx-auto px-3.5 pt-3.5 pb-24">
        {currentTab === 'home' && (
          <HomeScreen
            activeCity={activeCity}
            pandals={pandals}
            favorites={favorites}
            visitedList={visitedList}
            activeTripPandalIds={activeTripPandalIds}
            onToggleFavorite={handleToggleFavorite}
            onSelectPandal={handleSelectPandal}
            onSelectRoute={handleSelectRoute}
            onNavigateTab={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAddPandalToTrip={handleToggleTripPandal}
            userPrefs={userPrefs}
          />
        )}

        {currentTab === 'discovery' && (
          <DiscoveryScreen
            activeCity={activeCity}
            pandals={pandals}
            favorites={favorites}
            visitedList={visitedList}
            activeTripPandalIds={activeTripPandalIds}
            onToggleFavorite={handleToggleFavorite}
            onToggleTripPandal={handleToggleTripPandal}
            onToggleVisited={handleToggleVisited}
            onSelectPandal={handleSelectPandal}
            onPandalCreated={handlePandalCreated}
            userPrefs={userPrefs}
          />
        )}

        {currentTab === 'detail' && selectedPandal && (
          <PandalDetailScreen
            pandal={selectedPandal}
            onBack={() => setCurrentTab('discovery')}
            favorites={favorites}
            visitedList={visitedList}
            activeTripPandalIds={activeTripPandalIds}
            onToggleFavorite={handleToggleFavorite}
            onToggleVisited={handleToggleVisited}
            onToggleTripPandal={handleToggleTripPandal}
            userPrefs={userPrefs}
            onSelectOtherPandal={handleSelectPandal}
          />
        )}

        {currentTab === 'map' && (
          <MapScreen
            activeCity={activeCity}
            pandals={pandals}
            activeTripPandalIds={activeTripPandalIds}
            onSelectPandal={handleSelectPandal}
            onToggleTripPandal={handleToggleTripPandal}
            userPrefs={userPrefs}
          />
        )}

        {currentTab === 'route' && (
          <RouteScreen
            activeCity={activeCity}
            pandals={pandals}
            activeTripPandalIds={activeTripPandalIds}
            visitedList={visitedList}
            onUpdateTripPandals={setActiveTripPandalIds}
            onToggleVisited={handleToggleVisited}
            onSelectPandal={handleSelectPandal}
            onNavigateToGroup={() => {
              setCurrentTab('group');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            userPrefs={userPrefs}
          />
        )}

        {currentTab === 'favorites' && (
          <FavoritesScreen
            activeCity={activeCity}
            pandals={pandals}
            favorites={favorites}
            visitedList={visitedList}
            onToggleFavorite={handleToggleFavorite}
            onToggleVisited={handleToggleVisited}
            onAddAllToRoute={(ids) => {
              setActiveTripPandalIds(ids);
              setCurrentTab('route');
            }}
            onSelectPandal={handleSelectPandal}
            onNavigateDiscover={() => setCurrentTab('discovery')}
            userPrefs={userPrefs}
          />
        )}

        {currentTab === 'group' && (
          <GroupScreen
            activeCity={activeCity}
            pandals={pandals}
            visitedList={visitedList}
            onToggleVisited={handleToggleVisited}
            onSelectPandal={handleSelectPandal}
            onNavigateToRoute={() => {
              setCurrentTab('route');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            userPrefs={userPrefs}
          />
        )}

        {currentTab === 'settings' && (
          <SettingsScreen
            userPrefs={userPrefs}
            onUpdatePrefs={setUserPrefs}
            onCityChange={handleCityChange}
            onOpenSplash={() => setCurrentTab('splash')}
            onOpenDeveloper={() => {
              setCurrentTab('developer');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'developer' && (
          <AboutDeveloperScreen
            userPrefs={userPrefs}
            onBack={() => {
              setCurrentTab('settings');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}
      </main>

      {/* Floating Bottom PWA Install Banner for Uninstalled Visitors */}
      <PWAInstallBanner isDarkMode={isDarkMode} />

      {/* Bottom Sticky Tab Bar */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        favoritesCount={favorites.length}
        visitedCount={visitedList.length}
        userPrefs={userPrefs}
      />

      {/* Global Deep-Link Join Squad Modal */}
      {showInviteModal && pendingInviteCode && (
        <JoinSquadModal
          initialInviteCode={pendingInviteCode}
          currentUser={getCurrentUserProfile()}
          onJoined={handleSquadJoined}
          onClose={handleCloseInviteModal}
          userPrefs={userPrefs}
        />
      )}
    </div>
  );
}
