import { describe, it, expect } from "vitest";
import { createCustomClusterIcon } from "./VisitMarkers";

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
});
