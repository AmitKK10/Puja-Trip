import React, { useMemo } from 'react';
import { Pandal } from '../../types';
import { Users, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight, Gauge, Activity } from 'lucide-react';

interface PandalDensityIndicatorProps {
  pandal: Pandal;
  isDarkMode?: boolean;
}

export const PandalDensityIndicator: React.FC<PandalDensityIndicatorProps> = ({
  pandal,
  isDarkMode = false,
}) => {
  // Density calculation mapping based on crowdLevel and queue wait time
  const densityConfig = useMemo(() => {
    switch (pandal.crowdLevel) {
      case 'low':
        return {
          level: 'Low Density (স্বাভাবিক ভিড়)',
          levelCode: 'LOW',
          densityVal: '0.4',
          densityUnit: 'devotees / m²',
          capacityPct: 28,
          throughput: '~75 / min',
          statusColor: 'bg-emerald-600 text-white',
          badgeBorder: 'border-emerald-700',
          dotCount: 14,
          dotColor: 'bg-emerald-500',
          recommendation: 'Ideal time for serene, unhurried Darshan and close-up idol viewing.',
          advisoryTag: 'Easy Access • মসৃণ দর্শন',
        };
      case 'moderate':
        return {
          level: 'Moderate Density (পরিমিত ভিড়)',
          levelCode: 'MODERATE',
          densityVal: '1.3',
          densityUnit: 'devotees / m²',
          capacityPct: 58,
          throughput: '~52 / min',
          statusColor: 'bg-amber-600 text-white',
          badgeBorder: 'border-amber-700',
          dotCount: 32,
          dotColor: 'bg-amber-500',
          recommendation: 'Steady queue movement. Moving smoothly through the mandap barricades.',
          advisoryTag: 'Moderate Flow • স্বাভাবিক গতি',
        };
      case 'high':
        return {
          level: 'High Density (প্রচুর ভিড়)',
          levelCode: 'HIGH',
          densityVal: '2.8',
          densityUnit: 'devotees / m²',
          capacityPct: 82,
          throughput: '~34 / min',
          statusColor: 'bg-orange-600 text-white',
          badgeBorder: 'border-orange-700',
          dotCount: 56,
          dotColor: 'bg-orange-500',
          recommendation: 'Dense queue inside mandap. Keep bags secure and follow police barricade lines.',
          advisoryTag: 'Crowded • সাবধানে এগোন',
        };
      case 'extreme':
      case 'peak_surge':
      default:
        return {
          level: 'Extreme Density (অতিরিক্ত ভিড়)',
          levelCode: 'PEAK',
          densityVal: '4.2',
          densityUnit: 'devotees / m²',
          capacityPct: 96,
          throughput: '~18 / min',
          statusColor: 'bg-red-700 text-white',
          badgeBorder: 'border-red-800',
          dotCount: 84,
          dotColor: 'bg-red-500',
          recommendation: 'Peak festive rush. Entry restricted in regulated batches. Expect standstill intervals.',
          advisoryTag: 'Mega Rush • নিয়ন্ত্রিত প্রবেশ',
        };
    }
  }, [pandal.crowdLevel]);

  // Deterministic 2D simulated courtyard points
  const dots = useMemo(() => {
    const arr = [];
    const count = densityConfig.dotCount;
    for (let i = 0; i < count; i++) {
      // Deterministic pseudo-random distribution inside a courtyard 100x60 space
      const seedX = ((i * 37 + 13) % 86) + 7;
      const seedY = ((i * 53 + 23) % 76) + 12;
      arr.push({ x: seedX, y: seedY });
    }
    return arr;
  }, [densityConfig.dotCount]);

  return (
    <div
      id="pandal-density-indicator-card"
      className={`p-4 rounded-3xl border shadow-sm space-y-3.5 transition-all ${
        isDarkMode
          ? 'bg-[#281B23] border-amber-500/30 text-white'
          : 'bg-[#FFFDF9] border-stone-300 text-stone-900 shadow-stone-200/50'
      }`}
    >
      {/* Header & Solid High-Contrast Status Badge */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-stone-200 dark:border-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#DC2626] text-white flex items-center justify-center shadow-sm">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display font-black text-h4 leading-tight text-stone-900 dark:text-white">
              Real-Time Courtyard Density
            </h4>
            <p className="font-bengali text-micro text-[#DC2626] dark:text-[#FEF08A] font-bold">
              মণ্ডপ প্রাঙ্গণ ও লাইন ঘনত্ব নির্দেশক
            </p>
          </div>
        </div>

        {/* High Contrast Solid Badge */}
        <span
          className={`px-3 py-1 rounded-full text-btn font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border ${densityConfig.statusColor} ${densityConfig.badgeBorder}`}
        >
          <span className="w-2 h-2 rounded-full bg-white animate-pulse shrink-0" />
          <span>{densityConfig.levelCode} DENSITY</span>
        </span>
      </div>

      {/* Visual Density Grid / Courtyard Simulation */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-micro font-bold text-stone-600 dark:text-stone-400">
          <span className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Pavilion Courtyard (নাটমন্দির ও চত্বর মানচিত্র)</span>
          </span>
          <span className="font-mono text-[11px] text-stone-500 dark:text-stone-400">
            Sensor Capacity: {densityConfig.capacityPct}%
          </span>
        </div>

        {/* 2D Courtyard Boundary Simulation Box */}
        <div className="relative w-full h-28 rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden shadow-inner flex items-center justify-center">
          {/* Grid lines */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25 pointer-events-none" />

          {/* Sanctum / Idol Stage Indicator at Top */}
          <div className="absolute top-1 left-1/4 right-1/4 h-5 rounded-md bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-[10px] font-bold text-amber-300 pointer-events-none">
            ✦ মা দুর্গার মূল বেদি (Main Sanctum) ✦
          </div>

          {/* Devotee Density Dots */}
          <div className="absolute inset-0 pt-6 pb-2 px-3">
            {dots.map((dot, idx) => (
              <span
                key={idx}
                className={`absolute w-2 h-2 rounded-full ${densityConfig.dotColor} shadow-[0_0_4px_currentColor] transition-all duration-300 animate-pulse`}
                style={{
                  left: `${dot.x}%`,
                  top: `${dot.y}%`,
                  animationDelay: `${(idx * 70) % 1200}ms`,
                }}
              />
            ))}
          </div>

          {/* Entry & Exit Flow Arrows */}
          <div className="absolute bottom-1 left-3 flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-black/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
            <span>প্রবেশ (Entry)</span>
            <ArrowRight className="w-3 h-3" />
          </div>
          <div className="absolute bottom-1 right-3 flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-black/60 px-2 py-0.5 rounded-md border border-amber-500/30">
            <span>প্রস্থান (Exit)</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Key Metric Gauges */}
      <div className="grid grid-cols-3 gap-2 text-center pt-1">
        {/* Metric 1: Density value */}
        <div className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
          <span className="text-micro text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider block">
            Crowd Density
          </span>
          <div className="text-lg font-black text-stone-900 dark:text-white tabular-nums mt-0.5">
            {densityConfig.densityVal}
          </div>
          <span className="text-[10px] text-stone-500 font-medium block">
            {densityConfig.densityUnit}
          </span>
        </div>

        {/* Metric 2: Estimated Wait */}
        <div className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
          <span className="text-micro text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider block">
            Queue Wait
          </span>
          <div className="text-lg font-black text-[#DC2626] dark:text-[#FEF08A] tabular-nums mt-0.5">
            {pandal.queueWaitMinutes}m
          </div>
          <span className="text-[10px] text-stone-500 font-medium block">
            Gate to Idol
          </span>
        </div>

        {/* Metric 3: Throughput */}
        <div className="p-2.5 rounded-2xl bg-stone-100 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700">
          <span className="text-micro text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider block">
            Throughput
          </span>
          <div className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
            {densityConfig.throughput}
          </div>
          <span className="text-[10px] text-stone-500 font-medium block">
            Flow Velocity
          </span>
        </div>
      </div>

      {/* Advisory recommendation note */}
      <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2">
        <span className="text-amber-700 dark:text-amber-300 font-bold text-btn shrink-0 mt-0.5">
          ℹ️
        </span>
        <div className="text-small text-stone-800 dark:text-stone-200 leading-snug">
          <strong className="text-[#991B1B] dark:text-[#FEF08A] block font-bold mb-0.5">
            {densityConfig.advisoryTag}:
          </strong>
          {densityConfig.recommendation}
        </div>
      </div>
    </div>
  );
};
