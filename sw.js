// Hlasopis – offline: appka sa otvorí aj bez internetu (nahrávanie, počúvanie a hotové nahrávky fungujú offline).
const VERZIA = "hlasopis-v3";
const SUBORY = ["./", "index.html", "lame.min.js", "manifest.json", "icon-192.png", "icon-512.png"];
const NESKOR = ["pdf.min.js", "pdf.worker.min.js", "mammoth.browser.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERZIA).then(c => c.addAll(SUBORY).then(() => c.addAll(NESKOR).catch(() => {}))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== VERZIA).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  const vlastne = url.origin === location.origin;
  const pisma = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!vlastne && !pisma) return;
  // Najprv sieť (aby prišli aktualizácie), bez internetu uložená kópia.
  e.respondWith(
    fetch(e.request).then(odp => {
      if (odp.ok || odp.type === "opaque") { const kopia = odp.clone(); caches.open(VERZIA).then(c => c.put(e.request, kopia)); }
      return odp;
    }).catch(() => caches.match(e.request, { ignoreSearch: vlastne }).then(r => r || (e.request.mode === "navigate" ? caches.match("index.html") : undefined)))
  );
});
