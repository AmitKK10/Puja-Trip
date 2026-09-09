import React, { useMemo } from 'react';
import { Pandal } from '../../types';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, Sparkles } from 'lucide-react';

interface CrowdIntensitySparklineProps {
  pandal: Pandal;
  isDarkMode?: boolean;
}

interface TrendPoint {
  time: string;
  hourLabel: string;
  waitMinutes: number;
  intensity: number; // 0 - 100
  level: string;
}

export const CrowdIntensitySparkline: React.FC<CrowdIntensitySparklineProps> = ({
  pandal,
  isDarkMode = false,
}) => {
  // Generate predictive hourly trend for the next 6 hours based on current pandal queue and peak hours
  const trendData: TrendPoint[] = useMemo(() => {
    const currentWait = pandal.queueWaitMinutes;
    const isPeakNow = currentWait >= 40;

    // Projected progression for the next 6 hours
    const offsets = [
      { time: 'Now', offsetHours: 0, mult: 1.0 },
      { time: '+1h', offsetHours: 1, mult: isPeakNow ? 1.12 : 1.25 },
      { time: '+2h', offsetHours: 2, mult: isPeakNow ? 1.05 : 1.35 },
      { time: '+3h', offsetHours: 3, mult: isPeakNow ? 0.85 : 1.15 },
      { time: '+4h', offsetHours: 4, mult: isPeakNow ? 0.65 : 0.8 },
      { time: '+5h', offsetHours: 5, mult: isPeakNow ? 0.45 : 0.55 },
      { time: '+6h', offsetHours: 6, mult: isPeakNow ? 0.35 : 0.4 },
    ];

    const currentHour = new Date().getHours();

    return offsets.map((slot) => {
      const projectedHour = (currentHour + slot.offsetHours) % 24;
      const ampm = projectedHour >= 12 ? 'PM' : 'AM';
      const formattedHour = projectedHour % 12 === 0 ? 12 : projectedHour % 12;
      const hourLabel = slot.offsetHours === 0 ? 'Now' : `${formattedHour} ${ampm}`;

      const wait = Math.max(8, Math.round(currentWait * slot.mult));
      const intensity = Math.min(100, Math.round((wait / 75) * 100));

      let level = 'Low';
      if (wait >= 45) level = 'Peak Surge';
      else if (wait >= 30) level = 'Heavy';
      else if (wait >= 20) level = 'Moderate';

      return {
        time: slot.time,
        hourLabel,
        waitMinutes: wait,
        intensity,
        level,
      };
    });
  }, [pandal.queueWaitMinutes]);

  // Projected peak and minimum within next 6 hours
  const peakPoint = useMemo(() => {
    return trendData.reduce((max, p) => (p.waitMinutes > max.waitMinutes ? p : max), trendData[0]);
  }, [trendData]);

  const lowestPoint = useMemo(() => {
    return trendData.slice(1).reduce((min, p) => (p.waitMinutes < min.waitMinutes ? p : min), trendData[1] || trendData[0]);
  }, [trendData]);

  const isTrendIncreasing = trendData.length > 1 && trendData[1].waitMinutes > trendData[0].waitMinutes;

  return (
    <div
      id="crowd-intensity-sparkline-card"
      className={`p-3.5 rounded-2xl border transition-all ${
        isDarkMode
          ? 'bg-[#1F161C] border-[#F59E0B]/25 text-white'
          : 'bg-white border-[#D97706]/20 text-stone-900 shadow-xs'
      }`}
    >
      {/* Header with Title and Trend indicator */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              isTrendIncreasing ? 'bg-rose-500/15 text-rose-500' : 'bg-emerald-500/15 text-emerald-500'
            }`}
          >
            {isTrendIncreasing ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
          </div>
          <div>
            <h4 className="font-display font-bold text-small text-[#881337] dark:text-[#FEF08A] flex items-center gap-1.5">
              <span>Next 6 Hours Crowd Intensity Trend</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                Sparkline
              </span>
            </h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
              Predicted queue wait & rush fluctuations
            </p>
          </div>
        </div>

        {/* Dynamic Trend Pill */}
        <div className="text-right shrink-0">
          <span
            className={`text-micro font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 tabular-nums ${
              isTrendIncreasing
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {isTrendIncreasing ? '↗ Rising (+10m peak)' : '↘ Easing into night'}
          </span>
        </div>
      </div>

      {/* Sparkline Recharts Component */}
      <div className="h-24 w-full relative min-w-0 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData} margin={{ top: 6, right: 8, left: 8, bottom: 0 }}>
            <defs>
              <linearGradient id="crowdIntensityGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor={isDarkMode ? '#F59E0B' : '#DC2626'}
                  stopOpacity={0.45}
                />
                <stop
                  offset="95%"
                  stopColor={isDarkMode ? '#DC2626' : '#F59E0B'}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="hourLabel"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: isDarkMode ? '#A8A29E' : '#78716C' }}
              interval={0}
            />
            <YAxis hide domain={[0, 'dataMax + 15']} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as TrendPoint;
                  return (
                    <div className="px-2.5 py-1.5 rounded-xl bg-stone-900 text-white text-[11px] shadow-lg border border-white/15">
                      <p className="font-bold text-amber-300">{data.hourLabel}</p>
                      <p className="text-stone-200">
                        Queue Wait:{' '}
                        <strong className="text-white font-bold">{data.waitMinutes} mins</strong>
                      </p>
                      <p className="text-stone-400 text-[10px]">
                        Crowd Level: <span className="text-amber-200">{data.level}</span>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <ReferenceLine
              y={peakPoint.waitMinutes}
              stroke={isDarkMode ? '#F87171' : '#EF4444'}
              strokeDasharray="3 3"
              strokeOpacity={0.5}
            />
            <Area
              type="monotone"
              dataKey="waitMinutes"
              stroke={isDarkMode ? '#F59E0B' : '#DC2626'}
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#crowdIntensityGradient)"
              activeDot={{
                r: 4.5,
                fill: '#DC2626',
                stroke: '#FEF08A',
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Sparkline Highlights Bar */}
      <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-800 grid grid-cols-3 gap-1.5 text-center text-micro">
        <div className="p-1.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/60 dark:border-stone-700/60">
          <span className="text-stone-500 block text-[10px]">Current Wait</span>
          <span className="font-bold text-stone-800 dark:text-white tabular-nums">
            {pandal.queueWaitMinutes} mins
          </span>
        </div>

        <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
          <span className="text-rose-600 dark:text-rose-400 block text-[10px]">Projected Peak</span>
          <span className="font-bold text-rose-700 dark:text-rose-300 tabular-nums">
            {peakPoint.waitMinutes}m ({peakPoint.hourLabel})
          </span>
        </div>

        <div className="p-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-emerald-600 dark:text-emerald-400 block text-[10px]">Best Window</span>
          <span className="font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
            {lowestPoint.hourLabel} ({lowestPoint.waitMinutes}m)
          </span>
        </div>
      </div>
    </div>
  );
};
