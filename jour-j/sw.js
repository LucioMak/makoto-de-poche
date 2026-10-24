/* Notre jour J : l'appli marche sans internet, et se met à jour dès qu'il y a du réseau. */
const CACHE = "jourj-v4";
const FILES = ["./", "./index.html", "./manifest.webmanifest",
  "./icons/apple-touch-icon.png", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/icon-maskable-512.png",
  "./fonts/Poppins-Regular.ttf", "./fonts/Poppins-Medium.ttf", "./fonts/Poppins-Bold.ttf", "./fonts/Caladea-Italic.ttf"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES.map((f) => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (req.mode === "navigate") {
    /* the page itself: latest version when online, saved copy when offline */
    const net = fetch(req, { cache: "no-store" }).then((r) => {
      if (r && r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put("./index.html", copy)); }
      return r;
    });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3500));
    e.respondWith(Promise.race([net, timeout]).catch(() =>
      caches.match("./index.html").then((hit) => hit || caches.match("./")).then((hit) => hit || net)));
    return;
  }
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req).then((resp) => {
      const copy = resp.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
      return resp;
    }).catch(() => caches.match("./index.html")))
  );
});
