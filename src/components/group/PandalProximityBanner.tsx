import React from 'react';
import { Pandal } from '../../types';
import { MapPin, CheckCircle2, X, Sparkles } from 'lucide-react';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';

interface PandalProximityBannerProps {
  pandal: Pandal;
  distanceMeters: number;
  onConfirmVisit: (pandal: Pandal) => void;
  onDismiss: () => void;
  isDarkMode?: boolean;
}

export const PandalProximityBanner: React.FC<PandalProximityBannerProps> = ({
  pandal,
  distanceMeters,
  onConfirmVisit,
  onDismiss,
  isDarkMode = false,
}) => {
  const handleConfirm = () => {
    playKanshorBell(0.8);
    playDhakHit('dha', 0.9);
    onConfirmVisit(pandal);
  };

  return (
    <div
      id="pandal-gps-proximity-banner"
      className={`p-3.5 rounded-2xl border shadow-lg animate-bounce-subtle transition-all ${
        isDarkMode
          ? 'bg-gradient-to-r from-[#3B1324] via-[#2A1520] to-[#1C1418] border-[#DC2626]/50 text-white'
          : 'bg-gradient-to-r from-[#FFFBEB] via-[#FEF3C7] to-amber-100 border-[#DC2626]/40 text-stone-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left Icon & Message */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#991B1B] to-[#DC2626] text-white flex items-center justify-center shrink-0 shadow-md animate-pulse mt-0.5">
            <MapPin className="w-5 h-5 text-[#FEF08A]" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#DC2626] bg-[#DC2626]/10 px-2 py-0.2 rounded-full">
                📍 GPS Proximity Detected
              </span>
              <span className="text-[11px] text-stone-500 font-semibold">
                ~{Math.round(distanceMeters)}m away
              </span>
            </div>

            <h4 className="font-display font-black text-small sm:text-h4 text-stone-900 dark:text-white truncate mt-0.5">
              You appear to be near <strong>{pandal.name}</strong>
            </h4>

            <p className="font-bengali text-micro text-[#DC2626] font-bold">
              আপনি কি {pandal.bengaliName}-এ দর্শন সম্পন্ন করেছেন?
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 shrink-0 self-center">
          <button
            onClick={handleConfirm}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:brightness-110 text-white text-micro font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Visited</span>
          </button>

          <button
            onClick={onDismiss}
            className="p-2 rounded-xl hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-all"
            title="Dismiss prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
