import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { MobilePinHint } from "./MobilePinHint";

describe("MobilePinHint", () => {
  it("renders text and handles cancel button click", () => {
    const onCancel = vi.fn();
    render(<MobilePinHint onCancel={onCancel} />);

    expect(screen.getByText("地図をタップして場所を選択")).toBeInTheDocument();
    expect(screen.getByText("サウナの場所をタップしてね")).toBeInTheDocument();

    const cancelButton = screen.getByRole("button", { name: "場所の選択をやめる" });
    expect(cancelButton).toBeInTheDocument();

    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
