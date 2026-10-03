import { z } from "zod";
import { SaunaVisitSchema, type LatLng, type SaunaVisit, type VisitFormState } from "../types";
import { blobToDataUrl, isApiImageUrl, toNormalizedTags } from "../utils";
import type { ClientErrorReport, ImportResult, SessionState, VisitRepository } from "./types";
import { RepositoryError } from "./types";

/*
 * サーバーの応答は型注釈だけで信用せず、localモードと同じ SaunaVisitSchema で検証する。
 * シリアライザの変更などで形がずれたときに、描画中の実行時エラーではなく
 * Repository のエラーとして利用者へ伝えるため。
 */
const VisitEnvelopeSchema = z.object({ saunaVisit: SaunaVisitSchema });
const VisitPageEnvelopeSchema = z.object({
  saunaVisits: z.array(SaunaVisitSchema),
  // 古い版のサーバー（limit を解釈せず全件を返す）では無い。そのときは1ページで終える
  nextCursor: z.string().nullish(),
});
const ImportResultSchema = z.object({ added: z.number().int(), skipped: z.number().int() });
const SessionStateSchema = z.object({
  authenticated: z.boolean(),
  user: z.object({ email: z.string() }).nullable(),
  csrfToken: z.string().nullable(),
});

function parseResponse<T>(schema: z.ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    console.error("Unexpected API response:", result.error);
    throw new RepositoryError("サーバーから想定外の形式のデータが返されました。", "invalid_response");
  }
  return result.data;
}

/** エクスポート時に写真を同時に取得する数。1枚最大1MBのため、多く並べても回線を詰まらせるだけ */
const EXPORT_IMAGE_CONCURRENCY = 4;

/**
 * 一覧を1回に取る件数。サーバーの MAX_PAGE_SIZE（SaunaVisitsController）以下にすること。
 * limit を付けずに呼ぶとサーバーは全件を1回で返すが、記録が増えると応答が大きくなりすぎる。
 */
export const LIST_PAGE_SIZE = 100;

/** サーバーが毎回同じカーソルを返すなどの異常で、読み込みが終わらなくなるのを防ぐ上限 */
const MAX_LIST_PAGES = 1000;

const EXPORT_IMAGE_FAILED_MESSAGE = "写真を取得できなかったため、エクスポートを中止しました。";

interface ErrorEnvelope {
  error?: { code?: string; message?: string; details?: unknown };
}

function formPayload(location: LatLng, form: VisitFormState, lockVersion?: number) {
  return {
    saunaVisit: {
      name: form.name,
      lat: location.lat,
      lng: location.lng,
      area: form.area,
      status: form.status,
      tags: toNormalizedTags(form.tagsText),
      date: form.date,
      comment: form.comment,
      rating: form.rating,
      image: form.image || null,
      appendHistory: form.appendHistory,
      lockVersion,
    },
  };
}

export class ApiVisitRepository implements VisitRepository {
  readonly dataSource = "api" as const;
  private csrfToken: string | null = null;
  /** エラー報告の送信可否。サーバーはログイン中の報告だけを受け付ける */
  private authenticated = false;

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const method = init.method ?? "GET";
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body) headers.set("Content-Type", "application/json");
    if (!/^(GET|HEAD|OPTIONS)$/i.test(method) && this.csrfToken) {
      headers.set("X-CSRF-Token", this.csrfToken);
    }

    let response: Response;
    try {
      response = await fetch(path, { ...init, headers, credentials: "same-origin" });
    } catch (error) {
      console.error(`Failed to request ${method} ${path}:`, error);
      throw new RepositoryError("サーバーへ接続できません。通信状態を確認してください。", "network_error");
    }

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as ErrorEnvelope;
      const error = body.error;
      throw new RepositoryError(
        error?.message ?? "サーバー処理に失敗しました。",
        error?.code ?? "request_failed",
        response.status,
        error?.details,
      );
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  async getSession(): Promise<SessionState> {
    const body = await this.request<unknown>("/api/v1/session");
    const session: SessionState = parseResponse(SessionStateSchema, body);
    this.csrfToken = session.csrfToken;
    this.authenticated = session.authenticated;
    return session;
  }

  async logout(): Promise<void> {
    await this.request<void>("/api/v1/session", { method: "DELETE" });
    this.csrfToken = null;
    this.authenticated = false;
  }

  /**
   * 全ページを順に取得して1つの配列にする。ページは主キー順のため、取得の合間に
   * 更新された記録も取りこぼさない（並びは画面側で並べ替える）。
   */
  async list(): Promise<SaunaVisit[]> {
    const visits: SaunaVisit[] = [];
    const seen = new Set<string>();
    let cursor: string | null = null;
    for (let page = 0; page < MAX_LIST_PAGES; page += 1) {
      const params = new URLSearchParams({ limit: String(LIST_PAGE_SIZE) });
      if (cursor) params.set("cursor", cursor);
      const body = await this.request<unknown>(`/api/v1/sauna_visits?${params.toString()}`);
      const result = parseResponse(VisitPageEnvelopeSchema, body);
      for (const visit of result.saunaVisits) {
        if (seen.has(visit.id)) continue;
        seen.add(visit.id);
        visits.push(visit);
      }
      cursor = result.nextCursor ?? null;
      if (!cursor) return visits;
    }
    throw new RepositoryError("記録の読み込みが終わりませんでした。", "invalid_response");
  }

  async create(location: LatLng, form: VisitFormState): Promise<SaunaVisit> {
    const body = await this.request<unknown>("/api/v1/sauna_visits", {
      method: "POST",
      body: JSON.stringify(formPayload(location, form)),
    });
    return parseResponse(VisitEnvelopeSchema, body).saunaVisit;
  }

  async update(visit: SaunaVisit, location: LatLng, form: VisitFormState): Promise<SaunaVisit> {
    // サーバーは lockVersion の無い更新を拒否する。送る前に弾いて、原因を利用者へ正しく伝える
    if (visit.lockVersion === undefined) {
      throw new RepositoryError(
        "記録の版情報がありません。再読み込みしてからもう一度お試しください。",
        "missing_lock_version",
      );
    }
    const body = await this.request<unknown>(`/api/v1/sauna_visits/${encodeURIComponent(visit.id)}`, {
      method: "PATCH",
      body: JSON.stringify(formPayload(location, form, visit.lockVersion)),
    });
    return parseResponse(VisitEnvelopeSchema, body).saunaVisit;
  }

  async delete(id: string): Promise<void> {
    await this.request<void>(`/api/v1/sauna_visits/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async deleteHistoryEntry(visit: SaunaVisit, index: number): Promise<SaunaVisit> {
    const historyId = visit.history?.[index]?.id;
    if (!historyId) throw new RepositoryError("削除対象の履歴IDがありません。", "missing_history_id");
    const body = await this.request<unknown>(
      `/api/v1/sauna_visits/${encodeURIComponent(visit.id)}/history_entries/${encodeURIComponent(historyId)}`,
      { method: "DELETE" },
    );
    return parseResponse(VisitEnvelopeSchema, body).saunaVisit;
  }

  async importBatch(visits: SaunaVisit[]): Promise<ImportResult> {
    const body = await this.request<unknown>("/api/v1/sauna_visits/imports", {
      method: "POST",
      body: JSON.stringify({ saunaVisits: visits }),
    });
    return parseResponse(ImportResultSchema, body);
  }

  async prepareExport(visits: SaunaVisit[]): Promise<SaunaVisit[]> {
    // 記録本体の image は最新履歴の写しのため、同じ URL を二度取得しないよう集合にまとめる
    const pending = new Set<string>();
    for (const visit of visits) {
      if (isApiImageUrl(visit.image)) pending.add(visit.image);
      for (const entry of visit.history ?? []) {
        if (isApiImageUrl(entry.image)) pending.add(entry.image);
      }
    }

    const queue = [...pending];
    const dataUrls = new Map<string, string>();
    const worker = async () => {
      for (let url = queue.shift(); url !== undefined; url = queue.shift()) {
        dataUrls.set(url, await this.fetchImageAsDataUrl(url));
      }
    };
    await Promise.all(Array.from({ length: Math.min(EXPORT_IMAGE_CONCURRENCY, queue.length) }, worker));

    const inline = (image: string | undefined) => (image !== undefined && dataUrls.get(image)) || image;
    return visits.map((visit) => ({
      ...visit,
      image: inline(visit.image),
      ...(visit.history && {
        history: visit.history.map((entry) => ({ ...entry, image: inline(entry.image) })),
      }),
    }));
  }

  async reportClientError(report: ClientErrorReport): Promise<void> {
    // ログイン前はサーバーが受け付けない（401）ため送らない
    if (!this.authenticated) return;
    await this.request<void>("/api/v1/client_errors", {
      method: "POST",
      body: JSON.stringify({ clientError: report }),
    });
  }

  private async fetchImageAsDataUrl(url: string): Promise<string> {
    let response: Response;
    try {
      response = await fetch(url, { credentials: "same-origin" });
    } catch (error) {
      console.error(`Failed to request GET ${url}:`, error);
      throw new RepositoryError("サーバーへ接続できません。通信状態を確認してください。", "network_error");
    }
    // セッションの喪失は写真の取得失敗と区別する（errorMessages.ts の isSessionLostError で判定し、useVisitSession がログイン画面へ戻す）
    if (response.status === 401) {
      throw new RepositoryError("ログインが必要です。", "unauthenticated", response.status);
    }
    if (!response.ok) {
      throw new RepositoryError(EXPORT_IMAGE_FAILED_MESSAGE, "export_image_failed", response.status);
    }
    try {
      return await blobToDataUrl(await response.blob());
    } catch (error) {
      console.error(`Failed to read image ${url}:`, error);
      throw new RepositoryError(EXPORT_IMAGE_FAILED_MESSAGE, "export_image_failed");
    }
  }
}
