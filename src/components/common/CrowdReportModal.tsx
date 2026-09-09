import React, { useState } from 'react';
import { Pandal, CrowdLevel } from '../../types';
import { submitCrowdReport, getPandalCrowdStatus } from '../../services/crowdIntelligenceService';
import { playKanshorBell } from '../../utils/audioSynth';
import {
  Users,
  Clock,
  CheckCircle2,
  X,
  Flame,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

interface CrowdReportModalProps {
  pandal: Pandal;
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted?: () => void;
  currentUserId?: string;
  currentUserName?: string;
}

export const CrowdReportModal: React.FC<CrowdReportModalProps> = ({
  pandal,
  isOpen,
  onClose,
  onReportSubmitted,
  currentUserId = 'user_me',
  currentUserName = 'You',
}) => {
  const currentStatus = getPandalCrowdStatus(pandal.id, pandal);

  const [selectedLevel, setSelectedLevel] = useState<CrowdLevel>(currentStatus.crowdLevel);
  const [selectedQueue, setSelectedQueue] = useState<number>(currentStatus.queueWaitMinutes);
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitCrowdReport(
      pandal.id,
      selectedLevel,
      selectedQueue,
      currentUserId,
      currentUserName,
      notes.trim() || undefined
    );
    playKanshorBell(0.9);
    setIsSubmitted(true);
    setTimeout(() => {
      onReportSubmitted?.();
      onClose();
      setIsSubmitted(false);
    }, 1200);
  };

  const crowdLevelOptions: Array<{
    level: CrowdLevel;
    label: string;
    bengaliLabel: string;
    color: string;
    icon: string;
    desc: string;
  }> = [
    {
      level: 'low',
      label: 'Low Gathering',
      bengaliLabel: 'স্বল্প ভিড়',
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
      icon: '🟢',
      desc: 'Free movement inside pandal, almost zero barricade wait',
    },
    {
      level: 'moderate',
      label: 'Moderate Flow',
      bengaliLabel: 'মাঝারি ভিড়',
      color: 'border-amber-500 bg-amber-500/10 text-amber-800 dark:text-amber-300',
      icon: '🟡',
      desc: 'Steady queue moving continuously through entry gates',
    },
    {
      level: 'high',
      label: 'High Surge',
      bengaliLabel: 'প্রবল ভিড়',
      color: 'border-orange-500 bg-orange-500/10 text-orange-800 dark:text-orange-300',
      icon: '🟠',
      desc: 'Extended barricades with stop-and-go queue management',
    },
    {
      level: 'extreme',
      label: 'Extreme Peak',
      bengaliLabel: 'অত্যধিক ভিড়',
      color: 'border-rose-600 bg-rose-500/15 text-rose-800 dark:text-rose-300',
      icon: '🔴',
      desc: 'Massive surge; VIP gates full and barricades stretched across main road',
    },
  ];

  const queueOptions = [5, 15, 25, 40, 60, 90];

  return (
    <div
      id="crowd-report-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-stone-900 border border-amber-500/30 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#881337] text-white text-micro font-black uppercase tracking-wider">
              <Users className="w-3.5 h-3.5 text-[#FDE68A]" />
              <span>Community Crowd & Queue Report</span>
            </div>
            <h3 className="font-display font-black text-h3 text-stone-900 dark:text-white mt-2">
              {pandal.name}
            </h3>
            <p className="text-micro text-stone-500 dark:text-stone-400">
              Your real-time report helps friends and fellow devotees plan smoothly.
            </p>
          </div>

          <button
            id="close-crowd-report-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-10 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-h3 font-black text-stone-900 dark:text-white">
              Report Successfully Submitted!
            </h4>
            <p className="text-small text-stone-600 dark:text-stone-300">
              Thank you for updating the crowd intelligence feed.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {/* 1. Crowd Density Level Selection */}
            <div>
              <label className="block text-micro font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2">
                1. Select Current Crowd Density
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {crowdLevelOptions.map((opt) => (
                  <button
                    key={opt.level}
                    type="button"
                    onClick={() => setSelectedLevel(opt.level)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      selectedLevel === opt.level
                        ? `${opt.color} ring-2 ring-amber-500 font-black shadow-sm`
                        : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/60 text-stone-700 dark:text-stone-300 hover:border-amber-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5">
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </span>
                      <span className="font-bengali-serif text-micro font-bold">{opt.bengaliLabel}</span>
                    </div>
                    <p className="text-[11px] opacity-80 leading-snug">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Queue Wait Time Picker */}
            <div>
              <label className="block text-micro font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-2 flex items-center justify-between">
                <span>2. Estimated Queue / Wait Time</span>
                <span className="text-small font-black text-[#881337] dark:text-amber-400">
                  ~{selectedQueue} minutes
                </span>
              </label>

              <div className="flex items-center gap-1.5 flex-wrap">
                {queueOptions.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedQueue(mins)}
                    className={`px-3.5 py-2 rounded-xl text-small font-bold border transition-all ${
                      selectedQueue === mins
                        ? 'bg-[#881337] border-[#881337] text-white shadow-xs'
                        : 'bg-white dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                    }`}
                  >
                    ~{mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Optional Notes */}
            <div>
              <label className="block text-micro font-black uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-1.5">
                3. Additional Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. VIP line is fast, heavy police barricade at south gate"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-small text-stone-900 dark:text-white placeholder-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#881337]"
              />
            </div>

            {/* Reliability Note */}
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-micro text-stone-600 dark:text-stone-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Weighted Reliability:</strong> All reports are verified using recency weighting to ensure dependable estimates for all groups.
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl border border-stone-300 dark:border-stone-700 text-small font-bold text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                Cancel
              </button>

              <button
                id="submit-live-crowd-report-btn"
                type="submit"
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-[#881337] to-[#DC2626] text-white text-small font-bold shadow-md hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Submit Report</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
