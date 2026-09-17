/* ============================================================
   Vatsalya Vatika PWA Service Worker
   Registers app for offline support & home screen install
   ============================================================ */

const CACHE_NAME = 'vatsalya-vatika-v4';

// Files to cache for offline use
const STATIC_ASSETS = [
  '/',
  '/desktop-icon.png?v=4',
  '/desktop-icon.png',
  '/site.webmanifest?v=4'
];

// ── Install: cache static assets ──────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Silently fail for assets not yet available
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean old caches ────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first strategy ─────────────────────────────
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Skip API calls — always go to network
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cloned);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
