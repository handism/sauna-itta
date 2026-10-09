import { z } from "zod";
import { RepositoryError } from "./types";

/** ヘッダーの受信だけでなく、本文の読み込み完了までの上限。 */
export const API_REQUEST_TIMEOUT_MS = 30_000;

const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string().optional(),
    message: z.string().optional(),
    details: z.unknown().optional(),
  }).optional(),
});

/** JSON・画像に共通の通信処理。中断に反応しない処理も待ち続けないようにする。 */
export async function requestWithTimeout<T>(
  path: string,
  init: RequestInit,
  readResponse: (response: Response, signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new RepositoryError(
        "サーバーの応答が時間内に完了しませんでした。変更が保存済みの場合もあるため、再読み込みして結果を確認してください。",
        "request_timeout",
      ));
      controller.abort();
    }, API_REQUEST_TIMEOUT_MS);
  });
  try {
    const request = async () => {
      const response = await fetch(path, { ...init, credentials: "same-origin", signal: controller.signal });
      controller.signal.throwIfAborted();
      return readResponse(response, controller.signal);
    };
    return await Promise.race([request(), timeout]);
  } catch (error) {
    if (error instanceof RepositoryError) throw error;
    console.error(`通信に失敗しました (${init.method ?? "GET"} ${path}):`, error);
    throw new RepositoryError("サーバーへ接続できません。通信状態を確認してください。", "network_error");
  } finally {
    clearTimeout(timer);
  }
}

export function requestJson(path: string, init: RequestInit): Promise<unknown> {
  return requestWithTimeout(path, init, async (response) => {
    if (!response.ok) {
      // HTMLや壊れたJSONのエラー応答でもHTTPステータスを維持する。
      const body: unknown = await response.json().catch((error: unknown) => {
        if (error instanceof SyntaxError) return undefined;
        throw error;
      });
      const parsed = ErrorEnvelopeSchema.safeParse(body);
      const error = parsed.success ? parsed.data.error : undefined;
      throw new RepositoryError(
        error?.message ?? "サーバー処理に失敗しました。",
        error?.code ?? "request_failed",
        response.status,
        error?.details,
      );
    }
    if (response.status === 204) return undefined;
    try {
      return await response.json();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw error;
      throw new RepositoryError("サーバーから想定外の形式のデータが返されました。", "invalid_response", response.status);
    }
  });
}
