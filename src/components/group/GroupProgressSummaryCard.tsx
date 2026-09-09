import React from 'react';
import { GroupTripProgressSummary, TripMember } from '../../types';
import { Sparkles, CheckCircle2, Award } from 'lucide-react';

interface GroupProgressSummaryCardProps {
  progressSummary: GroupTripProgressSummary;
  isDarkMode?: boolean;
}

export const GroupProgressSummaryCard: React.FC<GroupProgressSummaryCardProps> = ({
  progressSummary,
  isDarkMode = false,
}) => {
  return (
    <div
      id="group-trip-progress-summary-card"
      className={`p-4 rounded-3xl border shadow-sm space-y-3.5 transition-all ${
        isDarkMode
          ? 'bg-[#1C1418] border-[#F59E0B]/30 text-white'
          : 'bg-white border-[#D97706]/25 text-stone-900'
      }`}
    >
      {/* Top Banner Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#DC2626]" />
            <h4 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
              Group Darshan Progress
            </h4>
          </div>
          <p className="text-micro text-stone-500 font-bengali">
            সকল বন্ধুর সম্মিলিত পূজা পরিক্রমা অগ্রগতি
          </p>
        </div>

        <div className="text-right">
          <div className="font-display font-black text-h2 text-[#DC2626] tabular-nums leading-none">
            {progressSummary.completedPandalsCount} / {progressSummary.totalPandals}
          </div>
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
            Pandals completed
          </span>
        </div>
      </div>

      {/* Main Overall Progress Bar */}
      <div className="space-y-1">
        <div className="w-full h-3 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-[#DC2626] transition-all duration-500 shadow-sm"
            style={{ width: `${Math.max(5, progressSummary.percentage)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-stone-500 font-semibold px-0.5">
          <span>{progressSummary.percentage}% Route Completed</span>
          <span>{progressSummary.totalPandals - progressSummary.completedPandalsCount} stops remaining</span>
        </div>
      </div>

      {/* Individual Member Breakdown List */}
      <div className="pt-2 border-t border-stone-200/70 dark:border-stone-800/70 space-y-2">
        <span className="text-micro font-bold text-stone-500 uppercase tracking-wider block">
          Individual Squad Member Breakdown
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {progressSummary.memberProgress.map((m) => (
            <div
              key={m.userId}
              className={`p-2.5 rounded-2xl border flex items-center justify-between gap-2.5 ${
                isDarkMode ? 'bg-[#241720] border-stone-800' : 'bg-stone-50 border-stone-200'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{m.avatarUrl || '🪔'}</span>
                <div className="min-w-0">
                  <span className="font-display font-bold text-small truncate block">
                    {m.userName}
                  </span>
                  {m.bengaliName && (
                    <span className="font-bengali text-micro text-[#DC2626] truncate block">
                      {m.bengaliName}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-black text-small text-[#DC2626] tabular-nums block">
                  {m.visitedCount} / {m.totalCount}
                </span>
                <span className="text-[10px] text-stone-400 font-semibold tabular-nums">
                  {m.percentage}% visited
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
