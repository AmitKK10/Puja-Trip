import React, { useMemo } from 'react';
import { Pandal, CrowdLevel, CrowdTrend } from '../../types';
import { getPandalCrowdStatus } from '../../services/crowdIntelligenceService';
import { Users, TrendingUp, TrendingDown, Minus, Flame, Clock, Sparkles } from 'lucide-react';

interface PandalCrowdHeatmapProps {
  pandal: Pandal;
  variant?: 'compact' | 'full';
  showPeakHours?: boolean;
}

/**
 * Calculates estimated real-time crowd density percentage (10% to 100%)
 * from queueWaitMinutes and crowdLevel in the pandal data structure.
 */
export function calculateCrowdDensityPercentage(level: CrowdLevel, waitMinutes: number): number {
  if (level === 'peak_surge') {
    return Math.min(99, Math.max(85, 75 + Math.round(waitMinutes * 0.3)));
  }
  if (level === 'high') {
    return Math.min(84, Math.max(60, 50 + Math.round(waitMinutes * 0.5)));
  }
  if (level === 'moderate') {
    return Math.min(59, Math.max(30, 25 + Math.round(waitMinutes * 0.8)));
  }
  // Low crowd
  return Math.min(29, Math.max(12, 10 + Math.round(waitMinutes * 0.8)));
}

export const PandalCrowdHeatmap: React.FC<PandalCrowdHeatmapProps> = ({
  pandal,
  variant = 'full',
  showPeakHours = true,
}) => {
  const liveStatus = useMemo(() => {
    return getPandalCrowdStatus(pandal.id, pandal);
  }, [pandal]);

  const level: CrowdLevel = liveStatus?.crowdLevel || pandal.crowdLevel || 'moderate';
  const waitMinutes: number = liveStatus?.queueWaitMinutes ?? pandal.queueWaitMinutes ?? 20;
  const trend: CrowdTrend = liveStatus?.trend || 'stable';

  const densityPercent = calculateCrowdDensityPercentage(level, waitMinutes);

  // Color config based on heatmap density zone
  const heatConfig = useMemo(() => {
    if (densityPercent >= 80) {
      return {
        label: 'Peak Surge',
        bengaliLabel: 'চরম ভিড়',
        textColor: 'text-rose-700 dark:text-rose-300',
        badgeBg: 'bg-rose-100 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-950 dark:text-rose-200 font-bold',
        gradient: 'from-amber-400 via-orange-500 to-rose-600',
        needleColor: 'bg-rose-600 shadow-[0_0_8px_rgba(225,29,72,0.9)]',
        accentBar: 'bg-rose-600',
        icon: Flame,
      };
    }
    if (densityPercent >= 55) {
      return {
        label: 'High Density',
        bengaliLabel: 'ভারী ভিড়',
        textColor: 'text-orange-700 dark:text-orange-300',
        badgeBg: 'bg-orange-100 dark:bg-orange-950/60 border-orange-300 dark:border-orange-700 text-orange-950 dark:text-orange-200 font-bold',
        gradient: 'from-emerald-400 via-amber-400 to-orange-500',
        needleColor: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]',
        accentBar: 'bg-orange-500',
        icon: Users,
      };
    }
    if (densityPercent >= 30) {
      return {
        label: 'Moderate',
        bengaliLabel: 'মাঝারি ভিড়',
        textColor: 'text-amber-800 dark:text-amber-300',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-200 font-bold',
        gradient: 'from-emerald-400 to-amber-400',
        needleColor: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]',
        accentBar: 'bg-amber-500',
        icon: Users,
      };
    }
    return {
      label: 'Low Crowd',
      bengaliLabel: 'স্বল্প ভিড়',
      textColor: 'text-emerald-800 dark:text-emerald-300',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 font-bold',
      gradient: 'from-emerald-500 to-teal-400',
      needleColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
      accentBar: 'bg-emerald-500',
      icon: Users,
    };
  }, [densityPercent]);

  const StatusIcon = heatConfig.icon;

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2" title={`Estimated Crowd Density: ${densityPercent}%`}>
        <div className="w-16 h-2 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-rose-600 rounded-full"
            style={{ width: `${densityPercent}%` }}
          />
        </div>
        <span className={`text-micro font-bold tabular-nums ${heatConfig.textColor}`}>
          {densityPercent}%
        </span>
      </div>
    );
  }

  return (
    <div
      id={`crowd-heatmap-${pandal.id}`}
      className="p-2.5 rounded-2xl bg-stone-50/90 dark:bg-black/30 border border-stone-200/80 dark:border-stone-800/80 space-y-1.5 transition-all"
    >
      {/* Top Header: Density Label, Bengali translation & Trend */}
      <div className="flex items-center justify-between gap-1 text-micro">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="flex items-center gap-1 font-bold text-stone-700 dark:text-stone-300">
            <StatusIcon className={`w-3.5 h-3.5 ${heatConfig.textColor}`} />
            <span>Estimated Density:</span>
          </span>
          <span
            className={`px-1.5 py-0.2 rounded-md font-black border text-micro flex items-center gap-1 ${heatConfig.badgeBg}`}
          >
            <span>{densityPercent}%</span>
            <span>•</span>
            <span>{heatConfig.label}</span>
            <span className="font-bengali font-semibold opacity-90 hidden xs:inline">
              ({heatConfig.bengaliLabel})
            </span>
          </span>
        </div>

        {/* Wait time & Trend */}
        <div className="flex items-center gap-1 font-bold shrink-0 tabular-nums">
          <span className="text-stone-700 dark:text-stone-300">~{waitMinutes}m queue</span>
          {trend === 'increasing' && (
            <span className="text-rose-500 flex items-center" title="Crowd is increasing">
              <TrendingUp className="w-3 h-3" />
            </span>
          )}
          {trend === 'decreasing' && (
            <span className="text-emerald-500 flex items-center" title="Crowd is decreasing">
              <TrendingDown className="w-3 h-3" />
            </span>
          )}
          {trend === 'stable' && (
            <span className="text-stone-400 flex items-center" title="Crowd is steady">
              <Minus className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      {/* Visual Color-Coded Heatmap Track */}
      <div className="relative pt-1 pb-0.5">
        {/* Continuous 4-zone spectrum bar */}
        <div className="h-2.5 w-full rounded-full bg-stone-200 dark:bg-stone-800 relative overflow-hidden shadow-inner">
          <div
            className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-amber-400 via-orange-500 to-rose-600 opacity-90"
            style={{ width: '100%' }}
          />
        </div>

        {/* Needle / Pin Indicator at current estimated density */}
        <div
          className="absolute top-0 -ml-1.5 transition-all duration-500 flex flex-col items-center pointer-events-none"
          style={{ left: `${Math.max(3, Math.min(97, densityPercent))}%` }}
        >
          <div
            className={`w-3 h-4 rounded-full border-2 border-white dark:border-stone-900 ${heatConfig.needleColor} transition-transform`}
          />
        </div>

        {/* Scale labels */}
        <div className="flex justify-between text-[10px] text-stone-600 dark:text-stone-400 font-semibold px-0.5 pt-1 select-none">
          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Low (0-25%)</span>
          <span className="text-amber-700 dark:text-amber-400 font-bold">Moderate (50%)</span>
          <span className="text-orange-700 dark:text-orange-400 font-bold">High (75%)</span>
          <span className="text-rose-700 dark:text-rose-400 font-bold">Surge (90%+)</span>
        </div>
      </div>

      {/* Peak hours info snippet if enabled */}
      {showPeakHours && pandal.peakHours && (
        <div className="flex items-center justify-between text-micro text-stone-500 dark:text-stone-400 pt-0.5 border-t border-stone-200/60 dark:border-stone-800/60">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-stone-400" />
            <span>Peak: {pandal.peakHours}</span>
          </span>
          {pandal.bestTimeToVisit && (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Best: {pandal.bestTimeToVisit}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
