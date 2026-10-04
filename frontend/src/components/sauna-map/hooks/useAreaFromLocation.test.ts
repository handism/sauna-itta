import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { SetStateAction } from "react";
import { AREA_LOOKUP_DELAY_MS, useAreaFromLocation } from "./useAreaFromLocation";
import { getDefaultForm } from "../utils/form";
import * as geocoding from "../utils/geocoding";
import { LatLng, VisitFormState } from "../types";

describe("useAreaFromLocation", () => {
  let form: VisitFormState;
  const setForm = vi.fn((action: SetStateAction<VisitFormState>) => {
    form = typeof action === "function" ? action(form) : action;
  });

  beforeEach(() => {
    vi.useFakeTimers();
    form = getDefaultForm();
    setForm.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("場所を選んで待ち時間が過ぎたら、空のエリア欄を補うこと", async () => {
    const lookup = vi.spyOn(geocoding, "reverseGeocodeArea").mockResolvedValue("東京都台東区");
    renderHook(() => useAreaFromLocation({ lat: 35.71, lng: 139.77 }, true, setForm));

    expect(lookup).not.toHaveBeenCalled();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AREA_LOOKUP_DELAY_MS);
    });

    expect(lookup).toHaveBeenCalledWith(35.71, 139.77, expect.any(AbortSignal));
    expect(form.area).toBe("東京都台東区");
  });

  it("続けて場所を選び直したときは最後の地点だけを問い合わせること（1 秒に 1 回までを守る）", async () => {
    const lookup = vi.spyOn(geocoding, "reverseGeocodeArea").mockResolvedValue("大阪府大阪市");
    const { rerender } = renderHook(
      ({ location }: { location: LatLng }) => useAreaFromLocation(location, true, setForm),
      { initialProps: { location: { lat: 34.1, lng: 135.1 } } },
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AREA_LOOKUP_DELAY_MS / 2);
    });
    rerender({ location: { lat: 34.69, lng: 135.5 } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(AREA_LOOKUP_DELAY_MS);
    });

    expect(lookup).toHaveBeenCalledOnce();
    expect(lookup).toHaveBeenCalledWith(34.69, 135.5, expect.any(AbortSignal));
  });

  it("問い合わせの間に利用者が入力したエリアは上書きしないこと", async () => {
    let resolveLookup: (area: string) => void = () => {};
    vi.spyOn(geocoding, "reverseGeocodeArea").mockReturnValue(
      new Promise((resolve) => {
        resolveLookup = resolve;
      }),
    );
    renderHook(() => useAreaFromLocation({ lat: 35.71, lng: 139.77 }, true, setForm));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AREA_LOOKUP_DELAY_MS);
    });
    form = { ...form, area: "上野" };
    await act(async () => {
      resolveLookup("東京都台東区");
    });

    expect(form.area).toBe("上野");
  });

  it("無効のとき（編集中・エリア入力済み）は問い合わせないこと", async () => {
    const lookup = vi.spyOn(geocoding, "reverseGeocodeArea").mockResolvedValue("東京都台東区");
    renderHook(() => useAreaFromLocation({ lat: 35.71, lng: 139.77 }, false, setForm));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(AREA_LOOKUP_DELAY_MS * 2);
    });

    expect(lookup).not.toHaveBeenCalled();
    expect(setForm).not.toHaveBeenCalled();
  });
});
