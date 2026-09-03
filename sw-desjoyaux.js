// Service Worker for Percent+ (Desjoyaux) — enables fully offline use after first load.
// Fully independent from the B2B2C app's service worker (sw-b2b2c.js):
// distinct cache name, distinct precached files, distinct offline fallback.
const CACHE_NAME = 'percent-plus-desjoyaux-v1';
const PRECACHE_URLS = [
  './percent-plus.html',
  './apple-touch-icon-desjoyaux.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache each file individually so one failure doesn't block the rest
      for (const url of PRECACHE_URLS) {
        try {
          await cache.add(url);
        } catch (e) {
          // ignore individual failures, keep going
        }
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  event.waitUntil(self.clients.claim());
});

// Network-first: try to fetch fresh content, but always save a copy in cache.
// If the network fails (no internet), serve the last cached copy instead,
// falling back to the main Desjoyaux page if the exact request was never cached.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone).catch(() => {});
        });
        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match('./percent-plus.html'))
      )
  );
});
