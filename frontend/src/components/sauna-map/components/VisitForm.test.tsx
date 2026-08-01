import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import type { FormEvent } from "react";
import "@testing-library/jest-dom/vitest";
import { VisitFormView } from "./VisitForm";
import { VisitFormState } from "../types";

describe("VisitFormView", () => {
  afterEach(() => {
    cleanup();
  });

  const defaultForm: VisitFormState = {
    status: "visited",
    name: "テストサウナ",
    area: "東京",
    date: "2026-07-25",
    rating: 5,
    tagsText: "サウナ,水風呂",
    comment: "良かったです",
    image: "",
    appendHistory: true,
  };

  const defaultProps = {
    form: defaultForm,
    setForm: vi.fn(),
    selectedLocation: { lat: 35.68, lng: 139.76 },
    editingId: "sauna-1",
    historyEntries: [],
    onSubmit: vi.fn(),
    onImageFile: vi.fn(),
    onRemoveImage: vi.fn(),
    onDelete: vi.fn(),
    onCancel: vi.fn(),
    imageUploading: false,
  };

  it("renders the append history checkbox with checkbox-row class when editing a visited sauna", () => {
    render(<VisitFormView {...defaultProps} />);

    const labelElement = screen.getByText(/新しい訪問記録として追加する/).closest("label");
    expect(labelElement).not.toBeNull();
    expect(labelElement).toHaveClass("checkbox-row");

    const checkbox = screen.getByRole("checkbox", {
      name: /新しい訪問記録として追加する/,
    });
    expect(checkbox).toBeChecked();
  });

  it("calls setForm when toggling the append history checkbox", () => {
    const setFormMock = vi.fn();
    render(<VisitFormView {...defaultProps} setForm={setFormMock} />);

    const checkbox = screen.getByRole("checkbox", {
      name: /新しい訪問記録として追加する/,
    });
    fireEvent.click(checkbox);

    expect(setFormMock).toHaveBeenCalled();
  });

  it("associates every text field label with its input", () => {
    render(<VisitFormView {...defaultProps} />);

    expect(screen.getByLabelText("サウナ名")).toHaveValue("テストサウナ");
    expect(screen.getByLabelText("エリア（任意）")).toHaveValue("東京");
    expect(screen.getByLabelText("行った日")).toHaveValue("2026-07-25");
    expect(screen.getByLabelText("タグ（カンマ区切り）")).toHaveValue("サウナ,水風呂");
    expect(screen.getByLabelText("感想・メモ")).toHaveValue("良かったです");
  });

  it("enables the submit button when the form is complete", () => {
    render(<VisitFormView {...defaultProps} />);

    expect(screen.getByRole("button", { name: /更新する/ })).toBeEnabled();
    expect(document.getElementById("submit-blocked-reason")).toBeNull();
  });

  it("explains why the submit button is disabled when no location is selected", () => {
    render(<VisitFormView {...defaultProps} selectedLocation={null} />);

    const submit = screen.getByRole("button", { name: /更新する/ });
    expect(submit).toBeDisabled();
    expect(submit).toHaveAttribute("aria-describedby", "submit-blocked-reason");
    expect(document.getElementById("submit-blocked-reason")).toHaveTextContent(
      "地図上をクリックして場所を選択してください"
    );
  });

  it("explains why the submit button is disabled when the name is blank", () => {
    render(
      <VisitFormView {...defaultProps} form={{ ...defaultForm, name: "   " }} />
    );

    expect(screen.getByRole("button", { name: /更新する/ })).toBeDisabled();
    expect(document.getElementById("submit-blocked-reason")).toHaveTextContent(
      "サウナ名を入力してください"
    );
  });

  it("explains why the submit button is disabled while an image is uploading", () => {
    render(<VisitFormView {...defaultProps} imageUploading />);

    expect(screen.getByRole("button", { name: /更新する/ })).toBeDisabled();
    expect(document.getElementById("submit-blocked-reason")).toHaveTextContent(
      "画像の処理が終わるまでお待ちください"
    );
  });

  it("保存中は理由を示してボタンを止める", () => {
    render(<VisitFormView {...defaultProps} saving />);

    expect(screen.getByRole("button", { name: /保存中/ })).toBeDisabled();
    expect(document.getElementById("submit-blocked-reason")).toHaveTextContent(
      "サーバーへ保存しています。"
    );
  });

  it("行きたい記録では日付・満足度・写真を出さずメモ欄にする", () => {
    render(
      <VisitFormView
        {...defaultProps}
        form={{ ...defaultForm, status: "wishlist" }}
      />
    );

    expect(screen.queryByLabelText("訪問日")).not.toBeInTheDocument();
    expect(screen.queryByText("写真を追加")).not.toBeInTheDocument();
    expect(screen.getByLabelText("メモ")).toBeInTheDocument();
    // 訪問済みでないので履歴追加のチェックボックスも出さない
    expect(
      screen.queryByRole("checkbox", { name: /新しい訪問記録として追加する/ })
    ).not.toBeInTheDocument();
  });

  it("新規作成時は削除ボタンと履歴セクションを出さない", () => {
    render(<VisitFormView {...defaultProps} editingId={null} />);

    expect(screen.getByRole("button", { name: /保存する/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /削除/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: /新しい訪問記録として追加する/ })
    ).not.toBeInTheDocument();
  });

  it("削除・キャンセルはそれぞれのハンドラを呼ぶ", () => {
    const onDelete = vi.fn();
    const onCancel = vi.fn();
    render(<VisitFormView {...defaultProps} onDelete={onDelete} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole("button", { name: /削除/ }));
    fireEvent.click(screen.getByRole("button", { name: /キャンセル/ }));

    expect(onDelete).toHaveBeenCalledOnce();
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("送信でハンドラを呼ぶ", () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    const { container } = render(<VisitFormView {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.submit(container.querySelector("form") as HTMLFormElement);

    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
