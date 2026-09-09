import { Pandal, CrowdLevel } from '../types';

export interface CachedPandalRecord {
  pandal: Pandal;
  cachedAt: number; // timestamp in ms
  cachedAtFormatted: string; // Human-readable date/time string
  queueWaitMinutesSnapshot: number;
  crowdLevelSnapshot: CrowdLevel;
  source: 'auto_view' | 'manual_save';
  networkStatusAtCache: 'online' | 'offline';
  notes?: string;
}

export interface OfflineCacheStats {
  totalPandals: number;
  lastUpdatedTimestamp: number | null;
  estimatedStorageSizeKb: number;
  pandalIds: string[];
}

const LOCAL_STORAGE_CACHE_KEY = 'pujatrip_cached_pandals_v1';
const SIMULATED_JAM_KEY = 'pujatrip_simulated_network_jam';
const PANDALS_CACHE_STORAGE_NAME = 'pujatrip-pandals-v1';

/**
 * Format timestamp into human-readable string
 */
export function formatCachedTimestamp(timestamp: number): string {
  const now = Date.now();
  const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Safe local storage reader
 */
function readCacheMap(): Record<string, CachedPandalRecord> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('[PandalOfflineCache] Failed to read from localStorage:', err);
    return {};
  }
}

/**
 * Safe local storage writer
 */
function writeCacheMap(map: Record<string, CachedPandalRecord>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(map));
    notifyCacheSubscribers();
  } catch (err) {
    console.error('[PandalOfflineCache] Failed to write to localStorage:', err);
  }
}

/**
 * Notify listening UI components that the cache state changed
 */
function notifyCacheSubscribers(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('pujatrip:offline-cache-change'));
  }
}

/**
 * Cache images in the CacheStorage API if supported
 */
async function cachePandalImages(pandal: Pandal): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;
  try {
    const cache = await window.caches.open(PANDALS_CACHE_STORAGE_NAME);
    const urlsToCache: string[] = [];

    if (pandal.heroImage && pandal.heroImage.startsWith('http')) {
      urlsToCache.push(pandal.heroImage);
    }
    if (Array.isArray(pandal.photos)) {
      pandal.photos.forEach((photo) => {
        if (photo && photo.startsWith('http') && !urlsToCache.includes(photo)) {
          urlsToCache.push(photo);
        }
      });
    }

    // Attempt to cache images quietly in background
    for (const url of urlsToCache) {
      try {
        const match = await cache.match(url);
        if (!match) {
          const res = await fetch(url, { mode: 'no-cors' });
          if (res) {
            await cache.put(url, res);
          }
        }
      } catch (e) {
        // Non-blocking for external CDN cross-origin images
      }
    }
  } catch (err) {
    console.warn('[PandalOfflineCache] Image cache storage notice:', err);
  }
}

/**
 * Save or update a pandal in the offline cache
 */
export function savePandalToOfflineCache(
  pandal: Pandal,
  source: 'auto_view' | 'manual_save' = 'auto_view'
): CachedPandalRecord {
  const map = readCacheMap();
  const now = Date.now();
  const formatted = formatCachedTimestamp(now);

  const record: CachedPandalRecord = {
    pandal: { ...pandal },
    cachedAt: now,
    cachedAtFormatted: formatted,
    queueWaitMinutesSnapshot: pandal.queueWaitMinutes,
    crowdLevelSnapshot: pandal.crowdLevel,
    source,
    networkStatusAtCache: navigator.onLine ? 'online' : 'offline',
  };

  map[pandal.id] = record;
  writeCacheMap(map);

  // Trigger non-blocking image precaching
  cachePandalImages(pandal).catch(() => {});

  return record;
}

/**
 * Retrieve cached pandal record by ID
 */
export function getCachedPandal(pandalId: string): CachedPandalRecord | null {
  const map = readCacheMap();
  return map[pandalId] || null;
}

/**
 * Check if a pandal is currently cached
 */
export function isPandalCached(pandalId: string): boolean {
  const map = readCacheMap();
  return Boolean(map[pandalId]);
}

/**
 * Get all cached pandal records ordered by most recently cached first
 */
export function getAllCachedPandals(): CachedPandalRecord[] {
  const map = readCacheMap();
  return Object.values(map).sort((a, b) => b.cachedAt - a.cachedAt);
}

/**
 * Remove a specific pandal from offline cache
 */
export function removeCachedPandal(pandalId: string): void {
  const map = readCacheMap();
  if (map[pandalId]) {
    delete map[pandalId];
    writeCacheMap(map);
  }
}

/**
 * Clear all cached pandals
 */
export function clearAllCachedPandals(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_CACHE_KEY);
    notifyCacheSubscribers();
  } catch (err) {
    console.error('[PandalOfflineCache] Error clearing cache:', err);
  }
}

/**
 * Calculate offline cache stats
 */
export function getOfflineCacheStats(): OfflineCacheStats {
  const map = readCacheMap();
  const pandalIds = Object.keys(map);
  const totalPandals = pandalIds.length;

  let lastUpdatedTimestamp: number | null = null;
  pandalIds.forEach((id) => {
    const item = map[id];
    if (!lastUpdatedTimestamp || item.cachedAt > lastUpdatedTimestamp) {
      lastUpdatedTimestamp = item.cachedAt;
    }
  });

  // Rough estimation of storage size
  let estimatedStorageSizeKb = 0;
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY) || '';
    estimatedStorageSizeKb = Math.round((raw.length * 2) / 1024);
  }

  return {
    totalPandals,
    lastUpdatedTimestamp,
    estimatedStorageSizeKb,
    pandalIds,
  };
}

/**
 * Cache all pandals in an active trip itinerary for offline hopping
 */
export function cacheEntireTripPandals(pandals: Pandal[]): number {
  let count = 0;
  pandals.forEach((p) => {
    savePandalToOfflineCache(p, 'manual_save');
    count++;
  });
  return count;
}

/**
 * Simulation of crowded network jam (telecom cellular congestion)
 * Allows testing and experiencing offline darshan mode directly in preview
 */
export function isCrowdNetworkJammedSimulated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(SIMULATED_JAM_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSimulatedCrowdNetworkJam(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    if (enabled) {
      sessionStorage.setItem(SIMULATED_JAM_KEY, 'true');
    } else {
      sessionStorage.removeItem(SIMULATED_JAM_KEY);
    }
    notifyCacheSubscribers();
  } catch (err) {
    console.error('[PandalOfflineCache] Error setting simulated jam:', err);
  }
}

/**
 * Register Service Worker safely
 */
export function registerPujaTripServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  // Don't block initial render; register on window load
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('[PujaTrip SW] Registered successfully with scope:', registration.scope);
      })
      .catch((error) => {
        // In certain iframe preview containers, Service Workers may be restricted by sandbox flags
        console.info('[PujaTrip SW] Notice (SW sandbox or unsupported):', error.message);
      });
  });
}
