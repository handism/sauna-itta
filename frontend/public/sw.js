const CACHE_PREFIX = "sauna-itta-";
const STATIC_CACHE_NAME = `${CACHE_PREFIX}static-v4`;
const TILE_CACHE_NAME = `${CACHE_PREFIX}tiles-v1`;
const MAX_TILE_ENTRIES = 200;
// 静的キャッシュのうち、先読み資産以外（_next/static のチャンクや RSC の .txt）の上限。
// これらはデプロイごとにファイル名が変わるため、上限が無いと古い版の資産が溜まり続ける。
// 1 回のビルドの出力は約 60 件なので、数デプロイ分の余裕を持たせている。
const MAX_STATIC_RUNTIME_ENTRIES = 150;
const TILE_HOSTS = new Set([
  "tile.openstreetmap.org",
  "a.tile.openstreetmap.org",
  "b.tile.openstreetmap.org",
  "c.tile.openstreetmap.org",
]);

// 公開パスの接頭辞（localモードは "/sauna-itta"）。この資産はビルドを通らず dataSource.ts の
// BASE_PATH を参照できないため、ServiceWorkerRegister が BASE_PATH から決めた登録スコープから求める
const BASE_PATH = new URL(self.registration.scope).pathname.replace(/\/$/, "");

// Cache core assets on install
const PRECACHE_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/manifest.webmanifest`,
  `${BASE_PATH}/icon.svg`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`,
  `${BASE_PATH}/icons/icon-maskable-192.png`,
  `${BASE_PATH}/icons/icon-maskable-512.png`,
  `${BASE_PATH}/icons/apple-icon.png`,
];

// 統計画面は別ドキュメントのため、一度も開かずにオフラインへ入ると遷移できない。
// ただし必須資産と同じ addAll に混ぜない：addAll は 1 つでも取得に失敗すると install
// ごと失敗し、オフライン対応そのものが失われるため、ここは取得できた分だけ保存する。
const OPTIONAL_PRECACHE_ASSETS = [`${BASE_PATH}/stats`];

// 上限による削除の対象から外す資産。オフラインで最初に開く画面の土台のため、
// 実行時に溜まった資産に押し出されて消えないようにする
const PRECACHE_PATHS = new Set([...PRECACHE_ASSETS, ...OPTIONAL_PRECACHE_ASSETS]);

function isPrecachedRequest(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin && PRECACHE_PATHS.has(url.pathname);
}

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

// cache.keys() は保存順に並ぶ。cache.put() は既存の項目を消してから末尾へ足すため、
// バックグラウンド更新で書き直された（＝最近使われた）資産ほど後ろに来る
async function trimCache(cache, maxEntries, isProtected = () => false) {
  const requests = (await cache.keys()).filter((request) => !isProtected(request));
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
          await trimCache(cache, MAX_STATIC_RUNTIME_ENTRIES, isPrecachedRequest);
        }
        return networkResponse;
      });
    })
  );
});
