import React from 'react';
import { Share, PlusSquare, CheckCircle, X, Sparkles, Smartphone } from 'lucide-react';
import { DurgaThirdEye, AlpanaCorner } from './BengaliMotifs';

interface IOSInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export const IOSInstallModal: React.FC<IOSInstallModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-sm rounded-3xl p-5 border shadow-2xl overflow-hidden transition-all transform scale-100 ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#2D1622] via-[#22131A] to-[#180E14] border-[#F59E0B]/30 text-white'
            : 'bg-gradient-to-br from-[#FFFDF9] via-[#FFF9F2] to-[#FFF1F2] border-[#D97706]/30 text-stone-900'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <AlpanaCorner position="top-right" size={44} color="#F59E0B" className="absolute top-1 right-1 opacity-25 pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 dark:bg-white/10 hover:bg-black/20 dark:hover:bg-white/20 transition-all text-stone-600 dark:text-stone-300"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with PujaTrip Logo */}
        <div className="flex items-center gap-3 pr-6 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#B45309] p-2 flex items-center justify-center shadow-md border border-amber-400/40 shrink-0">
            <DurgaThirdEye size={36} color="#FFFDF9" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-display font-black text-h3 text-stone-950 dark:text-white" id="ios-modal-title">
                Install PujaTrip
              </span>
              <span className="text-micro font-bold bg-[#DC2626]/10 text-[#991B1B] dark:text-[#FEF08A] px-2 py-0.5 rounded-full border border-[#DC2626]/20">
                iOS Safari
              </span>
            </div>
            <p className="font-bengali text-small text-[#991B1B] dark:text-[#FEF08A] font-bold">
              আইফোন ও আইপ্যাডে অ্যাপ ইনস্টল করুন
            </p>
          </div>
        </div>

        <p className="text-small text-stone-600 dark:text-stone-300 mb-4 leading-relaxed font-medium">
          Follow these 3 quick steps in Safari to add PujaTrip to your Home Screen for full-screen pandal hopping without browser bars:
        </p>

        {/* Step-by-Step Instructions */}
        <div className="space-y-3">
          {/* Step 1 */}
          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-black/30 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Share className="w-5 h-5" />
            </div>
            <div className="text-small">
              <span className="font-bold text-stone-900 dark:text-white block">
                1. Tap the Share button in Safari
              </span>
              <span className="text-micro text-stone-500 dark:text-stone-400">
                Located on the bottom navigation bar on iPhone, or top bar on iPad.
              </span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-black/30 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
              <PlusSquare className="w-5 h-5" />
            </div>
            <div className="text-small">
              <span className="font-bold text-stone-900 dark:text-white block">
                2. Select &ldquo;Add to Home Screen&rdquo;
              </span>
              <span className="text-micro text-stone-500 dark:text-stone-400">
                Scroll down the Share menu and tap <span className="font-semibold text-stone-700 dark:text-stone-200">&ldquo;Add to Home Screen&rdquo;</span>.
              </span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 p-2.5 rounded-2xl bg-white dark:bg-black/30 border border-stone-200 dark:border-stone-800 shadow-2xs">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="text-small">
              <span className="font-bold text-stone-900 dark:text-white block">
                3. Tap &ldquo;Add&rdquo; in the top-right corner
              </span>
              <span className="text-micro text-stone-500 dark:text-stone-400">
                PujaTrip will install and appear right on your home screen!
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#B45309] text-white font-bold text-btn shadow-md hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5"
        >
          <span>Got it! (বুঝেছি)</span>
        </button>
      </div>
    </div>
  );
};
