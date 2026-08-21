/* ============================================================
   Baxnaano Pharmacy — Service Worker
   MUHIIM: app-ku wuxuu ku jiraa horumarin firfircoon (fix-yo joogto
   ah ayaa la sii daayaa) — sidaas darteed NETWORK-FIRST ayaan
   isticmaaleynaa app-shell-ka (index.html iwm): marka internet la
   haysto, koodhka UGU CUSUB ayaa mar walba la soo qaataa; cache-ga
   waxaa loo isticmaalaa KALIYA marka internet la waayo (offline
   fallback). Xogta (Supabase API, CDN scripts) had iyo jeer NETWORK
   ayaa la isticmaalayaa — lama cache-gareynayo.
============================================================ */
const CACHE_NAME = 'baxnaano-pharmacy-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(()=>{})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Kaliya same-origin GET requests ayaan wax ka qabanaynaa (app-shell-ka
  // kaliya) — CDN-yada (jsQR/SweetAlert2/Supabase-js) iyo Supabase API-ga
  // (mid kale oo origin ah) had iyo jeer NETWORK ayaa loo mariyaa toos ah.
  if(event.request.method !== 'GET' || url.origin !== self.location.origin){
    return; // ha faragelin — browser-ku sida caadiga ah ha u qabto
  }

  // NETWORK-FIRST: isku day network-ka marka hore — haddii uu guuleysto,
  // isla markiiba isticmaal jawaabtiisa (koodhka UGU CUSUB) oo cusboonaysii
  // cache-ga si loo diyaariyo xaalad offline oo mustaqbalka ah. Kaliya
  // haddii network-ku fashilmo (offline) ayaan u noqonaynaa cache-ga.
  event.respondWith(
    fetch(event.request).then((response) => {
      if(response && response.ok){
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(()=>{});
      }
      return response;
    }).catch(() => caches.match(event.request))
  );
});
