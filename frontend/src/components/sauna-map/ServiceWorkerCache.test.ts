import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";

const source = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

type ServiceWorkerEvent = {
  request: Request;
  respondWith: ReturnType<typeof vi.fn>;
  waitUntil: ReturnType<typeof vi.fn>;
};

function loadFetchHandler(options: {
  cachedResponse?: Response;
  networkResponse: Response;
  put?: ReturnType<typeof vi.fn>;
  keys?: Request[];
}) {
  const listeners = new Map<string, (event: ServiceWorkerEvent) => void>();
  const put = options.put ?? vi.fn().mockResolvedValue(undefined);
  const cache = {
    add: vi.fn(),
    addAll: vi.fn(),
    delete: vi.fn(),
    keys: vi.fn().mockResolvedValue(options.keys ?? []),
    match: vi.fn(),
    put,
  };
  const cachesMock = {
    delete: vi.fn(),
    keys: vi.fn().mockResolvedValue([]),
    match: vi.fn().mockResolvedValue(options.cachedResponse),
    open: vi.fn().mockResolvedValue(cache),
  };
  const selfMock = {
    addEventListener: vi.fn((name: string, listener: (event: ServiceWorkerEvent) => void) => {
      listeners.set(name, listener);
    }),
    clients: { claim: vi.fn() },
    location: { origin: "https://example.com" },
    registration: { scope: "https://example.com/sauna-itta/" },
    skipWaiting: vi.fn(),
  };
  const fetchMock = vi.fn().mockResolvedValue(options.networkResponse);

  new Function("self", "caches", "fetch", source)(selfMock, cachesMock, fetchMock);

  return { handler: listeners.get("fetch")!, install: listeners.get("install")!, put, cache };
}

describe("Service Workerのキャッシュ方針", () => {
  it("静的資産と地図タイルを別キャッシュへ保存する", () => {
    expect(source).toContain('STATIC_CACHE_NAME = `${CACHE_PREFIX}static-v4`');
    expect(source).toContain('TILE_CACHE_NAME = `${CACHE_PREFIX}tiles-v1`');
    expect(source).toContain("caches.open(STATIC_CACHE_NAME)");
    expect(source).toContain("caches.open(TILE_CACHE_NAME)");
  });

  it("地図タイルを許可ホストだけに限定して最大200件に保つ", () => {
    expect(source).toContain("const MAX_TILE_ENTRIES = 200");
    expect(source).toContain("const isMapTile = TILE_HOSTS.has(url.hostname)");
    expect(source).toContain("trimCache(cache, MAX_TILE_ENTRIES)");
    expect(source).not.toContain('url.hostname.includes("tile")');
  });

  it("このアプリの古いキャッシュだけを削除する", () => {
    expect(source).toContain("cacheName.startsWith(CACHE_PREFIX)");
  });

  it("登録スコープの公開パスで先読みし、統計画面は失敗してもinstallを落とさない", async () => {
    const { install, cache } = loadFetchHandler({ networkResponse: new Response("network") });
    cache.add.mockRejectedValue(new Error("offline"));
    const event = { waitUntil: vi.fn() } as unknown as ServiceWorkerEvent;

    install(event);
    await event.waitUntil.mock.calls[0][0];

    const required = cache.addAll.mock.calls[0][0] as string[];
    expect(required).toContain("/sauna-itta/");
    expect(required).toContain("/sauna-itta/manifest.webmanifest");
    // 必須資産の addAll に統計画面を混ぜると、取得失敗でオフライン対応ごと失われる
    expect(required).not.toContain("/sauna-itta/stats");
    expect(cache.add).toHaveBeenCalledWith("/sauna-itta/stats");
  });

  it("キャッシュ済みレスポンスのバックグラウンド更新をイベント完了まで待つ", async () => {
    const cachedResponse = new Response("cached");
    const networkResponse = new Response("updated");
    const { handler, put } = loadFetchHandler({ cachedResponse, networkResponse });
    const event = {
      request: new Request("https://example.com/sauna-itta/"),
      respondWith: vi.fn(),
      waitUntil: vi.fn(),
    };

    handler(event);
    const responsePromise = event.respondWith.mock.calls[0][0] as Promise<Response>;
    await expect(responsePromise).resolves.toBe(cachedResponse);

    expect(event.waitUntil).toHaveBeenCalledOnce();
    await event.waitUntil.mock.calls[0][0];
    expect(put).toHaveBeenCalledWith(event.request, networkResponse);
  });

  it("初回取得時はキャッシュ保存の完了後にレスポンスを返す", async () => {
    let resolvePut: (() => void) | undefined;
    const put = vi.fn(() => new Promise<void>((resolve) => {
      resolvePut = resolve;
    }));
    const networkResponse = new Response("network");
    const { handler } = loadFetchHandler({ networkResponse, put });
    const event = {
      request: new Request("https://example.com/sauna-itta/app.js"),
      respondWith: vi.fn(),
      waitUntil: vi.fn(),
    };

    handler(event);
    const responsePromise = event.respondWith.mock.calls[0][0] as Promise<Response>;
    let settled = false;
    void responsePromise.then(() => {
      settled = true;
    });
    await vi.waitFor(() => expect(put).toHaveBeenCalledOnce());
    expect(settled).toBe(false);

    resolvePut?.();
    await expect(responsePromise).resolves.toBe(networkResponse);
    expect(put).toHaveBeenCalledOnce();
  });

  it("初回取得で静的キャッシュが上限を超えたら、先読み資産を残して古い資産から削除する", async () => {
    const precached = [
      new Request("https://example.com/sauna-itta/"),
      new Request("https://example.com/sauna-itta/stats"),
    ];
    const runtime = Array.from(
      { length: 152 },
      (_, i) => new Request(`https://example.com/sauna-itta/_next/static/chunk-${i}.js`),
    );
    // 先読み資産は install 時に入るため保存順では先頭に並ぶ
    const { handler, cache } = loadFetchHandler({
      networkResponse: new Response("network"),
      keys: [...precached, ...runtime],
    });
    const event = {
      request: new Request("https://example.com/sauna-itta/_next/static/chunk-new.js"),
      respondWith: vi.fn(),
      waitUntil: vi.fn(),
    };

    handler(event);
    await event.respondWith.mock.calls[0][0];

    const deleted = cache.delete.mock.calls.map(([request]) => (request as Request).url);
    expect(deleted).toEqual([runtime[0].url, runtime[1].url]);
  });
});
