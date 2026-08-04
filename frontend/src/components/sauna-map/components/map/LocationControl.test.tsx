import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocationControl } from "./LocationControl";
import { prefersReducedMotion } from "../../utils/motion";

// Mock react-leaflet
const mockFlyTo = vi.fn();
vi.mock("react-leaflet", () => ({
  useMap: () => ({
    flyTo: mockFlyTo,
  }),
}));

// Mock utils
vi.mock("../../utils/motion", () => ({
  prefersReducedMotion: vi.fn(),
}));

beforeEach(() => {
  // clearAllMocks で実装ごと消えるため、既定値は毎回張り直す
  vi.mocked(prefersReducedMotion).mockReturnValue(false);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("LocationControl", () => {
  it("renders the locate button", () => {
    render(<LocationControl />);
    const btn = screen.getByRole("button", { name: "現在地へ移動" });
    expect(btn).toBeInTheDocument();
  });

  it("calls onNotify with error if geolocation is not supported", () => {
    // Remove geolocation
    vi.stubGlobal("navigator", { geolocation: undefined });

    const onNotify = vi.fn();
    render(<LocationControl onNotify={onNotify} />);

    const btn = screen.getByRole("button", { name: "現在地へ移動" });
    fireEvent.click(btn);

    expect(onNotify).toHaveBeenCalledWith("お使いのブラウザは位置情報に対応していません", "error");
  });

  it("calls flyTo and onLocationFound on successful geolocation", async () => {
    const mockGetCurrentPosition = vi.fn((successCallback) => {
      successCallback({
        coords: {
          latitude: 35.6812,
          longitude: 139.7671,
          accuracy: 10,
        },
      });
    });

    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: mockGetCurrentPosition,
      },
    });

    const onLocationFound = vi.fn();
    render(<LocationControl onLocationFound={onLocationFound} />);

    const btn = screen.getByRole("button", { name: "現在地へ移動" });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockGetCurrentPosition).toHaveBeenCalled();
    });

    expect(onLocationFound).toHaveBeenCalledWith({
      lat: 35.6812,
      lng: 139.7671,
      accuracy: 10,
    });
    expect(mockFlyTo).toHaveBeenCalledWith([35.6812, 139.7671], 14, { animate: true });
  });

  it("calls onNotify with error if geolocation fails", async () => {
    const mockGetCurrentPosition = vi.fn((_, errorCallback) => {
      errorCallback(new Error("Geolocation failed"));
    });

    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: mockGetCurrentPosition,
      },
    });

    const onNotify = vi.fn();
    render(<LocationControl onNotify={onNotify} />);

    const btn = screen.getByRole("button", { name: "現在地へ移動" });
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockGetCurrentPosition).toHaveBeenCalled();
    });

    expect(onNotify).toHaveBeenCalledWith("位置情報を取得できませんでした", "error");
  });

  it("prefers-reduced-motion が有効なときはアニメーションなしで移動する", async () => {
    vi.mocked(prefersReducedMotion).mockReturnValue(true);
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn((successCallback) => {
          successCallback({ coords: { latitude: 35, longitude: 139, accuracy: 5 } });
        }),
      },
    });

    render(<LocationControl />);
    fireEvent.click(screen.getByRole("button", { name: "現在地へ移動" }));

    await waitFor(() => {
      expect(mockFlyTo).toHaveBeenCalledWith([35, 139], 14, { animate: false });
    });
  });

  it("取得中はボタンを非活性にし、完了後に戻す", async () => {
    let resolvePosition: ((position: unknown) => void) | undefined;
    vi.stubGlobal("navigator", {
      geolocation: {
        getCurrentPosition: vi.fn((successCallback) => {
          resolvePosition = successCallback;
        }),
      },
    });

    render(<LocationControl />);
    const btn = screen.getByRole("button", { name: "現在地へ移動" });

    fireEvent.click(btn);
    expect(btn).toBeDisabled();

    fireEvent.click(btn); // 非活性なので二重取得は起きない
    await waitFor(() => {
      resolvePosition?.({ coords: { latitude: 35, longitude: 139, accuracy: 5 } });
    });

    await waitFor(() => expect(btn).not.toBeDisabled());
    expect(mockFlyTo).toHaveBeenCalledTimes(1);
  });
});
