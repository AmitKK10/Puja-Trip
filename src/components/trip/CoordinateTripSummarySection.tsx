import React, { useState, useMemo } from 'react';
import { Pandal, CityId } from '../../types';
import {
  calculateHaversineDistance,
  formatDistance,
  URBAN_WALKING_CIRCUITY_FACTOR,
} from '../../utils/geoUtils';
import { formatDurationHoursMins } from '../../services/tripPlanningEngine';
import {
  Navigation,
  Clock,
  Footprints,
  Share2,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Compass,
  ArrowRight,
  Route as RouteIcon,
  CheckCircle2,
} from 'lucide-react';
import { AlpanaCorner } from '../common/BengaliMotifs';

interface CoordinateTripSummarySectionProps {
  pandals: Pandal[];
  activeCity: CityId;
  isDarkMode?: boolean;
  onShareDeepLink?: () => void;
}

interface RouteSegment {
  fromPandal: Pandal;
  toPandal: Pandal;
  straightDistanceMeters: number;
  streetDistanceMeters: number;
  estimatedTravelMinutes: number;
}

export const CoordinateTripSummarySection: React.FC<CoordinateTripSummarySectionProps> = ({
  pandals,
  activeCity,
  isDarkMode = false,
  onShareDeepLink,
}) => {
  const [showSegmentDetails, setShowSegmentDetails] = useState(false);

  // Calculate coordinate-based distances and travel times
  const {
    segments,
    totalStraightMeters,
    totalStreetDistanceMeters,
    totalTravelMinutes,
    totalDarshanMinutes,
    grandTotalMinutes,
    estimatedSteps,
  } = useMemo(() => {
    if (pandals.length <= 1) {
      const singleDarshan = pandals[0]?.estimatedVisitDuration || 30;
      return {
        segments: [],
        totalStraightMeters: 0,
        totalStreetDistanceMeters: 0,
        totalTravelMinutes: 0,
        totalDarshanMinutes: singleDarshan,
        grandTotalMinutes: singleDarshan,
        estimatedSteps: 0,
      };
    }

    const calculatedSegments: RouteSegment[] = [];
    let straightSum = 0;
    let streetSum = 0;
    let travelMinsSum = 0;

    for (let i = 0; i < pandals.length - 1; i++) {
      const p1 = pandals[i];
      const p2 = pandals[i + 1];

      const straightMeters = calculateHaversineDistance(
        p1.coordinates.lat,
        p1.coordinates.lng,
        p2.coordinates.lat,
        p2.coordinates.lng
      );

      // Kolkata & Contai urban streets circuity multiplier
      const streetMeters = Math.round(straightMeters * URBAN_WALKING_CIRCUITY_FACTOR);

      // Travel time estimation:
      // Legs <= 1.2km are primarily pedestrian walking (~76 m/min)
      // Legs > 1.2km involve auto/metro/rickshaw transit (~220 m/min + 5 mins wait)
      let legMinutes = 0;
      if (streetMeters <= 1200) {
        legMinutes = Math.max(3, Math.round(streetMeters / 76));
      } else {
        legMinutes = Math.max(8, Math.round(5 + streetMeters / 220));
      }

      straightSum += straightMeters;
      streetSum += streetMeters;
      travelMinsSum += legMinutes;

      calculatedSegments.push({
        fromPandal: p1,
        toPandal: p2,
        straightDistanceMeters: straightMeters,
        streetDistanceMeters: streetMeters,
        estimatedTravelMinutes: legMinutes,
      });
    }

    const darshanSum = pandals.reduce(
      (acc, p) => acc + (p.estimatedVisitDuration || 35),
      0
    );

    // Approximate step count for pedestrian portions (~1,320 steps per km)
    const steps = Math.round((streetSum / 1000) * 1320);

    return {
      segments: calculatedSegments,
      totalStraightMeters: straightSum,
      totalStreetDistanceMeters: streetSum,
      totalTravelMinutes: travelMinsSum,
      totalDarshanMinutes: darshanSum,
      grandTotalMinutes: travelMinsSum + darshanSum,
      estimatedSteps: steps,
    };
  }, [pandals]);

  if (pandals.length === 0) {
    return null;
  }

  const formattedDistance = formatDistance(totalStreetDistanceMeters);
  const formattedStraightDistance = formatDistance(totalStraightMeters);
  const formattedTravelTime = formatDurationHoursMins(totalTravelMinutes);
  const formattedTotalTime = formatDurationHoursMins(grandTotalMinutes);
  const formattedDarshanTime = formatDurationHoursMins(totalDarshanMinutes);

  return (
    <div
      id="coordinate-trip-summary-section"
      className={`rounded-3xl border shadow-lg relative overflow-hidden transition-all ${
        isDarkMode
          ? 'bg-gradient-to-br from-[#2D1622] via-[#20151C] to-[#171015] border-[#F59E0B]/30 text-white'
          : 'bg-gradient-to-br from-[#881337] via-[#991B1B] to-[#7F1D1D] border-[#FDE68A]/30 text-white'
      }`}
    >
      <AlpanaCorner
        position="top-right"
        size={56}
        color="#FDE68A"
        className="absolute top-1 right-1 opacity-25 pointer-events-none"
      />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black/30 border border-white/20 flex items-center justify-center text-[#FEF08A]">
              <RouteIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-h3 sm:text-h2 tracking-tight text-white">
                  Trip Summary
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/15 border border-white/20 text-[#FEF08A]">
                  GPS Coordinate Route
                </span>
              </div>
              <p className="text-[11px] text-amber-200/80 font-medium">
                Calculated via WGS-84 coordinates for {pandals.length} pandal stops in {activeCity === 'kolkata' ? 'Kolkata' : 'Contai'}
              </p>
            </div>
          </div>

          {/* Quick Share Button */}
          {onShareDeepLink && (
            <button
              onClick={onShareDeepLink}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 border border-white/25 text-white font-bold text-micro shadow-sm transition-all flex items-center gap-1.5"
              title="Share deep link for this route"
            >
              <Share2 className="w-3.5 h-3.5 text-[#FEF08A]" />
              <span>Share Route</span>
            </button>
          )}
        </div>

        {/* Primary High-Impact Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Total Estimated Travel Time */}
          <div className="p-3 rounded-2xl bg-black/25 border border-white/15 flex flex-col justify-center">
            <div className="flex items-center gap-1 text-[11px] text-amber-200 font-bold uppercase tracking-wider mb-0.5">
              <Clock className="w-3 h-3 text-[#F59E0B]" />
              <span>Travel Time</span>
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-white tabular-nums">
              {formattedTravelTime}
            </div>
            <span className="text-[10px] text-amber-200/75 mt-0.5">
              Between all {pandals.length} stops
            </span>
          </div>

          {/* Total Route Distance */}
          <div className="p-3 rounded-2xl bg-black/25 border border-white/15 flex flex-col justify-center">
            <div className="flex items-center gap-1 text-[11px] text-amber-200 font-bold uppercase tracking-wider mb-0.5">
              <Navigation className="w-3 h-3 text-[#38BDF8]" />
              <span>Total Distance</span>
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#FEF08A] tabular-nums">
              {formattedDistance}
            </div>
            <span className="text-[10px] text-amber-200/75 mt-0.5">
              ({formattedStraightDistance} straight-line)
            </span>
          </div>

          {/* Total Time with Darshan */}
          <div className="p-3 rounded-2xl bg-black/25 border border-white/15 flex flex-col justify-center">
            <div className="flex items-center gap-1 text-[11px] text-amber-200 font-bold uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3 h-3 text-[#FDE68A]" />
              <span>Grand Total</span>
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-white tabular-nums">
              {formattedTotalTime}
            </div>
            <span className="text-[10px] text-amber-200/75 mt-0.5">
              Incl. {formattedDarshanTime} darshan
            </span>
          </div>

          {/* Estimated Steps / Energy */}
          <div className="p-3 rounded-2xl bg-black/25 border border-white/15 flex flex-col justify-center">
            <div className="flex items-center gap-1 text-[11px] text-amber-200 font-bold uppercase tracking-wider mb-0.5">
              <Footprints className="w-3 h-3 text-[#34D399]" />
              <span>Est. Walking</span>
            </div>
            <div className="font-display font-black text-2xl sm:text-3xl text-[#FEF08A] tabular-nums">
              {estimatedSteps.toLocaleString()}
            </div>
            <span className="text-[10px] text-amber-200/75 mt-0.5">
              ~{Math.round(estimatedSteps * 0.04)} kcal energy
            </span>
          </div>
        </div>

        {/* Route Details & Leg Breakdown Toggle */}
        {segments.length > 0 && (
          <div className="pt-2 border-t border-white/15">
            <button
              onClick={() => setShowSegmentDetails(!showSegmentDetails)}
              className="w-full flex items-center justify-between text-micro text-amber-200 font-bold hover:text-white transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#FEF08A]" />
                <span>
                  View Coordinate Breakdown for {segments.length} Route Leg{segments.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px]">
                  {showSegmentDetails ? 'Hide details' : 'Show distance per stop'}
                </span>
                {showSegmentDetails ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Expandable Segment Breakdown */}
            {showSegmentDetails && (
              <div className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-1">
                {segments.map((seg, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-black/35 border border-white/15 flex items-center justify-between gap-2 text-micro"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-full bg-white/20 text-[#FEF08A] font-black text-[10px] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-1 truncate font-bold text-white">
                          <span className="truncate">{seg.fromPandal.name}</span>
                          <ArrowRight className="w-3 h-3 text-amber-300 shrink-0" />
                          <span className="truncate text-amber-200">{seg.toPandal.name}</span>
                        </div>
                        <span className="text-[10px] text-stone-300">
                          GPS: ({seg.fromPandal.coordinates.lat.toFixed(3)}, {seg.fromPandal.coordinates.lng.toFixed(3)}) → ({seg.toPandal.coordinates.lat.toFixed(3)}, {seg.toPandal.coordinates.lng.toFixed(3)})
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-extrabold text-[#FEF08A] block tabular-nums">
                        {formatDistance(seg.streetDistanceMeters)}
                      </span>
                      <span className="text-[10px] text-stone-300 tabular-nums">
                        ~{seg.estimatedTravelMinutes} mins travel
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
