const CACHE_NAME = "lares-cache-v3";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

/* ================================
   TELEPÍTÉS
================================ */

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_FILES)
    )
  );

  self.skipWaiting();
});

/* ================================
   FRISSÍTÉS
================================ */

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith("lares-cache-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

/* ================================
   FÁJLOK BETÖLTÉSE
================================ */

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.ok) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });
        }

        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => {
          return cached || caches.match("./index.html");
        })
      )
  );
});

/* ================================
  
