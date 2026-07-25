import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { SortSelect } from "./SortSelect";

describe("SortSelect", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders current selected option label and button", () => {
    const handleChange = vi.fn();
    render(<SortSelect value="recent" onChange={handleChange} />);

    const trigger = screen.getByRole("button", { name: "並び順" });
    expect(trigger).toBeDefined();
    expect(trigger.textContent).toContain("新しい順");
  });

  it("opens dropdown menu when clicked and closes when an option is selected", () => {
    const handleChange = vi.fn();
    render(<SortSelect value="recent" onChange={handleChange} />);

    const trigger = screen.getByRole("button", { name: "並び順" });

    // Initially closed
    expect(screen.queryByRole("listbox")).toBeNull();

    // Click to open
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeDefined();

    // Click an option by role
    const option = screen.getByRole("option", { name: /評価が高い順/ });
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith("ratingDesc");
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("closes dropdown menu on Escape key press and returns focus to the trigger", () => {
    const handleChange = vi.fn();
    render(<SortSelect value="recent" onChange={handleChange} />);

    const trigger = screen.getByRole("button", { name: "並び順" });

    // Open menu
    fireEvent.click(trigger);
    const listbox = screen.getByRole("listbox");
    expect(listbox).toBeDefined();

    // Press Escape
    fireEvent.keyDown(listbox, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("opens with ArrowDown from the trigger and moves focus into the listbox", () => {
    const handleChange = vi.fn();
    render(<SortSelect value="recent" onChange={handleChange} />);

    const trigger = screen.getByRole("button", { name: "並び順" });
    fireEvent.keyDown(trigger, { key: "ArrowDown" });

    const listbox = screen.getByRole("listbox");
    // フォーカスは listbox 本体に移り、位置は aria-activedescendant で公開される
    expect(document.activeElement).toBe(listbox);
    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: /新しい順/ }).id
    );
  });

  it("selects an option with arrow keys and Enter", () => {
    const handleChange = vi.fn();
    render(<SortSelect value="recent" onChange={handleChange} />);

    const trigger = screen.getByRole("button", { name: "並び順" });
    fireEvent.click(trigger);
    const listbox = screen.getByRole("listbox");

    // recent(0) -> oldest(1) -> ratingDesc(2)
    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: /評価が高い順/ }).id
    );

    fireEvent.keyDown(listbox, { key: "Enter" });

    expect(handleChange).toHaveBeenCalledWith("ratingDesc");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("wraps around with ArrowUp and supports Home / End", () => {
    const handleChange = vi.fn();
    render(<SortSelect value="recent" onChange={handleChange} />);

    fireEvent.click(screen.getByRole("button", { name: "並び順" }));
    const listbox = screen.getByRole("listbox");

    // 先頭から ArrowUp で末尾へ回り込む
    fireEvent.keyDown(listbox, { key: "ArrowUp" });
    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: /名前順/ }).id
    );

    fireEvent.keyDown(listbox, { key: "Home" });
    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: /新しい順/ }).id
    );

    fireEvent.keyDown(listbox, { key: "End" });
    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: /名前順/ }).id
    );
  });

  it("starts the highlight on the currently selected option", () => {
    const handleChange = vi.fn();
    render(<SortSelect value="visitCountDesc" onChange={handleChange} />);

    fireEvent.click(screen.getByRole("button", { name: "並び順" }));
    const listbox = screen.getByRole("listbox");

    expect(listbox).toHaveAttribute(
      "aria-activedescendant",
      screen.getByRole("option", { name: /訪問回数が多い順/ }).id
    );
  });

  it("closes without selecting on Tab", () => {
    const handleChange = vi.fn();
    render(<SortSelect value="recent" onChange={handleChange} />);

    fireEvent.click(screen.getByRole("button", { name: "並び順" }));
    const listbox = screen.getByRole("listbox");

    fireEvent.keyDown(listbox, { key: "ArrowDown" });
    fireEvent.keyDown(listbox, { key: "Tab" });

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
