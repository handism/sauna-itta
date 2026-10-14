import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useVisitFormState, UseVisitFormStateOptions } from "./useVisitFormState";
import { SaunaVisit } from "../types";
import * as utils from "../utils";

describe("useVisitFormState", () => {
  const mockVisit: SaunaVisit = {
    id: "v1",
    name: "サウナしきじ",
    lat: 34.95,
    lng: 138.4,
    date: "2023-05-01",
    comment: "最高",
    rating: 5,
  };

  let defaultOptions: UseVisitFormStateOptions;

  beforeEach(() => {
    defaultOptions = {
      startCreate: vi.fn(),
      startEdit: vi.fn(),
      cancelEdit: vi.fn(),
      showToast: vi.fn(),
    };
  });

  it("初期状態でデフォルトのフォーム状態を保持していること", () => {
    const { result } = renderHook(() => useVisitFormState(defaultOptions));

    expect(result.current.form.name).toBe("");
    expect(result.current.imageUploading).toBe(false);
  });

  it("startNewVisit を呼ぶと startCreate が呼び出されフォームがリセットされること", () => {
    const { result } = renderHook(() => useVisitFormState(defaultOptions));

    act(() => {
      result.current.startNewVisit();
    });

    expect(defaultOptions.startCreate).toHaveBeenCalled();
    expect(result.current.form.name).toBe("");
  });

  it("startEditing を呼ぶと startEdit が呼び出され指定データがフォームに反映されること", () => {
    const { result } = renderHook(() => useVisitFormState(defaultOptions));

    act(() => {
      result.current.startEditing(mockVisit);
    });

    expect(defaultOptions.startEdit).toHaveBeenCalledWith(mockVisit);
    expect(result.current.form.name).toBe("サウナしきじ");
  });

  it("startEditing に revisit を渡すと今日の訪問を追加する状態で開くこと", () => {
    const { result } = renderHook(() => useVisitFormState(defaultOptions));

    act(() => {
      result.current.startEditing({ ...mockVisit, status: "visited" }, { revisit: true });
    });

    expect(defaultOptions.startEdit).toHaveBeenCalled();
    expect(result.current.form).toMatchObject({
      name: "サウナしきじ",
      comment: "",
      rating: 0,
      date: utils.getTodayDate(),
      status: "visited",
      appendHistory: true,
    });
  });

  it("handleImageFile で画像圧縮に失敗したときにエラーのトーストが表示されること", async () => {
    const { result } = renderHook(() => useVisitFormState(defaultOptions));

    const spy = vi.spyOn(utils, "compressAndGetBase64").mockRejectedValue(new Error("compression failed"));

    await act(async () => {
      await result.current.handleImageFile(new File([""], "test.png", { type: "image/png" }));
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(defaultOptions.showToast).toHaveBeenCalledWith("画像の圧縮に失敗しました。別の画像で試してください。", "error");
    expect(result.current.imageUploading).toBe(false);

    spy.mockRestore();
  });

  it("handleImageFile は許可していない画像形式を圧縮まで進めずに拒否すること", async () => {
    const { result } = renderHook(() => useVisitFormState(defaultOptions));

    const spy = vi.spyOn(utils, "compressAndGetBase64");

    await act(async () => {
      await result.current.handleImageFile(new File([""], "test.bmp", { type: "image/bmp" }));
    });

    expect(spy).not.toHaveBeenCalled();
    expect(defaultOptions.showToast).toHaveBeenCalledWith(
      "対応していない画像形式です。JPEG / PNG / WebP / GIF を選んでください。",
      "error",
    );
    expect(result.current.form.image).toBe("");
    expect(result.current.imageUploading).toBe(false);

    spy.mockRestore();
  });
  describe("圧縮中にフォームが差し替わったとき", () => {
    function deferredCompression() {
      let resolve!: (value: string) => void;
      const spy = vi.spyOn(utils, "compressAndGetBase64").mockImplementation(
        () => new Promise<string>((r) => { resolve = r; }),
      );
      return { spy, resolve: (value: string) => resolve(value) };
    }
    const otherVisit: SaunaVisit = { ...mockVisit, id: "v2", name: "別のサウナ", image: undefined };
    const imageFile = () => new File(["x"], "photo.png", { type: "image/png" });

    it("別の記録の編集へ切り替えたら、終わった圧縮の写真を新しいフォームへ入れないこと", async () => {
      const { spy, resolve } = deferredCompression();
      const { result } = renderHook(() => useVisitFormState(defaultOptions));
      act(() => result.current.startEditing(mockVisit));

      let pending!: Promise<void>;
      act(() => {
        pending = result.current.handleImageFile(imageFile());
      });
      expect(result.current.imageUploading).toBe(true);

      act(() => result.current.startEditing(otherVisit));
      expect(result.current.imageUploading).toBe(false);

      await act(async () => {
        resolve("data:image/png;base64,old");
        await pending;
      });
      expect(result.current.form.name).toBe("別のサウナ");
      expect(result.current.form.image).toBe("");
      expect(result.current.imageUploading).toBe(false);
      spy.mockRestore();
    });

    it("編集を閉じた後に圧縮が終わっても、空のフォームへ写真を入れないこと", async () => {
      const { spy, resolve } = deferredCompression();
      const { result } = renderHook(() => useVisitFormState(defaultOptions));
      act(() => result.current.startNewVisit());

      let pending!: Promise<void>;
      act(() => {
        pending = result.current.handleImageFile(imageFile());
      });
      act(() => result.current.cancelEditing());

      await act(async () => {
        resolve("data:image/png;base64,old");
        await pending;
      });
      expect(result.current.form.image).toBe("");
      spy.mockRestore();
    });

    it("圧縮中に写真を外したら、終わった圧縮の写真で戻さないこと", async () => {
      const { spy, resolve } = deferredCompression();
      const { result } = renderHook(() => useVisitFormState(defaultOptions));

      let pending!: Promise<void>;
      act(() => {
        pending = result.current.handleImageFile(imageFile());
      });
      act(() => result.current.handleRemoveImage());
      expect(result.current.imageUploading).toBe(false);

      await act(async () => {
        resolve("data:image/png;base64,old");
        await pending;
      });
      expect(result.current.form.image).toBe("");
      spy.mockRestore();
    });

    it("写真を選び直したら、後から選んだ写真だけを反映すること", async () => {
      const resolvers: Array<(value: string) => void> = [];
      const spy = vi.spyOn(utils, "compressAndGetBase64").mockImplementation(
        () => new Promise<string>((r) => { resolvers.push(r); }),
      );
      const { result } = renderHook(() => useVisitFormState(defaultOptions));

      let first!: Promise<void>;
      let second!: Promise<void>;
      act(() => {
        first = result.current.handleImageFile(imageFile());
      });
      act(() => {
        second = result.current.handleImageFile(imageFile());
      });

      await act(async () => {
        resolvers[1]("data:image/png;base64,new");
        await second;
      });
      expect(result.current.imageUploading).toBe(false);
      await act(async () => {
        resolvers[0]("data:image/png;base64,old");
        await first;
      });
      expect(result.current.form.image).toBe("data:image/png;base64,new");
      spy.mockRestore();
    });
  });
});
