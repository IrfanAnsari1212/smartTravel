const APP_CACHE = "travel-platform-app-v1";
const TILE_CACHE = "travel-platform-map-tiles-v1";
const TILE_HOST = "tile.openstreetmap.org";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(["/", "/index.html"]))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== APP_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(APP_CACHE).then((cache) => cache.put("/index.html", copy));
          return response;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  if (url.hostname === TILE_HOST) {
    event.respondWith(
      caches.open(TILE_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) {
            return cached;
          }

          return fetch(request)
            .then((response) => {
              cache.put(request, response.clone());
              return response;
            })
            .catch(() => new Response("", { status: 204 }));
        })
      )
    );
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        return cached;
      }

      return fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(APP_CACHE).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});
