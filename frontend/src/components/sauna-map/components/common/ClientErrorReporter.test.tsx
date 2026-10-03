import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ClientErrorReporter } from "./ClientErrorReporter";
import { reportError } from "../../utils/errorReporter";

vi.mock("../../utils/errorReporter", () => ({ reportError: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.mocked(reportError).mockClear();
});

describe("ClientErrorReporter", () => {
  it("未処理の例外と Promise の拒否を報告する", () => {
    render(<ClientErrorReporter />);
    const error = new Error("boom");

    window.dispatchEvent(new ErrorEvent("error", { error, message: "boom" }));
    const rejection = new Event("unhandledrejection") as PromiseRejectionEvent;
    Object.defineProperty(rejection, "reason", { value: "rejected" });
    window.dispatchEvent(rejection);

    expect(reportError).toHaveBeenCalledWith(error, "window-error");
    expect(reportError).toHaveBeenCalledWith("rejected", "unhandled-rejection");
  });

  it("中身の伏せられた別オリジンのエラーは送らない", () => {
    render(<ClientErrorReporter />);

    window.dispatchEvent(new ErrorEvent("error", { message: "Script error." }));

    expect(reportError).not.toHaveBeenCalled();
  });

  it("アンマウント後は報告しない", () => {
    const { unmount } = render(<ClientErrorReporter />);
    unmount();

    window.dispatchEvent(new ErrorEvent("error", { message: "boom" }));

    expect(reportError).not.toHaveBeenCalled();
  });
});
