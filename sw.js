const CACHE_NAME = "lares-cache-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_FILES)
    )
  );

  self.skipWaiting();
});

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
    )
  );

  self.clients.claim();
});

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
        caches.match(event.request).then(cached =>
          cached || caches.match("./index.html")
        )
      )
  );
});

/* Lares értesítések megjelenítése */
self.addEventListener("message", event => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    const notification = event.data.notification || {};

    event.waitUntil(
      self.registration.showNotification(
        notification.title || "Lares emlékeztető",
        {
          body: notification.body || "Van egy elintézendő feladatod.",
          icon: "./icon.svg",
          badge: "./icon.svg",
          tag: notification.tag || "lares-reminder",
          renotify: true,
          data: {
            url: "./"
          }
        }
      )
    );
  }
});

/* Értesítésre kattintva Lares megnyitása */
self.addEventListener("notificationclick", event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(windowClients => {
      for (const client of windowClients) {
        if ("focus" in client) {
          return client.focus();
        }
      }

      return clients.openWindow("./");
    })
  );
});
