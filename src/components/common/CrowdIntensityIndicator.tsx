import React, { useMemo } from 'react';
import { CrowdLevel, CrowdTrend, Pandal } from '../../types';
import { getPandalCrowdStatus } from '../../services/crowdIntelligenceService';
import { Users, TrendingUp, TrendingDown, Minus, Clock, ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';

export interface CrowdIntensityIndicatorProps {
  pandal?: Pandal;
  crowdLevel?: CrowdLevel;
  queueWaitMinutes?: number;
  trend?: CrowdTrend;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'card' | 'pill' | 'compact';
  showTrafficLights?: boolean;
  showAvoidanceTip?: boolean;
  className?: string;
  onClick?: () => void;
}

export type TrafficLightState = 'low' | 'medium' | 'high';

/**
 * Maps multi-tier CrowdLevel and wait time to simplified Traffic Light state:
 * - Green (Low): <= 20 min queue, low crowd
 * - Amber/Yellow (Medium): 21 - 39 min queue, moderate crowd
 * - Red (High): >= 40 min queue, high, extreme, or peak_surge
 */
export function getTrafficLightState(level?: CrowdLevel, queueMinutes: number = 20): TrafficLightState {
  if (level === 'peak_surge' || level === 'extreme' || level === 'high' || queueMinutes >= 40) {
    return 'high';
  }
  if (level === 'moderate' || (queueMinutes > 20 && queueMinutes < 40)) {
    return 'medium';
  }
  return 'low';
}

export const CrowdIntensityIndicator: React.FC<CrowdIntensityIndicatorProps> = ({
  pandal,
  crowdLevel: explicitLevel,
  queueWaitMinutes: explicitQueue,
  trend: explicitTrend,
  size = 'md',
  variant = 'badge',
  showTrafficLights = true,
  showAvoidanceTip = false,
  className = '',
  onClick,
}) => {
  // Derive live status if pandal object is passed, otherwise use explicit props
  const liveStatus = useMemo(() => {
    if (pandal) {
      return getPandalCrowdStatus(pandal.id, pandal);
    }
    return null;
  }, [pandal]);

  const level: CrowdLevel = explicitLevel || liveStatus?.crowdLevel || pandal?.crowdLevel || 'moderate';
  const queueMinutes: number = explicitQueue ?? liveStatus?.queueWaitMinutes ?? pandal?.queueWaitMinutes ?? 20;
  const trend: CrowdTrend = explicitTrend || liveStatus?.trend || 'stable';

  const trafficState = getTrafficLightState(level, queueMinutes);

  // Status configuration based on Traffic Light color system
  const statusConfig = {
    low: {
      label: 'Low Crowd',
      bengaliLabel: 'স্বল্প ভিড়',
      lightColor: 'bg-emerald-500',
      activeGlow: 'shadow-[0_0_10px_rgba(16,185,129,0.7)] ring-2 ring-emerald-400',
      pillBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/60',
      textAccent: 'text-emerald-800 dark:text-emerald-300',
      advice: 'Ideal visiting window! Smooth queue progression and minimal wait.',
      bengaliAdvice: 'দর্শনের সেরা সময়! সহজেই নির্বিঘ্নে প্রতিমা দর্শন করা যাবে।',
      icon: CheckCircle,
    },
    medium: {
      label: 'Medium Crowd',
      bengaliLabel: 'মাঝারি ভিড়',
      lightColor: 'bg-amber-500',
      activeGlow: 'shadow-[0_0_10px_rgba(245,158,11,0.7)] ring-2 ring-amber-400',
      pillBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 border-amber-300 dark:border-amber-700/60',
      textAccent: 'text-amber-900 dark:text-amber-300',
      advice: 'Moderate crowd. Queue moving steadily with moderate barricade pacing.',
      bengaliAdvice: 'মাঝারি ভিড়। লাইন ধীরে ধীরে স্বাভাবিক গতিতে এগোচ্ছে।',
      icon: Users,
    },
    high: {
      label: level === 'peak_surge' ? 'Peak Crowd Surge' : 'High Crowd',
      bengaliLabel: level === 'peak_surge' ? 'প্রচণ্ড ভিড়' : 'বিশাল ভিড়',
      lightColor: 'bg-rose-600',
      activeGlow: 'shadow-[0_0_12px_rgba(225,29,72,0.8)] ring-2 ring-rose-500 animate-pulse',
      pillBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 border-rose-300 dark:border-rose-700/60',
      textAccent: 'text-rose-900 dark:text-rose-300',
      advice: 'High crowd density! Consider taking VIP entrance or visiting during late night.',
      bengaliAdvice: 'মণ্ডপে প্রচণ্ড ভিড়। সম্ভব হলে ভিআইপি পাস ব্যবহার করুন বা মধ্যরাতে আসুন।',
      icon: AlertTriangle,
    },
  }[trafficState];

  // Render 3-light traffic housing
  const renderTrafficLightHousing = (orientation: 'horizontal' | 'vertical' = 'horizontal', compact = false) => {
    const lampSize = compact ? 'w-2 h-2' : size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';

    return (
      <div
        className={`inline-flex items-center justify-center ${
          orientation === 'vertical' ? 'flex-col' : 'flex-row'
        } gap-1 p-1 bg-stone-900 dark:bg-stone-950 rounded-full border border-stone-700 shadow-inner shrink-0`}
        aria-hidden="true"
      >
        {/* Red Lamp (High) */}
        <span
          className={`rounded-full transition-all duration-300 ${lampSize} ${
            trafficState === 'high'
              ? 'bg-rose-500 ' + statusConfig.activeGlow
              : 'bg-rose-950/60 opacity-30'
          }`}
          title="Red: High Crowd"
        />
        {/* Yellow Lamp (Medium) */}
        <span
          className={`rounded-full transition-all duration-300 ${lampSize} ${
            trafficState === 'medium'
              ? 'bg-amber-400 ' + statusConfig.activeGlow
              : 'bg-amber-950/60 opacity-30'
          }`}
          title="Amber: Medium Crowd"
        />
        {/* Green Lamp (Low) */}
        <span
          className={`rounded-full transition-all duration-300 ${lampSize} ${
            trafficState === 'low'
              ? 'bg-emerald-400 ' + statusConfig.activeGlow
              : 'bg-emerald-950/60 opacity-30'
          }`}
          title="Green: Low Crowd"
        />
      </div>
    );
  };

  // 1. Variant: Compact / Inline Pill
  if (variant === 'pill') {
    return (
      <div
        onClick={onClick}
        role="status"
        aria-label={`Crowd Intensity: ${statusConfig.label}, estimated queue ${queueMinutes} minutes`}
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-micro font-bold tabular-nums transition-all ${
          statusConfig.pillBg
        } ${onClick ? 'cursor-pointer hover:opacity-90 active:scale-95' : ''} ${className}`}
      >
        {showTrafficLights && renderTrafficLightHousing('horizontal', true)}
        <span>{statusConfig.label}</span>
        <span className="opacity-70">•</span>
        <span>{queueMinutes}m queue</span>
      </div>
    );
  }

  // 2. Variant: Card (For PandalDetailScreen or detailed popup)
  if (variant === 'card') {
    return (
      <div
        id={pandal ? `crowd-intensity-${pandal.id}` : 'crowd-intensity-card'}
        role="region"
        aria-labelledby="crowd-intensity-title"
        className={`rounded-2xl border p-3.5 sm:p-4 shadow-sm transition-all ${
          statusConfig.pillBg
        } ${className}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Real vertical traffic signal housing */}
            {renderTrafficLightHousing('vertical', false)}

            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] uppercase tracking-wider font-bold opacity-75">
                  Crowd Intensity
                </span>
                <span className="text-micro font-semibold px-1.5 py-0.2 rounded-md bg-black/10 dark:bg-white/10">
                  Real-Time Traffic Light
                </span>
              </div>
              <h4 id="crowd-intensity-title" className="font-display font-black text-h3 leading-tight mt-0.5">
                {statusConfig.label}{' '}
                <span className="font-bengali font-semibold text-small opacity-90">
                  ({statusConfig.bengaliLabel})
                </span>
              </h4>
            </div>
          </div>

          {/* Queue wait & Trend */}
          <div className="text-right shrink-0">
            <div className="flex items-center justify-end gap-1 font-display font-black text-h3 tabular-nums">
              <Clock className="w-4 h-4 opacity-75" />
              <span>{queueMinutes} <span className="text-small font-normal">mins</span></span>
            </div>
            <div className="flex items-center justify-end gap-1 text-[11px] opacity-80 mt-0.5">
              <span>Trend:</span>
              {trend === 'increasing' ? (
                <span className="flex items-center text-rose-600 dark:text-rose-400 font-bold">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> Surging
                </span>
              ) : trend === 'decreasing' ? (
                <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> Easing
                </span>
              ) : (
                <span className="flex items-center opacity-80 font-medium">
                  <Minus className="w-3 h-3 mr-0.5" /> Steady
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Crowd Avoidance Advice */}
        <div className="mt-3 pt-2.5 border-t border-current/15 text-small">
          <div className="flex items-start gap-1.5">
            <span className="text-base leading-none shrink-0 mt-0.5">
              {trafficState === 'low' ? '🟢' : trafficState === 'medium' ? '🟡' : '🔴'}
            </span>
            <div>
              <p className="font-semibold leading-snug">{statusConfig.advice}</p>
              <p className="font-bengali text-micro opacity-90 mt-0.5">{statusConfig.bengaliAdvice}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Default Variant: Badge (Used in pandal listing cards)
  return (
    <div
      onClick={onClick}
      role="status"
      aria-label={`Crowd Intensity: ${statusConfig.label}, ${queueMinutes} minutes wait`}
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border text-small font-bold tabular-nums shadow-xs transition-all ${
        statusConfig.pillBg
      } ${onClick ? 'cursor-pointer hover:shadow-sm active:scale-95' : ''} ${className}`}
    >
      {showTrafficLights && renderTrafficLightHousing('horizontal', size === 'sm')}

      <div className="flex items-center gap-1.5">
        <span className="leading-tight">{statusConfig.label}</span>
        <span className="opacity-60">•</span>
        <span className="font-black">{queueMinutes}m queue</span>
      </div>

      {trend === 'increasing' && (
        <span className="text-rose-600 dark:text-rose-400 text-micro font-bold flex items-center" title="Crowd surge increasing">
          <TrendingUp className="w-3 h-3" />
        </span>
      )}
      {trend === 'decreasing' && (
        <span className="text-emerald-600 dark:text-emerald-400 text-micro font-bold flex items-center" title="Crowd clearing up">
          <TrendingDown className="w-3 h-3" />
        </span>
      )}
    </div>
  );
};
