import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ErrorBoundary } from "./ErrorBoundary";

function Bomb({ shouldThrow }: { shouldThrow?: boolean }) {
  if (shouldThrow) {
    throw new Error("テスト用の例外です");
  }
  return <div>正常なコンテンツ</div>;
}

describe("ErrorBoundary", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    cleanup();
  });

  it("エラーがない場合は子要素を表示する", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(screen.getByText("正常なコンテンツ")).toBeInTheDocument();
  });

  it("エラーが発生した場合はデフォルトのフォールバックUIを表示する", () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("予期せぬエラーが発生しました")).toBeInTheDocument();
    expect(
      screen.getByText("ページの読み込み中または表示中にエラーが発生しました。再読み込みをお試しください。")
    ).toBeInTheDocument();
    expect(screen.getByText("テスト用の例外です")).toBeInTheDocument();
  });

  it("再読み込みボタンをクリックするとonResetが呼び出される", () => {
    const onReset = vi.fn();
    render(
      <ErrorBoundary onReset={onReset}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    const button = screen.getByRole("button", { name: "再読み込み" });
    fireEvent.click(button);

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("関数型のfallbackが指定されている場合はエラー情報を渡して描画する", () => {
    render(
      <ErrorBoundary
        fallback={({ error, reset }) => (
          <div>
            <span>カスタムエラー: {error?.message}</span>
            <button onClick={reset}>カスタムリセット</button>
          </div>
        )}
      >
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText("カスタムエラー: テスト用の例外です")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "カスタムリセット" })).toBeInTheDocument();
  });

  it("ReactNodeのfallbackが指定されている場合はそれを描画する", () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">カスタムフォールバック</div>}>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
  });

  it("onResetが指定されておらず再読み込みボタンをクリックした場合は、window.location.reloadが呼ばれる", () => {
    const originalLocation = window.location;
    // @ts-expect-error JSDOM environment requires deleting window.location for mocking
    delete window.location;
    // @ts-expect-error JSDOM location mock does not fully match Location interface
    window.location = { ...originalLocation, reload: vi.fn() };

    render(
      <ErrorBoundary>
        <Bomb shouldThrow={true} />
      </ErrorBoundary>
    );

    const button = screen.getByRole("button", { name: "再読み込み" });
    fireEvent.click(button);

    expect(window.location.reload).toHaveBeenCalledTimes(1);

    // @ts-expect-error Restore original window.location
    window.location = originalLocation;
  });
});
