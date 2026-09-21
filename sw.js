const CACHE_VERSION = 'bp-kb-v46';
const SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isKbStaticRequest(request) {
  if (request.method !== 'GET') return false;

  const url = new URL(request.url);

  return (
    url.origin === self.location.origin &&
    (
      url.pathname.endsWith('/index.html') ||
      url.pathname.includes('/data/')
    )
  );
}

self.addEventListener('fetch', (event) => {
  if (!isKbStaticRequest(event.request)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);

      try {
        const response = await fetch(event.request);

        if (response && response.ok) {
          event.waitUntil(
            cache.put(
              event.request,
              response.clone()
            )
          );
        }

        return response;
      } catch (error) {
        const cached = await cache.match(event.request);

        if (cached) {
          return cached;
        }

        throw error;
      }
    })()
  );
});