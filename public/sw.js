/// <reference lib="webworker" />

const CACHE_VERSION = 'v2';
const CACHE_NAME = `otakudb-${CACHE_VERSION}`;
const STATIC_CACHE = `otakudb-static-${CACHE_VERSION}`;
const API_CACHE = `otakudb-api-${CACHE_VERSION}`;
const IMAGE_CACHE = `otakudb-images-${CACHE_VERSION}`;

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Offline fallback page content
const OFFLINE_PAGE = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OtakuDB - Hors ligne</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', system-ui, sans-serif;
      background: #0F0F0F;
      color: #F2F2F2;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #FF6B35, #FF8C5A);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 2.5rem;
    }
    h1 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
      color: #FF6B35;
    }
    p {
      color: #8C8C8C;
      margin-bottom: 1.5rem;
    }
    button {
      background: #FF6B35;
      color: #0F0F0F;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">&#128247;</div>
    <h1>Mode Hors Ligne</h1>
    <p>Verifiez votre connexion internet et reessayez.</p>
    <button onclick="location.reload()">Reessayer</button>
  </div>
</body>
</html>
`;

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
  const validCaches = [CACHE_NAME, STATIC_CACHE, API_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !validCaches.includes(name))
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
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
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
          return new Response(JSON.stringify({ error: 'Offline', data: [] }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }).catch(() => {
        return new Response(JSON.stringify({ error: 'Offline', data: [] }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }
  
  // CDN images (anime images) - cache first with network fallback
  if (url.hostname === 'cdn.myanimelist.net' || url.hostname.includes('jikan')) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        
        try {
          const response = await fetch(event.request);
          if (response.ok) {
            cache.put(event.request, response.clone());
          }
          return response;
        } catch (error) {
          // Return a placeholder for failed images
          return new Response('', { status: 404 });
        }
      })
    );
    return;
  }
  
  // Static assets - cache first
  if (event.request.destination === 'image' || 
      event.request.destination === 'script' || 
      event.request.destination === 'style' ||
      event.request.destination === 'font') {
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
  
  // Navigation requests - network first, offline page fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(event.request, clone);
            });
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;
          
          const indexCached = await caches.match('/');
          if (indexCached) return indexCached;
          
          return new Response(OFFLINE_PAGE, {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          });
        })
    );
    return;
  }
  
  // Default - network first
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (!response || response.status === 0) {
          throw new Error('Invalid response');
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        
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
