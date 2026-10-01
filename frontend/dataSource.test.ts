import { describe, expect, it } from "vitest";
import { resolveBasePath, resolveDataSource } from "./dataSource";

describe("resolveDataSource", () => {
  it("未指定時とlocal指定時はlocalモードを返す", () => {
    expect(resolveDataSource(undefined)).toBe("local");
    expect(resolveDataSource("local")).toBe("local");
  });

  it("api指定時はapiモードを返す", () => {
    expect(resolveDataSource("api")).toBe("api");
  });

  it("不正値は壊れた混在構成を生成せずエラーにする", () => {
    expect(() => resolveDataSource("ap1")).toThrow(/must be "local" or "api"/);
    expect(() => resolveDataSource("")).toThrow(/must be "local" or "api"/);
  });
});

describe("resolveBasePath", () => {
  it("localはGitHub Pagesのプロジェクトパス、apiはルート配信のため空文字を返す", () => {
    expect(resolveBasePath("local")).toBe("/sauna-itta");
    expect(resolveBasePath("api")).toBe("");
  });
});
