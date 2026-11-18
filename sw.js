/* HTV Flash : fonctionne hors ligne (cache de l'application) */
const CACHE = 'htvflash-v1.7.0';
const FILES = ['./', 'index.html', 'styles.css', 'app.js', 'vendor/qrcode.js', 'manifest.webmanifest',
  'icons/logo-htvflash.svg', 'icons/logo-htvflash-light.svg', 'icons/telethon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// réseau d'abord (pour recevoir les mises à jour), cache si pas de connexion
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request.url, { cache: 'no-cache' }).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
