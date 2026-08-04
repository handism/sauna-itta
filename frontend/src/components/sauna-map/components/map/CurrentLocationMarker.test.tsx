import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MapContainer } from "react-leaflet";
import { CurrentLocationMarker } from "./CurrentLocationMarker";

vi.mock("leaflet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("leaflet")>();
  return {
    ...actual,
    map: vi.fn(),
  };
});

describe("CurrentLocationMarker", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders nothing when location is null", () => {
    const { container } = render(
      <MapContainer center={[35.6, 139.7]} zoom={10}>
        <CurrentLocationMarker location={null} />
      </MapContainer>
    );

    expect(container.querySelector(".leaflet-marker-icon")).not.toBeInTheDocument();
  });

  it("renders current location marker when location is provided", () => {
    const location = { lat: 35.6812, lng: 139.7671, accuracy: 50 };

    const { container } = render(
      <MapContainer center={[35.6, 139.7]} zoom={10}>
        <CurrentLocationMarker location={location} />
      </MapContainer>
    );

    expect(container.querySelector(".leaflet-marker-icon")).toBeInTheDocument();
    expect(container.querySelector(".leaflet-overlay-pane svg path")).toBeInTheDocument();
  });
});
