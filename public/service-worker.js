/* eslint-disable no-restricted-globals */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.

// Precache manifest will be injected by workbox-webpack-plugin
self.__WB_MANIFEST = [].concat(self.__WB_MANIFEST || []);

const { registerRoute, setCatchHandler, setDefaultHandler } = workbox.routing;
const { CacheFirst, StaleWhileRevalidate, NetworkFirst, NetworkOnly } = workbox.strategies;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { ExpirationPlugin } = workbox.expiration;
const { BroadcastUpdatePlugin } = workbox.broadcastUpdate;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

// Cache names and versions
const CACHE_VERSIONS = {
  static: 'static-v1',
  dynamic: 'dynamic-v1',
  api: 'api-v1',
  firestore: 'firestore-v1',
  auth: 'auth-v1',
  fonts: 'fonts-v1',
  images: 'images-v1'
};

// Cache expiration times (in seconds)
const EXPIRATION_TIMES = {
  static: 60 * 60 * 24 * 30, // 30 days
  dynamic: 60 * 60 * 24, // 24 hours
  api: 60 * 60, // 1 hour
  firestore: 60 * 60 * 24, // 24 hours
  auth: 60 * 60, // 1 hour
  fonts: 60 * 60 * 24 * 365, // 1 year
  images: 60 * 60 * 24 * 30 // 30 days
};

// Critical assets that should be pre-cached
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png',
  '/static/css/main.4f8c016c.css',
  '/static/js/main.cca84b93.js',
  '/static/js/977.dccd1c1d.chunk.js',
  '/static/js/732.0be11214.chunk.js',
  '/static/js/453.425ac99a.chunk.js',
  '/workbox-352554f6.js',
  // Add icons for PWA
  '/icons/icon-72x72.png',
  '/icons/icon-96x96.png',
  '/icons/icon-128x128.png',
  '/icons/icon-144x144.png',
  '/icons/icon-152x152.png',
  '/icons/icon-192x192.png',
  '/icons/icon-384x384.png',
  '/icons/icon-512x512.png',
  // Add shortcuts if needed
  '/shortcuts/shortcut-96x96.png',
  '/shortcuts/shortcut-144x144.png',
  '/shortcuts/shortcut-192x192.png'
];

// Install event - precache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_VERSIONS.static)
        .then((cache) => cache.addAll(CRITICAL_ASSETS)),
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!Object.values(CACHE_VERSIONS).includes(cacheName)) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim all clients
      self.clients.claim()
    ])
  );
});

// Cache strategies for different types of content

// 1. Static assets (JS, CSS, images) - Cache First with versioning
registerRoute(
  ({ request }) => 
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_VERSIONS.static,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: EXPIRATION_TIMES.static,
      }),
      new BroadcastUpdatePlugin({
        channelName: 'static-assets-updates'
      })
    ],
  })
);

// 2. API requests - Network First with background sync
const bgSyncPlugin = new BackgroundSyncPlugin('api-queue', {
  maxRetentionTime: 24 * 60 // 24 hours
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: CACHE_VERSIONS.api,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: EXPIRATION_TIMES.api,
      }),
      bgSyncPlugin
    ],
  })
);

// 3. Firebase Auth endpoints - Network First with graceful degradation
registerRoute(
  ({ url }) => 
    url.href.includes('identitytoolkit.googleapis.com') || 
    url.href.includes('securetoken.googleapis.com'),
  new NetworkFirst({
    cacheName: CACHE_VERSIONS.auth,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 10,
        maxAgeSeconds: EXPIRATION_TIMES.auth,
      }),
    ],
    fallback: async () => {
      return new Response(
        JSON.stringify({ isOffline: true, error: 'No internet connection' }),
        { 
          headers: { 'Content-Type': 'application/json' },
          status: 503
        }
      );
    },
  })
);

// 4. Firestore endpoints - Network First with offline persistence
registerRoute(
  ({ url }) => url.href.includes('firestore.googleapis.com'),
  new NetworkFirst({
    cacheName: CACHE_VERSIONS.firestore,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: EXPIRATION_TIMES.firestore,
      }),
    ],
    fallback: async ({ request }) => {
      try {
        const cache = await caches.open(CACHE_VERSIONS.firestore);
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }
        return new Response(
          JSON.stringify({ isOffline: true, error: 'No cached data available' }),
          { 
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      } catch (error) {
        return Response.error();
      }
    },
  })
);

// 5. Google Fonts - Stale-while-revalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com',
  new StaleWhileRevalidate({
    cacheName: CACHE_VERSIONS.fonts,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: EXPIRATION_TIMES.fonts,
        maxEntries: 30,
      }),
    ],
  })
);

// 6. Images - Cache First with versioning
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: CACHE_VERSIONS.images,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: EXPIRATION_TIMES.images,
      }),
      new BroadcastUpdatePlugin({
        channelName: 'image-updates'
      })
    ],
  })
);

// 7. Navigation requests - Network First with offline fallback
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: CACHE_VERSIONS.dynamic,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: EXPIRATION_TIMES.dynamic,
      }),
    ],
    networkTimeoutSeconds: 3,
    fallback: async () => {
      try {
        const cache = await caches.open(CACHE_VERSIONS.static);
        const cachedResponse = await cache.match('/offline.html');
        return cachedResponse || Response.error();
      } catch (error) {
        return Response.error();
      }
    },
  })
);

// Default handler for all other requests
setDefaultHandler(
  new StaleWhileRevalidate({
    cacheName: CACHE_VERSIONS.dynamic,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: EXPIRATION_TIMES.dynamic,
      }),
    ],
  })
);

// Catch handler for failed requests
setCatchHandler(async ({ event }) => {
  // If this is a navigation request, return the offline page
  if (event.request.mode === 'navigate') {
    return caches.match('/offline.html');
  }
  
  // For all other requests, return a custom offline response
  return new Response('Offline', {
    status: 503,
    statusText: 'Service Unavailable',
    headers: new Headers({
      'Content-Type': 'text/plain'
    })
  });
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  } else if (event.tag === 'sync-redemptions') {
    event.waitUntil(syncRedemptions());
  }
});

// Sync pending transactions
async function syncTransactions() {
  try {
    // Get all unsynced transactions from IndexedDB
    const response = await fetch('/api/transactions/unsynced');
    const unsyncedTransactions = await response.json();

    if (unsyncedTransactions.length === 0) {
      return;
    }

    // Process each transaction
    for (const transaction of unsyncedTransactions) {
      try {
        // Submit to Firebase
        const firebaseResponse = await fetch('/api/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transaction),
        });

        if (!firebaseResponse.ok) {
          throw new Error('Failed to sync transaction');
        }

        const result = await firebaseResponse.json();

        // Mark as synced in IndexedDB
        await fetch('/api/transactions/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            localId: transaction.id,
            serverId: result.id,
          }),
        });

        // Update member's points
        await fetch(`/api/members/${transaction.memberId}/points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            points: transaction.pointsEarned,
          }),
        });

        // Backup to Google Sheets
        await fetch('/api/backup/transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: result.id,
            ...transaction,
          }),
        });
      } catch (error) {
        console.error('Error syncing transaction:', error);
        // Don't throw here to continue with other transactions
      }
    }
  } catch (error) {
    console.error('Error in syncTransactions:', error);
    throw error; // This will trigger a retry
  }
}

// Sync pending redemptions
async function syncRedemptions() {
  try {
    // Get all unsynced redemptions from IndexedDB
    const response = await fetch('/api/redemptions/unsynced');
    const unsyncedRedemptions = await response.json();

    if (unsyncedRedemptions.length === 0) {
      return;
    }

    // Process each redemption
    for (const redemption of unsyncedRedemptions) {
      try {
        // Submit to Firebase
        const firebaseResponse = await fetch('/api/redemptions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(redemption),
        });

        if (!firebaseResponse.ok) {
          throw new Error('Failed to sync redemption');
        }

        const result = await firebaseResponse.json();

        // Mark as synced in IndexedDB
        await fetch('/api/redemptions/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            localId: redemption.id,
            serverId: result.id,
          }),
        });

        // Update member's points
        await fetch(`/api/members/${redemption.memberId}/points`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            points: -redemption.pointsRedeemed,
          }),
        });

        // Backup to Google Sheets
        await fetch('/api/backup/redemption', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: result.id,
            ...redemption,
          }),
        });
      } catch (error) {
        console.error('Error syncing redemption:', error);
        // Don't throw here to continue with other redemptions
      }
    }
  } catch (error) {
    console.error('Error in syncRedemptions:', error);
    throw error; // This will trigger a retry
  }
}

// Handle push notifications with offline support
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.notification.body,
      icon: '/icons/logo-192.png',
      badge: '/icons/badge-96.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open App'
        }
      ],
      // Add offline support for notifications
      renotify: true,
      tag: data.notification.tag || 'default',
      silent: false
    };

    event.waitUntil(
      self.registration.showNotification(data.notification.title, options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

// Handle notification click with offline support
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Try to focus an existing window first
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no existing window, try to open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen).catch(() => {
          // If offline and can't open URL, open the offline page
          return clients.openWindow(CRITICAL_ASSETS[1]);
        });
      }
    })
  );
}); 