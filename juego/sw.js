// Math World · guarda en el celular las imágenes, sonidos y el motor del juego para que abra rápido
// la segunda vez (aunque la señal del colegio sea mala). El código y las páginas siempre se piden
// primero a internet, así cada actualización llega de inmediato; la copia guardada solo se usa sin conexión.
const CACHE = 'mw-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k.startsWith('mw-') && k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

async function guardar(req, res) {
  if (res && res.ok && (res.type === 'basic' || res.type === 'cors')) {
    const c = await caches.open(CACHE);
    await c.put(req, res.clone());
  }
  return res;
}
// imágenes, sonidos, fuentes y Phaser: se muestra lo guardado y se actualiza en segundo plano
async function guardadoYActualiza(e) {
  const copia = await caches.match(e.request);
  const red = fetch(e.request).then((r) => guardar(e.request, r)).catch(() => null);
  if (copia) { e.waitUntil(red); return copia; }
  const r = await red;
  return r || Response.error();
}
// código y páginas: primero internet; sin conexión, la última copia
async function redPrimero(req) {
  try { return await guardar(req, await fetch(req)); } catch (err) {
    const copia = await caches.match(req, { ignoreSearch: true });
    return copia || Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) {
    if (/^fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) e.respondWith(guardadoYActualiza(e));
    return;   // Supabase y todo lo demás va directo a internet
  }
  if (!url.pathname.startsWith('/juego/') || url.pathname.endsWith('/sw.js')) return;
  if (url.pathname.startsWith('/juego/assets/') || /\.(png|jpe?g|webp|gif|svg|mp3|ogg|wav|m4a|woff2?)$/i.test(url.pathname)) {
    e.respondWith(guardadoYActualiza(e));
    return;
  }
  if (/\.(js|css|html|json|webmanifest)$/i.test(url.pathname) || url.pathname.endsWith('/')) e.respondWith(redPrimero(req));
});
