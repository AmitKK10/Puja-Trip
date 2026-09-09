import { useState, useEffect, useCallback } from 'react';
import { Pandal } from '../types';
import {
  CachedPandalRecord,
  getCachedPandal,
  savePandalToOfflineCache,
  removeCachedPandal,
  getAllCachedPandals,
  getOfflineCacheStats,
  OfflineCacheStats,
  isCrowdNetworkJammedSimulated,
  setSimulatedCrowdNetworkJam,
} from '../services/pandalOfflineCacheService';

export interface UseOfflinePandalResult {
  isOnline: boolean;
  isSimulatedJam: boolean;
  isEffectiveOffline: boolean;
  cachedRecord: CachedPandalRecord | null;
  isCached: boolean;
  stats: OfflineCacheStats;
  allCachedPandals: CachedPandalRecord[];
  saveToCache: () => CachedPandalRecord | null;
  removeFromCache: () => void;
  toggleSimulatedJam: () => void;
  refreshState: () => void;
}

export function useOfflinePandal(pandal?: Pandal): UseOfflinePandalResult {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isSimulatedJam, setIsSimulatedJam] = useState<boolean>(
    isCrowdNetworkJammedSimulated()
  );
  const [cachedRecord, setCachedRecord] = useState<CachedPandalRecord | null>(
    pandal ? getCachedPandal(pandal.id) : null
  );
  const [allCached, setAllCached] = useState<CachedPandalRecord[]>([]);
  const [stats, setStats] = useState<OfflineCacheStats>({
    totalPandals: 0,
    lastUpdatedTimestamp: null,
    estimatedStorageSizeKb: 0,
    pandalIds: [],
  });

  const refreshState = useCallback(() => {
    if (typeof navigator !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
    setIsSimulatedJam(isCrowdNetworkJammedSimulated());
    if (pandal) {
      setCachedRecord(getCachedPandal(pandal.id));
    }
    setAllCached(getAllCachedPandals());
    setStats(getOfflineCacheStats());
  }, [pandal]);

  // Initial load and listeners
  useEffect(() => {
    refreshState();

    const handleOnline = () => {
      setIsOnline(true);
      refreshState();
    };
    const handleOffline = () => {
      setIsOnline(false);
      refreshState();
    };
    const handleCacheChange = () => {
      refreshState();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('pujatrip:offline-cache-change', handleCacheChange);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('pujatrip:offline-cache-change', handleCacheChange);
    };
  }, [refreshState]);

  // Automatic offline caching: Whenever a user opens a PandalDetailScreen,
  // save it quietly in background so if the network cuts out 30 seconds later,
  // the full details are already cached in localStorage & cacheStorage!
  useEffect(() => {
    if (pandal && isOnline && !isSimulatedJam) {
      const existing = getCachedPandal(pandal.id);
      // Auto-cache if not cached or if queueWaitMinutes changed
      if (!existing || existing.queueWaitMinutesSnapshot !== pandal.queueWaitMinutes) {
        savePandalToOfflineCache(pandal, 'auto_view');
      }
    }
  }, [pandal, isOnline, isSimulatedJam]);

  const saveToCache = useCallback(() => {
    if (!pandal) return null;
    const record = savePandalToOfflineCache(pandal, 'manual_save');
    setCachedRecord(record);
    refreshState();
    return record;
  }, [pandal, refreshState]);

  const removeFromCache = useCallback(() => {
    if (!pandal) return;
    removeCachedPandal(pandal.id);
    setCachedRecord(null);
    refreshState();
  }, [pandal, refreshState]);

  const toggleSimulatedJam = useCallback(() => {
    const nextVal = !isSimulatedJam;
    setSimulatedCrowdNetworkJam(nextVal);
    setIsSimulatedJam(nextVal);
  }, [isSimulatedJam]);

  return {
    isOnline,
    isSimulatedJam,
    isEffectiveOffline: !isOnline || isSimulatedJam,
    cachedRecord,
    isCached: Boolean(cachedRecord),
    stats,
    allCachedPandals: allCached,
    saveToCache,
    removeFromCache,
    toggleSimulatedJam,
    refreshState,
  };
}
