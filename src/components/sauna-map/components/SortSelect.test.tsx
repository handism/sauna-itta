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

  it("closes dropdown menu on Escape key press", () => {
    const handleChange = vi.fn();
    render(<SortSelect value="recent" onChange={handleChange} />);

    const trigger = screen.getByRole("button", { name: "並び順" });

    // Open menu
    fireEvent.click(trigger);
    expect(screen.getByRole("listbox")).toBeDefined();

    // Press Escape
    fireEvent.keyDown(trigger, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });
});
