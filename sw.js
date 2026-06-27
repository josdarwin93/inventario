// Service worker mínimo para PWA instalable.
// Cachea el cascarón de la app para que abra rápido y aunque la red falle.
// (Los datos viven en Firestore en la nube; esto solo guarda la interfaz.)

const CACHE = 'inventario-v1';
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
  // Nunca interceptamos llamadas a Firebase/Firestore: deben ir siempre a la red.
  if (req.url.includes('googleapis.com') || req.url.includes('firebase') || req.url.includes('gstatic')) {
    return;
  }
  // Para el resto: primero red, y si falla, usamos el caché (útil sin internet).
  e.respondWith(
    fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy)).catch(()=>{});
      return res;
    }).catch(() => caches.match(req))
  );
});
