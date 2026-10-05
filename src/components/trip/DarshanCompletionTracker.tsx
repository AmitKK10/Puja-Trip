import React, { useMemo } from 'react';
import { TripPlan, Pandal } from '../../types';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Share2,
  MessageCircle,
  Footprints,
  Trophy,
  ArrowRight,
  Flame,
  CheckCheck,
} from 'lucide-react';
import { DurgaThirdEye } from '../common/BengaliMotifs';

interface DarshanCompletionTrackerProps {
  trip: TripPlan;
  pandals: Pandal[];
  visitedList: string[];
  onToggleVisited: (id: string) => void;
  onOpenSharePoster: () => void;
  isDarkMode?: boolean;
}

export const DarshanCompletionTracker: React.FC<DarshanCompletionTrackerProps> = ({
  trip,
  pandals,
  visitedList,
  onToggleVisited,
  onOpenSharePoster,
  isDarkMode = false,
}) => {
  const totalCount = pandals.length;

  const { visitedCount, completionPercentage, nextUnvisitedPandal } = useMemo(() => {
    if (totalCount === 0) {
      return { visitedCount: 0, completionPercentage: 0, nextUnvisitedPandal: null };
    }
    const visitedInRoute = pandals.filter((p) => visitedList.includes(p.id));
    const count = visitedInRoute.length;
    const percentage = Math.round((count / totalCount) * 100);
    const nextPandal = pandals.find((p) => !visitedList.includes(p.id)) || null;

    return {
      visitedCount: count,
      completionPercentage: percentage,
      nextUnvisitedPandal: nextPandal,
    };
  }, [pandals, visitedList, totalCount]);

  const isAllCompleted = totalCount > 0 && visitedCount === totalCount;

  // Handle toggle with sound and celebration
  const handleToggle = (pandalId: string) => {
    const isNowVisited = !visitedList.includes(pandalId);
    onToggleVisited(pandalId);

    if (isNowVisited) {
      playKanshorBell(0.8);
      playDhakHit('dha', 0.85);

      // If completing the last pandal, trigger joyful confetti burst
      if (visitedCount + 1 >= totalCount && totalCount > 0) {
        setTimeout(() => {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#DC2626', '#F59E0B', '#10B981', '#FEF08A'],
          });
          playKanshorBell(1.0);
          playDhakHit('dha', 0.9);
        }, 150);
      }
    } else {
      playDhakHit('ta', 0.5);
    }
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div
      id="darshan-completion-tracker"
      className={`rounded-3xl border transition-all duration-300 overflow-hidden shadow-md relative ${
        isDarkMode
          ? 'bg-gradient-to-br from-[#23151D] via-[#1B1218] to-[#120B0F] border-amber-500/25 text-white'
          : 'bg-gradient-to-br from-[#FFFDF9] via-white to-amber-50/40 border-amber-200/90 text-stone-900 shadow-sm'
      }`}
    >
      {/* Decorative festive top accent line */}
      <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-[#DC2626] to-emerald-600" />

      <div className="p-4 sm:p-5 space-y-4">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                isAllCompleted
                  ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white'
                  : 'bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-[#FEF08A]'
              }`}
            >
              {isAllCompleted ? (
                <Trophy className="w-5 h-5 text-amber-300 animate-bounce" />
              ) : (
                <DurgaThirdEye className="w-5 h-5 fill-current" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-black text-h3 leading-tight text-[#881337] dark:text-[#FEF08A]">
                  Darshan Completion
                </h3>
                <span
                  className={`text-micro font-bold px-2 py-0.5 rounded-full border ${
                    isAllCompleted
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                      : completionPercentage > 0
                      ? 'bg-amber-500/15 border-amber-500/30 text-amber-900 dark:text-amber-200'
                      : 'bg-stone-200 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  {isAllCompleted ? '100% Done' : `${visitedCount}/${totalCount} Pandals`}
                </span>
              </div>
              <p className="font-bengali text-micro text-[#DC2626] dark:text-amber-300 font-bold mt-0.5">
                শারদ দর্শন সমাপ্তি পরিক্রমা
              </p>
            </div>
          </div>

          {/* Right Action: Share Itinerary Poster via WhatsApp */}
          <button
            id="btn-share-itinerary-poster"
            onClick={onOpenSharePoster}
            className="px-3.5 py-1.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-700 hover:brightness-110 active:scale-95 text-white text-micro font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
            title="Generate shareable PujaTrip Itinerary Poster for WhatsApp"
          >
            <MessageCircle className="w-3.5 h-3.5 fill-current text-white" />
            <Share2 className="w-3.5 h-3.5 text-amber-200" />
            <span>Share Poster</span>
          </button>
        </div>

        {/* Big Progress Counter & Visual Bar */}
        <div className="space-y-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-micro font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Route Progress
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black font-display tabular-nums tracking-tight text-[#991B1B] dark:text-[#FEF08A]">
                  {completionPercentage}%
                </span>
                <span className="text-xs text-stone-600 dark:text-stone-400 font-medium">
                  completed ({visitedCount} of {totalCount} visited)
                </span>
              </div>
            </div>

            <div className="text-right">
              {isAllCompleted ? (
                <span className="text-micro font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                  <CheckCheck className="w-4 h-4" />
                  <span>All Darshans Complete!</span>
                </span>
              ) : (
                <span className="text-micro font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1 justify-end">
                  <Flame className="w-3.5 h-3.5 text-[#DC2626]" />
                  <span>{totalCount - visitedCount} stops remaining</span>
                </span>
              )}
            </div>
          </div>

          {/* Main Visual Progress Bar */}
          <div className="relative h-3.5 w-full bg-stone-200/90 dark:bg-stone-800/90 rounded-full overflow-hidden p-0.5 border border-stone-300/60 dark:border-stone-700/60">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out relative ${
                isAllCompleted
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 shadow-sm'
                  : 'bg-gradient-to-r from-amber-500 via-[#DC2626] to-[#991B1B]'
              }`}
              style={{ width: `${Math.max(completionPercentage, totalCount > 0 && visitedCount > 0 ? 5 : 0)}%` }}
            >
              {/* Subtle animated light gleam on progress bar */}
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Interactive Stop-by-Stop Segmented Pills */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-micro text-stone-500 dark:text-stone-400 font-semibold px-0.5">
            <span>Tap any stop below to update visit status:</span>
            <span className="font-bengali">দর্শন সম্পন্ন হয়েছে?</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {pandals.map((pandal, idx) => {
              const isVisited = visitedList.includes(pandal.id);
              const isNext = !isVisited && nextUnvisitedPandal?.id === pandal.id;

              return (
                <button
                  key={pandal.id}
                  type="button"
                  onClick={() => handleToggle(pandal.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex items-center gap-2 group relative overflow-hidden ${
                    isVisited
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/40 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-500/20'
                      : isNext
                      ? 'bg-amber-500/15 dark:bg-amber-950/40 border-[#DC2626]/50 dark:border-amber-500/50 text-stone-900 dark:text-white shadow-xs ring-1 ring-[#DC2626]/30'
                      : 'bg-stone-100/80 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700/80 text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-800'
                  }`}
                  title={isVisited ? `Mark ${pandal.name} as unvisited` : `Mark ${pandal.name} as visited`}
                >
                  {/* Status Circle Indicator */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-micro font-bold transition-transform group-hover:scale-110 ${
                      isVisited
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : isNext
                        ? 'bg-[#DC2626] text-white animate-pulse'
                        : 'bg-stone-300 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    {isVisited ? <CheckCircle2 className="w-4 h-4 text-white" /> : <span>{idx + 1}</span>}
                  </div>

                  {/* Pandal Info */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-small font-bold truncate leading-tight ${
                        isVisited ? 'line-through opacity-85 text-emerald-950 dark:text-emerald-200' : ''
                      }`}
                    >
                      {pandal.name}
                    </p>
                    <p className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                      {isVisited ? '✓ Darshan Done' : isNext ? '🔥 Next Stop' : pandal.area}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Next Stop Highlight or All Complete Banner */}
        {isAllCompleted ? (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 border border-emerald-500/40 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-500 animate-spin" />
              <div>
                <p className="text-small font-black text-emerald-900 dark:text-emerald-100">
                  Parikrama Completed! শুভ শারদীয়া ২০২৬!
                </p>
                <p className="text-micro text-emerald-700 dark:text-emerald-300">
                  You have visited all {totalCount} pandals in this itinerary. Share your festive achievement!
                </p>
              </div>
            </div>

            <button
              onClick={onOpenSharePoster}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-micro font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-current" />
              <span>Share Poster on WhatsApp</span>
            </button>
          </div>
        ) : nextUnvisitedPandal ? (
          <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-stone-900/60 border border-amber-500/30 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#DC2626] animate-ping shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-micro uppercase font-black tracking-wider text-[#DC2626]">Next Stop:</span>
                  <span className="text-small font-bold truncate text-stone-900 dark:text-white">
                    {nextUnvisitedPandal.name}
                  </span>
                </div>
                <p className="text-micro text-stone-600 dark:text-stone-400 truncate">
                  📍 {nextUnvisitedPandal.area} • ⏱️ {nextUnvisitedPandal.queueWaitMinutes ? `~${nextUnvisitedPandal.queueWaitMinutes}m wait` : 'Low queue'}
                </p>
              </div>
            </div>

            <button
              onClick={() => handleToggle(nextUnvisitedPandal.id)}
              className="px-3 py-1.5 rounded-xl bg-[#991B1B] hover:bg-[#DC2626] active:scale-95 text-white text-micro font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Visited</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};
