import { afterEach, describe, expect, it, vi } from "vitest";
import { MAX_REPORTS_PER_PAGE, reportError, resetErrorReporter } from "./errorReporter";
import { getVisitRepository } from "../repositories";

vi.mock("../repositories", () => {
  const repository = { reportClientError: vi.fn().mockResolvedValue(undefined) };
  return { getVisitRepository: () => repository };
});

const reportClientError = vi.mocked(getVisitRepository().reportClientError);

afterEach(() => {
  resetErrorReporter();
  reportClientError.mockClear();
});

describe("reportError", () => {
  it("エラーの内容と発生場所を Repository へ渡す", () => {
    const error = new Error("boom");

    reportError(error, "window-error", { componentStack: "at Bomb" });

    expect(reportClientError).toHaveBeenCalledWith({
      message: "boom",
      stack: error.stack,
      componentStack: "at Bomb",
      source: "window-error",
      url: window.location.href.split("#")[0],
    });
  });

  it("Error 以外の値も文字列にして報告する", () => {
    reportError({ reason: "x" }, "unhandled-rejection");
    reportError("plain", "unhandled-rejection");

    expect(reportClientError.mock.calls.map(([report]) => report?.message)).toEqual(['{"reason":"x"}', "plain"]);
  });

  it("同じエラーは1回だけ、全体でも上限までしか送らない", () => {
    reportError(new Error("same"), "window-error");
    reportError(new Error("same"), "window-error");
    for (let index = 0; index < MAX_REPORTS_PER_PAGE + 3; index += 1) {
      reportError(new Error(`error-${index}`), "window-error");
    }

    expect(reportClientError).toHaveBeenCalledTimes(MAX_REPORTS_PER_PAGE);
  });

  it("報告の送信に失敗しても例外を投げない", async () => {
    reportClientError.mockRejectedValueOnce(new Error("offline"));

    expect(() => reportError(new Error("boom"), "window-error")).not.toThrow();
    await Promise.resolve();
  });
});
