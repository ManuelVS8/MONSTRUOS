/* Aula Siurot · service worker: guarda la "carcasa" de las apps para que abran rápido y sigan abriendo sin conexión.
   Los datos (Firebase) nunca se guardan aquí: siempre se piden en directo. */
const V = 'aula-siurot-v1';
const EXTERNOS = ['www.gstatic.com', 'fonts.gstatic.com', 'fonts.googleapis.com'];
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET') return;
  const propio = u.origin === location.origin;
  if (!propio && !(EXTERNOS.includes(u.hostname) && (u.pathname.startsWith('/firebasejs/') || u.hostname !== 'www.gstatic.com'))) return;
  if (propio) {
    // Páginas e iconos: primero la red (así siempre ves la última versión); sin conexión, la copia guardada.
    e.respondWith(fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(V).then(ca => ca.put(r, c)); } return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(x => x || caches.match(u.pathname.endsWith('/') ? './index.html' : r))));
  } else {
    // Fuentes y librería de Firebase: de la copia guardada, y se refrescan en segundo plano.
    e.respondWith(caches.open(V).then(ca => ca.match(r).then(x => {
      const red = fetch(r).then(res => { if (res.ok || res.type === 'opaque') ca.put(r, res.clone()); return res; }).catch(() => x);
      return x || red;
    })));
  }
});
