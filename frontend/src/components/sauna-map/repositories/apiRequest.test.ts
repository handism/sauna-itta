import { afterEach, describe, expect, it, vi } from "vitest";
import { API_REQUEST_TIMEOUT_MS, requestJson, requestWithTimeout } from "./apiRequest";
import { RepositoryError } from "./types";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("API通信", () => {
  it("成功時はタイマーを解除し、期限を過ぎてもリクエストを中断しない", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('{"ok":true}'));
    await expect(requestJson("/api/test", {})).resolves.toEqual({ ok: true });
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(API_REQUEST_TIMEOUT_MS);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(false);
    expect(fetchMock.mock.calls[0][1]?.credentials).toBe("same-origin");
  });

  it.each(["ヘッダー", "JSON本文", "画像本文"])("%sの受信が止まってもタイムアウトして中断する", async (stage) => {
    vi.useFakeTimers();
    const pending = deferred<Response>();
    const body = deferred<unknown>();
    const response = new Response('{}');
    vi.spyOn(response, "json").mockReturnValue(body.promise);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockReturnValue(stage === "ヘッダー" ? pending.promise : Promise.resolve(response));
    const request = stage === "画像本文"
      ? requestWithTimeout("/api/test", {}, () => body.promise)
      : requestJson("/api/test", {});
    const failure = expect(request).rejects.toMatchObject({ code: "request_timeout" });
    await vi.advanceTimersByTimeAsync(API_REQUEST_TIMEOUT_MS - 1);
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await failure;
    expect(fetchMock.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
    // 中断に反応しない処理が後から完了しても、タイムアウトを成功へ変えない。
    pending.resolve(response);
    body.resolve({ ok: true });
    await expect(request).rejects.toBeInstanceOf(RepositoryError);
  });

  it("タイムアウト後にヘッダーが届いても本文処理を開始しない", async () => {
    vi.useFakeTimers();
    const pending = deferred<Response>();
    vi.spyOn(globalThis, "fetch").mockReturnValue(pending.promise);
    const readResponse = vi.fn().mockResolvedValue({ ok: true });
    const failure = expect(requestWithTimeout("/api/test", {}, readResponse)).rejects.toMatchObject({ code: "request_timeout" });
    await vi.advanceTimersByTimeAsync(API_REQUEST_TIMEOUT_MS);
    await failure;
    pending.resolve(new Response('{}'));
    await pending.promise;
    expect(readResponse).not.toHaveBeenCalled();
  });

  it("成功ステータスでも壊れたJSONならinvalid_responseにする", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response('<html>障害</html>', { status: 200 }));
    await expect(requestJson("/api/test", {})).rejects.toMatchObject({ code: "invalid_response", status: 200 });
  });

  it.each(["<html>障害</html>", "null", '{"error":"不正な形式"}'])("不正なエラー応答でもHTTPステータスを維持する（%s）", async (body) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(body, { status: 503 }));
    await expect(requestJson("/api/test", {})).rejects.toMatchObject({ code: "request_failed", status: 503 });
  });

  it.each([200, 503])("本文の通信が失敗したらnetwork_errorにする（ステータス%s）", async (status) => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const response = new Response('{}', { status });
    vi.spyOn(response, "json").mockRejectedValue(new TypeError("本文の受信失敗"));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
    await expect(requestJson("/api/test", {})).rejects.toMatchObject({ code: "network_error" });
  });

  it("HTTPエラーのJSON本文が止まった場合もタイムアウトする", async () => {
    vi.useFakeTimers();
    const response = new Response('{}', { status: 503 });
    vi.spyOn(response, "json").mockReturnValue(new Promise(() => {}));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response);
    const failure = expect(requestJson("/api/test", {})).rejects.toMatchObject({ code: "request_timeout" });
    await vi.advanceTimersByTimeAsync(API_REQUEST_TIMEOUT_MS);
    await failure;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("失敗時にもタイマーを解除する", async () => {
    vi.useFakeTimers();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("通信失敗"));
    await expect(requestJson("/api/test", {})).rejects.toMatchObject({ code: "network_error" });
    expect(vi.getTimerCount()).toBe(0);
  });
});
