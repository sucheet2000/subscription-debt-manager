/**
 * Service Worker for Subscription Debt Manager
 * Enables offline functionality and faster repeat visits
 * Implements cache-first strategy for static assets
 */

const CACHE_NAME = 'subscription-manager-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Files to cache on install
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/src/index.css',
  '/vite.svg',
];

/**
 * Install Event
 * Caches essential assets when service worker is first registered
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

/**
 * Activate Event
 * Cleans up old cache versions
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );

  // Take control of all pages immediately
  self.clients.claim();
});

/**
 * Fetch Event
 * Implements cache-first strategy for static assets
 * Network-first for API calls
 */
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const { request } = event;
  const url = new URL(request.url);

  // Strategy 1: Cache first for static assets
  if (
    request.url.endsWith('.js') ||
    request.url.endsWith('.css') ||
    request.url.endsWith('.html') ||
    request.url.endsWith('.json') ||
    request.url.endsWith('.svg') ||
    request.url.endsWith('.png') ||
    request.url.endsWith('.jpg') ||
    request.url.endsWith('.gif') ||
    request.url.endsWith('.ico') ||
    request.url.endsWith('.woff') ||
    request.url.endsWith('.woff2')
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        // Return cached response if available
        if (response) {
          return response;
        }

        // Otherwise fetch from network and cache
        return fetch(request)
          .then((response) => {
            // Clone the response
            const clonedResponse = response.clone();

            // Cache it
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clonedResponse);
            });

            return response;
          })
          .catch(() => {
            // Return offline page if available
            return caches.match('/offline.html');
          });
      })
    );
  }
  // Strategy 2: Network first for API calls and other requests
  else {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response
          const clonedResponse = response.clone();

          // Cache successful API responses
          if (response.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, clonedResponse);
            });
          }

          return response;
        })
        .catch(() => {
          // Fall back to cache if network fails
          return caches.match(request).then((response) => {
            return response || createOfflineResponse();
          });
        })
    );
  }
});

/**
 * Create offline response fallback
 * Sends a simple offline message
 */
function createOfflineResponse() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Offline</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: #1a1a1a;
            color: #fff;
          }
          .message {
            text-align: center;
          }
          h1 { margin-bottom: 1rem; }
          p { color: #ccc; }
        </style>
      </head>
      <body>
        <div class="message">
          <h1>📴 You're Offline</h1>
          <p>Your subscription data is cached locally.</p>
          <p>Check your internet connection to sync with the server.</p>
        </div>
      </body>
    </html>
  `;

  return new Response(htmlContent, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

/**
 * Message Event
 * Handles messages from the main app
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
    caches.delete(RUNTIME_CACHE);
    console.log('Service Worker: Caches cleared');
  }
});

console.log('Service Worker: Loaded and ready');
