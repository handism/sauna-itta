import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { BottomSheet } from "./BottomSheet";

describe("BottomSheet", () => {
  const onSnapChange = vi.fn();

  const renderSheet = (snapPosition: "min" | "half" | "full") =>
    render(
      <BottomSheet snapPosition={snapPosition} onSnapChange={onSnapChange} filteredCount={3}>
        <p>リスト本体</p>
      </BottomSheet>
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the handle as a button with aria-expanded and aria-controls", () => {
    renderSheet("min");

    const handle = screen.getByRole("button", { name: "パネルを開く" });
    expect(handle).toHaveAttribute("aria-expanded", "false");
    expect(handle).toHaveAttribute("aria-controls", "bottom-sheet-content");
    expect(document.getElementById("bottom-sheet-content")).toHaveTextContent("リスト本体");
  });

  it("exposes aria-expanded=true and a matching label when opened", () => {
    renderSheet("half");

    const handle = screen.getByRole("button", { name: "パネルを最大化する" });
    expect(handle).toHaveAttribute("aria-expanded", "true");
  });

  it("cycles snap positions on click", () => {
    renderSheet("half");

    fireEvent.click(screen.getByRole("button", { name: "パネルを最大化する" }));
    expect(onSnapChange).toHaveBeenCalledWith("full");
  });

  it("moves up one snap step on ArrowUp", () => {
    renderSheet("min");

    fireEvent.keyDown(screen.getByRole("button", { name: "パネルを開く" }), { key: "ArrowUp" });
    expect(onSnapChange).toHaveBeenCalledWith("half");
  });

  it("moves down one snap step on ArrowDown", () => {
    renderSheet("full");

    fireEvent.keyDown(screen.getByRole("button", { name: "パネルを閉じる" }), { key: "ArrowDown" });
    expect(onSnapChange).toHaveBeenCalledWith("half");
  });

  it("does not go below min on ArrowDown", () => {
    renderSheet("min");

    fireEvent.keyDown(screen.getByRole("button", { name: "パネルを開く" }), { key: "ArrowDown" });
    expect(onSnapChange).not.toHaveBeenCalled();
  });
});
