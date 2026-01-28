/// <reference lib="webworker" />

const CACHE_NAME = 'otakudb-v1';
const STATIC_CACHE = 'otakudb-static-v1';
const API_CACHE = 'otakudb-api-v1';

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== STATIC_CACHE && name !== API_CACHE)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Clean localhost:4000 requests from API cache
      return caches.open(API_CACHE).then((cache) => {
        return cache.keys().then((requests) => {
          return Promise.all(
            requests
              .filter(req => req.url.includes('localhost:4000'))
              .map(req => cache.delete(req))
          );
        });
      });
    })
  );
  self.clients.claim();
});

// Fetch event - network first, cache fallback
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // API requests - network first with cache fallback
  if (url.hostname === 'api.jikan.moe') {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        try {
          const response = await fetch(event.request);
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (error) {
          const cached = await cache.match(event.request);
          if (cached) {
            return cached;
          }
          // Return a generic error response instead of throwing
          return new Response('Service unavailable', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        }
      }).catch(() => {
        // Ensure we always return a Response
        return new Response('Service unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      })
    );
    return;
  }
  
  // Static assets - cache first
  if (event.request.destination === 'image' || 
      event.request.destination === 'script' || 
      event.request.destination === 'style') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) {
          return cached;
        }
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
  
  // Default - network first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Ensure we have a valid response
        if (!response || response.status === 0) {
          throw new Error('Invalid response');
        }
        return response;
      })
      .catch(async () => {
        // Try to get from cache
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }
        // Return a proper error response
        return new Response('Service unavailable', {
          status: 503,
          statusText: 'Service Unavailable',
        });
      })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Nouvel épisode disponible !',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
        animeId: data.animeId,
      },
      actions: [
        { action: 'open', title: 'Voir' },
        { action: 'dismiss', title: 'Ignorer' },
      ],
      tag: data.tag || 'otakudb-notification',
      renotify: true,
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'OtakuDB', options)
    );
  } catch (error) {
    console.error('Push notification error:', error);
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if (url !== '/') {
            client.navigate(url);
          }
          return;
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Scheduled notification check (runs in background)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, delay, animeId, url } = event.data;
    
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: { url, animeId },
        tag: `anime-${animeId}`,
      });
    }, delay);
  }
});

// Periodic sync for background updates (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-new-episodes') {
    event.waitUntil(checkForNewEpisodes());
  }
});

async function checkForNewEpisodes() {
  // This would check for new episodes and send notifications
  // Implementation depends on stored reminder data
  console.log('Checking for new episodes...');
}