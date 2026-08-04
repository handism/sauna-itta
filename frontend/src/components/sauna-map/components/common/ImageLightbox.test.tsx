import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ImageLightbox } from "./ImageLightbox";

describe("ImageLightbox", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders null when src is null", () => {
    const { container } = render(<ImageLightbox src={null} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders image dialog when src is provided and handles close button click", () => {
    const handleClose = vi.fn();
    render(<ImageLightbox src="https://example.com/sauna.jpg" alt="サウナ画像" onClose={handleClose} />);

    const dialog = screen.getByRole("dialog", { name: "写真拡大表示" });
    expect(dialog).toBeInTheDocument();

    const img = screen.getByAltText("サウナ画像");
    expect(img).toHaveAttribute("src", "https://example.com/sauna.jpg");

    const closeBtn = screen.getByRole("button", { name: "閉じる" });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
