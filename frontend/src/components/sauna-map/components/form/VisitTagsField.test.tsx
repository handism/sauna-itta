import { render, screen, within, fireEvent, createEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { VisitTagsField } from "./VisitTagsField";
import { PRESET_TAGS } from "../../utils/visitStats";

afterEach(() => {
  cleanup();
});

describe("VisitTagsField", () => {
  it("入力欄をラベルと紐づけ、付けたタグをチップで、プリセットをgroupとして公開する", () => {
    render(<VisitTagsField tagsText="外気浴最高, 薬草" onChange={vi.fn()} suggestedTags={PRESET_TAGS} />);

    // 入力欄は次の 1 件を打つ場所なので、付けたタグは値ではなくチップに出る
    expect(screen.getByLabelText("タグを追加")).toHaveValue("");
    const chips = within(screen.getByRole("list", { name: "付けたタグ" })).getAllByRole("listitem");
    expect(chips.map((chip) => chip.textContent)).toEqual(["外気浴最高", "薬草"]);
    expect(screen.getByRole("group", { name: "タグの候補" })).toBeInTheDocument();
  });

  it("Enter で入力中の 1 件を既存のタグへ追加し、フォームを送信しない", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText="薬草" onChange={onChange} suggestedTags={PRESET_TAGS} />);

    const input = screen.getByLabelText("タグを追加");
    fireEvent.change(input, { target: { value: "ぬる湯" } });
    expect(onChange).not.toHaveBeenCalled();

    const event = createEvent.keyDown(input, { key: "Enter" });
    fireEvent(input, event);

    expect(event.defaultPrevented).toBe(true);
    expect(onChange).toHaveBeenCalledExactlyOnceWith("薬草, ぬる湯");
    expect(input).toHaveValue("");
  });

  it.each(["、", ",", "，"])("「%s」を打つとそこまでを 1 件として確定する", (separator) => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText="" onChange={onChange} suggestedTags={PRESET_TAGS} />);

    const input = screen.getByLabelText("タグを追加");
    fireEvent.change(input, { target: { value: `外気浴${separator}水` } });

    expect(onChange).toHaveBeenCalledExactlyOnceWith("外気浴");
    expect(input).toHaveValue("水");
  });

  it("確定し忘れた入力はフォーカスが外れたときに追加する", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText="薬草" onChange={onChange} suggestedTags={PRESET_TAGS} />);

    const input = screen.getByLabelText("タグを追加");
    fireEvent.change(input, { target: { value: "ぬる湯" } });
    fireEvent.blur(input);

    expect(onChange).toHaveBeenCalledExactlyOnceWith("薬草, ぬる湯");
  });

  it("空の入力欄で Backspace を押すと最後のタグを外す", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText="薬草, ぬる湯" onChange={onChange} suggestedTags={PRESET_TAGS} />);

    fireEvent.keyDown(screen.getByLabelText("タグを追加"), { key: "Backspace" });

    expect(onChange).toHaveBeenCalledExactlyOnceWith("薬草");
  });

  it("チップの外すボタンでそのタグだけを外す", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText="薬草, ぬる湯, ソロ向き" onChange={onChange} suggestedTags={PRESET_TAGS} />);

    fireEvent.click(screen.getByRole("button", { name: "タグ「ぬる湯」を外す" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith("薬草, ソロ向き");
  });

  it("すでに付いているタグを打っても重複させない", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText="薬草" onChange={onChange} suggestedTags={PRESET_TAGS} />);

    const input = screen.getByLabelText("タグを追加");
    fireEvent.change(input, { target: { value: "薬草" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledExactlyOnceWith("薬草");
  });

  it("未選択のプリセットを押すと既存のタグへ追加する", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText="薬草" onChange={onChange} suggestedTags={PRESET_TAGS} />);

    const chip = within(screen.getByRole("group", { name: "タグの候補" })).getByRole("button", { name: /外気浴最高/ });
    expect(chip).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(chip);

    expect(onChange).toHaveBeenCalledExactlyOnceWith("薬草, 外気浴最高");
  });

  it("選択済みのプリセットを押すとそのタグだけ外す", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText="薬草, 外気浴最高, ソロ向き" onChange={onChange} suggestedTags={PRESET_TAGS} />);

    const chip = within(screen.getByRole("group", { name: "タグの候補" })).getByRole("button", { name: /外気浴最高/ });
    expect(chip).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(chip);

    expect(onChange).toHaveBeenCalledExactlyOnceWith("薬草, ソロ向き");
  });

  it("空文字や余分な区切りからタグを作らない", () => {
    const onChange = vi.fn();
    render(<VisitTagsField tagsText=" , ,  " onChange={onChange} suggestedTags={PRESET_TAGS} />);

    // 空要素が混ざったままだと "、、外気浴最高" のような空タグが生まれる
    expect(within(screen.getByRole("group", { name: "タグの候補" })).getByRole("button", { name: /ソロ向き/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(within(screen.getByRole("group", { name: "タグの候補" })).getByRole("button", { name: /ソロ向き/ }));

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
