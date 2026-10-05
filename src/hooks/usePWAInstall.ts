import { useEffect, useState, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

// Global cached deferred prompt to ensure early event is captured
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDeferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((listener) => listener());
  });

  window.addEventListener('appinstalled', () => {
    globalDeferredPrompt = null;
    listeners.forEach((listener) => listener());
  });
}

const DISMISSAL_KEY = 'pujatrip_install_banner_dismissed_v1';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => globalDeferredPrompt
  );
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes('android-app://');
    return isStandalone;
  });

  const [isIOS, setIsIOS] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
  });

  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      return localStorage.getItem(DISMISSAL_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const updateState = () => {
      setDeferredPrompt(globalDeferredPrompt);

      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
    };

    listeners.add(updateState);

    // Media query listener for real-time standalone transitions
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    };

    try {
      mediaQuery.addEventListener('change', handleMediaChange);
    } catch {
      // Fallback for older Safari
      mediaQuery.addListener(handleMediaChange);
    }

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      globalDeferredPrompt = null;
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      listeners.delete(updateState);
      try {
        mediaQuery.removeEventListener('change', handleMediaChange);
      } catch {
        mediaQuery.removeListener(handleMediaChange);
      }
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unsupported'> => {
    const promptEvent = deferredPrompt || globalDeferredPrompt;
    if (!promptEvent) {
      return 'unsupported';
    }

    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        globalDeferredPrompt = null;
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.warn('[PujaTrip PWA] Install error:', err);
      return 'unsupported';
    }
  }, [deferredPrompt]);

  const dismissBanner = useCallback(() => {
    try {
      localStorage.setItem(DISMISSAL_KEY, 'true');
    } catch {}
    setIsBannerDismissed(true);
  }, []);

  const resetDismissBanner = useCallback(() => {
    try {
      localStorage.removeItem(DISMISSAL_KEY);
    } catch {}
    setIsBannerDismissed(false);
  }, []);

  return {
    isInstallable: !!(deferredPrompt || globalDeferredPrompt),
    isInstalled,
    isIOS,
    isBannerDismissed,
    install,
    dismissBanner,
    resetDismissBanner,
  };
}
