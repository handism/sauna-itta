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

  it("検索の処理を渡したときだけ地点検索を出す（モバイル）", () => {
    const { unmount } = render(<MobilePinHint onCancel={vi.fn()} />);
    expect(screen.queryByRole("combobox")).toBeNull();
    unmount();

    render(<MobilePinHint onCancel={vi.fn()} onSelectSearchResult={vi.fn()} />);
    expect(screen.getByLabelText("施設名や住所で場所を検索")).toBeInTheDocument();
    // 案内の文言だけをライブリージョンにする（検索欄は検索結果の件数を自前のライブリージョンで伝える）
    expect(screen.getByText("地図をタップして場所を選択").closest('[role="status"]')).toHaveClass("pin-hint-main");
  });

  it("デスクトップでは検索の処理を渡しても地点検索を出さない（フォーム側にあるため）", () => {
    render(<MobilePinHint variant="desktop" onSelectSearchResult={vi.fn()} />);
    expect(screen.queryByLabelText("施設名や住所で場所を検索")).toBeNull();
  });
});
