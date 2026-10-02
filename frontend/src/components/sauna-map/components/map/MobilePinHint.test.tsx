import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MobilePinHint } from "./MobilePinHint";

describe("MobilePinHint", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders text and handles cancel button click", () => {
    const onCancel = vi.fn();
    render(<MobilePinHint onCancel={onCancel} />);

    expect(screen.getByText("地図をタップして場所を選択")).toBeInTheDocument();
    expect(screen.getByText("選ぶと記録の入力に進みます")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "場所の選択をやめる" });
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("shows desktop wording without a cancel button when onCancel is omitted", () => {
    const { container } = render(<MobilePinHint variant="desktop" />);

    expect(screen.getByText("地図をクリックして場所を選択")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "場所の選択をやめる" })).toBeNull();
    expect(container.querySelector(".pin-hint--desktop")).not.toBeNull();
  });
});
