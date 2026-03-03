/**
 * Service Worker for AttendSync PWA.
 * Implements a cache-first strategy for the application shell and assets.
 */

const CACHE_NAME = 'attendsync-cache-v1';

// A list of essential files to be pre-cached when the service worker is installed.
const URLS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  // Pre-cache the application shell and essential assets.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  // Clean up old caches to ensure the user gets the latest version.
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignore non-GET requests (like POSTs to Firestore).
  if (event.request.method !== 'GET') {
    return;
  }

  // Cache-first strategy.
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // If a cached response is found, return it.
      return cachedResponse || fetch(event.request).then((response) => {
        // If fetched from network, cache it for next time.
        return caches.open(CACHE_NAME).then((cache) => {
          if (response.status === 200) {
            cache.put(event.request.url, response.clone());
          }
          return response;
        });
      });
    })
  );
});