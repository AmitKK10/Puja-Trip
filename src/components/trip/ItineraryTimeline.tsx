import React, { useState, useEffect, useMemo } from 'react';
import {
  ItineraryStop,
  Pandal,
  UserPreferences,
  RecommendationLevel,
  GroupTripProgressSummary,
  PandalGroupVisitSummary,
  UserProfile,
} from '../../types';
import {
  getCurrentUserProfile,
  getMyTripGroups,
  getGroupVisitStatuses,
  getPandalGroupVisitSummary,
  getGroupTripProgressSummary,
  markGroupPandalDarshan,
  subscribeToTripUpdates,
  seedDemoVisitStatusesIfEmpty,
} from '../../services/friendGroupService';
import { PandalGroupVisitCard } from '../group/PandalGroupVisitCard';
import { GroupProgressSummaryCard } from '../group/GroupProgressSummaryCard';
import { RouteComparisonModal } from './RouteComparisonModal';
import { CrowdIntensityIndicator } from '../common/CrowdIntensityIndicator';
import { BestTimeToVisitIndicator } from './BestTimeToVisitIndicator';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  MapPin,
  Clock,
  Navigation,
  CheckCircle2,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Compass,
  ArrowRight,
  ShieldCheck,
  Footprints,
  Eye,
  Users,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface ItineraryTimelineProps {
  stops: ItineraryStop[];
  visitedList: string[];
  onToggleVisited: (pandalId: string) => void;
  onSelectPandal: (pandal: Pandal) => void;
  onRemovePandal: (pandalId: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  userPrefs: UserPreferences;
}

export const ItineraryTimeline: React.FC<ItineraryTimelineProps> = ({
  stops,
  visitedList,
  onToggleVisited,
  onSelectPandal,
  onRemovePandal,
  onMoveUp,
  onMoveDown,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const currentUser: UserProfile = useMemo(() => getCurrentUserProfile(), []);
  const [activeComparisonStop, setActiveComparisonStop] = useState<ItineraryStop | null>(null);
  
  // Find current active shared group (if any)
  const myGroups = useMemo(() => getMyTripGroups(), []);
  const activeGroup = myGroups[0] || null;
  const tripId = activeGroup?.trip.id || 'default-group-trip';

  // Seed demo visit statuses if empty
  useEffect(() => {
    if (activeGroup) {
      seedDemoVisitStatusesIfEmpty(activeGroup.trip.id, activeGroup.trip.selectedPandalIds);
    }
  }, [activeGroup]);

  // Real-time group visit state
  const [groupVisitVersion, setGroupVisitVersion] = useState(0);

  useEffect(() => {
    if (!activeGroup) return;
    const unsubscribe = subscribeToTripUpdates(activeGroup.trip.id, () => {
      setGroupVisitVersion((v) => v + 1);
    });
    return () => unsubscribe();
  }, [activeGroup]);

  // Group Progress Summary
  const groupProgressSummary: GroupTripProgressSummary | null = useMemo(() => {
    if (!activeGroup) return null;
    return getGroupTripProgressSummary(activeGroup.trip.id);
  }, [activeGroup, groupVisitVersion, visitedList]);

  const pandalStops = useMemo(() => stops.filter((s) => s.type === 'pandal' && s.pandalId), [stops]);

  const getRecommendationBadge = (level?: RecommendationLevel) => {
    switch (level) {
      case 'Must Visit':
        return 'bg-gradient-to-r from-red-600 to-rose-700 text-white font-black border-red-700';
      case 'Highly Recommended':
        return 'bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold border-amber-700';
      case 'Good':
        return 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold border-emerald-700';
      case 'Optional':
        return 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium border-stone-300 dark:border-stone-600';
      default:
        return 'bg-stone-200 text-stone-700';
    }
  };

  // Handle Mark My Darshan with audio + confetti celebration
  const handleToggleMyDarshan = async (pandalId: string, pandalName: string) => {
    onToggleVisited(pandalId);
    if (activeGroup) {
      const isCurrentlyVisited = visitedList.includes(pandalId);
      await markGroupPandalDarshan(
        activeGroup.trip.id,
        pandalId,
        pandalName,
        currentUser.id,
        !isCurrentlyVisited
      );
      setGroupVisitVersion((v) => v + 1);
    }
    playKanshorBell(0.8);
    playDhakHit('dha', 0.8);
  };

  return (
    <div className="space-y-4" id="itinerary-timeline-wrapper">
      {/* 1. Group Overall Progress Card if in Shared Group Trip */}
      {groupProgressSummary && (
        <GroupProgressSummaryCard
          progressSummary={groupProgressSummary}
          isDarkMode={isDarkMode}
        />
      )}

      {/* 2. Timeline Track */}
      <div className="relative pl-3 sm:pl-4">
        {/* Continuous timeline vertical track line */}
        <div className="absolute left-[23px] sm:left-[27px] top-6 bottom-6 w-1 bg-gradient-to-b from-[#DC2626] via-[#F59E0B] to-[#10B981] rounded-full opacity-60 pointer-events-none" />

        <div className="space-y-4">
          {stops.map((stop, index) => {
            const isStart = stop.type === 'start';
            const isEnd = stop.type === 'end';
            const isPandal = stop.type === 'pandal';
            const isVisited = stop.pandalId ? visitedList.includes(stop.pandalId) : false;

            // Get Group Visit Summary for this Pandal
            const visitSummary: PandalGroupVisitSummary | null =
              isPandal && stop.pandalId && activeGroup
                ? getPandalGroupVisitSummary(activeGroup.trip.id, stop.pandalId, currentUser.id)
                : null;

            return (
              <div key={stop.id} className="relative">
                {/* Transit Leg Connector Card (if not first stop) */}
                {index > 0 && (
                  <div className="my-2.5 ml-10 mr-1 p-3 rounded-2xl bg-amber-500/10 dark:bg-stone-900/80 border border-amber-500/25 text-stone-700 dark:text-stone-300 text-micro shadow-sm space-y-2">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 font-semibold">
                        <span className="text-lg">{stop.transportIcon}</span>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-stone-900 dark:text-stone-100 font-bold">
                              {stop.transportModeLabel}
                            </span>
                            {stop.smartModeOption?.isRecommended && (
                              <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-[10px]">
                                Best Mode
                              </span>
                            )}
                          </div>
                          {stop.smartRecommendationReason && (
                            <p className="text-[11px] text-stone-600 dark:text-stone-400 line-clamp-1">
                              {stop.smartRecommendationReason}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right tabular-nums">
                          <span className="text-amber-700 dark:text-amber-300 font-bold block">
                            ~{stop.estimatedTravelMinutes} min
                          </span>
                          <span className="text-[11px] text-stone-500 block">
                            {stop.formattedDistanceFromPrev}
                          </span>
                        </div>

                        {stop.routeComparison && (
                          <button
                            id={`compare-transit-leg-btn-${stop.id}`}
                            onClick={() => setActiveComparisonStop(stop)}
                            className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-stone-800 border border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-stone-700 font-bold text-micro shadow-xs flex items-center gap-1 transition-all"
                          >
                            <Layers className="w-3 h-3 text-[#DC2626]" />
                            <span>Compare</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stop Card */}
                <div className="flex items-start gap-3">
                  {/* Left Node Badge */}
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 z-10 shadow-md font-display font-black text-micro ${
                      isStart
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white ring-4 ring-blue-500/20'
                        : isEnd
                        ? 'bg-gradient-to-br from-emerald-600 to-green-700 text-white ring-4 ring-emerald-500/20'
                        : isVisited
                        ? 'bg-gradient-to-br from-green-600 to-emerald-700 text-white ring-4 ring-green-500/20'
                        : 'bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white ring-4 ring-red-500/20'
                    }`}
                  >
                    {isStart ? 'START' : isEnd ? 'END' : stop.stopIndex}
                  </div>

                  {/* Stop Content Card */}
                  <div
                    className={`flex-1 rounded-2xl p-3.5 border transition-all shadow-sm space-y-3 ${
                      isStart || isEnd
                        ? isDarkMode
                          ? 'bg-[#221820] border-[#F59E0B]/30 text-white'
                          : 'bg-stone-50 border-[#D97706]/25 text-stone-900'
                        : isVisited
                        ? 'bg-green-500/10 border-green-500/40 text-stone-900 dark:text-white'
                        : isDarkMode
                        ? 'bg-[#281B23] border-[#F59E0B]/20 text-white hover:border-[#F59E0B]/40'
                        : 'bg-white border-[#D97706]/20 text-stone-800 hover:border-[#D97706]/40'
                    }`}
                  >
                    {/* Top Row: Title, Bengali Name, Timings */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4
                            className={`font-display font-bold text-h4 sm:text-h3 leading-tight transition-all duration-300 ${
                              isVisited
                                ? 'line-through decoration-[#DC2626] decoration-[2px] text-stone-400 dark:text-stone-500'
                                : ''
                            } ${
                              isPandal && stop.pandal
                                ? 'cursor-pointer hover:text-[#DC2626]'
                                : ''
                            }`}
                            onClick={() => {
                              if (isPandal && stop.pandal) onSelectPandal(stop.pandal);
                            }}
                          >
                            {stop.locationName}
                          </h4>

                          {/* Recommendation badge & Worth score for pandals */}
                          {isPandal && stop.recommendationLevel && (
                            <span
                              className={`text-micro px-2 py-0.5 rounded-md border uppercase tracking-wider ${getRecommendationBadge(
                                stop.recommendationLevel
                              )}`}
                            >
                              {stop.recommendationLevel}
                            </span>
                          )}

                          {isPandal && stop.worthScore !== undefined && (
                            <span className="text-micro font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-0.5 tabular-nums">
                              <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                              <span>{stop.worthScore} Worth</span>
                            </span>
                          )}
                        </div>

                        {stop.bengaliLocationName && (
                          <p className={`font-bengali-serif text-small font-bold mt-0.5 transition-all duration-300 ${
                            isVisited
                              ? 'line-through decoration-stone-400 text-stone-400 dark:text-stone-600'
                              : 'text-[#DC2626] dark:text-[#FEF08A]'
                          }`}>
                            {stop.bengaliLocationName}
                          </p>
                        )}

                        {/* Crowd Intensity Indicator with Traffic Light System */}
                        {isPandal && stop.pandal && (
                          <div className="mt-1.5">
                            <CrowdIntensityIndicator
                              pandal={stop.pandal}
                              variant="badge"
                              size="sm"
                              showTrafficLights={true}
                            />
                          </div>
                        )}
                      </div>

                      {/* Visited & Action Controls for pandals */}
                      {isPandal && stop.pandalId && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleToggleMyDarshan(stop.pandalId!, stop.locationName)}
                            className={`p-1.5 rounded-xl border transition-all ${
                              isVisited
                                ? 'bg-green-600 border-green-600 text-white shadow-sm'
                                : 'bg-stone-100 dark:bg-stone-800 text-stone-500 border-stone-300 dark:border-stone-700 hover:text-green-600'
                            }`}
                            title={isVisited ? 'Visited (Completed)' : 'Mark as Visited'}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>

                          {/* Reorder Arrows */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              disabled={stop.stopIndex <= 1}
                              onClick={() => onMoveUp(stop.stopIndex - 1)}
                              className="p-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 disabled:opacity-20 hover:bg-stone-200 dark:hover:bg-stone-700"
                              title="Move stop earlier"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={stop.stopIndex >= stops.length - 2}
                              onClick={() => onMoveDown(stop.stopIndex - 1)}
                              className="p-1 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 disabled:opacity-20 hover:bg-stone-200 dark:hover:bg-stone-700"
                              title="Move stop later"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            onClick={() => onRemovePandal(stop.pandalId!)}
                            className="p-1.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40"
                            title="Remove from trip"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Planned Timing & Visit Details */}
                    <div className="pt-2 border-t border-stone-200/80 dark:border-stone-800 flex items-center justify-between gap-2 text-micro flex-wrap">
                      <div className="flex items-center gap-3 text-stone-600 dark:text-stone-300 font-semibold tabular-nums">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[#DC2626]" />
                          <span>
                            Arrive:{' '}
                            <strong className="text-stone-900 dark:text-white font-bold">
                              {stop.plannedArrivalTime}
                            </strong>
                          </span>
                        </span>

                        {isPandal && (
                          <>
                            <span>→</span>
                            <span>
                              Depart:{' '}
                              <strong className="text-stone-900 dark:text-white font-bold">
                                {stop.plannedDepartureTime}
                              </strong>
                            </span>
                          </>
                        )}
                      </div>

                      {isPandal && (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-bold tabular-nums">
                            ~{stop.estimatedVisitDurationMinutes}m darshan
                          </span>

                          {stop.pandal && (
                            <button
                              onClick={() => onSelectPandal(stop.pandal!)}
                              className="inline-flex items-center gap-1 text-[#DC2626] hover:underline font-bold"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Historical Best Time to Visit Indicator based on Kolkata & Contai crowd cycles */}
                    {isPandal && stop.pandal && (
                      <div className="pt-1">
                        <BestTimeToVisitIndicator
                          pandal={stop.pandal}
                          city={userPrefs.activeCity}
                          plannedArrivalTime={stop.plannedArrivalTime}
                          variant="strip"
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    )}

                    {/* 3. Squad Visit Breakdown (Who has visited in the squad) */}
                    {isPandal && visitSummary && (
                      <div className="pt-1">
                        <PandalGroupVisitCard
                          summary={visitSummary}
                          onToggleMyVisit={() =>
                            handleToggleMyDarshan(stop.pandalId!, stop.locationName)
                          }
                          isDarkMode={isDarkMode}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Route Comparison Modal */}
      {activeComparisonStop?.routeComparison && (
        <RouteComparisonModal
          comparison={activeComparisonStop.routeComparison}
          isOpen={!!activeComparisonStop}
          onClose={() => setActiveComparisonStop(null)}
        />
      )}
    </div>
  );
};
