import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { DurgaThirdEye } from './BengaliMotifs';
import { IOSInstallModal } from './IOSInstallModal';
import { Download, CheckCircle2, Smartphone, Sparkles, ExternalLink } from 'lucide-react';

interface PWAInstallCardProps {
  variant?: 'settings' | 'home';
  isDarkMode?: boolean;
}

export const PWAInstallCard: React.FC<PWAInstallCardProps> = ({
  variant = 'settings',
  isDarkMode = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      try {
        await install();
      } finally {
        setIsInstalling(false);
      }
    } else {
      // Browser does not support native prompt or event hasn't fired yet
      // Fallback: If on iOS show guide, else show friendly instructions
      setShowIOSModal(true);
    }
  };

  // If already installed as standalone PWA
  if (isInstalled) {
    if (variant === 'home') {
      // On Home, if already installed, keep home clean or return null
      return null;
    }

    return (
      <div
        id="pwa-installed-status-card"
        className={`p-4 rounded-3xl border shadow-xs transition-all ${
          isDarkMode
            ? 'bg-gradient-to-r from-emerald-950/40 via-[#281B23] to-[#1C1418] border-emerald-500/30 text-white'
            : 'bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white border-emerald-200 text-stone-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-black text-h3 text-emerald-700 dark:text-emerald-400">
                PujaTrip is installed ✓
              </span>
            </div>
            <p className="font-bengali text-small text-stone-600 dark:text-stone-300 font-semibold">
              পূজাত্রিপ আপনার ডিভাইসে সফলভাবে ইনস্টল করা আছে
            </p>
            <p className="text-micro text-stone-500 dark:text-stone-400 mt-0.5">
              Running in standalone app mode with offline pandal hopper shell.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If NOT installed: render the action card
  return (
    <>
      <div
        id={`pwa-install-${variant}-card`}
        className={`p-4 rounded-3xl border shadow-sm transition-all relative overflow-hidden ${
          isDarkMode
            ? 'bg-gradient-to-br from-[#3B1324]/80 via-[#2A1721] to-[#1C1217] border-[#F59E0B]/30 text-white'
            : 'bg-gradient-to-br from-[#FFF5F5] via-[#FFFDF9] to-[#FEF3C7]/60 border-[#DC2626]/20 text-stone-900'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#B45309] p-2 flex items-center justify-center shadow-md border border-amber-400/40 shrink-0 mt-0.5">
              <DurgaThirdEye size={36} color="#FFFDF9" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                  Install PujaTrip
                </h3>
                <span className="font-bengali-serif text-small text-[#DC2626] dark:text-[#FDE68A] font-bold">
                  (অ্যাপ ইনস্টল করুন)
                </span>
                <span className="text-micro font-bold bg-[#DC2626]/10 text-[#991B1B] dark:text-[#FEF08A] px-2 py-0.5 rounded-full border border-[#DC2626]/20">
                  PWA Standalone
                </span>
              </div>

              <p className="text-small text-stone-700 dark:text-stone-300 font-medium mt-1 leading-snug">
                Get the full Puja trip experience on your phone with faster access, offline pandal hopping, and no browser address bar.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end sm:justify-start">
            <button
              onClick={handleInstallClick}
              disabled={isInstalling}
              aria-label="Install PujaTrip App"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#991B1B] via-[#DC2626] to-[#B45309] text-white font-bold text-btn shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4 animate-bounce" />
              <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
              <span className="font-bengali text-small font-bold opacity-90">• ইনস্টল করুন</span>
            </button>
          </div>
        </div>
      </div>

      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
};
