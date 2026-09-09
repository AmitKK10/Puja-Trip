// PujaTrip Service Worker - Offline Pandal Hopping Cache
const CACHE_NAME = 'pujatrip-offline-v1';
const PANDAL_ASSETS_CACHE = 'pujatrip-pandals-v1';

const STATIC_PRECACHE = [
  '/',
  '/index.html',
  '/metadata.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE).catch((err) => {
        console.warn('[PujaTrip SW] Precache warning (non-fatal):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME && cache !== PANDAL_ASSETS_CACHE) {
            console.log('[PujaTrip SW] Deleting obsolete cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Handle image and static media caching
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i)) {
    event.respondWith(
      caches.open(PANDAL_ASSETS_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          // Return cached image, but fetch latest in background if online
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(request, networkResponse.clone());
            }
          }).catch(() => {/* Offline fallback active */});
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // If offline and image not found, return an empty SVG placeholder
          return new Response(
            `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="#281B23"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#FEF08A" font-family="sans-serif" font-size="16">PujaTrip Offline Image</text></svg>`,
            { headers: { 'Content-Type': 'image/svg+xml' } }
          );
        }
      })
    );
    return;
  }

  // Handle navigation and JS/CSS assets: Network first with Cache fallback
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        if (request.mode === 'navigate') {
          return caches.match('/index.html') || caches.match('/');
        }
        return new Response('Network offline', { status: 503, statusText: 'Offline' });
      })
  );
});
