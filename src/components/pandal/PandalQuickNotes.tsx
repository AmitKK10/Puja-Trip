import React, { useState, useEffect } from 'react';
import { Pandal } from '../../types';
import { playDhakHit, playKanshorBell } from '../../utils/audioSynth';
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Check,
  Sparkles,
  Calendar,
  Clock,
  Tag,
  PenLine,
  Bookmark,
  Share2,
} from 'lucide-react';

export interface PandalQuickNote {
  id: string;
  pandalId: string;
  text: string;
  category: 'thought' | 'memory' | 'tip' | 'food' | 'photo_spot';
  timestamp: string; // ISO date string
  formattedDate: string;
}

interface PandalQuickNotesProps {
  pandal: Pandal;
  isDarkMode: boolean;
}

const STORAGE_KEY_PREFIX = 'pujatrip_quick_notes_';

const NOTE_CATEGORIES: Array<{
  id: PandalQuickNote['category'];
  label: string;
  bengaliLabel: string;
  emoji: string;
  colorClass: string;
}> = [
  { id: 'memory', label: 'Memory', bengaliLabel: 'স্মৃতি', emoji: '✨', colorClass: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30' },
  { id: 'thought', label: 'Thought', bengaliLabel: 'ভাবনা', emoji: '💭', colorClass: 'bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/30' },
  { id: 'tip', label: 'Pro Tip', bengaliLabel: 'টিপস', emoji: '💡', colorClass: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30' },
  { id: 'food', label: 'Food Note', bengaliLabel: 'খাবার', emoji: '🍛', colorClass: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30' },
  { id: 'photo_spot', label: 'Photo Spot', bengaliLabel: 'ছবি', emoji: '📸', colorClass: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30' },
];

const PRESET_IDEAS = [
  'Best view of the idol is from the left ramp',
  'Spectacular Chandannagar lighting on the gate',
  'Queue was moving fast, only 15 mins wait',
  'Delicious bhog prasad available at 8:30 PM',
  'Great photo angle right opposite the dhunuchi stage',
];

export const PandalQuickNotes: React.FC<PandalQuickNotesProps> = ({ pandal, isDarkMode }) => {
  const storageKey = `${STORAGE_KEY_PREFIX}${pandal.id}`;

  const [notes, setNotes] = useState<PandalQuickNote[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [noteInput, setNoteInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PandalQuickNote['category']>('memory');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // Sync to local storage whenever notes update
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notes));
    } catch (err) {
      console.warn('Failed to save pandal notes to localStorage:', err);
    }
  }, [notes, storageKey]);

  const handleAddNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = noteInput.trim();
    if (!trimmed) return;

    const now = new Date();
    const formatted = now.toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newNote: PandalQuickNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      pandalId: pandal.id,
      text: trimmed,
      category: selectedCategory,
      timestamp: now.toISOString(),
      formattedDate: formatted,
    };

    setNotes((prev) => [newNote, ...prev]);
    setNoteInput('');
    setJustSaved(true);

    // Festive audio feedback
    playDhakHit('ta', 0.6);
    playKanshorBell(0.6);

    setTimeout(() => {
      setJustSaved(false);
    }, 2500);
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    playDhakHit('tin', 0.5);
  };

  const handleCopyNote = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(`${pandal.name} Note: "${text}"`);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      id="pandal-quick-notes-section"
      className={`p-4 rounded-3xl border shadow-sm space-y-3.5 transition-all ${
        isDarkMode
          ? 'bg-[#281B23] border-[#F59E0B]/20 text-white'
          : 'bg-white border-[#D97706]/20 text-stone-800'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-[#DC2626]" />
          <div>
            <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A] leading-tight">
              Quick Notes & Memories
            </h3>
            <span className="text-micro text-stone-500 font-bengali">
              মণ্ডপের স্মৃতি ও প্রয়োজনীয় নোট (Offline Saved)
            </span>
          </div>
        </div>

        {notes.length > 0 && (
          <span className="text-micro font-bold px-2 py-0.5 rounded-full bg-[#DC2626]/10 text-[#DC2626] dark:bg-[#FEF08A]/10 dark:text-[#FEF08A] tabular-nums">
            {notes.length} {notes.length === 1 ? 'note' : 'notes'}
          </span>
        )}
      </div>

      {/* Note Creation Form */}
      <form onSubmit={handleAddNote} className="space-y-2.5">
        {/* Category Pill Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {NOTE_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-micro font-bold shrink-0 border transition-all flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-[#881337] text-[#FEF08A] border-[#881337] shadow-xs'
                    : isDarkMode
                    ? 'bg-stone-800/80 text-stone-300 border-stone-700 hover:border-stone-600'
                    : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-300'
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
                <span className="opacity-70 font-bengali text-[10px]">({cat.bengaliLabel})</span>
              </button>
            );
          })}
        </div>

        {/* Textarea Input */}
        <div className="relative">
          <textarea
            id="pandal-quick-note-input"
            rows={2}
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value)}
            placeholder={`Save a thought or memory about ${pandal.name}...`}
            className="w-full px-3.5 py-2.5 rounded-2xl border text-small leading-relaxed bg-stone-50 dark:bg-stone-800/70 border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#DC2626]/50 focus:border-[#DC2626] transition-all resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleAddNote();
              }
            }}
          />

          {justSaved && (
            <div className="absolute right-3 top-3 text-micro font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 animate-fadeIn">
              <Check className="w-3 h-3" />
              <span>Saved!</span>
            </div>
          )}
        </div>

        {/* Preset Quick Chips */}
        {notes.length === 0 && !noteInput && (
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-stone-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span>Quick inspiration:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_IDEAS.slice(0, 3).map((idea, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNoteInput(idea)}
                  className="text-micro px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800/80 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-left transition-colors cursor-pointer"
                >
                  "{idea}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Submit Bar */}
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-[11px] text-stone-400 dark:text-stone-500">
            Stored locally on this device
          </span>

          <button
            type="submit"
            disabled={!noteInput.trim()}
            className={`px-4 py-2 rounded-xl text-small font-bold flex items-center gap-1.5 transition-all ${
              noteInput.trim()
                ? 'bg-gradient-to-r from-amber-600 via-[#DC2626] to-[#881337] text-white shadow-sm hover:brightness-110 active:scale-95 cursor-pointer'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Note</span>
          </button>
        </div>
      </form>

      {/* Notes List */}
      {notes.length === 0 ? (
        <div className="py-6 text-center rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/30 px-4">
          <FileText className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto mb-1.5" />
          <p className="text-small text-stone-500 dark:text-stone-400 font-medium">
            No memories saved for {pandal.name} yet.
          </p>
          <p className="text-micro text-stone-400 dark:text-stone-500 font-bengali mt-0.5">
            মণ্ডপের সুন্দর মুহূর্ত বা তথ্য লিখে রাখুন, ইন্টারনেট ছাড়াও সবসময় দেখা যাবে।
          </p>
        </div>
      ) : (
        <div className="space-y-2 pt-1">
          {notes.map((note) => {
            const cat = NOTE_CATEGORIES.find((c) => c.id === note.category) || NOTE_CATEGORIES[0];
            const isCopied = copiedId === note.id;

            return (
              <div
                key={note.id}
                className="p-3 rounded-2xl border bg-stone-50/80 dark:bg-stone-800/50 border-stone-200 dark:border-stone-800 transition-all hover:border-amber-400/40 group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border flex items-center gap-1 ${cat.colorClass}`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                    <span className="text-[11px] text-stone-400 dark:text-stone-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{note.formattedDate}</span>
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleCopyNote(note.text, note.id)}
                      className="p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-500 transition-colors"
                      title="Copy note"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40 text-stone-400 hover:text-red-600 transition-colors"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-small text-stone-800 dark:text-stone-200 mt-2 leading-relaxed whitespace-pre-wrap font-sans">
                  {note.text}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
