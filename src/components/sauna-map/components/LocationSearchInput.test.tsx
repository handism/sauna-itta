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

  it("triggers search and displays results list when user types", async () => {
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

    const input = screen.getByRole("textbox", { name: "地点検索" });
    fireEvent.change(input, { target: { value: "東京駅" } });

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

    const input = screen.getByRole("textbox", { name: "地点検索" });
    fireEvent.change(input, { target: { value: "東京駅" } });

    await waitFor(() => {
      expect(screen.getByText("東京都千代田区丸の内1丁目")).toBeInTheDocument();
    });

    const option = screen.getByRole("option");
    fireEvent.click(option);

    expect(mockOnSelectLocation).toHaveBeenCalledWith(mockResult);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect((input as HTMLInputElement).value).toBe("");
  });
});
