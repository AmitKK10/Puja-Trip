import React, { useState, useEffect } from 'react';
import {
  LocationSharingDuration,
  LocationSharingSettings,
  UserProfile,
  CityId,
} from '../../types';
import {
  getLocationSharingSettings,
  startLocationSharing,
  stopLocationSharing,
  toggleBatterySaverMode,
  simulateStationaryState,
  wakeUpGps,
  subscribeToLiveLocationBroadcasts,
} from '../../services/groupLocationService';
import { formatTimeAgo } from '../../utils/geoUtils';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import {
  Radio,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MapPin,
  Power,
  ChevronDown,
  Info,
  BatteryCharging,
  BatteryMedium,
  Zap,
  Moon,
  Footprints,
  Leaf,
  Sparkles,
} from 'lucide-react';

interface LocationSharingBarProps {
  tripId: string;
  currentUser: UserProfile;
  activeCity?: CityId;
  onStatusChange?: (isSharing: boolean) => void;
  isDarkMode?: boolean;
}

export const LocationSharingBar: React.FC<LocationSharingBarProps> = ({
  tripId,
  currentUser,
  activeCity = 'kolkata',
  onStatusChange,
  isDarkMode = false,
}) => {
  const [settings, setSettings] = useState<LocationSharingSettings>(() =>
    getLocationSharingSettings(tripId)
  );
  const [selectedDuration, setSelectedDuration] = useState<LocationSharingDuration>(
    settings.duration || '3h'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timeAgoText, setTimeAgoText] = useState<string>('Just now');
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showDevControls, setShowDevControls] = useState(false);

  // Poll time ago text, stationary state, and expiration
  useEffect(() => {
    const refreshSettings = () => {
      const current = getLocationSharingSettings(tripId);
      setSettings(current);
      if (current.lastUpdated) {
        setTimeAgoText(formatTimeAgo(current.lastUpdated));
      }
    };

    refreshSettings();

    const timer = setInterval(refreshSettings, 3000);
    const unsubscribe = subscribeToLiveLocationBroadcasts(tripId, refreshSettings);

    return () => {
      clearInterval(timer);
      unsubscribe();
    };
  }, [tripId]);

  const handleToggleSharing = async () => {
    setErrorMessage(null);
    setIsLoading(true);

    if (settings.isSharing) {
      // Turn OFF immediately
      stopLocationSharing(tripId);
      const updated = getLocationSharingSettings(tripId);
      setSettings(updated);
      setIsLoading(false);
      onStatusChange?.(false);
      playKanshorBell(0.4);
    } else {
      // Turn ON with selected duration
      const res = await startLocationSharing({
        tripId,
        duration: selectedDuration,
        city: activeCity,
        onLocationUpdate: (record) => {
          const updated = getLocationSharingSettings(tripId);
          setSettings(updated);
          setTimeAgoText('Just now');
          setIsLoading(false);
        },
        onError: (err) => {
          setErrorMessage(err.message);
          setIsLoading(false);
        },
      });

      if (res.success) {
        const updated = getLocationSharingSettings(tripId);
        setSettings(updated);
        onStatusChange?.(true);
        playDhakHit('dha', 0.6);
      } else {
        setErrorMessage(res.error || 'Failed to initialize location sharing.');
      }
      setIsLoading(false);
    }
  };

  const handleDurationChange = async (newDuration: LocationSharingDuration) => {
    setSelectedDuration(newDuration);
    setShowDurationPicker(false);

    if (settings.isSharing) {
      // Restart with new duration
      setIsLoading(true);
      await startLocationSharing({
        tripId,
        duration: newDuration,
        city: activeCity,
        onLocationUpdate: () => {
          const updated = getLocationSharingSettings(tripId);
          setSettings(updated);
          setIsLoading(false);
        },
        onError: (err) => {
          setErrorMessage(err.message);
          setIsLoading(false);
        },
      });
    }
  };

  const handleBatterySaverToggle = () => {
    const nextState = !(settings.batterySaverMode ?? true);
    const updated = toggleBatterySaverMode(tripId, nextState);
    setSettings(updated);
    playDhakHit('ta', 0.4);
  };

  const handleWakeUpGps = async () => {
    await wakeUpGps(tripId);
    const updated = getLocationSharingSettings(tripId);
    setSettings(updated);
    playDhakHit('dha', 0.5);
  };

  const handleSimulateStationary = (minutes: number) => {
    const updated = simulateStationaryState(tripId, minutes);
    setSettings(updated);
  };

  // Remaining duration formatting
  const getRemainingDurationLabel = () => {
    if (!settings.expiresAt) return 'Until trip ends';
    const diffMs = new Date(settings.expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Expired';
    const mins = Math.ceil(diffMs / 60000);
    if (mins < 60) return `Expires in ${mins}m`;
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;
    return `Expires in ${hours}h ${remMins > 0 ? `${remMins}m` : ''}`;
  };

  const getDurationTitle = (d: LocationSharingDuration) => {
    switch (d) {
      case '1h':
        return '1 Hour (Quick Hop)';
      case '3h':
        return '3 Hours (Standard Route)';
      case 'until_trip_ends':
        return 'Until Trip Ends (Full Darshan)';
    }
  };

  const isBatterySaverOn = settings.batterySaverMode ?? true;
  const isGpsSleeping = settings.isSharing && settings.gpsState === 'sleep_stationary';

  return (
    <div
      id="live-location-sharing-bar"
      className={`p-3.5 rounded-2xl border transition-all shadow-sm ${
        settings.isSharing
          ? isGpsSleeping
            ? isDarkMode
              ? 'bg-[#18231E] border-teal-500/40 text-white'
              : 'bg-teal-50/90 border-teal-300 text-stone-900'
            : isDarkMode
            ? 'bg-[#1E251E] border-emerald-500/40 text-white'
            : 'bg-emerald-50/90 border-emerald-300 text-stone-900'
          : isDarkMode
          ? 'bg-[#22171E] border-stone-800 text-stone-200'
          : 'bg-stone-50 border-stone-200 text-stone-800'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        {/* Left Status & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-colors ${
              settings.isSharing
                ? isGpsSleeping
                  ? 'bg-teal-600 text-white'
                  : 'bg-emerald-600 text-white animate-pulse'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
            }`}
          >
            {settings.isSharing ? (
              isGpsSleeping ? (
                <Moon className="w-5 h-5 text-teal-200 animate-pulse" />
              ) : (
                <Radio className="w-5 h-5" />
              )
            ) : (
              <Power className="w-4 h-4" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-bold text-small">
                {settings.isSharing
                  ? isGpsSleeping
                    ? 'Live Sharing (GPS Sleeping)'
                    : 'Live Location Sharing Active'
                  : 'Live Location Sharing'}
              </span>
              <span
                className={`text-[10px] font-black px-2 py-0.2 rounded-full uppercase tracking-wider ${
                  settings.isSharing
                    ? isGpsSleeping
                      ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30'
                      : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                {settings.isSharing ? (isGpsSleeping ? '💤 GPS SLEEP' : '🟢 LIVE') : 'OFF'}
              </span>

              {/* Battery Saver Mode Active Pill */}
              {isBatterySaverOn && (
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <Leaf className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Battery Saver</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-micro text-stone-500 dark:text-stone-400 mt-0.5 flex-wrap">
              {settings.isSharing ? (
                <>
                  <span>Updated {timeAgoText}</span>
                  <span>•</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                    {getRemainingDurationLabel()}
                  </span>
                  <span>•</span>
                  <span className="text-stone-600 dark:text-stone-300">
                    Freq: {settings.updateFrequencySeconds || 35}s
                  </span>
                </>
              ) : (
                <span>Private • Visible only to trip squad when enabled</span>
              )}
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Duration Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDurationPicker(!showDurationPicker)}
              className={`px-2.5 py-1.5 rounded-xl border text-micro font-bold flex items-center gap-1.5 transition-all ${
                isDarkMode
                  ? 'bg-stone-800/80 border-stone-700 text-stone-200 hover:bg-stone-700'
                  : 'bg-white border-stone-200 text-stone-800 hover:bg-stone-100'
              }`}
              title="Change Sharing Duration"
            >
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>{selectedDuration === 'until_trip_ends' ? 'Trip End' : selectedDuration}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {showDurationPicker && (
              <div
                className={`absolute right-0 top-full mt-1.5 w-52 rounded-2xl border shadow-xl z-50 p-1.5 space-y-1 ${
                  isDarkMode
                    ? 'bg-[#1C1418] border-stone-700 text-white'
                    : 'bg-white border-stone-200 text-stone-900'
                }`}
              >
                <div className="px-2 py-1 text-[10px] font-bold uppercase text-stone-400">
                  Sharing Duration
                </div>
                {(['1h', '3h', 'until_trip_ends'] as LocationSharingDuration[]).map((dur) => (
                  <button
                    key={dur}
                    onClick={() => handleDurationChange(dur)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-micro font-bold flex items-center justify-between transition-all ${
                      selectedDuration === dur
                        ? 'bg-[#DC2626] text-white'
                        : 'hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <span>{getDurationTitle(dur)}</span>
                    {selectedDuration === dur && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Battery Saver Mode Toggle Button */}
          <button
            onClick={handleBatterySaverToggle}
            className={`px-2.5 py-1.5 rounded-xl border text-micro font-bold flex items-center gap-1.5 transition-all ${
              isBatterySaverOn
                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/30'
                : isDarkMode
                ? 'bg-stone-800 border-stone-700 text-stone-400 hover:bg-stone-700'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
            }`}
            title="Toggle Battery-Saving Mode (Suspends GPS when stationary > 5m)"
          >
            <Leaf className={`w-3.5 h-3.5 ${isBatterySaverOn ? 'text-emerald-600' : 'text-stone-400'}`} />
            <span>Eco Mode {isBatterySaverOn ? 'ON' : 'OFF'}</span>
          </button>

          {/* ON / OFF Toggle Button */}
          <button
            onClick={handleToggleSharing}
            disabled={isLoading}
            className={`px-3.5 py-1.5 rounded-xl font-bold text-btn transition-all shadow-sm flex items-center gap-1.5 ${
              settings.isSharing
                ? 'bg-rose-600 hover:bg-rose-700 text-white ring-2 ring-rose-500/20'
                : 'bg-gradient-to-r from-[#991B1B] to-[#DC2626] hover:brightness-110 text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Updating...' : settings.isSharing ? 'Stop Sharing' : 'Share Live GPS'}</span>
          </button>
        </div>
      </div>

      {/* Stationary Sleeping GPS Notification Banner */}
      {settings.isSharing && isGpsSleeping && (
        <div className="mt-3 p-2.5 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-950 dark:text-teal-100 text-micro flex items-center justify-between gap-2.5 animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <Moon className="w-4 h-4 text-teal-600 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold text-teal-800 dark:text-teal-200">
                Stationary ({settings.stationaryDurationMinutes || 5}+ mins in queue/bhog)
              </span>
              <span className="hidden sm:inline text-teal-700/80 dark:text-teal-300/80 ml-1">
                • GPS chip sleeping to save up to 75% battery. Auto-wakes when you start walking.
              </span>
            </div>
          </div>
          <button
            onClick={handleWakeUpGps}
            className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-[11px] shrink-0 shadow-xs flex items-center gap-1 transition-all"
            title="Force immediate high-accuracy GPS fix"
          >
            <Zap className="w-3 h-3 text-amber-300" />
            <span>Wake GPS</span>
          </button>
        </div>
      )}

      {/* Error / Alert Banner if permission denied or GPS unavailable */}
      {errorMessage && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-micro flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Location Permission or GPS Issue</p>
            <p className="text-stone-600 dark:text-stone-300 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-stone-400 hover:text-stone-600 text-micro font-bold ml-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Battery-Saving Mode Details & Stationary Test Controls */}
      <div className="mt-2.5 pt-2 border-t border-stone-200/50 dark:border-stone-800/50 flex items-center justify-between text-[10px] text-stone-500 flex-wrap gap-2">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>
            {isBatterySaverOn
              ? 'Eco Mode: Reduced frequency (35s) & GPS disabled when stationary > 5m (saves ~65% battery)'
              : 'Standard Mode: High frequency (15s) continuous GPS watch'}
          </span>
        </span>

        {/* Quick Testing Toggles */}
        {settings.isSharing && (
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => handleSimulateStationary(settings.isStationary ? 0 : 6)}
              className={`px-2 py-0.5 rounded-md font-semibold text-[10px] border transition-colors flex items-center gap-1 ${
                settings.isStationary
                  ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-300 dark:border-stone-700'
              }`}
              title="Test stationary battery saver transition"
            >
              {settings.isStationary ? (
                <>
                  <Footprints className="w-2.5 h-2.5 text-amber-600" />
                  <span>Simulate Moving</span>
                </>
              ) : (
                <>
                  <Moon className="w-2.5 h-2.5 text-teal-600" />
                  <span>Simulate 5m Stationary</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
