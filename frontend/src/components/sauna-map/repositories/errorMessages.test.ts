import { describe, expect, it } from "vitest";
import { RepositoryError } from "./types";
import { isSessionLostError, toUserMessage } from "./errorMessages";

describe("toUserMessage", () => {
  it("409 は楽観ロックの競合として再読み込みを案内すること", () => {
    expect(toUserMessage(new RepositoryError("conflict", "conflict", 409), "fallback")).toContain("再読み込み");
  });

  it("409 でも一意制約の重複はサーバーの文言をそのまま出すこと", () => {
    const message = "同時に行われた別の操作と重複したため保存できませんでした。";
    expect(toUserMessage(new RepositoryError(message, "duplicate", 409), "fallback")).toBe(message);
  });

  it("セッションの喪失はログインし直すか再試行するかを案内すること", () => {
    expect(toUserMessage(new RepositoryError("ログインが必要です。", "unauthenticated", 401), "fallback")).toContain(
      "もう一度ログイン",
    );
    expect(toUserMessage(new RepositoryError("CSRFトークンが不正です。", "invalid_csrf", 422), "fallback")).toContain(
      "もう一度お試しください",
    );
  });

  it("Error 以外は既定の文言にすること", () => {
    expect(toUserMessage("unknown", "fallback")).toBe("fallback");
  });
});

describe("isSessionLostError", () => {
  it("401 の unauthenticated と、変更系で返る invalid_csrf の両方をセッションの喪失とみなすこと", () => {
    expect(isSessionLostError(new RepositoryError("", "unauthenticated", 401))).toBe(true);
    expect(isSessionLostError(new RepositoryError("", "invalid_csrf", 422))).toBe(true);
    expect(isSessionLostError(new RepositoryError("", "conflict", 409))).toBe(false);
    expect(isSessionLostError(new Error("unauthenticated"))).toBe(false);
  });
});
