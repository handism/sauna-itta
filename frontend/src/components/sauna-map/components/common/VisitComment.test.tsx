import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitComment } from "./VisitComment";

describe("VisitComment", () => {
  afterEach(() => {
    cleanup();
  });

  // jsdom はレイアウトを計算しないため、省略中の高さとあふれた高さを差し替えて判定させる
  const mockOverflow = (scrollHeight: number, clientHeight: number) => {
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(scrollHeight);
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(clientHeight);
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("空のコメントは何も描画しない", () => {
    const { container } = render(<VisitComment text="" className="sauna-card-comment" />);
    expect(container.firstChild).toBeNull();
  });

  it("あふれていなければ「続きを読む」を出さない", () => {
    mockOverflow(40, 40);
    render(<VisitComment text="短いコメント" className="sauna-card-comment" />);
    expect(screen.getByText("短いコメント")).toHaveClass("is-clamped");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("あふれていれば「続きを読む」で全文を展開し、「閉じる」で戻す", () => {
    mockOverflow(120, 60);
    const onParentClick = vi.fn();
    render(
      <div onClick={onParentClick}>
        <VisitComment text="長いコメント" className="sauna-card-comment" />
      </div>
    );

    const toggle = screen.getByRole("button", { name: "続きを読む" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", screen.getByText("長いコメント").id);

    fireEvent.click(toggle);
    expect(screen.getByText("長いコメント")).not.toHaveClass("is-clamped");
    expect(screen.getByRole("button", { name: "閉じる" })).toHaveAttribute("aria-expanded", "true");
    // 一覧カードの選択（親のクリック）を巻き込まない
    expect(onParentClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "閉じる" }));
    expect(screen.getByText("長いコメント")).toHaveClass("is-clamped");
  });
});
