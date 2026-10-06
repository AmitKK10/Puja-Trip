import React, { useState, useEffect } from 'react';
import { CityId, LocationWeather } from '../../types';
import {
  getCachedWeatherSync,
  getLiveCityWeather,
  formatTimeAgo,
  isWeatherStale,
} from '../../services/weatherService';
import { playKanshorBell } from '../../utils/audioSynth';
import {
  CloudRain,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Umbrella,
  ShieldCheck,
  ExternalLink,
  Radio,
} from 'lucide-react';

interface WeatherTickerProps {
  activeCity: CityId;
  onWeatherChange?: (weather: LocationWeather) => void;
  compact?: boolean;
}

export const WeatherTicker: React.FC<WeatherTickerProps> = ({
  activeCity,
  onWeatherChange,
  compact = false,
}) => {
  const [weather, setWeather] = useState<LocationWeather>(() => getCachedWeatherSync(activeCity));
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getLiveCityWeather(activeCity).then((w) => {
      if (isMounted) {
        setWeather(w);
        onWeatherChange?.(w);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [activeCity]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    playKanshorBell(0.4);
    try {
      const fresh = await getLiveCityWeather(activeCity, true);
      setWeather(fresh);
      onWeatherChange?.(fresh);
    } catch (err) {
      console.warn('Manual weather refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const isRainImminent = weather.rainProbability >= 60 || weather.weatherCondition.includes('rain');
  const isStale = weather.isStale || isWeatherStale(weather.lastUpdated);

  return (
    <div
      id="weather-intelligence-ticker"
      className="relative rounded-3xl border transition-all overflow-hidden bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-amber-500/10 dark:from-[#23151b] dark:via-[#1c1218] dark:to-[#23151b] border-amber-500/30 shadow-xs"
    >
      {/* Top Banner Row */}
      <div className="p-3 sm:px-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs ${
              isRainImminent
                ? 'bg-blue-600 text-white animate-pulse'
                : 'bg-gradient-to-br from-amber-400 to-orange-500 text-stone-900'
            }`}
          >
            {weather.weatherIcon}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-display font-black text-small text-stone-900 dark:text-amber-100">
                {weather.currentTempC}°C
              </span>
              <span className="text-micro font-bold text-stone-600 dark:text-stone-300">
                {weather.conditionLabel}
              </span>
              <span
                className={`text-micro font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  isRainImminent
                    ? 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-400/30 font-black'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <Umbrella className="w-3 h-3" />
                <span>{weather.rainProbability}% Rain Chance</span>
              </span>

              {weather.expectedRainfallMm !== undefined && weather.expectedRainfallMm > 0 && (
                <span className="text-micro font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {weather.expectedRainfallMm} mm
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3 text-amber-600" />
                <span>{weather.windSpeedKmh} km/h {weather.windDirection.split(' ')[0]}</span>
              </span>
              {weather.humidityPercent !== undefined && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-500" />
                    <span>{weather.humidityPercent}% Humidity</span>
                  </span>
                </>
              )}
              <span>•</span>
              <span className="font-medium text-stone-600 dark:text-stone-400">
                Observed: {weather.observedAt || 'Current'}
              </span>
              <span>•</span>
              <span className="text-amber-700 dark:text-amber-300 font-semibold">
                Source: {weather.source}
              </span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh verified weather data"
            className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-600' : ''}`} />
          </button>

          <button
            id="expand-weather-forecast-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-amber-500/20 transition-all cursor-pointer"
            title="View hourly rain forecast & radar"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Stale Data Notice Banner */}
      {isStale && (
        <div className="px-3 py-1.5 bg-amber-500/20 border-t border-amber-500/40 flex items-center justify-between text-micro text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Weather data may be outdated (Last updated: {formatTimeAgo(weather.lastUpdated)})</span>
          </div>
          <button
            onClick={handleRefresh}
            className="underline font-bold hover:text-amber-950 cursor-pointer"
          >
            Refresh Now
          </button>
        </div>
      )}

      {/* Severe Weather Alert Ribbon */}
      {weather.severeAlert && (
        <div className="px-3.5 py-2 bg-red-600/15 dark:bg-red-950/40 border-t border-red-500/30 flex items-start justify-between gap-2 text-micro text-red-900 dark:text-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">{weather.severeAlert.headline}</div>
              <p className="text-[11px] opacity-90 mt-0.5">{weather.severeAlert.description}</p>
              <div className="text-[10px] text-red-700 dark:text-red-300 font-semibold mt-1">
                Source: {weather.severeAlert.source || 'IMD Kolkata'} • Valid until: {new Date(weather.severeAlert.effectiveUntil).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded 6-Hour Real Hourly Forecast & Radar Status */}
      {isExpanded && (
        <div className="p-3 sm:p-4 bg-white/70 dark:bg-black/50 border-t border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-micro font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Next 6 Hours Rain & Temperature Forecast</span>
            </h4>
            <span className="text-[10px] font-bold text-stone-500 dark:text-stone-400">
              Asia/Kolkata (IST)
            </span>
          </div>

          {/* Horizontal scrollable hourly cards */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {weather.shortTermForecast.map((slot, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-2xl border text-center transition-all min-w-[105px] shrink-0 ${
                  slot.rainProbability >= 60
                    ? 'bg-blue-500/10 border-blue-500/40 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                    : 'bg-white/90 dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                  {idx === 0 ? 'Now' : slot.forecastTime}
                </div>
                <div className="text-xl my-1">{slot.icon}</div>
                <div className="text-small font-black">{slot.temperatureC}°C</div>
                <div
                  className={`text-[11px] font-bold mt-0.5 ${
                    slot.rainProbability >= 60 ? 'text-blue-600 dark:text-blue-400' : 'text-stone-500'
                  }`}
                >
                  🌧️ {slot.rainProbability}%
                </div>
                {slot.rainAmountMm !== undefined && slot.rainAmountMm > 0 && (
                  <div className="text-[10px] text-blue-500 font-semibold">
                    {slot.rainAmountMm} mm
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Radar Intelligence Card */}
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-pulse" />
              <div>
                <span className="font-bold text-small text-stone-900 dark:text-white">
                  Radar Nowcast:
                </span>{' '}
                <span className="text-small text-stone-700 dark:text-stone-300">
                  {weather.radarStatus?.label || 'No significant precipitation nearby'}
                </span>
                <p className="font-bengali text-micro text-amber-800 dark:text-amber-300 mt-0.2">
                  {weather.radarStatus?.bengaliLabel}
                </p>
              </div>
            </div>

            {weather.radarStatus?.externalRadarUrl && (
              <a
                href={weather.radarStatus.externalRadarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-micro font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
              >
                <span>IMD Radar Live</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
