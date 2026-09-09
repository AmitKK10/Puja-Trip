import React, { useMemo } from 'react';
import { Pandal } from '../../types';
import { Users, AlertTriangle, CheckCircle2, Clock, Activity, Compass, Flame } from 'lucide-react';

export type CrowdDensityLevel = 'green' | 'yellow' | 'red';

export interface CrowdDensityInfo {
  level: CrowdDensityLevel;
  colorHex: string;
  bgLightClass: string;
  borderClass: string;
  textClass: string;
  label: string;
  bengaliLabel: string;
  waitMinutes: number;
  devoteesPerSqMeter: number;
  capacityPct: number;
  flowRatePerMin: number;
  gateStatus: string;
  recommendation: string;
  advisoryTip: string;
}

/**
 * Computes deterministic dummy crowd density telemetry for a given pandal.
 * Returns color-coded status (Green / Yellow / Red).
 */
export function getCrowdDensityInfo(pandal: Pandal): CrowdDensityInfo {
  // Deterministic seed based on pandal id characters
  const charSum = pandal.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  
  // Use pandal.queueWaitMinutes or crowdLevel to anchor the calculation
  let wait = pandal.queueWaitMinutes || 25;
  if (pandal.crowdLevel === 'low') {
    wait = Math.min(wait, 18);
  } else if (pandal.crowdLevel === 'peak_surge' || pandal.crowdLevel === 'extreme') {
    wait = Math.max(wait, 45);
  }

  // Determine Green / Yellow / Red category
  if (wait <= 20) {
    const devotees = +(0.3 + ((charSum % 7) / 10)).toFixed(1); // 0.3 - 0.9 / m²
    const capPct = Math.round(20 + (charSum % 18)); // 20 - 37%
    const flow = 60 + (charSum % 25); // 60 - 84 devotees/min
    return {
      level: 'green',
      colorHex: '#16A34A',
      bgLightClass: 'bg-emerald-500/15 dark:bg-emerald-950/40',
      borderClass: 'border-emerald-500/40 dark:border-emerald-500/50',
      textClass: 'text-emerald-700 dark:text-emerald-300',
      label: 'Low Crowd Density',
      bengaliLabel: 'স্বাভাবিক ভিড় (মসৃণ দর্শন)',
      waitMinutes: wait,
      devoteesPerSqMeter: devotees,
      capacityPct: capPct,
      flowRatePerMin: flow,
      gateStatus: 'Gates Open & Free-Flowing',
      recommendation: 'Ideal darshan window! Minimal queue delay inside the courtyard.',
      advisoryTip: 'Best time to take family and elderly members right now.',
    };
  } else if (wait <= 38) {
    const devotees = +(1.2 + ((charSum % 12) / 10)).toFixed(1); // 1.2 - 2.3 / m²
    const capPct = Math.round(45 + (charSum % 22)); // 45 - 66%
    const flow = 38 + (charSum % 18); // 38 - 55 devotees/min
    return {
      level: 'yellow',
      colorHex: '#CA8A04',
      bgLightClass: 'bg-amber-500/15 dark:bg-amber-950/40',
      borderClass: 'border-amber-500/40 dark:border-amber-500/50',
      textClass: 'text-amber-800 dark:text-amber-300',
      label: 'Moderate Density',
      bengaliLabel: 'পরিমিত ভিড় (চলতি লাইন)',
      waitMinutes: wait,
      devoteesPerSqMeter: devotees,
      capacityPct: capPct,
      flowRatePerMin: flow,
      gateStatus: 'Single-Lane Staggered Queue',
      recommendation: 'Steady moving line. Entry barricades operational with moderate pace.',
      advisoryTip: 'Keep water handy; queue moves forward every 2-3 minutes.',
    };
  } else {
    const devotees = +(2.8 + ((charSum % 16) / 10)).toFixed(1); // 2.8 - 4.3 / m²
    const capPct = Math.round(75 + (charSum % 22)); // 75 - 96%
    const flow = 18 + (charSum % 14); // 18 - 31 devotees/min
    return {
      level: 'red',
      colorHex: '#DC2626',
      bgLightClass: 'bg-red-500/15 dark:bg-red-950/40',
      borderClass: 'border-red-500/40 dark:border-red-500/50',
      textClass: 'text-red-700 dark:text-red-300',
      label: 'High Crowd Density',
      bengaliLabel: 'অতিরিক্ত ভিড় (নিয়ন্ত্রিত প্রবেশ)',
      waitMinutes: wait,
      devoteesPerSqMeter: devotees,
      capacityPct: capPct,
      flowRatePerMin: flow,
      gateStatus: 'Crowd Holding Pens Active',
      recommendation: 'Dense festive rush inside mandap. Kolkata Police batching protocol active.',
      advisoryTip: 'Expect slow queue crawl. Hold group members together and secure belongings.',
    };
  }
}

interface CrowdDensityVisualIndicatorProps {
  pandal: Pandal;
  variant?: 'badge' | 'compact' | 'card' | 'detailed';
  showAvoidanceTip?: boolean;
  isDarkMode?: boolean;
  className?: string;
}

export const CrowdDensityVisualIndicator: React.FC<CrowdDensityVisualIndicatorProps> = ({
  pandal,
  variant = 'card',
  showAvoidanceTip = true,
  isDarkMode = false,
  className = '',
}) => {
  const density = useMemo(() => getCrowdDensityInfo(pandal), [pandal]);

  // Variant 1: Compact Badge (Ideal for Lists, Map Bottom Sheets, and Map Pins)
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-micro font-bold shadow-xs ${density.bgLightClass} ${density.borderClass} ${density.textClass} ${className}`}
        title={`${density.label}: ~${density.waitMinutes}m queue (${density.devoteesPerSqMeter} dev/m²)`}
      >
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
          style={{ backgroundColor: density.colorHex }}
        />
        <span className="font-extrabold uppercase tracking-wider text-[10px]">
          {density.level === 'green' ? 'Low' : density.level === 'yellow' ? 'Moderate' : 'High'} Density
        </span>
        <span className="opacity-60">•</span>
        <span className="tabular-nums">{density.waitMinutes}m</span>
      </div>
    );
  }

  // Variant 2: Compact Traffic Light Bar (Great for Map Cards)
  if (variant === 'compact') {
    return (
      <div
        className={`p-2.5 rounded-2xl border ${density.bgLightClass} ${density.borderClass} ${className}`}
      >
        <div className="flex items-center justify-between gap-2">
          {/* Traffic light 3-pill indicator */}
          <div className="flex items-center gap-1.5 bg-black/10 dark:bg-black/30 p-1 rounded-full border border-black/10">
            <span
              className={`w-3 h-3 rounded-full transition-all ${
                density.level === 'green'
                  ? 'bg-emerald-500 shadow-sm shadow-emerald-500/80 ring-2 ring-emerald-400/50 scale-110'
                  : 'bg-stone-300 dark:bg-stone-700 opacity-40'
              }`}
              title="Green: Low Density (<20m)"
            />
            <span
              className={`w-3 h-3 rounded-full transition-all ${
                density.level === 'yellow'
                  ? 'bg-amber-400 shadow-sm shadow-amber-400/80 ring-2 ring-amber-300/50 scale-110'
                  : 'bg-stone-300 dark:bg-stone-700 opacity-40'
              }`}
              title="Yellow: Moderate Density (20-38m)"
            />
            <span
              className={`w-3 h-3 rounded-full transition-all ${
                density.level === 'red'
                  ? 'bg-red-500 shadow-sm shadow-red-500/80 ring-2 ring-red-400/50 scale-110'
                  : 'bg-stone-300 dark:bg-stone-700 opacity-40'
              }`}
              title="Red: High Density (>38m)"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className={`text-small font-black ${density.textClass}`}>
                {density.label}
              </span>
              <span className="text-micro font-medium text-stone-500 dark:text-stone-400 truncate">
                ({density.bengaliLabel.split(' ')[0]})
              </span>
            </div>
            <p className="text-micro text-stone-600 dark:text-stone-300 font-medium">
              ~{density.waitMinutes} mins wait • {density.devoteesPerSqMeter} devotees/m²
            </p>
          </div>

          <span
            className="text-micro font-black px-2 py-0.5 rounded-md text-white shrink-0"
            style={{ backgroundColor: density.colorHex }}
          >
            {density.capacityPct}% Rush
          </span>
        </div>
      </div>
    );
  }

  // Variant 3: Card / Detailed (Full visual component for PandalDetailScreen & Map Detailed Sheet)
  return (
    <div
      id={`crowd-density-indicator-${pandal.id}`}
      className={`p-4 rounded-3xl border shadow-sm transition-all ${
        isDarkMode ? 'bg-[#22161E] border-stone-800' : 'bg-stone-50/90 border-stone-200'
      } ${className}`}
    >
      {/* Top Header: Traffic Light Status & Badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* 3-State Traffic Lights Box */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-stone-900/90 border border-stone-700 shadow-inner"
            title="Real-Time Color Coded Crowd Indicator"
          >
            <div className="flex items-center gap-1">
              <span
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  density.level === 'green'
                    ? 'bg-emerald-400 ring-2 ring-emerald-300 shadow-[0_0_8px_#34D399] animate-pulse'
                    : 'bg-stone-600 opacity-30'
                }`}
                title="Green: Low Density"
              />
              <span
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  density.level === 'yellow'
                    ? 'bg-amber-400 ring-2 ring-amber-300 shadow-[0_0_8px_#FBBF24] animate-pulse'
                    : 'bg-stone-600 opacity-30'
                }`}
                title="Yellow: Moderate Density"
              />
              <span
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  density.level === 'red'
                    ? 'bg-red-500 ring-2 ring-red-300 shadow-[0_0_8px_#F87171] animate-pulse'
                    : 'bg-stone-600 opacity-30'
                }`}
                title="Red: High Density"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-display font-black text-h4 text-stone-900 dark:text-white leading-tight">
                {density.label}
              </h4>
              <span
                className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full text-white tracking-wider"
                style={{ backgroundColor: density.colorHex }}
              >
                {density.level.toUpperCase()}
              </span>
            </div>
            <p className="text-micro font-bengali font-bold text-stone-500 dark:text-stone-400">
              {density.bengaliLabel}
            </p>
          </div>
        </div>

        {/* Dummy Data Sensor Source Pill */}
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-300 dark:border-stone-700 inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            <span>Simulated Sensor</span>
          </span>
          <span className="block text-[9px] text-stone-400 mt-0.5">Updated 2 mins ago</span>
        </div>
      </div>

      {/* Visual Color-Coded Spectrum Bar (Green -> Yellow -> Red) */}
      <div className="mt-3.5 pt-1">
        <div className="flex items-center justify-between text-micro font-bold mb-1">
          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>Green (Low &lt;20m)</span>
          </span>
          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>Yellow (Moderate 20-38m)</span>
          </span>
          <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <span>Red (High &gt;38m)</span>
          </span>
        </div>

        {/* 3-Section Gradient Track with Needle */}
        <div className="relative h-4 rounded-full overflow-hidden flex shadow-inner border border-stone-300/50 dark:border-stone-700/50 p-0.5 bg-stone-200 dark:bg-stone-800">
          <div
            className={`h-full rounded-l-full transition-all ${
              density.level === 'green' ? 'opacity-100 ring-2 ring-white/50' : 'opacity-40'
            }`}
            style={{ width: '33.33%', backgroundColor: '#16A34A' }}
            title="Green Zone: 0 - 20 mins"
          />
          <div
            className={`h-full transition-all ${
              density.level === 'yellow' ? 'opacity-100 ring-2 ring-white/50' : 'opacity-40'
            }`}
            style={{ width: '33.33%', backgroundColor: '#EAB308' }}
            title="Yellow Zone: 20 - 38 mins"
          />
          <div
            className={`h-full rounded-r-full transition-all ${
              density.level === 'red' ? 'opacity-100 ring-2 ring-white/50' : 'opacity-40'
            }`}
            style={{ width: '33.34%', backgroundColor: '#DC2626' }}
            title="Red Zone: > 38 mins"
          />
        </div>

        {/* Dynamic Marker Arrow indicator */}
        <div className="relative w-full h-4 mt-0.5">
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
            style={{
              left: `${Math.min(95, Math.max(5, density.capacityPct))}%`,
            }}
          >
            <span
              className="text-[10px] font-black leading-none"
              style={{ color: density.colorHex }}
            >
              ▲
            </span>
            <span
              className="text-[10px] font-black px-1 rounded text-white shadow-xs leading-tight"
              style={{ backgroundColor: density.colorHex }}
            >
              {density.capacityPct}%
            </span>
          </div>
        </div>
      </div>

      {/* 3 Key Density Telemetry Metrics */}
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div
          className={`p-2.5 rounded-2xl border text-center ${
            density.level === 'green'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
              : density.level === 'yellow'
              ? 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-200'
              : 'bg-red-500/10 border-red-500/20 text-red-900 dark:text-red-200'
          }`}
        >
          <span className="text-[10px] font-bold block opacity-75 uppercase tracking-wide">
            Courtyard Density
          </span>
          <span className="font-display font-black text-h4 tabular-nums block">
            {density.devoteesPerSqMeter}
          </span>
          <span className="text-[10px] opacity-75 block">devotees / m²</span>
        </div>

        <div className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/50 text-center">
          <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wide">
            Queue Delay
          </span>
          <span className="font-display font-black text-h4 text-stone-900 dark:text-white tabular-nums block">
            ~{density.waitMinutes}m
          </span>
          <span className="text-[10px] text-stone-500 block">estimated wait</span>
        </div>

        <div className="p-2.5 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/50 text-center">
          <span className="text-[10px] font-bold text-stone-500 block uppercase tracking-wide">
            Throughput
          </span>
          <span className="font-display font-black text-h4 text-stone-900 dark:text-white tabular-nums block">
            {density.flowRatePerMin}
          </span>
          <span className="text-[10px] text-stone-500 block">people / min</span>
        </div>
      </div>

      {/* Advisory Callout Box */}
      {showAvoidanceTip && (
        <div
          className={`mt-2.5 p-2.5 rounded-2xl border flex items-start gap-2 ${density.bgLightClass} ${density.borderClass}`}
        >
          {density.level === 'green' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : density.level === 'yellow' ? (
            <Activity className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 text-micro">
            <p className={`font-bold leading-tight ${density.textClass}`}>
              {density.recommendation}
            </p>
            <p className="text-stone-600 dark:text-stone-300 mt-0.5 leading-snug">
              💡 {density.advisoryTip}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
