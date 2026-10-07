import React, { useState } from 'react';
import { Shield, MapPin, AlertCircle, RefreshCw, X, Radio, Check } from 'lucide-react';
import { DurgaThirdEye } from '../common/BengaliMotifs';

interface LocationConsentModalProps {
  isOpen: boolean;
  squadName: string;
  onAllow: () => Promise<void> | void;
  onCancel: () => void;
  isDarkMode?: boolean;
  permissionError?: string | null;
  onClearError?: () => void;
}

export const LocationConsentModal: React.FC<LocationConsentModalProps> = ({
  isOpen,
  squadName,
  onAllow,
  onCancel,
  isDarkMode = false,
  permissionError = null,
  onClearError,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);

  if (!isOpen) return null;

  const handleAllowClick = async () => {
    setIsRequesting(true);
    try {
      await onAllow();
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-modal-title"
    >
      <div
        className={`w-full max-w-md rounded-3xl border shadow-2xl overflow-hidden transition-all transform animate-scaleUp ${
          isDarkMode
            ? 'bg-[#1C1418] border-[#F59E0B]/30 text-white'
            : 'bg-white border-[#D97706]/30 text-stone-900'
        }`}
      >
        {/* Festive Header Accent */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-[#DC2626] to-[#881337]" />

        <div className="p-6 space-y-5">
          {/* Top Icon & Title */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#991B1B] to-[#DC2626] text-white flex items-center justify-center shadow-md shrink-0">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-amber-600 dark:text-amber-400 block">
                  PujaTrip Squad Live
                </span>
                <h3
                  id="consent-modal-title"
                  className="font-display font-black text-h3 text-stone-900 dark:text-white leading-tight"
                >
                  Share your live location with your Squad?
                </h3>
              </div>
            </div>

            <button
              onClick={onCancel}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Bengali Subheading */}
          <p className="font-bengali-serif text-small text-[#DC2626] font-semibold">
            আপনার দলের সদস্যদের সাথে লাইভ লোকেশন শেয়ার করবেন?
          </p>

          {/* Privacy & Purpose Explanation */}
          <div
            className={`p-4 rounded-2xl border space-y-2.5 ${
              isDarkMode
                ? 'bg-[#281B23] border-stone-800 text-stone-200'
                : 'bg-amber-50/70 border-amber-200/80 text-stone-800'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-small space-y-1">
                <p className="font-semibold text-stone-900 dark:text-white">
                  Your location will be visible only to members of this PujaTrip Squad while sharing is enabled.
                </p>
                <p className="text-micro text-stone-500 dark:text-stone-400">
                  Sharing is completely opt-in. You can pause or stop location updates at any time with a single tap.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-amber-200/60 dark:border-stone-800/80 flex items-center gap-2 text-micro text-stone-600 dark:text-stone-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>
                Active Squad: <strong>{squadName}</strong>
              </span>
            </div>
          </div>

          {/* Browser Permission Denied Error Box & Guidance */}
          {permissionError && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-2 animate-fadeIn">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-micro">
                  <p className="font-bold">Location permission is required for live tracking.</p>
                  <p className="mt-0.5 opacity-90 text-[11px] leading-relaxed">
                    {permissionError.includes('denied')
                      ? 'Browser location access was blocked. Please tap the site settings lock icon 🔒 near the address bar to allow location access, then tap Retry.'
                      : permissionError}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAllowClick}
                disabled={isRequesting}
                className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-micro flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRequesting ? 'animate-spin' : ''}`} />
                <span>Retry Location Permission</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              id="btn-allow-location-sharing"
              disabled={isRequesting}
              onClick={handleAllowClick}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-110 active:scale-98 text-white font-bold text-btn shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isRequesting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4 stroke-[3]" />
              )}
              <span>Allow Location Sharing</span>
            </button>

            <button
              type="button"
              id="btn-not-now-location-sharing"
              onClick={onCancel}
              className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-bold text-btn transition-colors cursor-pointer"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
