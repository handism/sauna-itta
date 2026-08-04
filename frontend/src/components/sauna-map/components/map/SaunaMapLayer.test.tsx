import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { SaunaMapProvider } from "../../context";
import { SaunaMapLayer } from "./SaunaMapLayer";

vi.mock("leaflet", async (importOriginal) => {
  const actual = await importOriginal<typeof import("leaflet")>();
  return {
    ...actual,
    map: vi.fn(),
  };
});

describe("SaunaMapLayer", () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        for (const key in store) {
          delete store[key];
        }
      }),
    };

    Object.defineProperty(window, "localStorage", {
      value: mockLocalStorage,
      writable: true,
    });

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders map layer controls inside SaunaMapProvider", () => {
    const setCurrentLocation = vi.fn();

    render(
      <SaunaMapProvider>
        <SaunaMapLayer
          currentLocation={null}
          setCurrentLocation={setCurrentLocation}
        />
      </SaunaMapProvider>
    );

    expect(screen.getByRole("button", { name: "拡大" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "縮小" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "現在地へ移動" })).toBeInTheDocument();
  });
});
