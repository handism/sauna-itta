import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

const DEMO_DATA_IMPORT = "@/data/sauna-visits.json";

async function loadConfig(dataSource: "local" | "api") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_DATA_SOURCE", dataSource);
  return (await import("./next.config")).default;
}

describe("next.config のデモ記録の差し替え", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("apiモードは同梱のデモ記録を空配列のファイルへ差し替える", async () => {
    const config = await loadConfig("api");
    const target = config.turbopack?.resolveAlias?.[DEMO_DATA_IMPORT];

    expect(typeof target).toBe("string");
    const targetPath = path.resolve(__dirname, target as string);
    expect(existsSync(targetPath)).toBe(true);
    expect(JSON.parse(readFileSync(targetPath, "utf8"))).toEqual([]);
  });

  it("localモードはデモ記録を差し替えない", async () => {
    const config = await loadConfig("local");

    expect(config.turbopack?.resolveAlias?.[DEMO_DATA_IMPORT]).toBeUndefined();
  });

  it("差し替え対象の import 文字列が savedVisits.ts の import と一致している", () => {
    // import の書き方が変わるとエイリアスが無言で効かなくなり、apiモードへデモ記録が戻る
    const source = readFileSync(
      path.resolve(__dirname, "src/components/sauna-map/utils/savedVisits.ts"),
      "utf8",
    );
    expect(source).toContain(`from "${DEMO_DATA_IMPORT}"`);
  });
});
