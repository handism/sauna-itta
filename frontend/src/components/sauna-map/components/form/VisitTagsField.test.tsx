import { render, screen, within, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitTagsField } from "./VisitTagsField";
import { PRESET_TAGS } from "../../utils/visitStats";

afterEach(() => {
  cleanup();
});

describe("VisitTagsField", () => {
  it("入力欄をラベルと紐づけ、プリセットをgroupとして公開する", () => {
    render(<VisitTagsField tagsText="外気浴最高" onChange={vi.fn()} suggestedTags={PRESET_TAGS} />);

    expect(screen.getByLabelText("タグ（カンマ区切り）")).toHaveValue("外気浴最高");
    expect(screen.getByRole("group", { name: "タグの候補" })).toBeInTheDocument();
  });

  it("自由入力をそのまま通知する", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText="" onChange={onChange} suggestedTags={PRESET_TAGS} />);

    fireEvent.change(screen.getByLabelText("タグ（カンマ区切り）"), {
      target: { value: "薬草, ぬる湯" },
    });

    expect(onChange).toHaveBeenCalledExactlyOnceWith("薬草, ぬる湯");
  });

  it("未選択のプリセットを押すと既存のタグへ追加する", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText="薬草" onChange={onChange} suggestedTags={PRESET_TAGS} />);

    const chip = screen.getByRole("button", { name: /外気浴最高/ });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(chip);

    expect(onChange).toHaveBeenCalledExactlyOnceWith("薬草, 外気浴最高");
  });

  it("選択済みのプリセットを押すとそのタグだけ外す", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText="薬草, 外気浴最高, ソロ向き" onChange={onChange} suggestedTags={PRESET_TAGS} />);

    const chip = screen.getByRole("button", { name: /外気浴最高/ });
    expect(chip).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(chip);

    expect(onChange).toHaveBeenCalledExactlyOnceWith("薬草, ソロ向き");
  });

  it("空文字や余分な区切りからタグを作らない", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText=" , ,  " onChange={onChange} suggestedTags={PRESET_TAGS} />);

    // 空要素が混ざったままだと "、、外気浴最高" のような空タグが生まれる
    expect(screen.getByRole("button", { name: /ソロ向き/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(screen.getByRole("button", { name: /ソロ向き/ }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("ソロ向き");
  });

  it("渡された候補の順にチップを並べる", () => {
    render(
      <VisitTagsField tagsText="" onChange={vi.fn()} suggestedTags={["薪ストーブ", "サウナ飯"]} />
    );

    const chips = within(screen.getByRole("group", { name: "タグの候補" })).getAllByRole("button");
    expect(chips.map((chip) => chip.textContent?.trim())).toEqual(["+ 薪ストーブ", "+ サウナ飯"]);
  });
});
