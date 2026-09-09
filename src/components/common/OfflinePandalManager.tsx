import React, { useState } from 'react';
import { Pandal } from '../../types';
import {
  CachedPandalRecord,
  formatCachedTimestamp,
  clearAllCachedPandals,
} from '../../services/pandalOfflineCacheService';
import { useOfflinePandal } from '../../hooks/useOfflinePandal';
import { playKanshorBell, playDhakHit } from '../../utils/audioSynth';
import confetti from 'canvas-confetti';
import {
  WifiOff,
  Wifi,
  HardDrive,
  CheckCircle2,
  Download,
  AlertTriangle,
  Info,
  Clock,
  Trash2,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Database,
  Layers,
  X,
  Radio,
} from 'lucide-react';
import { DhunuchiIcon, ShankhaIcon } from './BengaliMotifs';

interface OfflinePandalManagerProps {
  pandal: Pandal;
  isDarkMode?: boolean;
  onSelectOtherPandal?: (pandal: Pandal) => void;
}

export const OfflinePandalManager: React.FC<OfflinePandalManagerProps> = ({
  pandal,
  isDarkMode = false,
  onSelectOtherPandal,
}) => {
  const {
    isOnline,
    isSimulatedJam,
    isEffectiveOffline,
    cachedRecord,
    isCached,
    stats,
    allCachedPandals,
    saveToCache,
    removeFromCache,
    toggleSimulatedJam,
  } = useOfflinePandal(pandal);

  const [showInspectorModal, setShowInspectorModal] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  const handleManualSave = () => {
    const record = saveToCache();
    if (record) {
      playKanshorBell(0.6);
      playDhakHit('dha', 0.7);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#D97706', '#DC2626', '#10B981'],
      });
      setSaveToast('Pandal details saved to local storage! Accessible offline.');
      setTimeout(() => setSaveToast(null), 3500);
    }
  };

  return (
    <div id="offline-pandal-manager-section" className="space-y-2.5">
      {/* 1. Offline Mode Alert Banner (Visible when truly offline or simulated crowd jam) */}
      {isEffectiveOffline ? (
        <div
          id="offline-crowd-alert-banner"
          className="p-3.5 rounded-2xl border bg-gradient-to-r from-[#7F1D1D]/90 via-[#991B1B]/95 to-[#831843]/90 text-white shadow-md border-amber-400/40 relative overflow-hidden animate-fadeIn"
        >
          <div className="flex items-start justify-between gap-2.5">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shrink-0 mt-0.5 text-amber-300">
                <WifiOff className="w-4 h-4 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-small text-amber-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
                    Offline Darshan Mode Active
                  </span>
                  <span className="font-bengali text-micro text-amber-100 font-medium">
                    (ভিড়ে নেটওয়ার্ক জ্যাম • অফলাইন তথ্য)
                  </span>
                  {isSimulatedJam && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      Simulated Crowd Jam
                    </span>
                  )}
                </div>

                <p className="text-small text-stone-200 leading-snug">
                  You are viewing locally cached pandal data saved{' '}
                  <strong className="text-white">
                    {cachedRecord ? formatCachedTimestamp(cachedRecord.cachedAt) : 'earlier'}
                  </strong>
                  . Metro exits, idol artisan notes, and street food remain available without cell service.
                </p>

                {cachedRecord && (
                  <div className="pt-1 flex items-center gap-3 text-micro text-amber-200/90 font-medium">
                    <span>
                      Recorded Queue:{' '}
                      <strong className="text-white font-bold tabular-nums">
                        {cachedRecord.queueWaitMinutesSnapshot} min wait
                      </strong>
                    </span>
                    <span>•</span>
                    <span>
                      Crowd Level:{' '}
                      <strong className="text-white capitalize">
                        {cachedRecord.crowdLevelSnapshot.replace('_', ' ')}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <button
                onClick={() => setShowInspectorModal(true)}
                className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-micro font-bold text-white transition-all active:scale-95 flex items-center gap-1 shadow-xs"
              >
                <Database className="w-3 h-3 text-amber-300" />
                <span>Cache Info</span>
              </button>

              {isSimulatedJam && (
                <button
                  onClick={toggleSimulatedJam}
                  className="text-[11px] text-amber-300 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Turn Off Sim
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 2. Online Mode Cache Status Strip */
        <div
          id="online-cache-status-strip"
          className={`px-3 py-2 rounded-2xl border flex items-center justify-between gap-2 text-micro transition-all ${
            isDarkMode
              ? 'bg-[#281B23]/70 border-[#F59E0B]/20 text-stone-300'
              : 'bg-amber-50/80 border-amber-200/60 text-stone-700'
          }`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                isCached
                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isCached ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <HardDrive className="w-3.5 h-3.5" />
              )}
            </div>

            <div className="truncate">
              {isCached && cachedRecord ? (
                <span>
                  <strong className="text-emerald-700 dark:text-emerald-300 font-bold">
                    Cached for Offline Darshan
                  </strong>{' '}
                  <span className="opacity-75">
                    ({formatCachedTimestamp(cachedRecord.cachedAt)})
                  </span>
                </span>
              ) : (
                <span>
                  <strong className="text-stone-700 dark:text-stone-200 font-bold">
                    Auto-Caching to Local Storage
                  </strong>{' '}
                  <span className="opacity-75">• Ready for offline crowds</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleManualSave}
              className={`px-2.5 py-1 rounded-xl text-micro font-bold border transition-all active:scale-95 flex items-center gap-1 ${
                isDarkMode
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                  : 'bg-white border-amber-300 text-amber-900 hover:bg-amber-100/60 shadow-xs'
              }`}
              title="Pin or refresh the offline snapshot with current crowd status"
            >
              <Download className="w-3 h-3 text-amber-600 dark:text-amber-400" />
              <span>{isCached ? 'Update Cache' : 'Save Offline'}</span>
            </button>

            <button
              onClick={() => setShowInspectorModal(true)}
              className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 transition-colors"
              title="View Offline Cache Storage details"
            >
              <Database className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Save feedback toast */}
      {saveToast && (
        <div className="p-2 px-3 rounded-xl bg-emerald-600 text-white text-micro font-bold shadow-md flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* 3. Offline Cache Inspector & Simulator Modal */}
      {showInspectorModal && (
        <div
          id="offline-cache-inspector-modal"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={() => setShowInspectorModal(false)}
        >
          <div
            className={`w-full max-w-lg rounded-3xl border shadow-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto space-y-4 ${
              isDarkMode
                ? 'bg-[#1C1418] border-amber-500/30 text-stone-100'
                : 'bg-[#FFFDF9] border-amber-500/30 text-stone-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-600 to-rose-600 text-white flex items-center justify-center shadow-sm">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-black text-h3 text-[#881337] dark:text-[#FEF08A]">
                    Offline Pandal Storage
                  </h3>
                  <p className="text-micro text-stone-500 dark:text-stone-400 font-bengali font-semibold">
                    মণ্ডপ দর্শন অফলাইন ক্যাশ মেমোরি
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowInspectorModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-500 hover:text-stone-800 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Offline Simulation Switcher */}
            <div
              className={`p-3 rounded-2xl border space-y-2 ${
                isSimulatedJam
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className={`w-4 h-4 ${isSimulatedJam ? 'text-red-500 animate-pulse' : 'text-stone-400'}`} />
                  <div>
                    <span className="font-bold text-small block">
                      Simulate Dense Crowd Network Jam
                    </span>
                    <span className="text-micro text-stone-500 dark:text-stone-400">
                      Test viewing cached pandal data with jammed cellular towers
                    </span>
                  </div>
                </div>

                <button
                  id="btn-toggle-simulated-jam"
                  onClick={toggleSimulatedJam}
                  className={`px-3 py-1.5 rounded-xl font-bold text-micro transition-all ${
                    isSimulatedJam
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-300'
                  }`}
                >
                  {isSimulatedJam ? 'Jammed Active (Offline)' : 'Simulate Offline'}
                </button>
              </div>

              {isSimulatedJam && (
                <p className="text-micro text-red-600 dark:text-red-400 font-medium">
                  ⚡ Network congestion is now active in simulation. The app is serving all details from local offline cache.
                </p>
              )}
            </div>

            {/* Current Pandal Cache Snapshot Status */}
            <div className="space-y-2">
              <h4 className="text-small font-bold text-stone-800 dark:text-stone-200 flex items-center justify-between">
                <span>Current Pandal Snapshot</span>
                {isCached && (
                  <span className="text-micro text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Saved in Local Storage & SW Cache
                  </span>
                )}
              </h4>

              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-small space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-stone-200 dark:border-stone-700">
                  <span className="font-bold text-stone-800 dark:text-white">
                    {pandal.name} ({pandal.bengaliName})
                  </span>
                  <span className="text-micro px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-200 font-bold">
                    {pandal.area}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-micro">
                  <div>
                    <span className="text-stone-500 block">Cached Timestamp</span>
                    <strong className="text-stone-800 dark:text-stone-200">
                      {cachedRecord ? formatCachedTimestamp(cachedRecord.cachedAt) : 'Not saved yet'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-stone-500 block">Recorded Queue</span>
                    <strong className="text-stone-800 dark:text-stone-200 tabular-nums">
                      {cachedRecord ? `${cachedRecord.queueWaitMinutesSnapshot} min wait` : 'Live'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-stone-500 block">Transit Instructions</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      {pandal.transit.nearestMetro ? `${pandal.transit.nearestMetro.station} Gate` : 'Bus / Auto preserved'}
                    </strong>
                  </div>

                  <div>
                    <span className="text-stone-500 block">Theme & Artisan Data</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      Preserved in Full
                    </strong>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={handleManualSave}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 to-[#991B1B] text-white text-micro font-bold shadow-xs hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Update Snapshot Now</span>
                  </button>

                  {isCached && (
                    <button
                      onClick={removeFromCache}
                      className="py-2 px-3 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-red-500 text-micro font-medium transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Total Stored Pandals List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-small font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <span>All Cached Pandals ({allCachedPandals.length})</span>
                </h4>
                <span className="text-micro text-stone-500 tabular-nums">
                  ~{stats.estimatedStorageSizeKb} KB used
                </span>
              </div>

              {allCachedPandals.length === 0 ? (
                <p className="text-micro text-stone-500 py-3 text-center italic">
                  No other pandals in cache yet. Any pandal you open is auto-saved here.
                </p>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                  {allCachedPandals.map((record) => (
                    <div
                      key={record.pandal.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-micro transition-all ${
                        record.pandal.id === pandal.id
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200'
                          : 'bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 hover:border-amber-500/30'
                      }`}
                    >
                      <div className="truncate">
                        <span className="font-bold block truncate">
                          {record.pandal.name}
                        </span>
                        <span className="text-stone-500 text-[11px]">
                          {record.pandal.area} • {formatCachedTimestamp(record.cachedAt)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 tabular-nums">
                          {record.queueWaitMinutesSnapshot}m
                        </span>

                        {onSelectOtherPandal && record.pandal.id !== pandal.id && (
                          <button
                            onClick={() => {
                              setShowInspectorModal(false);
                              onSelectOtherPandal(record.pandal);
                            }}
                            className="p-1 text-amber-600 dark:text-amber-400 hover:scale-110 transition-transform"
                            title="Open this cached pandal"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Offline Hopping Best Practice Note */}
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-micro text-stone-700 dark:text-stone-300 space-y-1">
              <strong className="text-amber-800 dark:text-amber-200 font-bold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Crowd Hopping Pro-Tip:
              </strong>
              <p>
                Before leaving your hotel or home on Maha Ashtami/Navami evening, browse through the pandals on your planned route. Each one is automatically saved to local storage so you never lose exit gate directions or idol descriptions in signal deadzones!
              </p>
            </div>

            {/* Footer buttons */}
            <div className="pt-2 flex items-center justify-between border-t border-stone-200 dark:border-stone-800">
              {allCachedPandals.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear all cached pandal snapshots from device storage?')) {
                      clearAllCachedPandals();
                    }
                  }}
                  className="text-micro text-stone-400 hover:text-red-500 transition-colors"
                >
                  Clear All Cache
                </button>
              )}

              <button
                onClick={() => setShowInspectorModal(false)}
                className="ml-auto px-4 py-2 rounded-xl bg-stone-900 text-white dark:bg-white dark:text-stone-900 font-bold text-micro shadow-sm hover:opacity-90 active:scale-95 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
