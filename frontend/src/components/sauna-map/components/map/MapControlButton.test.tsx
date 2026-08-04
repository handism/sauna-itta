import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MapControlButton } from "./MapControlButton";

afterEach(() => {
  cleanup();
});

describe("MapControlButton", () => {
  it("active のときに CSS 側と同じ .is-active を付け、aria-pressed を公開すること", () => {
    render(
      <MapControlButton
        onClick={vi.fn()}
        title="ピンの集約を解除"
        ariaLabel="ピンの集約を解除"
        className="map-cluster-control-btn"
        active
      >
        <span />
      </MapControlButton>
    );

    const btn = screen.getByRole("button", { name: "ピンの集約を解除" });
    // CSS の .map-cluster-control-btn.is-active と一致していること
    expect(btn).toHaveClass("map-cluster-control-btn", "is-active");
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("active が false のときは .is-active を付けず aria-pressed=false にすること", () => {
    render(
      <MapControlButton
        onClick={vi.fn()}
        title="ピンをまとめて集約"
        ariaLabel="ピンをまとめて集約"
        className="map-cluster-control-btn"
        active={false}
      >
        <span />
      </MapControlButton>
    );

    const btn = screen.getByRole("button", { name: "ピンをまとめて集約" });
    expect(btn).not.toHaveClass("is-active");
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("トグルでないボタン（active 未指定）には aria-pressed を付けないこと", () => {
    render(
      <MapControlButton onClick={vi.fn()} title="拡大" ariaLabel="拡大">
        <span />
      </MapControlButton>
    );

    expect(screen.getByRole("button", { name: "拡大" })).not.toHaveAttribute(
      "aria-pressed"
    );
  });
});
