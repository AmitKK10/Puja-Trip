import React, { useState, useMemo } from 'react';
import { Pandal, CityId } from '../../types';
import { playDhakHit, playKanshorBell } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Camera,
  MapPin,
  Clock,
  Train,
  CheckCheck,
  RotateCcw,
  Eye,
  Filter,
  Flame,
  Award,
} from 'lucide-react';
import { DurgaThirdEye, AlpanaCorner } from '../common/BengaliMotifs';

interface PandalChecklistProps {
  pandals: Pandal[];
  visitedList: string[];
  activeCity: CityId;
  onToggleVisited: (id: string) => void;
  onSelectPandal: (pandal: Pandal) => void;
  onSnapPhoto?: (pandal: Pandal) => void;
  isDarkMode?: boolean;
}

export const PandalChecklist: React.FC<PandalChecklistProps> = ({
  pandals,
  visitedList,
  activeCity,
  onToggleVisited,
  onSelectPandal,
  onSnapPhoto,
  isDarkMode = false,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');
  const [animatingId, setAnimatingId] = useState<string | null>(null);

  // Total and completed statistics
  const totalCount = pandals.length;
  const completedCount = useMemo(() => {
    return pandals.filter((p) => visitedList.includes(p.id)).length;
  }, [pandals, visitedList]);

  const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllComplete = totalCount > 0 && completedCount === totalCount;

  // Filtered list
  const filteredPandals = useMemo(() => {
    return pandals.filter((p) => {
      const isDone = visitedList.includes(p.id);
      if (filterMode === 'pending') return !isDone;
      if (filterMode === 'completed') return isDone;
      return true;
    });
  }, [pandals, visitedList, filterMode]);

  const handleToggle = (pandal: Pandal) => {
    const isCurrentlyDone = visitedList.includes(pandal.id);
    setAnimatingId(pandal.id);

    if (!isCurrentlyDone) {
      // Satisfying celebration audio and confetti
      playDhakHit('dha');
      playKanshorBell(0.85);
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.65 },
        colors: ['#DC2626', '#F59E0B', '#10B981', '#FEF08A'],
      });
    } else {
      playDhakHit('tin');
    }

    onToggleVisited(pandal.id);

    setTimeout(() => {
      setAnimatingId(null);
    }, 600);
  };

  const handleMarkAll = () => {
    const unvisited = pandals.filter((p) => !visitedList.includes(p.id));
    if (unvisited.length === 0) return;

    unvisited.forEach((p) => onToggleVisited(p.id));
    playDhakHit('dha');
    playKanshorBell(1);
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#DC2626', '#F59E0B', '#10B981', '#FEF08A'],
    });
  };

  const handleResetChecklist = () => {
    const visited = pandals.filter((p) => visitedList.includes(p.id));
    visited.forEach((p) => onToggleVisited(p.id));
    playDhakHit('tin');
  };

  if (pandals.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl border border-stone-200 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60">
        <p className="text-stone-500 dark:text-stone-400 font-medium">
          No pandal stops added to this trip yet. Add pandals to build your checklist!
        </p>
      </div>
    );
  }

  return (
    <div id="pandal-checklist-container" className="space-y-4">
      {/* Header Banner & Progress Bar */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-sm relative overflow-hidden transition-all ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#271420] via-[#1D121B] to-[#140D13] border-[#F59E0B]/30 text-white'
            : 'bg-gradient-to-br from-[#FFFBEB] via-[#FEF2F2] to-[#FFF7ED] border-[#FDE68A] text-stone-900'
        }`}
      >
        <AlpanaCorner
          position="top-right"
          size={52}
          color="#DC2626"
          className="absolute top-1 right-1 opacity-20 pointer-events-none"
        />

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#DC2626] to-[#991B1B] text-white flex items-center justify-center shadow-xs">
                <CheckCheck className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-display font-black text-h3 sm:text-h2 text-[#881337] dark:text-[#FEF08A]">
                  Pandal Darshan Checklist
                </h3>
                <p className="text-micro font-bold text-stone-600 dark:text-stone-300">
                  {activeCity === 'kolkata' ? 'Kolkata' : 'Contai'} Route • Strike off visited pandals
                </p>
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="font-display font-black text-2xl sm:text-3xl text-[#DC2626] dark:text-[#FEF08A] tabular-nums">
              {completedCount}
              <span className="text-sm font-bold text-stone-400 dark:text-stone-500">/{totalCount}</span>
            </span>
            <span className="block text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {percentage}% Completed
            </span>
          </div>
        </div>

        {/* Celebratory Banner when 100% complete */}
        {isAllComplete ? (
          <div className="mt-3.5 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-800 dark:text-emerald-300 animate-fadeIn">
            <Sparkles className="w-5 h-5 text-emerald-500 shrink-0 animate-bounce" />
            <div className="text-small font-bold">
              <span>উৎসব দর্শন সমাপ্ত! All {totalCount} pandals visited on this trip route! 🎉</span>
            </div>
          </div>
        ) : (
          /* Smooth Animated Progress Bar */
          <div className="mt-3.5 space-y-1.5">
            <div className="w-full h-3 rounded-full bg-stone-200 dark:bg-stone-800 overflow-hidden p-0.5 border border-black/5 dark:border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#DC2626] via-[#F59E0B] to-[#10B981] transition-all duration-500 ease-out shadow-xs"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-bold text-stone-500 dark:text-stone-400">
              <span>{totalCount - completedCount} pandal{totalCount - completedCount === 1 ? '' : 's'} remaining</span>
              <span>{percentage}% of route completed</span>
            </div>
          </div>
        )}

        {/* Filter & Batch Actions */}
        <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-xl text-micro font-bold transition-all ${
                filterMode === 'all'
                  ? 'bg-[#DC2626] text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-black/10'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1 rounded-xl text-micro font-bold transition-all ${
                filterMode === 'pending'
                  ? 'bg-[#DC2626] text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-black/10'
              }`}
            >
              Pending ({totalCount - completedCount})
            </button>
            <button
              onClick={() => setFilterMode('completed')}
              className={`px-3 py-1 rounded-xl text-micro font-bold transition-all ${
                filterMode === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-black/5 dark:bg-white/5 text-stone-600 dark:text-stone-400 hover:bg-black/10'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>

          {/* Batch Quick Action */}
          <div className="flex items-center gap-2">
            {!isAllComplete ? (
              <button
                onClick={handleMarkAll}
                className="text-micro font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                title="Mark all stops as completed"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark All Done</span>
              </button>
            ) : (
              <button
                onClick={handleResetChecklist}
                className="text-micro font-bold text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 flex items-center gap-1"
                title="Reset checklist"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Checklist Stops Items */}
      <div className="space-y-2.5">
        {filteredPandals.map((pandal, idx) => {
          const isDone = visitedList.includes(pandal.id);
          const isAnimating = animatingId === pandal.id;
          const originalIndex = pandals.findIndex((p) => p.id === pandal.id) + 1;

          return (
            <div
              key={pandal.id}
              id={`checklist-item-${pandal.id}`}
              className={`group relative p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 ${
                isDone
                  ? isDarkMode
                    ? 'bg-[#18201B]/80 border-emerald-500/30'
                    : 'bg-emerald-50/70 border-emerald-200'
                  : isDarkMode
                  ? 'bg-[#221720] border-[#F59E0B]/20 hover:border-[#F59E0B]/50'
                  : 'bg-white border-stone-200 hover:border-[#DC2626]/40 shadow-2xs'
              } ${isAnimating ? 'scale-[1.01] ring-2 ring-emerald-500/50' : ''}`}
            >
              <div className="flex items-start gap-3">
                {/* Custom Satisfying Interactive Checkbox */}
                <button
                  type="button"
                  onClick={() => handleToggle(pandal)}
                  aria-label={isDone ? `Mark ${pandal.name} as uncompleted` : `Mark ${pandal.name} as completed`}
                  className={`mt-0.5 w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center transition-all duration-300 shrink-0 cursor-pointer active:scale-90 ${
                    isDone
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/30 rotate-0'
                      : isDarkMode
                      ? 'bg-stone-800/80 border-stone-600 text-transparent hover:border-[#DC2626] hover:bg-stone-800'
                      : 'bg-stone-100 border-stone-300 text-transparent hover:border-[#DC2626] hover:bg-stone-200'
                  }`}
                >
                  <CheckCircle2
                    className={`w-5 h-5 transition-transform duration-300 ${
                      isDone ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
                    }`}
                  />
                </button>

                {/* Pandal Thumbnail */}
                <div
                  onClick={() => onSelectPandal(pandal)}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden shrink-0 relative cursor-pointer border border-black/10 dark:border-white/10"
                >
                  <img
                    src={pandal.heroImage || pandal.photos?.[0] || 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?w=500'}
                    alt={pandal.name}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-all duration-500 ${
                      isDone ? 'grayscale-[40%] contrast-90' : 'group-hover:scale-105'
                    }`}
                  />
                  <div className="absolute top-1 left-1 w-5 h-5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[10px] font-black flex items-center justify-center">
                    {originalIndex}
                  </div>
                </div>

                {/* Pandal Content with Satisfying Strike-Through Animation */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300">
                      {pandal.zoneLabel || pandal.zone}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-1 animate-fadeIn">
                        <CheckCheck className="w-3 h-3" />
                        <span>Completed ✓</span>
                      </span>
                    )}
                  </div>

                  {/* Pandal Title with Animated Strike-through */}
                  <div
                    onClick={() => onSelectPandal(pandal)}
                    className="cursor-pointer mt-0.5"
                  >
                    <h4
                      className={`font-display font-black text-sm sm:text-base leading-tight transition-all duration-500 ${
                        isDone
                          ? 'line-through decoration-[#DC2626] decoration-[2px] text-stone-400 dark:text-stone-500'
                          : 'text-stone-900 dark:text-white group-hover:text-[#DC2626]'
                      }`}
                    >
                      {pandal.name}
                    </h4>
                    <p
                      className={`text-micro transition-all duration-500 ${
                        isDone
                          ? 'line-through decoration-stone-400 text-stone-400 dark:text-stone-600'
                          : 'text-stone-500 dark:text-stone-400 font-serif'
                      }`}
                    >
                      {pandal.bengaliName}
                    </p>
                  </div>

                  {/* Meta Chips */}
                  <div className="flex items-center gap-2 mt-1.5 text-micro text-stone-500 dark:text-stone-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Train className="w-3 h-3 text-[#DC2626]" />
                      <span className="truncate max-w-[130px]">
                        {pandal.transit?.nearestMetro?.station || pandal.transit?.nearestBusStop?.stop || pandal.area}
                      </span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>{pandal.queueWaitMinutes}m wait</span>
                    </span>
                  </div>
                </div>

                {/* Quick Row Actions: Snap Photo & View */}
                <div className="flex flex-col items-end gap-1.5 shrink-0 self-center">
                  {onSnapPhoto && (
                    <button
                      type="button"
                      onClick={() => onSnapPhoto(pandal)}
                      className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 active:scale-95 text-amber-800 dark:text-amber-300 font-bold text-micro border border-amber-500/30 flex items-center gap-1 transition-all"
                      title={`Snap festive photo for ${pandal.name}`}
                    >
                      <Camera className="w-3.5 h-3.5 text-[#DC2626]" />
                      <span className="hidden sm:inline">Snap</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectPandal(pandal)}
                    className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                    title="View pandal details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
