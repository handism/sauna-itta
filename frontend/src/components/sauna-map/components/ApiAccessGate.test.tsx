import { cleanup, render, screen, fireEvent } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ApiAccessGate } from "./ApiAccessGate";

afterEach(cleanup);

describe("ApiAccessGate", () => {
  it("ローディング中はローディングインジケーターを表示する", () => {
    render(
      <ApiAccessGate
        loading={true}
        authenticated={false}
        csrfToken="csrf-token"
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByText("記録を読み込んでいます...")).toBeInTheDocument();
  });

  it("エラーがある場合はエラーメッセージと再読み込みボタンを表示し、クリックでonRetryを呼ぶ", () => {
    const onRetryMock = vi.fn();
    render(
      <ApiAccessGate
        loading={false}
        authenticated={false}
        csrfToken="csrf-token"
        error="ネットワークエラーが発生しました"
        onRetry={onRetryMock}
      />,
    );
    expect(screen.getByText("ネットワークエラーが発生しました")).toBeInTheDocument();

    const retryButton = screen.getByRole("button", { name: "再読み込み" });
    fireEvent.click(retryButton);
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });

  it("ロード完了、認証済み、エラーなしの場合は何も表示しない（nullを返す）", () => {
    const { container } = render(
      <ApiAccessGate
        loading={false}
        authenticated={true}
        csrfToken="csrf-token"
        error={null}
        onRetry={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("CSRFトークンを含むPOSTフォームでGoogleログインを開始する", () => {
    const { container } = render(
      <ApiAccessGate
        loading={false}
        authenticated={false}
        csrfToken="csrf-token"
        error={null}
        onRetry={vi.fn()}
      />,
    );

    const button = screen.getByRole("button", { name: "Googleでログイン" });
    const form = button.closest("form");
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/auth/google_oauth2");
    expect(container.querySelector('input[name="authenticity_token"]')).toHaveValue("csrf-token");
  });

  it("CSRFトークンが無い間はログインボタンを無効化する", () => {
    render(
      <ApiAccessGate
        loading={false}
        authenticated={false}
        csrfToken={null}
        error={null}
        onRetry={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Googleでログイン" })).toBeDisabled();
  });
});
