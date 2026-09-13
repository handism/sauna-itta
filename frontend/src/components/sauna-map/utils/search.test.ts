import { describe, it, expect } from "vitest";
import { createSearchRegex, matchesSearchKeyword } from "./search";
import { SaunaVisit } from "../types";

describe("createSearchRegex", () => {
  it("returns null for empty keyword", () => {
    expect(createSearchRegex("")).toBeNull();
    expect(createSearchRegex("   ")).toBeNull();
  });

  it("returns regex for valid keyword and escapes special chars", () => {
    const regex = createSearchRegex("サウナ(東京)");
    expect(regex).not.toBeNull();
    expect(regex!.test("人気サウナ(東京)本店")).toBe(true);
  });
});

describe("matchesSearchKeyword", () => {
  const visit: SaunaVisit = {
    id: "1",
    name: "サウナしきじ",
    lat: 35.0,
    lng: 138.0,
    date: "2026-07-24",
    comment: "水風呂が最高",
    area: "静岡県",
    tags: ["聖地", "天然水"],
  };

  it("returns true when regex is null", () => {
    expect(matchesSearchKeyword(visit, null)).toBe(true);
  });

  it("matches by name", () => {
    expect(matchesSearchKeyword(visit, createSearchRegex("しきじ"))).toBe(true);
  });

  it("matches by comment", () => {
    expect(matchesSearchKeyword(visit, createSearchRegex("水風呂"))).toBe(true);
  });

  it("matches by area", () => {
    expect(matchesSearchKeyword(visit, createSearchRegex("静岡"))).toBe(true);
  });

  it("matches by tags", () => {
    expect(matchesSearchKeyword(visit, createSearchRegex("聖地"))).toBe(true);
  });

  it("returns false when keyword does not match any field", () => {
    expect(matchesSearchKeyword(visit, createSearchRegex("北海道"))).toBe(false);
  });

  it("handles visits with missing optional fields without errors", () => {
    const minimalVisit: SaunaVisit = {
      id: "2",
      name: "シンプルサウナ",
      lat: 35.0,
      lng: 138.0,
      date: "2026-07-25",
      comment: "",
      // area and tags are omitted
    };
    expect(matchesSearchKeyword(minimalVisit, createSearchRegex("シンプル"))).toBe(true);
    expect(matchesSearchKeyword(minimalVisit, createSearchRegex("水風呂"))).toBe(false);
  });

  it("matches keywords case-insensitively", () => {
    const englishVisit: SaunaVisit = {
      id: "3",
      name: "Tokyo Sauna",
      lat: 35.0,
      lng: 139.0,
      date: "2026-07-25",
      comment: "Great SPA",
      area: "Tokyo",
      tags: ["RELAX"],
    };
    expect(matchesSearchKeyword(englishVisit, createSearchRegex("tokyo"))).toBe(true);
    expect(matchesSearchKeyword(englishVisit, createSearchRegex("spa"))).toBe(true);
    expect(matchesSearchKeyword(englishVisit, createSearchRegex("relax"))).toBe(true);
  });

  it("matches using complex custom RegExp objects", () => {
    // Tests a regex that matches either "しきじ" or "サウナ" followed by any characters and "最高"
    const complexRegex = /しきじ|サウナ.*最高/;
    expect(matchesSearchKeyword(visit, complexRegex)).toBe(true);

    // Visit doesn't match this complex pattern
    const notMatchingRegex = /^しきじ$/;
    expect(matchesSearchKeyword(visit, notMatchingRegex)).toBe(false);
  });
});
