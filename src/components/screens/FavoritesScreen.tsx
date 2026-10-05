import React, { useState } from 'react';
import { CityId, Pandal, UserPreferences } from '../../types';
import { DurgaThirdEye, ShankhaIcon, DhakIcon, AlpanaCorner } from '../common/BengaliMotifs';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import { handleImageError } from '../../utils/imageFallback';
import confetti from 'canvas-confetti';
import {
  Bookmark,
  CheckCircle2,
  Trophy,
  Sparkles,
  MapPin,
  Clock,
  Trash2,
  ArrowRight,
  Plus,
  Compass,
  Edit3,
} from 'lucide-react';

interface FavoritesScreenProps {
  activeCity: CityId;
  pandals: Pandal[];
  favorites: string[];
  visitedList: string[];
  onToggleFavorite: (id: string) => void;
  onToggleVisited: (id: string) => void;
  onAddAllToRoute: (ids: string[]) => void;
  onSelectPandal: (pandal: Pandal) => void;
  onNavigateDiscover: () => void;
  userPrefs: UserPreferences;
}

export const FavoritesScreen: React.FC<FavoritesScreenProps> = ({
  activeCity,
  pandals,
  favorites,
  visitedList,
  onToggleFavorite,
  onToggleVisited,
  onAddAllToRoute,
  onSelectPandal,
  onNavigateDiscover,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [personalNotes, setPersonalNotes] = useState<Record<string, string>>({
    'bagbazar-sarbojanin': 'Taste the sponge rosogolla at Chittaranjan sweets nearby!',
    'maddox-square': 'Meet batchmates near the south lawn at 7 PM for Kathi rolls',
  });
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');

  const favPandals = pandals.filter((p) => favorites.includes(p.id));
  const visitedCount = favPandals.filter((p) => visitedList.includes(p.id)).length;
  const progressPercent = favPandals.length > 0 ? Math.round((visitedCount / favPandals.length) * 100) : 0;

  const handleSaveNote = (pandalId: string) => {
    setPersonalNotes((prev) => ({ ...prev, [pandalId]: noteInput }));
    setEditingNoteId(null);
    setNoteInput('');
  };

  const handleToggleVisitedWithSound = (id: string) => {
    const isCurrentlyVisited = visitedList.includes(id);
    onToggleVisited(id);
    if (!isCurrentlyVisited) {
      playKanshorBell(0.6);
      playDhakHit('dha', 0.8);
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#DC2626', '#F59E0B', '#FDE68A'],
      });
    }
  };

  return (
    <div id="favorites-screen" className="space-y-4 pb-12 animate-fadeIn">
      {/* Hopping Progress Milestone Banner */}
      <div
        className={`p-4 sm:p-5 rounded-3xl border shadow-lg relative overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#3B1324] via-[#281B23] to-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-gradient-to-br from-[#881337] via-[#991B1B] to-[#7F1D1D] border-[#FDE68A]/30 text-white'
        }`}
      >
        <AlpanaCorner position="top-right" size={42} color="#FDE68A" className="absolute top-1 right-1 opacity-25" />

        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 backdrop-blur-md border border-white/20 text-micro font-bold text-[#FEF08A] uppercase">
            <Trophy className="w-3.5 h-3.5 text-[#F59E0B]" />
            <span>Sharad Darshan Milestone</span>
          </div>

          <span className="text-micro font-black text-amber-200 bg-white/10 px-2.5 py-1 rounded-full tabular-nums">
            {progressPercent}% Complete
          </span>
        </div>

        <div className="mt-3">
          <h2 className="font-display font-black text-h1 text-white">
            <span className="tabular-nums">{visitedCount}</span> of <span className="tabular-nums">{favPandals.length}</span> Saved Pandals Visited
          </h2>
          <p className="font-bengali-serif text-h4 text-[#FEF08A] font-bold mt-0.5">
            {visitedCount >= 5 ? '🏆 শারদ পরিক্রমা চ্যাম্পিয়ন পদক আনলক হয়েছে!' : '🪔 আপনার প্রিয় পুজো মণ্ডপ দর্শন করুন'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-3.5">
          <div className="h-3 w-full bg-black/30 rounded-full overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#4ADE80] rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick Add All to Route Action */}
        {favPandals.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/15 flex items-center justify-between">
            <span className="text-micro text-stone-300">Convert your saved wishlist into a route</span>
            <button
              onClick={() => {
                onAddAllToRoute(favPandals.map((p) => p.id));
                playKanshorBell(0.4);
                alert('All saved pandals added to your Trip Planner!');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-white text-[#991B1B] font-bold text-btn shadow-md hover:bg-stone-100 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add All to Trip
            </button>
          </div>
        )}
      </div>

      {/* Saved Pandals List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-[#DC2626]" />
            <h3 className="font-display font-black text-h2 text-[#881337] dark:text-[#FEF08A]">
              My Saved Wishlist ({favPandals.length})
            </h3>
          </div>
        </div>

        {favPandals.length === 0 ? (
          <div className="py-12 text-center space-y-3 bg-stone-50 dark:bg-stone-900/50 rounded-3xl border border-dashed border-stone-300 dark:border-stone-700 p-6">
            <div className="w-16 h-16 rounded-full bg-[#DC2626]/10 flex items-center justify-center mx-auto text-[#DC2626]">
              <Bookmark size={32} />
            </div>
            <h4 className="font-display font-bold text-h3 text-stone-800 dark:text-stone-200">
              No saved pandals yet
            </h4>
            <p className="text-small text-stone-500 max-w-xs mx-auto font-bengali">
              এক্সপ্লোর স্ক্রিন থেকে আপনার পছন্দের মণ্ডপগুলো বুকমার্ক করুন।
            </p>
            <button
              onClick={onNavigateDiscover}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white text-btn font-bold shadow-md inline-flex items-center gap-1.5"
            >
              <Compass className="w-4 h-4" /> Explore Pandals Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {favPandals.map((pandal) => {
              const isVisited = visitedList.includes(pandal.id);
              const note = personalNotes[pandal.id];
              const isEditing = editingNoteId === pandal.id;

              return (
                <div
                  key={pandal.id}
                  className={`p-3.5 rounded-3xl border transition-all ${
                    isVisited
                      ? 'bg-emerald-500/10 border-emerald-500/30'
                      : isDarkMode
                      ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
                      : 'bg-white border-[#D97706]/20 text-stone-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Thumbnail */}
                    <div
                      className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 cursor-pointer shadow-sm relative"
                      onClick={() => onSelectPandal(pandal)}
                    >
                      <img
                        src={pandal.heroImage}
                        alt={pandal.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                      {isVisited && (
                        <div className="absolute inset-0 bg-emerald-900/60 flex items-center justify-center text-white">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div onClick={() => onSelectPandal(pandal)} className="cursor-pointer">
                          <h4 className="font-display font-bold text-h4 leading-tight text-stone-900 dark:text-white hover:text-[#DC2626]">
                            {pandal.name}
                          </h4>
                          <p className="font-bengali-serif text-small text-[#DC2626] font-bold">{pandal.bengaliName}</p>
                        </div>

                        <button
                          onClick={() => onToggleFavorite(pandal.id)}
                          className="text-stone-400 hover:text-red-500 p-1"
                          title="Remove from Saved"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-micro text-stone-500 mt-1">
                        <span>{pandal.zoneLabel}</span>
                        <span>•</span>
                        <span className="font-bold text-stone-700 dark:text-stone-300 tabular-nums">
                          {pandal.queueWaitMinutes}m wait
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Note Box */}
                  <div className="mt-2.5 pt-2 border-t border-stone-200 dark:border-stone-800">
                    {isEditing ? (
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          placeholder="Add private note (e.g. Try fish fry near gate)..."
                          className="w-full text-small p-2 rounded-xl border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800"
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => setEditingNoteId(null)}
                            className="text-micro px-2 py-1 rounded bg-stone-200 dark:bg-stone-700 font-bold"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNote(pandal.id)}
                            className="text-micro px-2 py-1 rounded bg-[#991B1B] text-white font-bold"
                          >
                            Save Note
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-small">
                        <span className="text-stone-600 dark:text-stone-300 italic text-micro">
                          {note ? `📝 "${note}"` : 'No custom notes added'}
                        </span>
                        <button
                          onClick={() => {
                            setEditingNoteId(pandal.id);
                            setNoteInput(note || '');
                          }}
                          className="text-[#D97706] font-bold text-micro flex items-center gap-0.5 hover:underline"
                        >
                          <Edit3 className="w-3 h-3" /> {note ? 'Edit' : 'Add Note'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Check Visited Action Button */}
                  <div className="mt-2.5 pt-2 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleVisitedWithSound(pandal.id)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-btn flex items-center gap-1.5 transition-all ${
                        isVisited
                          ? 'bg-emerald-600 text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-[#FEF3C7]'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isVisited ? 'Visited (দর্শন সম্পন্ন)' : 'Mark as Visited'}</span>
                    </button>

                    <button
                      onClick={() => onSelectPandal(pandal)}
                      className="text-btn font-bold text-[#DC2626] flex items-center gap-0.5 hover:underline"
                    >
                      <span>Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
