// Service worker para PWA instalable.
// Estrategia: la interfaz (index.html) SIEMPRE se busca fresca de la red,
// para que las actualizaciones se vean de inmediato. Solo se usa el caché
// como respaldo si no hay conexión.
// (Los datos viven en Firestore en la nube; esto solo guarda la interfaz.)

const CACHE = 'controlstock-v2';   // subir este número invalida el caché viejo
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.url.includes('googleapis.com') || req.url.includes('firebase') ||
      req.url.includes('gstatic') || req.url.includes('cdn') ||
      req.url.includes('jsdelivr') || req.url.includes('cloudflare')) {
    return;
  }
  if (req.mode === 'navigate' || req.destination === 'document' || req.url.includes('index.html')) {
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(()=>{});
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(()=>{});
      return res;
    }))
  );
});
