import React, { useState } from 'react';
import { Pandal, UserProfile, UserPreferences, CrowdLevel } from '../../types';
import { X, Users, Clock, AlertTriangle, Check, Sparkles } from 'lucide-react';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';

interface CrowdReportModalProps {
  pandals: Pandal[];
  defaultPandalId?: string;
  currentUser: UserProfile;
  onSubmitReport: (pandalId: string, crowdLevel: CrowdLevel, waitMinutes: number, notes: string) => Promise<void>;
  onClose: () => void;
  userPrefs: UserPreferences;
}

export const CrowdReportModal: React.FC<CrowdReportModalProps> = ({
  pandals,
  defaultPandalId,
  currentUser,
  onSubmitReport,
  onClose,
  userPrefs,
}) => {
  const isDarkMode = userPrefs.themeMode === 'mahasaptami_night';
  const [selectedPandalId, setSelectedPandalId] = useState(
    defaultPandalId || (pandals.length > 0 ? pandals[0].id : '')
  );
  const [crowdLevel, setCrowdLevel] = useState<CrowdLevel>('moderate');
  const [waitMinutes, setWaitMinutes] = useState<number>(20);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const crowdOptions: Array<{ level: CrowdLevel; label: string; bengaliLabel: string; color: string; desc: string }> = [
    {
      level: 'low',
      label: 'Smooth / Light',
      bengaliLabel: 'স্বাভাবিক ভিড়',
      color: 'bg-emerald-500 text-white',
      desc: '< 15 mins direct entry',
    },
    {
      level: 'moderate',
      label: 'Moderate Rush',
      bengaliLabel: 'মাঝারি লাইন',
      color: 'bg-amber-500 text-white',
      desc: '15-30 mins moving queue',
    },
    {
      level: 'high',
      label: 'Heavy Crowd',
      bengaliLabel: 'প্রবল ভিড়',
      color: 'bg-orange-600 text-white',
      desc: '30-60 mins waiting',
    },
    {
      level: 'peak_surge',
      label: 'Peak Surge (Jam)',
      bengaliLabel: 'চরম জনসমুদ্র',
      color: 'bg-red-700 text-white',
      desc: '> 60 mins barricade hold',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPandalId) return;

    setIsSubmitting(true);
    playKanshorBell(0.8);
    playDhakHit('dha', 0.8);

    await onSubmitReport(selectedPandalId, crowdLevel, waitMinutes, notes.trim());
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div
      id="crowd-report-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        className={`w-full max-w-md rounded-3xl p-5 border shadow-2xl space-y-4 my-auto ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-[#FFFDF9] border-[#D97706]/30 text-stone-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                Report Live Crowd Level
              </h3>
              <p className="font-bengali-serif text-small text-[#DC2626] font-bold">
                লাইভ ভিড় ও লাইনের সময় বন্ধুদের জানান
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Select Pandal */}
          <div className="space-y-1.5">
            <label className="text-small font-bold text-stone-700 dark:text-stone-300">
              Select Durga Puja Pandal
            </label>
            <select
              value={selectedPandalId}
              onChange={(e) => setSelectedPandalId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-semibold focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            >
              {pandals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.bengaliName}) — {p.area}
                </option>
              ))}
            </select>
          </div>

          {/* Crowd Level Buttons */}
          <div className="space-y-2">
            <label className="text-small font-bold text-stone-700 dark:text-stone-300">
              Current Crowd / Rush Condition
            </label>
            <div className="grid grid-cols-2 gap-2">
              {crowdOptions.map((opt) => {
                const isSelected = crowdLevel === opt.level;
                return (
                  <button
                    key={opt.level}
                    type="button"
                    onClick={() => {
                      setCrowdLevel(opt.level);
                      if (opt.level === 'low') setWaitMinutes(10);
                      if (opt.level === 'moderate') setWaitMinutes(25);
                      if (opt.level === 'high') setWaitMinutes(45);
                      if (opt.level === 'peak_surge') setWaitMinutes(75);
                      playKanshorBell(0.4);
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'border-[#DC2626] bg-[#DC2626]/10 ring-2 ring-[#DC2626]/30'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-small font-bold">{opt.label}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#DC2626]" />}
                    </div>
                    <p className="text-[11px] text-[#DC2626] font-bengali font-bold">{opt.bengaliLabel}</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Queue Wait Duration Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-small font-bold text-stone-700 dark:text-stone-300 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Estimated Queue Wait Time:</span>
              </label>
              <span className="text-small font-black text-[#DC2626] tabular-nums">
                {waitMinutes} minutes
              </span>
            </div>
            <input
              type="range"
              min={5}
              max={120}
              step={5}
              value={waitMinutes}
              onChange={(e) => setWaitMinutes(Number(e.target.value))}
              className="w-full accent-[#DC2626]"
            />
            <div className="flex justify-between text-[10px] text-stone-500 font-mono">
              <span>5m (Breeze)</span>
              <span>30m</span>
              <span>60m</span>
              <span>120m (Heavy Jam)</span>
            </div>
          </div>

          {/* Optional Notes */}
          <div className="space-y-1.5">
            <label className="text-small font-bold text-stone-700 dark:text-stone-300">
              Live Tip / Advisory for Friends (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. VIP line gate 3 is open, or entry fast via southern lane"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-small font-semibold focus:outline-none focus:ring-2 focus:ring-[#DC2626]"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-small font-bold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white text-small font-bold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? 'Publishing...' : 'Broadcast to Friends'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
