import type { LatLng, SaunaVisit, VisitFormState } from "../types";
import {
  VISITS_STORAGE_KEY,
  loadSavedVisits,
  writeStorage,
  createNewVisit,
  getUpdatedVisits,
  getVisitsWithRemovedHistory,
} from "../utils";
import type { ImportResult, SessionState, VisitRepository } from "./types";

export class LocalVisitRepository implements VisitRepository {
  readonly dataSource = "local" as const;

  /**
   * 保存されていたが検証に通らなかった要素。画面には出さないが、persist のたびに
   * 末尾へ書き戻す（捨てて保存すると、読めなかった記録が復元できなくなるため）。
   */
  private unreadable: unknown[] = [];

  /**
   * 保存値を毎回読み直す。読み込み結果をキャッシュして保存の土台にすると、
   * 別タブがその後に書き込んだ記録を古い配列で上書きして消してしまう。
   * 更新系は必ずこれで最新の保存値を読んでから変更を当てること。
   */
  private load(): SaunaVisit[] {
    const { visits, unreadable } = loadSavedVisits();
    this.unreadable = unreadable;
    return visits;
  }

  private persist(visits: SaunaVisit[]): void {
    if (!writeStorage(VISITS_STORAGE_KEY, JSON.stringify([...visits, ...this.unreadable]))) {
      throw new Error("ブラウザへの保存に失敗しました。");
    }
  }

  async getSession(): Promise<SessionState> {
    return { authenticated: true, user: null, csrfToken: null };
  }

  async logout(): Promise<void> {}

  async list(): Promise<SaunaVisit[]> {
    return this.load();
  }

  async create(location: LatLng, form: VisitFormState): Promise<SaunaVisit> {
    const visit = createNewVisit(location, form);
    this.persist([visit, ...this.load()]);
    return visit;
  }

  async update(visit: SaunaVisit, location: LatLng, form: VisitFormState): Promise<SaunaVisit> {
    const next = getUpdatedVisits(this.load(), visit.id, location, form);
    const updated = next.find((item) => item.id === visit.id);
    if (!updated) throw new Error("更新対象が見つかりません。");
    this.persist(next);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.persist(this.load().filter((visit) => visit.id !== id));
  }

  async deleteHistoryEntry(visit: SaunaVisit, index: number): Promise<SaunaVisit> {
    const next = getVisitsWithRemovedHistory(this.load(), visit.id, index);
    const updated = next.find((item) => item.id === visit.id);
    if (!updated) throw new Error("更新対象が見つかりません。");
    this.persist(next);
    return updated;
  }

  async importBatch(visits: SaunaVisit[]): Promise<ImportResult> {
    const current = this.load();
    const ids = new Set(current.map((visit) => visit.id));
    const additions = visits.filter((visit) => !ids.has(visit.id));
    if (additions.length > 0) this.persist([...additions, ...current]);
    return { added: additions.length, skipped: visits.length - additions.length };
  }
}
