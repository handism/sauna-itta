import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Toast, type ToastState } from "./Toast";

const baseToast: ToastState = { id: 1, message: "データを3件取り込みました。", tone: "success" };

describe("Toast", () => {
  afterEach(() => {
    cleanup();
  });

  it("トーストが無いときは何も描画しない", () => {
    const { container } = render(<Toast toast={null} onClose={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("エラーは即座に読み上げるライブリージョンで伝える", () => {
    render(<Toast toast={{ ...baseToast, tone: "error", message: "保存に失敗しました。" }} onClose={vi.fn()} />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("保存に失敗しました。");
    expect(alert).toHaveAttribute("aria-live", "assertive");
  });

  it("エラー以外は操作の邪魔をしないpoliteなライブリージョンにする", () => {
    for (const tone of ["success", "info"] as const) {
      const { unmount } = render(<Toast toast={{ ...baseToast, tone }} onClose={vi.fn()} />);

      const status = screen.getByRole("status");
      expect(status).toHaveAttribute("aria-live", "polite");
      expect(status).toHaveClass(`app-toast--${tone}`);
      unmount();
    }
  });

  it("閉じるボタンはラベルを持ちonCloseを呼ぶ", () => {
    const onClose = vi.fn();
    render(<Toast toast={baseToast} onClose={onClose} />);

    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));

    expect(onClose).toHaveBeenCalledOnce();
  });
});
