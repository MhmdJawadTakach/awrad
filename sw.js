/* أوراد — keeps the app working offline. The page always tries the network first (so updates arrive by themselves)
   and falls back to the saved copy; data is never touched here, it lives in the page's own storage. */
const VERSION = '1.0';
const CACHE = 'app-' + VERSION + '-181cfd8a', FONTS = 'fonts-v1';
const CORE = ['./', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'fonts/plex-arabic-400.woff2', 'fonts/plex-arabic-500.woff2', 'fonts/plex-arabic-600.woff2', 'fonts/plex-arabic-700.woff2', 'i18n/fa.js', 'i18n/en.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE && k !== FONTS).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
function pageFromNetwork(req) {
  const net = fetch(req.url, { cache: 'no-cache' }).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)); } return res; });
  const saved = caches.open(CACHE).then(c => c.match('./'));
  // online: the newest page; slow or offline: the saved one after a short wait
  return new Promise(resolve => {
    let done = false; const finish = r => { if (!done && r) { done = true; resolve(r); } };
    net.then(finish, () => saved.then(r => finish(r || Response.error())));
    setTimeout(() => saved.then(finish), 3500);
  });
}
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname)) { e.respondWith(pageFromNetwork(req)); return; }
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
    return;
  }
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FONTS).then(c => c.match(req).then(hit => {
      const net = fetch(req).then(res => { if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })));
  }
});
