/* Curious Data RNG - Service Worker v2.0.1 */
const CACHE_NAME = 'curious-data-rng-v2.0.1';
const ASSETS = [
  './',
  './index.html',
  './data.html',
  './manifest.json',
  './icons/192.png',
  './icons/512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // data.json NUNCA se cachea: siempre red, sin fallback a caché
  if (url.pathname.includes('/data/data.json') || url.pathname.endsWith('/data.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' }).catch(() =>
        new Response('', { status: 404, statusText: 'data.json not found' })
      )
    );
    return;
  }

  // Resto: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return (
        cached ||
        fetch(event.request).then((res) => {
          if (res && res.ok && event.request.method === 'GET') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return res;
        })
      );
    })
  );
});
