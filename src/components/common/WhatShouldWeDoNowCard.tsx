import React, { useState, useMemo, useEffect } from 'react';
import {
  CityId,
  Pandal,
  UserPreferences,
  JourneyRouteComparison,
  TripPlan,
  DynamicVisitScore,
  LocationWeather,
  WalkingSessionStats,
  UserWalkingEnergyConfig,
} from '../../types';
import { compareAllTransportModes } from '../../services/smartTransportEngine';
import { RouteComparisonModal } from '../trip/RouteComparisonModal';
import { CrowdReportModal } from './CrowdReportModal';
import { PandalVisitScoreBadge } from './PandalVisitScoreBadge';
import { getPandalCrowdStatus } from '../../services/crowdIntelligenceService';
import { calculateDynamicVisitScore } from '../../services/dynamicVisitScoreService';
import { getCachedWeatherSync, isRainLikelySoon } from '../../services/weatherService';
import {
  getWalkingSessionStats,
  getWalkingEnergyConfig,
  evaluateWalkingThresholds,
  seedSampleWalkingStatsIfEmpty,
} from '../../services/walkingEnergyService';
import { formatDistance } from '../../utils/geoUtils';
import { playKanshorBell } from '../../utils/audioSynth';
import {
  Sparkles,
  Compass,
  Navigation,
  ArrowRight,
  Clock,
  Flame,
  ShieldCheck,
  Footprints,
  Train,
  CheckCircle2,
  ChevronRight,
  Layers,
  MapPin,
  RefreshCw,
  Umbrella,
  CloudRain,
  Users,
  AlertTriangle,
  TrendingUp,
  BatteryCharging,
  Zap,
} from 'lucide-react';

interface WhatShouldWeDoNowCardProps {
  activeCity: CityId;
  pandals: Pandal[];
  visitedList: string[];
  activeTrip?: TripPlan | null;
  currentGpsPosition?: { latitude: number; longitude: number } | null;
  onSelectPandal: (pandal: Pandal) => void;
  onAddPandalToTrip?: (pandalId: string) => void;
  userPrefs: UserPreferences;
  weather?: LocationWeather;
}

export const WhatShouldWeDoNowCard: React.FC<WhatShouldWeDoNowCardProps> = ({
  activeCity,
  pandals,
  visitedList,
  activeTrip,
  currentGpsPosition,
  onSelectPandal,
  onAddPandalToTrip,
  userPrefs,
  weather,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showCrowdReportModal, setShowCrowdReportModal] = useState(false);

  const [walkingStats, setWalkingStats] = useState<WalkingSessionStats>(() =>
    seedSampleWalkingStatsIfEmpty(activeTrip?.id || 'default-trip', 6.4)
  );
  const [walkingConfig, setWalkingConfig] = useState<UserWalkingEnergyConfig>(() =>
    getWalkingEnergyConfig()
  );

  useEffect(() => {
    setWalkingStats(getWalkingSessionStats(activeTrip?.id));

    const handleStatsUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<WalkingSessionStats>;
      if (customEvent.detail) setWalkingStats(customEvent.detail);
      else setWalkingStats(getWalkingSessionStats(activeTrip?.id));
    };
    window.addEventListener('pujatrip_walking_stats_updated', handleStatsUpdated);
    return () => window.removeEventListener('pujatrip_walking_stats_updated', handleStatsUpdated);
  }, [activeTrip?.id]);

  const walkingEval = evaluateWalkingThresholds(walkingStats, walkingConfig);
  const activeWeather = weather || getCachedWeatherSync(activeCity);
  const rainInfo = isRainLikelySoon(activeWeather, 45);

  // 1. Determine reference origin
  const originInfo = useMemo(() => {
    if (currentGpsPosition) {
      return {
        lat: currentGpsPosition.latitude,
        lng: currentGpsPosition.longitude,
        name: 'Current Live GPS Location',
        isGps: true,
      };
    }

    // Check last visited pandal in itinerary
    if (visitedList.length > 0) {
      const lastVisitedId = visitedList[visitedList.length - 1];
      const lastPandal = pandals.find((p) => p.id === lastVisitedId);
      if (lastPandal) {
        return {
          lat: lastPandal.latitude,
          lng: lastPandal.longitude,
          name: lastPandal.name,
          pandal: lastPandal,
          isGps: false,
        };
      }
    }

    // Default to active trip start location or city landmark
    if (activeTrip?.startLocation) {
      return {
        lat: activeTrip.startLocation.latitude,
        lng: activeTrip.startLocation.longitude,
        name: activeTrip.startLocation.name,
        isGps: false,
      };
    }

    return activeCity === 'kolkata'
      ? { lat: 22.5748, lng: 88.3582, name: 'Central Kolkata', isGps: false }
      : { lat: 21.7785, lng: 87.7510, name: 'Contai Central', isGps: false };
  }, [currentGpsPosition, visitedList, activeTrip, pandals, activeCity]);

  // 2. Multi-factor candidate ranking considering energy-aware walking, crowds, worth scores & weather
  const rankedCandidates = useMemo(() => {
    const cityPandals = pandals.filter(
      (p) => p.city === activeCity && !visitedList.includes(p.id)
    );

    if (cityPandals.length === 0) return [];

    const isHighWalkingFatigue =
      walkingEval.isApproachingLimit || walkingEval.isExceedingMax || walkingEval.walkedKm >= 5.5;

    return cityPandals
      .map((pandal) => {
        const crowdStatus = getPandalCrowdStatus(pandal.id, pandal);
        const dynamicScore = calculateDynamicVisitScore(pandal, crowdStatus, activeWeather);

        const comparison = compareAllTransportModes({
          originLat: originInfo.lat,
          originLng: originInfo.lng,
          destinationLat: pandal.latitude,
          destinationLng: pandal.longitude,
          originName: originInfo.name,
          destinationName: pandal.name,
          fromPandal: originInfo.pandal,
          toPandal: pandal,
          walkingPreference: activeTrip?.walkingPreference || 'normal',
          transportPreference: activeTrip?.preferredTransport || 'mixed',
          maxWalkingDistanceMeters: activeTrip?.maxWalkingDistanceMeters,
          todayWalkedDistanceMeters: walkingStats.totalDistanceMeters,
          energyAwareMode: true,
          city: activeCity,
          weather: activeWeather,
        });

        const worth = Math.round(pandal.overallQualityScore * 10);
        const travelMinutes = comparison.recommendedOption.totalDurationMinutes;
        const walkMeters = comparison.recommendedOption.walkingDistanceMeters;

        // Composite opportunity ranking
        let opportunityScore = dynamicScore.currentVisitScore * 10 - travelMinutes * 1.2;

        // Energy-Aware Trade-off logic (Requirement 8)
        let energyTradeoffNote: string | null = null;
        if (isHighWalkingFatigue) {
          if (walkMeters <= 750) {
            // Highly reward closer pandals to save walking
            opportunityScore += 18;
            energyTradeoffNote = `Saves walking fatigue (${formatDistance(walkMeters)} walk after ${walkingEval.walkedKm} km today).`;
          } else if (walkMeters > 1500) {
            // Penalize heavy walking when fatigued
            opportunityScore -= 16;
          }
        }

        // If rain is approaching, boost pandals that are closer or have Metro transit
        if (rainInfo.likely) {
          if (comparison.recommendedOption.mode === 'metro') {
            opportunityScore += 8;
          } else if (walkMeters <= 600) {
            opportunityScore += 6;
          } else {
            opportunityScore -= 6;
          }
        }

        // Crowd influence
        if (crowdStatus.crowdLevel === 'low') opportunityScore += 12;
        else if (crowdStatus.crowdLevel === 'moderate') opportunityScore += 6;
        else if (crowdStatus.crowdLevel === 'extreme' || crowdStatus.crowdLevel === 'peak_surge') {
          opportunityScore -= 12;
        }

        // Why now explanation generator
        const whyNowReasons: string[] = [];
        if (energyTradeoffNote) {
          whyNowReasons.push(energyTradeoffNote);
        }
        if (pandal.recommendationLevel === 'Must Visit' || pandal.overallQualityScore >= 9.5) {
          whyNowReasons.push('Artistic masterpiece');
        }
        if (walkMeters <= 700) {
          whyNowReasons.push(`Nearby (${formatDistance(walkMeters)})`);
        }
        if (crowdStatus.queueWaitMinutes <= 20) {
          whyNowReasons.push(`Short queue (~${crowdStatus.queueWaitMinutes}m)`);
        }
        if (rainInfo.likely) {
          whyNowReasons.push(`Best before rain in ~${rainInfo.inMinutes || 35}m`);
        }

        const whyNowText =
          whyNowReasons.length > 0
            ? whyNowReasons.join(' • ') + '.'
            : 'Optimal travel distance and smooth darshan timing.';

        return {
          pandal,
          crowdStatus,
          dynamicScore,
          comparison,
          worth,
          travelMinutes,
          opportunityScore,
          whyNowText,
          energyTradeoffNote,
        };
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore);
  }, [
    pandals,
    activeCity,
    visitedList,
    originInfo,
    activeTrip,
    activeWeather,
    rainInfo,
    walkingStats,
    walkingEval,
  ]);

  const currentRecommendation =
    rankedCandidates.length > 0
      ? rankedCandidates[candidateIndex % rankedCandidates.length]
      : null;

  if (!currentRecommendation) return null;

  const { pandal, crowdStatus, dynamicScore, comparison, whyNowText } = currentRecommendation;
  const bestOption = comparison.recommendedOption;
  const isInTrip = activeTrip?.selectedPandalIds.includes(pandal.id);

  // Compare alternative candidate to showcase energy savings (Requirement 8)
  const alternateCandidate =
    rankedCandidates.length > 1
      ? rankedCandidates[(candidateIndex + 1) % rankedCandidates.length]
      : null;

  const energySavingsText = useMemo(() => {
    if (!alternateCandidate) return null;
    const currentWalk = bestOption.walkingDistanceMeters;
    const altWalk = alternateCandidate.comparison.recommendedOption.walkingDistanceMeters;
    const currentTime = bestOption.totalDurationMinutes;
    const altTime = alternateCandidate.comparison.recommendedOption.totalDurationMinutes;

    const walkDiff = altWalk - currentWalk;
    const timeDiff = altTime - currentTime;

    if (walkDiff > 350 || timeDiff > 8) {
      const walkSavedStr = walkDiff > 200 ? `~${formatDistance(walkDiff)} less walking` : '';
      const timeSavedStr = timeDiff > 5 ? `~${timeDiff} mins faster` : '';
      const combined = [timeSavedStr, walkSavedStr].filter(Boolean).join(' and ');
      return `Recommended: ${pandal.name.split(' ')[0]} saves ${combined} vs ${alternateCandidate.pandal.name.split(' ')[0]}.`;
    }
    return null;
  }, [bestOption, alternateCandidate, pandal.name]);

  const handleNextCandidate = (e: React.MouseEvent) => {
    e.stopPropagation();
    playKanshorBell(0.5);
    setCandidateIndex((prev) => (prev + 1) % rankedCandidates.length);
  };

  return (
    <section
      id="what-should-we-do-now-card"
      className={`rounded-3xl p-4 sm:p-5 border shadow-lg relative overflow-hidden transition-all ${
        isDarkMode
          ? 'bg-gradient-to-br from-[#2D1220] via-[#1E141C] to-[#171016] border-[#F59E0B]/40 text-white'
          : 'bg-gradient-to-br from-[#FFFBEB] via-[#FEF3C7] to-[#FEE2E2] border-[#D97706]/35 text-stone-900'
      }`}
    >
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#881337] dark:bg-[#7F1D1D] text-white text-micro font-black uppercase tracking-wider shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#FDE68A] animate-pulse" />
          <span>🏆 Best Next Pandal Recommendation</span>
        </div>

        <button
          id="cycle-next-recommendation-btn"
          onClick={handleNextCandidate}
          className="inline-flex items-center gap-1 text-micro font-bold text-[#881337] dark:text-[#FEF08A] hover:opacity-80 transition-opacity"
        >
          <RefreshCw className="w-3 h-3" />
          <span>Option {candidateIndex + 1} of {Math.min(5, rankedCandidates.length)}</span>
        </button>
      </div>

      {/* Main Recommendation Content */}
      <div className="mt-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3
                onClick={() => onSelectPandal(pandal)}
                className="font-display font-black text-h3 sm:text-h2 text-stone-900 dark:text-white cursor-pointer hover:text-[#DC2626] transition-colors leading-tight"
              >
                {pandal.name}
              </h3>
              <span className="text-micro font-bold px-2 py-0.5 rounded-md bg-red-600 text-white shadow-xs">
                {pandal.recommendationLevel}
              </span>
            </div>
            <p className="font-bengali-serif text-small font-bold text-[#DC2626] dark:text-[#FEF08A] mt-0.5">
              {pandal.bengaliName}
            </p>
          </div>

          <div className="text-right shrink-0">
            <PandalVisitScoreBadge score={dynamicScore} />
          </div>
        </div>

        {/* Live Multi-Factor Attributes Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-micro">
          {/* Distance & Travel */}
          <div className="p-2 rounded-xl bg-white/70 dark:bg-black/30 border border-stone-200/60 dark:border-stone-800">
            <span className="text-stone-500 block text-[10px] uppercase font-bold">Route Leg</span>
            <span className="font-bold flex items-center gap-1 text-stone-900 dark:text-white">
              <Footprints className="w-3.5 h-3.5 text-amber-600" />
              <span>{formatDistance(bestOption.walkingDistanceMeters)} • {bestOption.totalDurationMinutes}m</span>
            </span>
          </div>

          {/* Live Crowd & Trend */}
          <div className="p-2 rounded-xl bg-white/70 dark:bg-black/30 border border-stone-200/60 dark:border-stone-800">
            <span className="text-stone-500 block text-[10px] uppercase font-bold">Crowd & Queue</span>
            <span className="font-bold flex items-center gap-1 capitalize text-stone-900 dark:text-white">
              <Users className="w-3.5 h-3.5 text-[#DC2626]" />
              <span>{crowdStatus.crowdLevel} (~{crowdStatus.queueWaitMinutes}m {crowdStatus.trendIcon})</span>
            </span>
          </div>

          {/* Energy & Fatigue Awareness */}
          <div className="p-2 rounded-xl bg-white/70 dark:bg-black/30 border border-stone-200/60 dark:border-stone-800">
            <span className="text-stone-500 block text-[10px] uppercase font-bold">Energy Target</span>
            <span className="font-bold flex items-center gap-1 text-stone-900 dark:text-white">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
              <span>{walkingEval.walkedKm} / {walkingConfig.maxWalkingLimitKm} km</span>
            </span>
          </div>

          {/* Weather Influence */}
          <div className="p-2 rounded-xl bg-white/70 dark:bg-black/30 border border-stone-200/60 dark:border-stone-800">
            <span className="text-stone-500 block text-[10px] uppercase font-bold">Weather Outlook</span>
            <span className="font-bold flex items-center gap-1 text-stone-900 dark:text-white">
              <Umbrella className="w-3.5 h-3.5 text-blue-500" />
              <span>{rainInfo.likely ? `Rain in ~${rainInfo.inMinutes || 35}m` : 'Clear Sky'}</span>
            </span>
          </div>
        </div>

        {/* Energy & Decision Intelligence Explanation */}
        <div className="p-3 rounded-2xl bg-white/85 dark:bg-black/40 border border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between text-micro font-black uppercase tracking-wider text-[#881337] dark:text-amber-200">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Why Visit Right Now?</span>
            </span>
            <button
              id="report-crowd-from-what-now-btn"
              onClick={() => setShowCrowdReportModal(true)}
              className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
            >
              <Users className="w-3 h-3" />
              <span>Submit Report</span>
            </button>
          </div>

          <p className="text-small text-stone-800 dark:text-stone-200 leading-relaxed font-medium">
            {whyNowText}
          </p>

          {/* Energy Saving Comparison Note if available */}
          {energySavingsText && (
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-micro text-emerald-900 dark:text-emerald-200 font-bold flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{energySavingsText}</span>
            </div>
          )}

          {/* Smart Transport Recommendation Strip */}
          <div className="pt-2 border-t border-stone-200/50 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap text-micro">
            <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-white">
              <span>{bestOption.icon}</span>
              <span>{bestOption.modeLabel} Recommended (~{bestOption.totalDurationMinutes} min)</span>
            </div>

            <button
              id="open-what-now-route-comparison-btn"
              onClick={() => setShowComparisonModal(true)}
              className="font-bold text-[#DC2626] dark:text-amber-300 hover:underline flex items-center gap-1"
            >
              <Layers className="w-3 h-3" />
              <span>Compare All 4 Modes</span>
            </button>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 pt-1">
          <button
            id="view-what-now-pandal-details-btn"
            onClick={() => onSelectPandal(pandal)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-small font-bold text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-center"
          >
            Pandal Details & Rituals
          </button>

          {onAddPandalToTrip && !isInTrip && (
            <button
              id="add-what-now-pandal-to-trip-btn"
              onClick={() => {
                onAddPandalToTrip(pandal.id);
                playKanshorBell(0.8);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#881337] to-[#DC2626] text-white text-small font-bold shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-4 h-4" />
              <span>Add to Active Trip</span>
            </button>
          )}

          {isInTrip && (
            <div className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-small font-bold text-center flex items-center justify-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>In Your Itinerary</span>
            </div>
          )}
        </div>
      </div>

      {/* Route Comparison Modal */}
      {showComparisonModal && (
        <RouteComparisonModal
          comparison={comparison}
          isOpen={showComparisonModal}
          onClose={() => setShowComparisonModal(false)}
        />
      )}

      {/* Community Crowd Report Modal */}
      {showCrowdReportModal && (
        <CrowdReportModal
          pandal={pandal}
          isOpen={showCrowdReportModal}
          onClose={() => setShowCrowdReportModal(false)}
        />
      )}
    </section>
  );
};

