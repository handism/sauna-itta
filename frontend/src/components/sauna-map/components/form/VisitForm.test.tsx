import { render, screen, fireEvent, cleanup, act, within } from "@testing-library/react";
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
    editingStatus: "visited" as const,
    historyEntries: [],
    onSubmit: vi.fn(),
    onImageFile: vi.fn(),
    onRemoveImage: vi.fn(),
    onDelete: vi.fn(),
    onCancel: vi.fn(),
    imageUploading: false,
  };

  it("新規登録は任意項目を閉じ、編集時は開いて表示する", () => {
    const { container, rerender } = render(<VisitFormView {...defaultProps} editingId={null} />);
    const details = container.querySelector("details.form-details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(screen.getByLabelText("サウナ名")).toBeRequired();
    expect(screen.getByLabelText("行った日")).toBeRequired();
    rerender(<VisitFormView {...defaultProps} />);
    expect(details.open).toBe(true);
    expect(screen.getByLabelText("感想・メモ")).toHaveValue(defaultForm.comment);
    // 閉じた後も値を消さず、再び開いたときに見返せる
    fireEvent.click(details.querySelector("summary")!);
    expect(details.open).toBe(false);
    expect(screen.getByLabelText("感想・メモ")).toHaveValue(defaultForm.comment);
    fireEvent.click(details.querySelector("summary")!);
    expect(details.open).toBe(true);
    expect(screen.getByRole("list", { name: "付けたタグ" })).toHaveTextContent("サウナ水風呂");
  });

  it("訪問済みの編集では保存のしかたを排他の切り替えで公開する", () => {
    render(<VisitFormView {...defaultProps} />);

    const group = screen.getByRole("group", { name: "保存のしかた" });
    expect(within(group).getByRole("button", { name: "新しい訪問を追加" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(within(group).getByRole("button", { name: "前回の記録を修正" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    expect(screen.getByText(/新しい訪問として履歴に追加します/)).toBeInTheDocument();
  });

  it("行きたい記録を行ったへ切り替えたときは保存のしかたを選ばせない", () => {
    render(<VisitFormView {...defaultProps} editingStatus="wishlist" />);

    expect(screen.queryByRole("group", { name: "保存のしかた" })).toBeNull();
  });

  it("「前回の記録を修正」を選ぶと appendHistory を false にする", () => {
    const setFormMock = vi.fn();
    render(<VisitFormView {...defaultProps} setForm={setFormMock} />);

    fireEvent.click(screen.getByRole("button", { name: "前回の記録を修正" }));

    const updater = setFormMock.mock.calls[0][0];
    expect(updater({ ...defaultForm, appendHistory: true }).appendHistory).toBe(false);
  });

  it("項目を「場所」「記録の内容」「タグ」「これまでの訪問」の区切りで見せる", () => {
    render(<VisitFormView {...defaultProps} />);

    const headings = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual(["場所（必須）", "記録の内容", "タグ", "これまでの訪問"]);
    // 必須のサウナ名は場所の区切りに置く
    expect(
      within(screen.getByRole("region", { name: "場所（必須）" })).getByLabelText("サウナ名")
    ).toBeInTheDocument();
  });

  it("associates every text field label with its input", () => {
    render(<VisitFormView {...defaultProps} />);

    expect(screen.getByLabelText("サウナ名")).toHaveValue("テストサウナ");
    expect(screen.getByLabelText("エリア（任意）")).toHaveValue("東京");
    expect(screen.getByLabelText("行った日")).toHaveValue("2026-07-25");
    expect(screen.getByLabelText("タグを追加")).toHaveValue("");
    expect(screen.getByRole("list", { name: "付けたタグ" })).toHaveTextContent("サウナ水風呂");
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
    // 押したときに足りない箇所へ案内するため、disabled ではなく aria-disabled にする
    expect(submit).toBeEnabled();
    expect(submit).toHaveAttribute("aria-disabled", "true");
    expect(submit).toHaveAttribute("aria-describedby", "submit-blocked-reason");
    const reason = document.getElementById("submit-blocked-reason");
    expect(reason).toHaveTextContent("場所が未選択です（地図をクリック、または下の検索で選択）");
    // フォーム先頭の場所の案内と同じ文なので、見た目には出さず読み上げにだけ残す
    expect(reason).toHaveClass("sr-only");
  });

  it("サウナ名の不足はボタンの下に見える形で理由を出す", () => {
    render(<VisitFormView {...defaultProps} form={{ ...defaultProps.form, name: "" }} />);

    const reason = document.getElementById("submit-blocked-reason");
    expect(reason).toHaveTextContent("サウナ名");
    expect(reason).not.toHaveClass("sr-only");
  });

  it("場所が未選択のまま保存を押すと、送信せず場所の案内を強調する", () => {
    const onSubmit = vi.fn();
    render(
      <VisitFormView {...defaultProps} editingId={null} selectedLocation={null} onSubmit={onSubmit} />
    );

    expect(document.querySelector(".location-status")).not.toHaveClass("is-attention");
    fireEvent.click(screen.getByRole("button", { name: /保存する/ }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(document.querySelector(".location-status")).toHaveClass("is-attention");
  });

  it("サウナ名が空のまま保存を押すと、送信せずサウナ名の欄へフォーカスする", () => {
    const onSubmit = vi.fn();
    render(
      <VisitFormView {...defaultProps} form={{ ...defaultForm, name: "   " }} onSubmit={onSubmit} />
    );

    fireEvent.click(screen.getByRole("button", { name: /更新する/ }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByLabelText("サウナ名")).toHaveFocus();
  });

  it("入力がそろっていれば保存を押すと送信する", () => {
    const onSubmit = vi.fn((e: FormEvent) => e.preventDefault());
    render(<VisitFormView {...defaultProps} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole("button", { name: /更新する/ }));

    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("新規登録では場所の選択状態を見出しの下に表示すること", () => {
    const { rerender } = render(
      <VisitFormView {...defaultProps} editingId={null} selectedLocation={null} />
    );

    const status = document.querySelector(".location-status");
    expect(status).toHaveTextContent("場所が未選択です（地図をクリック、または下の検索で選択）");
    expect(status).not.toHaveClass("is-selected");

    rerender(<VisitFormView {...defaultProps} editingId={null} />);
    expect(document.querySelector(".location-status")).toHaveClass("is-selected");
  });

  it("開いたとき・編集対象が変わったときにスクロール位置を先頭へ戻すこと", () => {
    // jsdom は scrollTop の代入を保持しないため、スクロール領域の値を自前で持つ
    const container = document.createElement("div");
    let scrollTop = 400;
    Object.defineProperty(container, "scrollTop", {
      get: () => scrollTop,
      set: (value: number) => {
        scrollTop = value;
      },
    });
    document.body.appendChild(container);

    const { rerender } = render(<VisitFormView {...defaultProps} />, { container });
    expect(scrollTop).toBe(0);

    scrollTop = 400;
    rerender(<VisitFormView {...defaultProps} editingId="sauna-2" />);
    expect(scrollTop).toBe(0);
    container.remove();
  });

  it("explains why the submit button is disabled when the name is blank", () => {
    render(
      <VisitFormView {...defaultProps} form={{ ...defaultForm, name: "   " }} />
    );

    expect(screen.getByRole("button", { name: /更新する/ })).toHaveAttribute("aria-disabled", "true");
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
    // 訪問済みでないので保存のしかたの切り替えも出さない
    expect(
      screen.queryByRole("group", { name: "保存のしかた" })
    ).not.toBeInTheDocument();
  });

  it("新規作成時は削除ボタンと履歴セクションを出さない", () => {
    render(<VisitFormView {...defaultProps} editingId={null} />);

    expect(screen.getByRole("button", { name: /保存する/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /削除/ })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "保存のしかた" })
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

    fireEvent.click(screen.getByRole("radio", { name: "3つ星" }));
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
