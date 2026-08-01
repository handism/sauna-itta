import type { LatLng, SaunaVisit, VisitFormState } from "../types";
import { VISITS_STORAGE_KEY, getInitialVisits, writeStorage } from "../utils";
import {
  createNewVisit,
  getUpdatedVisits,
  getVisitsWithRemovedHistory,
} from "../hooks/useVisitCRUD";
import type { ImportResult, SessionState, VisitRepository } from "./types";

function persist(visits: SaunaVisit[]): void {
  if (!writeStorage(VISITS_STORAGE_KEY, JSON.stringify(visits))) {
    throw new Error("ブラウザへの保存に失敗しました。");
  }
}

export class LocalVisitRepository implements VisitRepository {
  readonly dataSource = "local" as const;

  async getSession(): Promise<SessionState> {
    return { authenticated: true, user: null, csrfToken: null };
  }

  async logout(): Promise<void> {}

  async list(): Promise<SaunaVisit[]> {
    return getInitialVisits();
  }

  async create(location: LatLng, form: VisitFormState): Promise<SaunaVisit> {
    const visit = createNewVisit(location, form);
    persist([visit, ...getInitialVisits()]);
    return visit;
  }

  async update(id: string, location: LatLng, form: VisitFormState): Promise<SaunaVisit> {
    const next = getUpdatedVisits(getInitialVisits(), id, location, form);
    const visit = next.find((item) => item.id === id);
    if (!visit) throw new Error("更新対象が見つかりません。");
    persist(next);
    return visit;
  }

  async delete(id: string): Promise<void> {
    persist(getInitialVisits().filter((visit) => visit.id !== id));
  }

  async deleteHistoryEntry(visit: SaunaVisit, index: number): Promise<SaunaVisit> {
    const next = getVisitsWithRemovedHistory(getInitialVisits(), visit.id, index);
    const updated = next.find((item) => item.id === visit.id);
    if (!updated) throw new Error("更新対象が見つかりません。");
    persist(next);
    return updated;
  }

  async importBatch(visits: SaunaVisit[]): Promise<ImportResult> {
    const current = getInitialVisits();
    const ids = new Set(current.map((visit) => visit.id));
    const additions = visits.filter((visit) => !ids.has(visit.id));
    if (additions.length > 0) persist([...additions, ...current]);
    return { added: additions.length, skipped: visits.length - additions.length };
  }
}
