import { describe, it, expect, vi } from "vitest";
import { areVisitItemPropsEqual, type VisitItemProps } from "./visitItem";
import type { SaunaVisit } from "../types";

const visit: SaunaVisit = {
  id: "sauna-1",
  name: "天空サウナ",
  lat: 35.6895,
  lng: 139.6917,
  date: "2026-07-24",
  comment: "最高のととのい",
  status: "visited",
};

function props(overrides: Partial<VisitItemProps> = {}): VisitItemProps {
  return {
    visit,
    isHovered: false,
    isSelected: false,
    onEdit: vi.fn(),
    setFilters: vi.fn(),
    onOpenImage: vi.fn(),
    ...overrides,
  };
}

describe("areVisitItemPropsEqual", () => {
  it("記録・ホバー・選択が同じなら再描画しない", () => {
    expect(areVisitItemPropsEqual(props(), props())).toBe(true);
  });

  it("ホバー状態が変わったら再描画する", () => {
    expect(areVisitItemPropsEqual(props(), props({ isHovered: true }))).toBe(false);
  });

  it("選択状態が変わったら再描画する", () => {
    expect(areVisitItemPropsEqual(props(), props({ isSelected: true }))).toBe(false);
  });

  it("記録の参照が変わったら再描画する", () => {
    // 中身が同じでも参照が違えば更新後の記録とみなす（浅い比較で十分にするための約束）
    expect(areVisitItemPropsEqual(props(), props({ visit: { ...visit } }))).toBe(false);
  });

  it("コールバックの参照が変わっただけでは再描画しない", () => {
    const next = props({ onEdit: vi.fn(), setFilters: vi.fn(), onOpenImage: vi.fn() });

    expect(areVisitItemPropsEqual(props(), next)).toBe(true);
  });
});
