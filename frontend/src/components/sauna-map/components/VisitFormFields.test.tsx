import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import { AreaField, DateField, NameField, RatingField, StatusField } from "./VisitFormFields";

afterEach(() => {
  cleanup();
});

describe("StatusField", () => {
  it("排他トグルをrole=groupとaria-pressedで公開する", () => {
    render(<StatusField status="wishlist" onChange={vi.fn()} />);

    expect(screen.getByRole("group", { name: "ステータス" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "行きたい" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "行った" })).toHaveAttribute("aria-pressed", "false");
    // タブではなくトグルなので role="tab" を名乗らない
    expect(screen.queryAllByRole("tab")).toHaveLength(0);
  });

  it("選択したステータスを通知する", () => {
    const onChange = vi.fn();
    render(<StatusField status="visited" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "行きたい" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("wishlist");
  });
});

describe("RatingField", () => {
  it("選択中の星までをaria-pressedで公開する", () => {
    render(<RatingField rating={3} onChange={vi.fn()} />);

    expect(screen.getByRole("group", { name: "満足度（1〜5）" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3つ星" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "4つ星" })).toHaveAttribute("aria-pressed", "false");
  });

  it("星の選択とクリアを通知する", () => {
    const onChange = vi.fn();
    render(<RatingField rating={3} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "5つ星" }));
    expect(onChange).toHaveBeenLastCalledWith(5);

    fireEvent.click(screen.getByRole("button", { name: "評価をクリア" }));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });
});

describe("DateField", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ラベルを入力欄に紐づける", () => {
    render(<DateField date="2026-08-02" onChange={vi.fn()} />);

    expect(screen.getByLabelText("行った日")).toHaveValue("2026-08-02");
  });

  it("日本時間の深夜でも「今日」がUTCの前日にならない", () => {
    // UTC では 2026-08-01 だが、利用者のローカル日付は 2026-08-02
    vi.setSystemTime(new Date("2026-08-02T00:30:00+09:00"));
    const onChange = vi.fn();
    render(<DateField date="" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "今日" }));

    expect(onChange).toHaveBeenLastCalledWith("2026-08-02");
  });

  it("「昨日」はローカル日付の前日を渡す", () => {
    vi.setSystemTime(new Date("2026-08-01T09:00:00+09:00"));
    const onChange = vi.fn();
    render(<DateField date="" onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "昨日" }));

    expect(onChange).toHaveBeenLastCalledWith("2026-07-31");
  });
});

describe("テキスト入力欄", () => {
  it("サウナ名はラベルと紐づき入力を通知する", () => {
    const onChange = vi.fn();
    render(<NameField name="北欧" onChange={onChange} />);

    const input = screen.getByLabelText("サウナ名");
    expect(input).toHaveValue("北欧");

    fireEvent.change(input, { target: { value: "上野 SHIZUKU" } });
    expect(onChange).toHaveBeenCalledExactlyOnceWith("上野 SHIZUKU");
  });

  it("エリアはラベルと紐づき入力を通知する", () => {
    const onChange = vi.fn();
    render(<AreaField area="" onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("エリア（任意）"), { target: { value: "東京都" } });

    expect(onChange).toHaveBeenCalledExactlyOnceWith("東京都");
  });
});
