import { describe, it, expect } from "vitest";
import L from "leaflet";
import { areVisitMarkersPropsEqual, createCustomClusterIcon } from "./VisitMarkers";
import { SaunaVisit } from "../../types";
import { getSaunaIcon } from "../common/markerIcon";

const markerWith = (icon: L.DivIcon) => ({ options: { icon } }) as L.Marker;

describe("createCustomClusterIcon", () => {
  it("should create divIcon with correct HTML structure and cluster count", () => {
    const cluster = { getChildCount: () => 3 };
    const icon = createCustomClusterIcon(cluster);

    expect(icon.options.className).toBe("custom-cluster-marker");
    expect(icon.options.html).toContain("sauna-cluster");
    expect(icon.options.html).toContain("sauna-cluster--small");
    expect(icon.options.html).toContain("sauna-cluster-icon");
    expect(icon.options.html).toContain("sauna-cluster-count");
    expect(icon.options.html).toContain(">3</span>");
  });

  it("should apply correct size class based on child count", () => {
    const mediumCluster = { getChildCount: () => 7 };
    const mediumIcon = createCustomClusterIcon(mediumCluster);
    expect(mediumIcon.options.html).toContain("sauna-cluster--medium");

    const largeCluster = { getChildCount: () => 25 };
    const largeIcon = createCustomClusterIcon(largeCluster);
    expect(largeIcon.options.html).toContain("sauna-cluster--large");
  });

  it("行きたい記録を含むクラスタにだけ星のバッジを付ける", () => {
    const visited = markerWith(getSaunaIcon({ rating: 4 }));
    const wishlist = markerWith(getSaunaIcon({ wishlist: true }));

    const withWishlist = createCustomClusterIcon({
      getChildCount: () => 2,
      getAllChildMarkers: () => [visited, wishlist],
    });
    expect(withWishlist.options.html).toContain("sauna-cluster-wishlist");

    // 件数が同じでも行きたいの有無でアイコンを取り違えない（キャッシュのキーに含める）
    const visitedOnly = createCustomClusterIcon({
      getChildCount: () => 2,
      getAllChildMarkers: () => [visited, visited],
    });
    expect(visitedOnly.options.html).not.toContain("sauna-cluster-wishlist");
  });
});

describe("areVisitMarkersPropsEqual", () => {
  const visit: SaunaVisit = {
    id: "1",
    name: "サウナA",
    lat: 35,
    lng: 139,
    date: "2026-07-24",
    comment: "",
    status: "wishlist",
  };
  const props = (visits: SaunaVisit[]) => ({ visits, editingId: null, onEdit: () => {} });

  it("同じ記録の配列が作り直されただけなら再描画しない", () => {
    const base = props([visit]);
    expect(areVisitMarkersPropsEqual(base, { ...base, visits: [visit] })).toBe(true);
  });

  it("場所を変えずに内容だけ編集した記録はピンとポップアップを描き直す", () => {
    const base = props([visit]);
    const edited = { ...visit, status: "visited" as const, rating: 4, comment: "最高" };
    expect(areVisitMarkersPropsEqual(base, { ...base, visits: [edited] })).toBe(false);
  });
});
