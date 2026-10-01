import { Profiler } from "react";
import { render, screen, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { SaunaMapProvider, useSaunaUIActions } from "../../context";
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

  it("loads map tiles with CORS so the service worker can cache them", () => {
    const { container } = render(
      <SaunaMapProvider>
        <SaunaMapLayer currentLocation={null} setCurrentLocation={vi.fn()} />
      </SaunaMapProvider>
    );

    // no-cors だと応答が opaque (status 0) になり、sw.js のタイルキャッシュに入らない
    const tiles = container.querySelectorAll<HTMLImageElement>("img.leaflet-tile");
    expect(tiles.length).toBeGreaterThan(0);
    tiles.forEach((tile) => expect(tile.getAttribute("crossorigin")).toBe("anonymous"));
  });

  it("does not re-render the map when a toast is shown", () => {
    let showToast: ReturnType<typeof useSaunaUIActions>["showToast"] = () => {};
    function ToastTrigger() {
      ({ showToast } = useSaunaUIActions());
      return null;
    }
    const onRender = vi.fn();

    render(
      <SaunaMapProvider>
        <ToastTrigger />
        <Profiler id="map" onRender={onRender}>
          <SaunaMapLayer currentLocation={null} setCurrentLocation={vi.fn()} />
        </Profiler>
      </SaunaMapProvider>
    );
    onRender.mockClear();

    // UI 状態全体を購読すると、通知 1 件で地図とマーカー全体が再描画される
    act(() => showToast("保存しました", "success"));

    expect(onRender).not.toHaveBeenCalled();
  });
});
