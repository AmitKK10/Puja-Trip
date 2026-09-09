import React, { useState, useEffect } from 'react';
import { CityId, Pandal, CuratedRoute, UserPreferences } from './types';
import { SAMPLE_PANDALS } from './data/pandalData';
import { Header } from './components/common/Header';
import { BottomNav, ScreenTab } from './components/common/BottomNav';
import { SplashScreen } from './components/screens/SplashScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { DiscoveryScreen } from './components/screens/DiscoveryScreen';
import { PandalDetailScreen } from './components/screens/PandalDetailScreen';
import { MapScreen } from './components/screens/MapScreen';
import { RouteScreen } from './components/screens/RouteScreen';
import { FavoritesScreen } from './components/screens/FavoritesScreen';
import { GroupScreen } from './components/screens/GroupScreen';
import { SettingsScreen } from './components/screens/SettingsScreen';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ScreenTab>('splash');
  const [activeCity, setActiveCity] = useState<CityId>('kolkata');
  const [pandals, setPandals] = useState<Pandal[]>(SAMPLE_PANDALS);
  const [selectedPandal, setSelectedPandal] = useState<Pandal | null>(null);

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

  // Ingest shareable deep-link if opened via URL query parameters
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
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
      console.warn('Could not parse route deep-link', e);
    }
  }, []);

  // Handle City Change
  const handleCityChange = (newCity: CityId) => {
    setActiveCity(newCity);
    setUserPrefs((prev) => ({ ...prev, activeCity: newCity }));

    // If active trip is empty for new city, set appropriate defaults
    if (newCity === 'contai') {
      setActiveTripPandalIds(['contai-sabuj-sangha', 'contai-central-bus-stand', 'contai-junput-jubak']);
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
          />
        )}
      </main>

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
    </div>
  );
}
