import React from 'react';
import { PandalGroupVisitSummary } from '../../types';
import { formatTimeAgo } from '../../utils/geoUtils';
import { CheckCircle2, XCircle, Users, Clock } from 'lucide-react';

interface PandalGroupVisitCardProps {
  summary: PandalGroupVisitSummary;
  onToggleMyVisit?: () => void;
  isDarkMode?: boolean;
}

export const PandalGroupVisitCard: React.FC<PandalGroupVisitCardProps> = ({
  summary,
  onToggleMyVisit,
  isDarkMode = false,
}) => {
  return (
    <div
      id={`pandal-group-visit-${summary.pandalId}`}
      className={`p-3 rounded-2xl border transition-all ${
        isDarkMode ? 'bg-[#22161E] border-stone-800' : 'bg-stone-50 border-stone-200'
      }`}
    >
      {/* Header: Visited ratio */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-stone-200/60 dark:border-stone-800/60">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-display font-black text-small text-stone-900 dark:text-white">
            <Users className="w-3.5 h-3.5 text-[#DC2626]" />
            <span>Squad Visit Status:</span>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-micro font-black flex items-center gap-1 ${
              summary.visitedCount > 0
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400'
            }`}
          >
            <span>{summary.visitedCount > 0 ? '✅' : '⏳'}</span>
            <span>
              {summary.visitedCount}/{summary.totalMembers} visited
            </span>
          </span>
        </div>

        {onToggleMyVisit && (
          <button
            onClick={onToggleMyVisit}
            className={`px-2.5 py-1 rounded-xl text-micro font-bold transition-all flex items-center gap-1 ${
              summary.isCurrentUserVisited
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-200 dark:bg-stone-700 hover:bg-[#DC2626] hover:text-white text-stone-700 dark:text-stone-300'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>{summary.isCurrentUserVisited ? 'My Darshan Done' : 'Mark My Darshan'}</span>
          </button>
        )}
      </div>

      {/* Member Chips: Visited vs Not Visited */}
      <div className="pt-2 flex flex-wrap gap-1.5">
        {/* Visited members */}
        {summary.visitedMembers.map((m) => (
          <div
            key={m.userId}
            className="px-2 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-micro font-bold flex items-center gap-1"
            title={`Visited ${formatTimeAgo(m.visitedAt)}`}
          >
            <span>{m.avatarUrl || '🪔'}</span>
            <span>{m.userName.split(' ')[0]}</span>
            <span className="text-emerald-600 font-bold">✅</span>
          </div>
        ))}

        {/* Not visited members */}
        {summary.notVisitedMembers.map((m) => (
          <div
            key={m.userId}
            className="px-2 py-1 rounded-xl bg-stone-200/60 dark:bg-stone-800 border border-stone-300/40 dark:border-stone-700 text-stone-600 dark:text-stone-400 text-micro font-medium flex items-center gap-1 opacity-75"
          >
            <span>{m.avatarUrl || '🪔'}</span>
            <span>{m.userName.split(' ')[0]}</span>
            <span className="text-stone-400">❌</span>
          </div>
        ))}
      </div>
    </div>
  );
};
