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
   * list() で初期化し、以降の CRUD でも同じ配列を参照するキャッシュ。
   * loadSavedVisits() を毎回呼ぶと JSON パース + Zod 検証が走るうえ、
   * 別タブが同時に書き込んだ値を読んで競合する（TOCTOU）リスクがある。
   */
  private cache: SaunaVisit[] | null = null;

  /**
   * 保存されていたが検証に通らなかった要素。画面には出さないが、persist のたびに
   * 末尾へ書き戻す（捨てて保存すると、読めなかった記録が復元できなくなるため）。
   */
  private unreadable: unknown[] = [];

  private load(): SaunaVisit[] {
    const { visits, unreadable } = loadSavedVisits();
    this.cache = visits;
    this.unreadable = unreadable;
    return visits;
  }

  private getCache(): SaunaVisit[] {
    return this.cache ?? this.load();
  }

  private persist(visits: SaunaVisit[]): void {
    if (!writeStorage(VISITS_STORAGE_KEY, JSON.stringify([...visits, ...this.unreadable]))) {
      throw new Error("ブラウザへの保存に失敗しました。");
    }
    this.cache = visits;
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
    this.persist([visit, ...this.getCache()]);
    return visit;
  }

  async update(visit: SaunaVisit, location: LatLng, form: VisitFormState): Promise<SaunaVisit> {
    const next = getUpdatedVisits(this.getCache(), visit.id, location, form);
    const updated = next.find((item) => item.id === visit.id);
    if (!updated) throw new Error("更新対象が見つかりません。");
    this.persist(next);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.persist(this.getCache().filter((visit) => visit.id !== id));
  }

  async deleteHistoryEntry(visit: SaunaVisit, index: number): Promise<SaunaVisit> {
    const next = getVisitsWithRemovedHistory(this.getCache(), visit.id, index);
    const updated = next.find((item) => item.id === visit.id);
    if (!updated) throw new Error("更新対象が見つかりません。");
    this.persist(next);
    return updated;
  }

  async importBatch(visits: SaunaVisit[]): Promise<ImportResult> {
    const current = this.getCache();
    const ids = new Set(current.map((visit) => visit.id));
    const additions = visits.filter((visit) => !ids.has(visit.id));
    if (additions.length > 0) this.persist([...additions, ...current]);
    return { added: additions.length, skipped: visits.length - additions.length };
  }
}
