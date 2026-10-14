import type { LatLng, SaunaVisit, VisitFormState } from "../types";
import {
  VISITS_STORAGE_KEY,
  loadSavedVisits,
  writeStorage,
  createNewVisit,
  getUpdatedVisits,
  getVisitsWithRemovedHistory,
  getVisitHistoryEntries,
  findHistoryEntryIndex,
} from "../utils";
import type { ImportResult, SessionState, VisitRepository } from "./types";
import { RepositoryError } from "./types";

/**
 * 更新後の配列から対象の記録を取り出す。見つからないのは、読み込み後に別タブで削除された
 * ときなど。apiモードの 404 と同じ code にして、呼び出し側がモードを意識せずに扱えるようにする。
 */
function findUpdated(visits: SaunaVisit[], id: string): SaunaVisit {
  const updated = visits.find((item) => item.id === id);
  if (!updated) throw new RepositoryError("更新対象が見つかりません。", "not_found");
  return updated;
}

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
      throw new RepositoryError("ブラウザへの保存に失敗しました。", "storage_failed");
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
    const updated = findUpdated(next, visit.id);
    this.persist(next);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.persist(this.load().filter((visit) => visit.id !== id));
  }

  /**
   * index は画面に表示中の記録（visit）の履歴の番号。保存値は別タブで変わっている場合があるため、
   * 番号のまま当てず、その履歴を保存値の中で探し直してから消す（apiモードは履歴IDで指定する）。
   */
  async deleteHistoryEntry(visit: SaunaVisit, index: number): Promise<SaunaVisit> {
    const target = getVisitHistoryEntries(visit)[index];
    if (!target) throw new RepositoryError("削除対象の履歴が見つかりません。", "not_found");

    const current = this.load();
    const stored = findUpdated(current, visit.id);
    const storedHistory = getVisitHistoryEntries(stored);
    const storedIndex = findHistoryEntryIndex(storedHistory, target);
    if (storedIndex < 0) {
      throw new RepositoryError(
        "削除しようとした履歴は別の画面で変更されています。再読み込みしてからもう一度お試しください。",
        "not_found",
      );
    }
    // apiモード（HistoryEntriesController の last_history）と同じく、最後の 1 件は消さずに失敗させる
    if (storedHistory.length <= 1) {
      throw new RepositoryError("最後の履歴は削除できません。", "last_history");
    }

    const next = getVisitsWithRemovedHistory(current, visit.id, storedIndex);
    const updated = findUpdated(next, visit.id);
    this.persist(next);
    return updated;
  }

  async importBatch(visits: SaunaVisit[]): Promise<ImportResult> {
    const current = this.load();
    // 同じ ID が 2 件来たら先の 1 件だけを取り込む（apiモードの ImportsController と同じ扱い）
    const ids = new Set(current.map((visit) => visit.id));
    const additions = visits.filter((visit) => {
      if (ids.has(visit.id)) return false;
      ids.add(visit.id);
      return true;
    });
    if (additions.length > 0) this.persist([...additions, ...current]);
    return { added: additions.length, skipped: visits.length - additions.length };
  }

  /** localモードの写真は保存時から data URL のため、そのまま書き出せる */
  async prepareExport(visits: SaunaVisit[]): Promise<SaunaVisit[]> {
    return visits;
  }

  /** 静的サイトで送り先のサーバーが無いため何もしない（console への出力は utils/errorReporter.ts が行う） */
  async reportClientError(): Promise<void> {}
}
