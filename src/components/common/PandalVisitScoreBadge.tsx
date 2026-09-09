import React, { useState } from 'react';
import { DynamicVisitScore } from '../../types';
import {
  Star,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  Users,
  CloudRain,
  TrendingUp,
  Sparkles,
} from 'lucide-react';

interface PandalVisitScoreBadgeProps {
  score: DynamicVisitScore;
  compact?: boolean;
}

export const PandalVisitScoreBadge: React.FC<PandalVisitScoreBadgeProps> = ({
  score,
  compact = false,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const hasScoreDrop = score.baseQualityScore - score.currentVisitScore >= 1.0;

  return (
    <div
      id={`pandal-visit-score-badge-${score.pandalId}`}
      className="inline-block relative text-left"
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          setShowDetails(!showDetails);
        }}
        className={`inline-flex items-center gap-2 p-1.5 px-2.5 rounded-xl border cursor-pointer transition-all shadow-xs ${
          hasScoreDrop
            ? 'bg-amber-500/10 border-amber-500/40 text-stone-900 dark:text-amber-100 hover:bg-amber-500/20'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-500/20'
        }`}
      >
        {/* Permanent Quality Score */}
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
          <span className="text-micro font-bold text-stone-700 dark:text-stone-300">Quality:</span>
          <span className="text-micro font-black tabular-nums text-stone-900 dark:text-white">{score.baseQualityScore}/10</span>
        </div>

        <span className="text-stone-400 dark:text-stone-600 font-normal">|</span>

        {/* Temporary Visit Now Score */}
        <div className="flex items-center gap-1">
          <span
            className={`w-2 h-2 rounded-full ${
              score.currentVisitScore >= 7.5 ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`}
          ></span>
          <span className="text-micro font-bold text-stone-700 dark:text-stone-300">Visit Now:</span>
          <span
            className={`text-micro font-black tabular-nums ${
              score.currentVisitScore >= 7.5
                ? 'text-emerald-800 dark:text-emerald-300'
                : 'text-amber-800 dark:text-amber-300'
            }`}
          >
            {score.currentVisitScore}/10
          </span>
        </div>

        <Info className="w-3 h-3 text-stone-500 hover:text-stone-800" />
      </div>

      {/* Popover Breakdown Dialog */}
      {showDetails && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 top-full mt-1.5 z-40 w-72 p-3 rounded-2xl bg-white dark:bg-stone-900 border border-amber-500/30 shadow-xl space-y-2 text-micro animate-in fade-in-50 duration-150"
        >
          <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-1.5">
            <span className="font-black uppercase tracking-wider text-stone-800 dark:text-stone-200">
              Score Intelligence
            </span>
            <button
              onClick={() => setShowDetails(false)}
              className="text-[10px] font-bold text-stone-400 hover:text-stone-700 dark:hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="space-y-1 text-stone-700 dark:text-stone-300">
            <div className="flex items-center justify-between">
              <span className="font-medium">⭐ Permanent Pandal Quality:</span>
              <strong className="text-stone-900 dark:text-white font-black">
                {score.baseQualityScore}/10
              </strong>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-medium">⚡ Current Visit Score:</span>
              <strong
                className={`font-black ${
                  score.currentVisitScore >= 7.5 ? 'text-emerald-600' : 'text-amber-600'
                }`}
              >
                {score.currentVisitScore}/10
              </strong>
            </div>
          </div>

          {score.reasons && score.reasons.length > 0 && (
            <div className="pt-1.5 border-t border-stone-200 dark:border-stone-800 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                Why difference right now?
              </div>
              <ul className="space-y-0.5 text-stone-600 dark:text-stone-400">
                {score.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <span className="text-amber-500">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="p-2 rounded-xl bg-amber-500/10 text-[10px] text-stone-600 dark:text-stone-400 leading-snug">
            <strong>Key Principle:</strong> Permanent artistic excellence is never reduced just because of current crowd surges or rain.
          </div>
        </div>
      )}
    </div>
  );
};
