import type { LatLng, SaunaVisit, VisitFormState } from "../types";
import type { ImportResult, SessionState, VisitRepository } from "./types";
import { RepositoryError } from "./types";

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
      tags: form.tagsText.split(",").map((tag) => tag.trim()).filter(Boolean),
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
      console.error("Failed to fetch visits:", error);
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
    const session = await this.request<SessionState>("/api/v1/session");
    this.csrfToken = session.csrfToken;
    return session;
  }

  async logout(): Promise<void> {
    await this.request<void>("/api/v1/session", { method: "DELETE" });
    this.csrfToken = null;
  }

  async list(): Promise<SaunaVisit[]> {
    const result = await this.request<{ saunaVisits: SaunaVisit[] }>("/api/v1/sauna_visits");
    return result.saunaVisits;
  }

  async create(location: LatLng, form: VisitFormState): Promise<SaunaVisit> {
    const result = await this.request<{ saunaVisit: SaunaVisit }>("/api/v1/sauna_visits", {
      method: "POST",
      body: JSON.stringify(formPayload(location, form)),
    });
    return result.saunaVisit;
  }

  async update(visit: SaunaVisit, location: LatLng, form: VisitFormState): Promise<SaunaVisit> {
    // サーバーは lockVersion の無い更新を拒否する。送る前に弾いて、原因を利用者へ正しく伝える
    if (visit.lockVersion === undefined) {
      throw new RepositoryError(
        "記録の版情報がありません。再読み込みしてからもう一度お試しください。",
        "missing_lock_version",
      );
    }
    const result = await this.request<{ saunaVisit: SaunaVisit }>(`/api/v1/sauna_visits/${encodeURIComponent(visit.id)}`, {
      method: "PATCH",
      body: JSON.stringify(formPayload(location, form, visit.lockVersion)),
    });
    return result.saunaVisit;
  }

  async delete(id: string): Promise<void> {
    await this.request<void>(`/api/v1/sauna_visits/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  async deleteHistoryEntry(visit: SaunaVisit, index: number): Promise<SaunaVisit> {
    const historyId = visit.history?.[index]?.id;
    if (!historyId) throw new RepositoryError("削除対象の履歴IDがありません。", "missing_history_id");
    const result = await this.request<{ saunaVisit: SaunaVisit }>(
      `/api/v1/sauna_visits/${encodeURIComponent(visit.id)}/history_entries/${encodeURIComponent(historyId)}`,
      { method: "DELETE" },
    );
    return result.saunaVisit;
  }

  async importBatch(visits: SaunaVisit[]): Promise<ImportResult> {
    return this.request<ImportResult>("/api/v1/sauna_visits/imports", {
      method: "POST",
      body: JSON.stringify({ saunaVisits: visits }),
    });
  }
}
