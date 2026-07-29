import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitHistorySection } from "./VisitHistorySection";

const historyEntries = [
  { date: "2026-07-01", comment: "最初の訪問", rating: 4 },
  { date: "2026-07-20", comment: "最新の訪問", rating: 5 },
];

describe("VisitHistorySection", () => {
  afterEach(() => {
    cleanup();
  });

  it("削除ボタンを押しても確認前には履歴を削除しないこと", () => {
    const onDeleteEntry = vi.fn();
    render(
      <VisitHistorySection
        historyCount={2}
        shouldAppend={false}
        historyEntries={historyEntries}
        onDeleteEntry={onDeleteEntry}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "訪問履歴（2件）" }));
    fireEvent.click(screen.getAllByRole("button", { name: "この履歴を削除" })[0]);

    expect(onDeleteEntry).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "訪問履歴を削除しますか？" })).toBeInTheDocument();
    expect(screen.getByText(/2026-07-20の訪問履歴を削除します/)).toBeInTheDocument();
  });

  it("確認後にだけ対象の履歴を削除すること", () => {
    const onDeleteEntry = vi.fn();
    render(
      <VisitHistorySection
        historyCount={2}
        shouldAppend={false}
        historyEntries={historyEntries}
        onDeleteEntry={onDeleteEntry}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "訪問履歴（2件）" }));
    fireEvent.click(screen.getAllByRole("button", { name: "この履歴を削除" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "履歴を削除する" }));

    expect(onDeleteEntry).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("キャンセルした場合は履歴を削除しないこと", () => {
    const onDeleteEntry = vi.fn();
    render(
      <VisitHistorySection
        historyCount={2}
        shouldAppend={false}
        historyEntries={historyEntries}
        onDeleteEntry={onDeleteEntry}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "訪問履歴（2件）" }));
    fireEvent.click(screen.getAllByRole("button", { name: "この履歴を削除" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onDeleteEntry).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
