import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ConfirmModal } from "./ConfirmModal";

function renderModal(overrides: Partial<Parameters<typeof ConfirmModal>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const utils = render(
    <ConfirmModal
      isOpen
      title="記録を削除しますか？"
      message="2026-07-24 の履歴を削除します。"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel, ...utils };
}

describe("ConfirmModal", () => {
  afterEach(() => {
    cleanup();
  });

  it("閉じているときは何も描画しない", () => {
    renderModal({ isOpen: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("タイトルと本文をdialogへ関連づける", () => {
    renderModal();

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAccessibleName("記録を削除しますか？");
    expect(dialog).toHaveAccessibleDescription("2026-07-24 の履歴を削除します。");
  });

  it("確認ボタンでだけonConfirmを呼ぶ", () => {
    const { onConfirm, onCancel } = renderModal({ confirmLabel: "削除する" });

    fireEvent.click(screen.getByRole("button", { name: "削除する" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("キャンセルボタンでonCancelを呼ぶ", () => {
    const { onConfirm, onCancel } = renderModal({ cancelLabel: "やめる" });

    fireEvent.click(screen.getByRole("button", { name: "やめる" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("オーバーレイのクリックは閉じるが、モーダル本体のクリックでは閉じない", () => {
    const { onCancel, onConfirm, container } = renderModal();

    fireEvent.click(container.querySelector(".confirm-modal")!);
    expect(onCancel).not.toHaveBeenCalled();

    fireEvent.click(container.querySelector(".confirm-overlay")!);
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Escapeで閉じる", () => {
    const { onCancel, onConfirm } = renderModal();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("開いたときは最初の操作要素へフォーカスし、確認ボタンを既定の当たり先にしない", () => {
    renderModal({ confirmLabel: "削除する", cancelLabel: "やめる" });

    // 誤操作を防ぐため、破壊的な確認ボタンではなくキャンセル側にフォーカスが載る
    expect(screen.getByRole("button", { name: "やめる" })).toHaveFocus();
  });

  it("destructiveのときだけ確認ボタンを危険操作の見た目にする", () => {
    const { unmount } = renderModal({ destructive: true, confirmLabel: "削除する" });
    expect(screen.getByRole("button", { name: "削除する" })).toHaveClass("btn-danger");
    unmount();

    renderModal({ confirmLabel: "OK" });
    expect(screen.getByRole("button", { name: "OK" })).toHaveClass("btn-primary");
  });
});
