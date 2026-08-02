import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { LocationSearchInput } from "./LocationSearchInput";
import * as geocodingModule from "../utils/geocoding";

vi.mock("../utils/geocoding", () => ({
  searchLocation: vi.fn(),
}));

describe("LocationSearchInput", () => {
  const mockOnSelectLocation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders search input correctly", () => {
    render(<LocationSearchInput onSelectLocation={mockOnSelectLocation} />);
    expect(screen.getByPlaceholderText("施設名や住所で場所を検索...")).toBeInTheDocument();
  });

  it("入力だけでは検索せず、検索ボタンで結果を表示する", async () => {
    const mockResults: geocodingModule.GeocodingResult[] = [
      {
        placeId: 1,
        lat: 35.6812,
        lng: 139.7671,
        displayName: "東京駅, 東京都, 日本",
        name: "東京駅",
        addressText: "東京都千代田区丸の内1丁目",
      },
    ];

    vi.mocked(geocodingModule.searchLocation).mockResolvedValueOnce(mockResults);

    render(<LocationSearchInput onSelectLocation={mockOnSelectLocation} />);

    const input = screen.getByRole("combobox", { name: "地点検索" });
    fireEvent.change(input, { target: { value: "東京駅" } });
    expect(geocodingModule.searchLocation).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "地点を検索" }));

    await waitFor(
      () => {
        expect(screen.getByText("東京都千代田区丸の内1丁目")).toBeInTheDocument();
      },
      { timeout: 1000 }
    );
  });

  it("calls onSelectLocation and closes dropdown when an option is clicked", async () => {
    const mockResult: geocodingModule.GeocodingResult = {
      placeId: 1,
      lat: 35.6812,
      lng: 139.7671,
      displayName: "東京駅, 東京都, 日本",
      name: "東京駅",
      addressText: "東京都千代田区丸の内1丁目",
    };

    vi.mocked(geocodingModule.searchLocation).mockResolvedValueOnce([mockResult]);

    render(<LocationSearchInput onSelectLocation={mockOnSelectLocation} />);

    const input = screen.getByRole("combobox", { name: "地点検索" });
    fireEvent.change(input, { target: { value: "東京駅" } });
    fireEvent.click(screen.getByRole("button", { name: "地点を検索" }));

    await waitFor(() => {
      expect(screen.getByText("東京都千代田区丸の内1丁目")).toBeInTheDocument();
    });

    const option = screen.getByRole("option");
    fireEvent.click(option);

    expect(mockOnSelectLocation).toHaveBeenCalledWith(mockResult);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("selects an option with ArrowDown and Enter keys", async () => {
    const mockResults: geocodingModule.GeocodingResult[] = [
      {
        placeId: 1,
        lat: 35.6812,
        lng: 139.7671,
        displayName: "東京駅, 東京都, 日本",
        name: "東京駅",
        addressText: "東京都千代田区丸の内1丁目",
      },
      {
        placeId: 2,
        lat: 35.6586,
        lng: 139.7454,
        displayName: "東京タワー, 東京都, 日本",
        name: "東京タワー",
        addressText: "東京都港区芝公園4丁目",
      },
    ];

    vi.mocked(geocodingModule.searchLocation).mockResolvedValueOnce(mockResults);

    render(<LocationSearchInput onSelectLocation={mockOnSelectLocation} />);

    const input = screen.getByRole("combobox", { name: "地点検索" });
    fireEvent.change(input, { target: { value: "東京" } });
    fireEvent.keyDown(input, { key: "Enter" });

    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(2);
    });

    // 1回目: 先頭 / 2回目: 2件目がアクティブになる
    fireEvent.keyDown(input, { key: "ArrowDown" });
    await waitFor(() => {
      expect(input).toHaveAttribute("aria-activedescendant", "location-search-option-0");
    });

    fireEvent.keyDown(input, { key: "ArrowDown" });
    await waitFor(() => {
      expect(input).toHaveAttribute("aria-activedescendant", "location-search-option-1");
    });
    expect(screen.getAllByRole("option")[1]).toHaveAttribute("aria-selected", "true");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockOnSelectLocation).toHaveBeenCalledWith(mockResults[1]);
  });

  it("wraps to the last option when ArrowUp is pressed first", async () => {
    const mockResults: geocodingModule.GeocodingResult[] = [
      {
        placeId: 1,
        lat: 35.6812,
        lng: 139.7671,
        displayName: "東京駅, 東京都, 日本",
        name: "東京駅",
        addressText: "東京都千代田区丸の内1丁目",
      },
      {
        placeId: 2,
        lat: 35.6586,
        lng: 139.7454,
        displayName: "東京タワー, 東京都, 日本",
        name: "東京タワー",
        addressText: "東京都港区芝公園4丁目",
      },
    ];

    vi.mocked(geocodingModule.searchLocation).mockResolvedValueOnce(mockResults);

    render(<LocationSearchInput onSelectLocation={mockOnSelectLocation} />);

    const input = screen.getByRole("combobox", { name: "地点検索" });
    fireEvent.change(input, { target: { value: "東京" } });
    fireEvent.click(screen.getByRole("button", { name: "地点を検索" }));

    await waitFor(() => {
      expect(screen.getAllByRole("option")).toHaveLength(2);
    });

    fireEvent.keyDown(input, { key: "ArrowUp" });
    await waitFor(() => {
      expect(input).toHaveAttribute("aria-activedescendant", "location-search-option-1");
    });
  });

  it("closes the dropdown on Escape", async () => {
    vi.mocked(geocodingModule.searchLocation).mockResolvedValueOnce([
      {
        placeId: 1,
        lat: 35.6812,
        lng: 139.7671,
        displayName: "東京駅, 東京都, 日本",
        name: "東京駅",
        addressText: "東京都千代田区丸の内1丁目",
      },
    ]);

    render(<LocationSearchInput onSelectLocation={mockOnSelectLocation} />);

    const input = screen.getByRole("combobox", { name: "地点検索" });
    fireEvent.change(input, { target: { value: "東京駅" } });
    fireEvent.click(screen.getByRole("button", { name: "地点を検索" }));

    await waitFor(() => {
      expect(screen.getByRole("listbox")).toBeInTheDocument();
    });

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    });
  });

  it("shows an error message when the search request fails", async () => {
    vi.mocked(geocodingModule.searchLocation).mockRejectedValueOnce(new Error("network error"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<LocationSearchInput onSelectLocation={mockOnSelectLocation} />);

    const input = screen.getByRole("combobox", { name: "地点検索" });
    fireEvent.change(input, { target: { value: "東京駅" } });
    fireEvent.click(screen.getByRole("button", { name: "地点を検索" }));

    // ドロップダウン内と aria-live 領域の両方に表示される
    await waitFor(() => {
      expect(
        screen.getAllByText("場所を検索できませんでした。通信環境を確認して再度お試しください。")
      ).toHaveLength(2);
    });

    consoleSpy.mockRestore();
  });
});
