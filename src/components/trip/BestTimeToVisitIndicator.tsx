import React, { useState } from 'react';
import { CityId, Pandal } from '../../types';
import { getHistoricalCrowdInsight } from '../../utils/crowdTimingUtils';
import { Clock, Sparkles, AlertTriangle, Info, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface BestTimeToVisitIndicatorProps {
  pandal: Pandal;
  city: CityId;
  plannedArrivalTime?: string;
  variant?: 'pill' | 'strip' | 'card';
  isDarkMode?: boolean;
}

export const BestTimeToVisitIndicator: React.FC<BestTimeToVisitIndicatorProps> = ({
  pandal,
  city,
  plannedArrivalTime,
  variant = 'strip',
  isDarkMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const insight = getHistoricalCrowdInsight(pandal, city, plannedArrivalTime);

  const getStatusBadge = () => {
    switch (insight.timingStatus) {
      case 'optimal':
        return {
          bg: isDarkMode ? 'bg-emerald-950/50 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200',
          text: isDarkMode ? 'text-emerald-300' : 'text-emerald-800',
          pillBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300',
          icon: <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />,
        };
      case 'peak_rush':
        return {
          bg: isDarkMode ? 'bg-rose-950/40 border-rose-500/30' : 'bg-rose-50 border-rose-200',
          text: isDarkMode ? 'text-rose-300' : 'text-rose-800',
          pillBg: 'bg-rose-500/20 text-rose-700 dark:text-rose-300',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />,
        };
      case 'moderate':
      default:
        return {
          bg: isDarkMode ? 'bg-amber-950/40 border-amber-500/30' : 'bg-amber-50/80 border-amber-200',
          text: isDarkMode ? 'text-amber-300' : 'text-amber-800',
          pillBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-300',
          icon: <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />,
        };
    }
  };

  const style = getStatusBadge();

  if (variant === 'pill') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-micro font-bold shadow-2xs ${style.bg} ${style.text}`}
        title={`Best Time to Visit: ${insight.bestWindow}`}
      >
        {style.icon}
        <span>Best Time: {insight.bestWindow.split('(')[0].trim()}</span>
      </span>
    );
  }

  return (
    <div
      className={`rounded-xl border transition-all ${style.bg} overflow-hidden shadow-2xs`}
      id={`best-time-indicator-${pandal.id}`}
    >
      {/* Primary summary strip */}
      <div className="p-2.5 flex items-center justify-between gap-2">
        <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
          <div className="mt-0.5 sm:mt-0">{style.icon}</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-display font-bold text-micro text-stone-900 dark:text-white uppercase tracking-wider">
                Best Time to Visit
              </span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${style.pillBg}`}>
                {insight.statusLabel}
              </span>
              {plannedArrivalTime && (
                <span className="text-[10px] text-stone-500 dark:text-stone-400">
                  (Arr: {plannedArrivalTime})
                </span>
              )}
            </div>

            <p className={`text-small font-semibold ${style.text} leading-snug mt-0.5 line-clamp-1`}>
              {insight.bestWindow}
            </p>
          </div>
        </div>

        {/* Expand / Collapse toggle for historical details */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 rounded-lg shrink-0 transition-colors"
          title="Toggle historical crowd details"
          aria-label="Toggle crowd details"
        >
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Collapsible Historical Insight & Cycle Details */}
      {isExpanded && (
        <div className="px-2.5 pb-2.5 pt-1 border-t border-black/5 dark:border-white/10 text-micro space-y-1.5 bg-black/5 dark:bg-white/5">
          <div className="flex items-start gap-1.5 text-stone-700 dark:text-stone-300">
            <Info className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{insight.historicalCycleNote}</p>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300">
              <span className="font-bold block text-[10px] uppercase">Recommended Window</span>
              <span>{insight.bestWindow.split('(')[0]}</span>
            </div>
            <div className="p-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300">
              <span className="font-bold block text-[10px] uppercase">Peak Historical Rush</span>
              <span>{insight.peakHours}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
