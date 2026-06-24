const CACHE_NAME = 'ewelink-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Solo interceptamos peticiones GET
  if (event.request.method !== 'GET') return;

  // Para las APIs (ej. llamadas a eWeLink), no usamos cache para asegurar datos en tiempo real
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clona la petición porque se consume una vez
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          (response) => {
            // Revisa si recibimos una respuesta válida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona la respuesta
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                // No cachear todo, solo cosas estáticas si es posible
                // cache.put(event.request, responseToCache);
              });

            return response;
          }
        ).catch(() => {
          // Si el fetch falla (ej. sin internet), podrías devolver una página offline.
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
