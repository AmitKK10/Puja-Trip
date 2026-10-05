import React, { useState, useEffect } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { DurgaThirdEye } from './BengaliMotifs';
import { IOSInstallModal } from './IOSInstallModal';
import { Download, X, Sparkles } from 'lucide-react';

interface PWAInstallBannerProps {
  isDarkMode?: boolean;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ isDarkMode = false }) => {
  const { isInstallable, isInstalled, isIOS, isBannerDismissed, install, dismissBanner } =
    usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Delay showing the banner slightly after user arrives/interacts
  useEffect(() => {
    if (isInstalled || isBannerDismissed) {
      setIsVisible(false);
      return;
    }

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isInstalled, isBannerDismissed]);

  if (!isVisible || isInstalled || isBannerDismissed) {
    return null;
  }

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
      setShowIOSModal(true);
    }
  };

  return (
    <>
      <aside
        id="pwa-floating-install-banner"
        aria-label="PWA Installation Prompt"
        className="fixed bottom-20 left-0 right-0 z-40 px-3.5 pointer-events-none"
      >
        <div className="max-w-md mx-auto pointer-events-auto">
          <div
            className={`p-3.5 rounded-2xl border shadow-xl backdrop-blur-md transition-all animate-bounceIn flex items-center justify-between gap-3 ${
              isDarkMode
                ? 'bg-[#281B23]/95 border-[#F59E0B]/40 text-white shadow-[0_8px_30px_rgba(0,0,0,0.6)]'
                : 'bg-white/95 border-amber-300/90 text-stone-900 shadow-[0_8px_30px_rgba(153,27,27,0.18)]'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#991B1B] via-[#DC2626] to-[#B45309] p-1.5 flex items-center justify-center shadow-xs border border-amber-400/40 shrink-0">
                <DurgaThirdEye size={28} color="#FFFDF9" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-black text-body text-stone-950 dark:text-white truncate">
                    PujaTrip
                  </span>
                  <span className="text-[10px] font-bold bg-[#DC2626]/10 text-[#991B1B] dark:text-[#FEF08A] px-1.5 py-0.2 rounded-full border border-[#DC2626]/20">
                    App
                  </span>
                </div>
                <p className="text-small text-stone-700 dark:text-stone-300 font-medium line-clamp-1 leading-tight mt-0.5">
                  Install for faster access during Puja trips
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#991B1B] to-[#DC2626] text-white font-bold text-small shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isInstalling ? '...' : 'Install App'}</span>
              </button>

              <button
                onClick={dismissBanner}
                aria-label="Dismiss install banner"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <IOSInstallModal
        isOpen={showIOSModal}
        onClose={() => setShowIOSModal(false)}
        isDarkMode={isDarkMode}
      />
    </>
  );
};
