const CACHE_PREFIX = "sauna-itta-";
const STATIC_CACHE_NAME = `${CACHE_PREFIX}static-v5`;
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

// ファイル名にハッシュを含み、同じ URL の内容が変わらない資産（Next.js のビルド出力）
function isImmutableAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith(`${BASE_PATH}/_next/static/`);
}

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

  // ハッシュ付きの資産は内容が変わらないため、キャッシュがあればそのまま返す
  if (isImmutableAsset(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => cachedResponse ?? fetchAndCache(request))
    );
    return;
  }

  /*
   * ページ（HTML）・RSC の .txt・manifest など、同じ URL のまま中身がデプロイで変わる資産は
   * ネットワーク優先にし、オフラインのときだけ保存済みの版を返す。キャッシュ優先にすると
   * デプロイ直後の 1 回目は必ず古い版が表示され、さらに古い HTML が参照するハッシュ付き
   * チャンクが上限で削除済みだと、配信元にも無いため画面が壊れたまま読み込まれる。
   */
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetchAndCache(request).catch(async (error) => {
        const cachedResponse = await caches.match(cacheKeyFor(request));
        if (cachedResponse) return cachedResponse;
        throw error;
      })
    );
    return;
  }

  // 外部のスクリプト・スタイルはキャッシュを返しつつ、裏で最新版に更新する
  if (request.destination !== "style" && request.destination !== "script") return;
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (!cachedResponse) return fetchAndCache(request);
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
    })
  );
});

/**
 * ページ遷移は ?id= や ?tag= の違いでも同じ HTML なので、クエリを除いた URL を保存キーにする。
 * クエリごとに保存すると古い版が別項目として残り、オフライン時にそれを返してしまう。
 */
function cacheKeyFor(request) {
  if (request.mode !== "navigate") return request;
  const url = new URL(request.url);
  url.search = "";
  url.hash = "";
  return url.href;
}

/**
 * ネットワークから取得し、成功したら静的キャッシュへ保存してから返す。
 * respondWith() へ渡す Promise の中で保存を待つため、イベント終了で書き込みが欠落しない。
 */
async function fetchAndCache(request) {
  const networkResponse = await fetch(request);
  if (networkResponse && networkResponse.status === 200) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    await cache.put(cacheKeyFor(request), networkResponse.clone());
    await trimCache(cache, MAX_STATIC_RUNTIME_ENTRIES, isPrecachedRequest);
  }
  return networkResponse;
}
