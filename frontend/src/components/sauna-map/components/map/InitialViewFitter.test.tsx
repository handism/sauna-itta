import { render, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import * as reactLeaflet from "react-leaflet";
import { InitialViewFitter } from "./InitialViewFitter";

vi.mock("react-leaflet", () => ({
  useMap: vi.fn(),
}));

const rect = (left: number, top: number, right: number, bottom: number) =>
  ({ left, top, right, bottom, width: right - left, height: bottom - top, x: left, y: top }) as DOMRect;

describe("InitialViewFitter", () => {
  let mockMap: { fitBounds: ReturnType<typeof vi.fn>; getContainer: () => HTMLElement };
  const visits = [
    { lat: 43.06, lng: 141.35 },
    { lat: 26.21, lng: 127.68 },
  ];

  beforeEach(() => {
    const container = document.createElement("div");
    container.getBoundingClientRect = () => rect(0, 0, 1400, 900);
    mockMap = { fitBounds: vi.fn(), getContainer: () => container };
    vi.spyOn(reactLeaflet, "useMap").mockReturnValue(mockMap as unknown as ReturnType<typeof reactLeaflet.useMap>);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
    cleanup();
  });

  it("記録が無いうちは合わせず、読み込まれたら 1 回だけ全件の範囲へ合わせる", () => {
    const { rerender } = render(<InitialViewFitter visits={[]} />);
    expect(mockMap.fitBounds).not.toHaveBeenCalled();

    rerender(<InitialViewFitter visits={visits} />);
    expect(mockMap.fitBounds).toHaveBeenCalledTimes(1);
    const [bounds, options] = mockMap.fitBounds.mock.calls[0];
    expect(bounds.getNorth()).toBeCloseTo(43.06);
    expect(bounds.getSouth()).toBeCloseTo(26.21);
    expect(options).toMatchObject({ paddingTopLeft: [48, 48], paddingBottomRight: [48, 48], maxZoom: 12 });

    // 記録が増えても動かさない（利用者が動かした地図を勝手に戻さない）
    rerender(<InitialViewFitter visits={[...visits, { lat: 35, lng: 139 }]} />);
    expect(mockMap.fitBounds).toHaveBeenCalledTimes(1);
  });

  it("デスクトップのサイドバーに覆われた幅を左の余白に足す", () => {
    const sidebar = document.createElement("aside");
    sidebar.className = "sidebar";
    sidebar.getBoundingClientRect = () => rect(0, 0, 450, 900);
    document.body.appendChild(sidebar);

    render(<InitialViewFitter visits={visits} />);

    expect(mockMap.fitBounds.mock.calls[0][1].paddingTopLeft).toEqual([48 + 450, 48]);
  });

  it("モバイルのボトムシートに覆われた高さを下の余白に足す", () => {
    const sheet = document.createElement("div");
    sheet.className = "bottom-sheet";
    sheet.getBoundingClientRect = () => rect(0, 780, 400, 900);
    document.body.appendChild(sheet);

    render(<InitialViewFitter visits={visits} />);

    expect(mockMap.fitBounds.mock.calls[0][1].paddingBottomRight).toEqual([48, 48 + 120]);
  });

  it("ディープリンクで別の地点へ移動する予定があるときは合わせない", () => {
    const { rerender } = render(<InitialViewFitter visits={visits} skip />);
    rerender(<InitialViewFitter visits={visits} />);

    expect(mockMap.fitBounds).not.toHaveBeenCalled();
  });
});
