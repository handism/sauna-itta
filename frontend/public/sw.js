const CACHE_PREFIX = "sauna-itta-";
const STATIC_CACHE_NAME = `${CACHE_PREFIX}static-v3`;
const TILE_CACHE_NAME = `${CACHE_PREFIX}tiles-v1`;
const MAX_TILE_ENTRIES = 200;
const TILE_HOSTS = new Set([
  "tile.openstreetmap.org",
  "a.tile.openstreetmap.org",
  "b.tile.openstreetmap.org",
  "c.tile.openstreetmap.org",
]);

// Cache core assets on install
const PRECACHE_ASSETS = [
  "/sauna-itta/",
  "/sauna-itta/manifest.webmanifest",
  "/sauna-itta/icon.svg",
  "/sauna-itta/icons/icon-192.png",
  "/sauna-itta/icons/icon-512.png",
  "/sauna-itta/icons/icon-maskable-192.png",
  "/sauna-itta/icons/icon-maskable-512.png",
  "/sauna-itta/icons/apple-icon.png",
];

// 統計画面は別ドキュメントのため、一度も開かずにオフラインへ入ると遷移できない。
// ただし必須資産と同じ addAll に混ぜない：addAll は 1 つでも取得に失敗すると install
// ごと失敗し、オフライン対応そのものが失われるため、ここは取得できた分だけ保存する。
const OPTIONAL_PRECACHE_ASSETS = ["/sauna-itta/stats"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(async (cache) => {
      await cache.addAll(PRECACHE_ASSETS);
      await Promise.allSettled(
        OPTIONAL_PRECACHE_ASSETS.map((asset) => cache.add(asset))
      );
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName.startsWith(CACHE_PREFIX) &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== TILE_CACHE_NAME
            ) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

async function trimCache(cache, maxEntries) {
  const requests = await cache.keys();
  const overflow = requests.length - maxEntries;
  if (overflow <= 0) return;
  await Promise.all(requests.slice(0, overflow).map((request) => cache.delete(request)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cache strategy for explicitly allowed OpenStreetMap tile hosts
  const isMapTile = TILE_HOSTS.has(url.hostname);

  if (isMapTile) {
    event.respondWith(
      caches.open(TILE_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          return fetch(request).then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              await cache.put(request, networkResponse.clone());
              await trimCache(cache, MAX_TILE_ENTRIES);
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }

  // Cache-First strategy with Network Fallback for static assets & pages
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for cache freshness
        const updatePromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              return caches.open(STATIC_CACHE_NAME).then((cache) => {
                return cache.put(request, networkResponse);
              });
            }
          })
          .catch(() => {
            /* ignore offline network error */
          });
        event.waitUntil(updatePromise);
        return cachedResponse;
      }

      return fetch(request).then(async (networkResponse) => {
        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.origin === self.location.origin || request.destination === "style" || request.destination === "script")
        ) {
          const responseToCache = networkResponse.clone();
          const cache = await caches.open(STATIC_CACHE_NAME);
          await cache.put(request, responseToCache);
        }
        return networkResponse;
      });
    })
  );
});
