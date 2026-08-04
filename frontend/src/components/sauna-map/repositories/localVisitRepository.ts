import type { LatLng, SaunaVisit, VisitFormState } from "../types";
import {
  VISITS_STORAGE_KEY,
  getInitialVisits,
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
   * getInitialVisits() を毎回呼ぶと JSON パース + Zod 検証が走るうえ、
   * 別タブが同時に書き込んだ値を読んで競合する（TOCTOU）リスクがある。
   */
  private cache: SaunaVisit[] | null = null;

  private getCache(): SaunaVisit[] {
    this.cache ??= getInitialVisits();
    return this.cache;
  }

  private persist(visits: SaunaVisit[]): void {
    if (!writeStorage(VISITS_STORAGE_KEY, JSON.stringify(visits))) {
      throw new Error("ブラウザへの保存に失敗しました。");
    }
    this.cache = visits;
  }

  async getSession(): Promise<SessionState> {
    return { authenticated: true, user: null, csrfToken: null };
  }

  async logout(): Promise<void> {}

  async list(): Promise<SaunaVisit[]> {
    this.cache = getInitialVisits();
    return this.cache;
  }

  async create(location: LatLng, form: VisitFormState): Promise<SaunaVisit> {
    const visit = createNewVisit(location, form);
    this.persist([visit, ...this.getCache()]);
    return visit;
  }

  async update(id: string, location: LatLng, form: VisitFormState): Promise<SaunaVisit> {
    const next = getUpdatedVisits(this.getCache(), id, location, form);
    const visit = next.find((item) => item.id === id);
    if (!visit) throw new Error("更新対象が見つかりません。");
    this.persist(next);
    return visit;
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
