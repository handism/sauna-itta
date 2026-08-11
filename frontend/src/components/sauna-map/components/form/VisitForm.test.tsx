import { render, screen, fireEvent, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { FormEvent, SetStateAction } from "react";
import "@testing-library/jest-dom/vitest";
import { VisitForm, VisitFormView } from "./VisitForm";
import { VisitFormState } from "../../types";
import {
  SaunaMapProvider,
  useSaunaMapActions,
  useSaunaMapStateValue,
} from "../../context";

// 地点検索は debounce と Nominatim への fetch を伴うため、選択結果の受け渡しだけを差し替える
vi.mock("./VisitFormFields", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./VisitFormFields")>();
  return {
    ...actual,
    LocationSearchField: ({
      onSelectLocation,
    }: {
      onSelectLocation: (result: import("../../utils/geocoding").GeocodingResult) => void;
    }) => (
      <button
        type="button"
        onClick={() =>
          onSelectLocation({
            placeId: 1,
            lat: 43.06,
            lng: 141.35,
            displayName: "ニコーリフレ, 札幌市",
            name: "ニコーリフレ",
            addressText: "北海道札幌市中央区",
          })
        }
      >
        検索結果を選ぶ
      </button>
    ),
  };
});

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

  /*
   * setForm には更新関数が渡る。コメント欄の onChange は `e.target.value` を更新関数の
   * 中で読むため、setForm がダミーだと再レンダリングで DOM の値が元へ戻り、あとから
   * 評価しても取りこぼす。そのため呼び出された時点で適用しておく。
   */
  function createSetForm(base: VisitFormState = defaultForm) {
    let current = base;
    const setForm = vi.fn((action: SetStateAction<VisitFormState>) => {
      current = typeof action === "function" ? action(current) : action;
    });
    return { setForm, latest: () => current };
  }

  it.each([
    ["サウナ名", "しきじ", "name"],
    ["エリア（任意）", "静岡県", "area"],
    ["タグ（カンマ区切り）", "薬草", "tagsText"],
    ["感想・メモ", "水がうまい", "comment"],
    ["行った日", "2026-08-01", "date"],
  ] as const)("%s の入力をフォーム状態へ反映する", (label, value, key) => {
    const { setForm, latest } = createSetForm();
    render(<VisitFormView {...defaultProps} setForm={setForm} />);

    fireEvent.change(screen.getByLabelText(label), { target: { value } });

    expect(latest()[key]).toBe(value);
  });

  it("ステータスと満足度の変更をフォーム状態へ反映する", () => {
    const { setForm, latest } = createSetForm();
    render(<VisitFormView {...defaultProps} setForm={setForm} />);

    fireEvent.click(screen.getByRole("button", { name: "行きたい" }));
    expect(latest().status).toBe("wishlist");

    fireEvent.click(screen.getByRole("button", { name: "3つ星" }));
    expect(latest().rating).toBe(3);
  });

  it("地点検索の選択は座標を通知し、空欄の名前とエリアだけを埋める", () => {
    const emptyForm = { ...defaultForm, name: "", area: "" };
    const { setForm, latest } = createSetForm(emptyForm);
    const onLocationSelect = vi.fn();
    render(
      <VisitFormView
        {...defaultProps}
        form={emptyForm}
        setForm={setForm}
        onLocationSelect={onLocationSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "検索結果を選ぶ" }));

    expect(onLocationSelect).toHaveBeenCalledExactlyOnceWith(43.06, 141.35);
    expect(latest().name).toBe("ニコーリフレ");
    expect(latest().area).toBe("北海道札幌市中央区");
  });

  it("入力済みの名前とエリアは地点検索の結果で上書きしない", () => {
    const { setForm, latest } = createSetForm();
    render(<VisitFormView {...defaultProps} setForm={setForm} onLocationSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "検索結果を選ぶ" }));

    expect(latest().name).toBe("テストサウナ");
    expect(latest().area).toBe("東京");
  });

  it("onLocationSelectが無くてもフォームの補完だけは行う", () => {
    const emptyForm = { ...defaultForm, name: "", area: "" };
    const { setForm, latest } = createSetForm(emptyForm);
    render(<VisitFormView {...defaultProps} form={emptyForm} setForm={setForm} />);

    fireEvent.click(screen.getByRole("button", { name: "検索結果を選ぶ" }));

    expect(latest().name).toBe("ニコーリフレ");
  });
});

/*
 * コンテナは Context を集めて View へ渡すだけだが、キャンセルを EditorContext の
 * cancelEditing へ直結させるとモバイルでシートが full のまま地図が隠れる。
 * その配線（MapStateContext 経由であること）をここで固定する。
 */
describe("VisitForm（コンテナ）", () => {
  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", { writable: true, value: 500 });
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  function Harness() {
    const { snapPosition } = useSaunaMapStateValue();
    const { handleSelectMobileTab } = useSaunaMapActions();
    return (
      <>
        <span data-testid="snap">{snapPosition}</span>
        <button type="button" onClick={() => handleSelectMobileTab("add")}>
          追加を開始
        </button>
        <VisitForm />
      </>
    );
  }

  it("キャンセルでモバイルのシートを最小化まで戻す", async () => {
    render(
      <SaunaMapProvider>
        <Harness />
      </SaunaMapProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "追加を開始" }));
    });
    expect(screen.getByTestId("snap")).toHaveTextContent("full");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /キャンセル/ }));
    });
    expect(screen.getByTestId("snap")).toHaveTextContent("min");
  });

  it("Contextのフォーム値を表示し、入力を書き戻す", async () => {
    render(
      <SaunaMapProvider>
        <Harness />
      </SaunaMapProvider>
    );

    const nameInput = screen.getByLabelText("サウナ名");
    expect(nameInput).toHaveValue("");

    await act(async () => {
      fireEvent.change(nameInput, { target: { value: "サウナしきじ" } });
    });

    expect(screen.getByLabelText("サウナ名")).toHaveValue("サウナしきじ");
  });
});
