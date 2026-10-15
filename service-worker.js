// Service Worker — Jadwal Kuliah Adzka
const CACHE_VERSION = "jadwal-v1";
const CACHE_STATIS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./data.js",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(CACHE_STATIS).catch((err) => {
        console.warn("[SW] Sebagian aset gagal di-cache:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_VERSION).then((cache) => {
              cache.put(req, clone);
            });
          }
          return networkRes;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});

self.addEventListener("message", (event) => {
  const data = event.data || {};

  if (data.type === "TAMPILKAN_NOTIFIKASI") {
    const { title, body, tag, icon, badge } = data.payload || {};
    self.registration.showNotification(title || "Kuliah", {
      body: body || "",
      tag: tag || "jadwal",
      icon: icon || "./icon-192.png",
      badge: badge || "./icon-192.png"
    });
  }

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("./");
      }
    })
  );
});