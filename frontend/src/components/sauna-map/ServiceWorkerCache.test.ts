import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");

describe("Service Workerのキャッシュ方針", () => {
  it("静的資産と地図タイルを別キャッシュへ保存する", () => {
    expect(source).toContain('STATIC_CACHE_NAME = `${CACHE_PREFIX}static-v2`');
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
});
