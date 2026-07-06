import { describe, it, expect } from "vitest";
import { extractPrefecture } from "./utils";

describe("extractPrefecture", () => {
  it("should extract valid prefectures", () => {
    expect(extractPrefecture("東京都")).toBe("東京都");
    expect(extractPrefecture("北海道")).toBe("北海道");
    expect(extractPrefecture("大阪府")).toBe("大阪府");
    expect(extractPrefecture("京都府")).toBe("京都府");
    expect(extractPrefecture("神奈川県")).toBe("神奈川県");
  });

  it("should extract prefecture when there is a space and city name", () => {
    expect(extractPrefecture("東京都 新宿区")).toBe("東京都");
    expect(extractPrefecture("北海道 札幌市")).toBe("北海道");
    expect(extractPrefecture("愛知県 名古屋市 中区")).toBe("愛知県");
  });

  it("should extract prefecture when there are full-width spaces", () => {
    expect(extractPrefecture("福岡県　福岡市")).toBe("福岡県");
    expect(extractPrefecture("長野県　松本市")).toBe("長野県");
  });

  it("should return null for undefined or empty string", () => {
    expect(extractPrefecture(undefined)).toBeNull();
    expect(extractPrefecture("")).toBeNull();
    expect(extractPrefecture("   ")).toBeNull();
  });

  it("should return null for strings that do not end with prefecture suffixes", () => {
    expect(extractPrefecture("東京")).toBeNull();
    expect(extractPrefecture("アメリカ")).toBeNull();
    expect(extractPrefecture("日本")).toBeNull();
    expect(extractPrefecture("Hawaii")).toBeNull();
  });

  it("should return null if the first part doesn't end with suffix", () => {
    expect(extractPrefecture("東京 新宿区")).toBeNull();
    expect(extractPrefecture("Osaka City")).toBeNull();
  });
});
