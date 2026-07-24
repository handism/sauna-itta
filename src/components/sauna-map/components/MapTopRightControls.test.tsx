import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MapContainer } from "react-leaflet";
import { MapTopRightControls } from "./MapTopRightControls";

vi.mock("leaflet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("leaflet")>();
  return {
    ...actual,
    map: vi.fn(),
  };
});

describe("MapTopRightControls", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders clustering, zoom, and location controls inside top right container", () => {
    const handleToggle = vi.fn();
    const handleNotify = vi.fn();

    render(
      <MapContainer center={[35.6, 139.7]} zoom={10}>
        <MapTopRightControls
          enableClustering={true}
          onToggleClustering={handleToggle}
          onNotify={handleNotify}
        />
      </MapContainer>
    );

    // Verify MapClusterControl
    const clusterBtn = screen.getByRole("button", { name: "ピンの集約を解除" });
    expect(clusterBtn).toBeInTheDocument();
    fireEvent.click(clusterBtn);
    expect(handleToggle).toHaveBeenCalledTimes(1);

    // Verify MapZoomControl buttons
    const zoomInBtn = screen.getByRole("button", { name: "拡大" });
    const zoomOutBtn = screen.getByRole("button", { name: "縮小" });
    expect(zoomInBtn).toBeInTheDocument();
    expect(zoomOutBtn).toBeInTheDocument();

    // Verify LocationControl button
    const locationBtn = screen.getByRole("button", { name: "現在地へ移動" });
    expect(locationBtn).toBeInTheDocument();
  });
});
