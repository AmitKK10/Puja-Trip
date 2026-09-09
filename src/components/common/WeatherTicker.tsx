import React, { useState, useEffect } from 'react';
import { CityId, LocationWeather } from '../../types';
import {
  getCachedWeatherSync,
  getLiveCityWeather,
  formatTimeAgo,
  setWeatherScenario,
  getCurrentWeatherScenario,
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
  Sliders,
  Check,
  RefreshCw,
  Umbrella,
  Sparkles,
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
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const [activeScenario, setActiveScenario] = useState(() => getCurrentWeatherScenario());

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
  }, [activeCity, activeScenario]);

  const handleScenarioChange = (scenario: 'autumn_breeze' | 'rain_approaching_35m' | 'heavy_thunderstorm' | 'humid_heat') => {
    setWeatherScenario(scenario);
    setActiveScenario(scenario);
    const updated = getCachedWeatherSync(activeCity);
    setWeather(updated);
    onWeatherChange?.(updated);
    setShowScenarioMenu(false);
    playKanshorBell(0.6);
  };

  const isRainImminent = weather.rainProbability >= 60 || weather.weatherCondition.includes('rain');

  return (
    <div
      id="weather-intelligence-ticker"
      className="relative rounded-2xl border transition-all overflow-hidden bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-amber-500/10 dark:from-[#23151b] dark:via-[#1c1218] dark:to-[#23151b] border-amber-500/30 shadow-xs"
    >
      {/* Top Banner Row */}
      <div className="p-3 sm:px-4 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 shadow-xs ${
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
                <span>{weather.rainProbability}% Rain</span>
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Wind className="w-3 h-3 text-amber-600" />
                <span>{weather.windSpeedKmh} km/h {weather.windDirection.split(' ')[0]}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Droplets className="w-3 h-3 text-blue-500" />
                <span>{weather.humidityPercent}% Humidity</span>
              </span>
              <span>•</span>
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Updated {formatTimeAgo(weather.lastUpdated)}
              </span>
            </div>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="toggle-weather-scenario-btn"
            onClick={() => setShowScenarioMenu(!showScenarioMenu)}
            title="Switch weather simulation scenario for testing"
            className="px-2.5 py-1 rounded-lg text-micro font-bold bg-white/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 flex items-center gap-1 transition-colors"
          >
            <Sliders className="w-3 h-3 text-amber-600" />
            <span className="hidden sm:inline">Scenario Test</span>
          </button>

          <button
            id="expand-weather-forecast-btn"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-stone-600 dark:text-stone-300 hover:bg-amber-500/20 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Severe Weather Alert Ribbon */}
      {weather.severeAlert && (
        <div className="px-3 py-2 bg-amber-500/15 dark:bg-amber-500/20 border-t border-amber-500/30 flex items-center gap-2 text-micro text-amber-900 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span className="font-bold flex-1">{weather.severeAlert.headline}</span>
        </div>
      )}

      {/* Expanded 2-Hour Forecast Matrix */}
      {isExpanded && (
        <div className="p-3 sm:p-4 bg-white/60 dark:bg-black/40 border-t border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-micro font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Next 2 Hours Pandal Walk Forecast (2-Hour Timeline)</span>
            </h4>
            <span className="text-[10px] text-stone-500 dark:text-stone-400">
              Provider-Independent Engine
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {weather.shortTermForecast.map((slot, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  slot.rainProbability >= 60
                    ? 'bg-blue-500/10 border-blue-500/30 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                    : 'bg-white/80 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                <div className="text-[11px] font-bold text-stone-500 dark:text-stone-400">
                  {slot.timeOffsetMinutes === 0 ? 'Now' : `+${slot.timeOffsetMinutes}m (${slot.forecastTime})`}
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
              </div>
            ))}
          </div>

          <div className="text-micro text-stone-600 dark:text-stone-400 leading-relaxed bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
            <span className="font-bold text-amber-800 dark:text-amber-200">Weather-Aware Advisory: </span>
            {weather.rainProbability >= 60
              ? 'Rain is approaching within the next hour. Outdoor walking routes above 1.2 km will automatically recommend 🚇 Metro connections to keep your Pandal Darshan dry.'
              : 'Clear autumn conditions. Perfect for walking along heritage illumination corridors.'}
          </div>
        </div>
      )}

      {/* Scenario Selection Dropdown Modal for Testing */}
      {showScenarioMenu && (
        <div className="p-3 bg-white dark:bg-stone-900 border-t border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-micro font-black uppercase tracking-wider text-stone-700 dark:text-stone-300">
              Weather Simulation Scenario (For Live Testing)
            </span>
            <button
              onClick={() => setShowScenarioMenu(false)}
              className="text-[11px] font-bold text-stone-500 hover:text-stone-900"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              {
                id: 'rain_approaching_35m',
                title: '🌧️ Rain Approaching in 35m',
                desc: 'Triggers rain advisories, metro recommendations & outdoor queue warnings',
              },
              {
                id: 'autumn_breeze',
                title: '🌙 Clear Autumn Night',
                desc: 'Optimal walking weather with 10% rain chance',
              },
              {
                id: 'heavy_thunderstorm',
                title: '⛈️ Severe Thunderstorm',
                desc: 'Severe weather alert & underground metro shelter advisory',
              },
              {
                id: 'humid_heat',
                title: '☀️ High Afternoon Heat',
                desc: '32°C afternoon sun with hydration reminders',
              },
            ].map((sc) => (
              <button
                key={sc.id}
                onClick={() => handleScenarioChange(sc.id as any)}
                className={`p-2 rounded-xl text-left border text-micro transition-all flex items-start justify-between gap-2 ${
                  activeScenario === sc.id
                    ? 'bg-amber-500/20 border-amber-500 text-stone-900 dark:text-amber-200 font-bold'
                    : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                }`}
              >
                <div>
                  <div className="font-bold">{sc.title}</div>
                  <div className="text-[10px] text-stone-500 dark:text-stone-400 mt-0.5">{sc.desc}</div>
                </div>
                {activeScenario === sc.id && <Check className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
