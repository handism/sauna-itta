import type { LatLng, SaunaVisit, VisitFormState } from "../types";
// 配布形態の型は判定（resolveDataSource）と同じ場所を唯一の出所にする
import type { DataSource } from "../../../../dataSource";

export type { DataSource };

export interface SessionUser {
  email: string;
}

export interface SessionState {
  authenticated: boolean;
  user: SessionUser | null;
  csrfToken: string | null;
}

export interface ImportResult {
  added: number;
  skipped: number;
}

/** ブラウザで起きたエラーの報告（apiモードはサーバーのログへ送る） */
export interface ClientErrorReport {
  message: string;
  stack?: string;
  componentStack?: string;
  /** どこで捕まえたか（"error-boundary" / "window-error" / "unhandled-rejection"） */
  source: string;
  url?: string;
}

export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "RepositoryError";
  }
}

export interface VisitRepository {
  readonly dataSource: DataSource;
  getSession(): Promise<SessionState>;
  logout(): Promise<void>;
  list(): Promise<SaunaVisit[]>;
  create(location: LatLng, form: VisitFormState): Promise<SaunaVisit>;
  /**
   * @param visit 画面に表示中の記録。apiモードは `lockVersion` を楽観ロックの版として送るため、
   *   IDだけで呼べる形へ戻さないこと（Repository 側に版を覚えさせると、画面の状態と食い違う）
   */
  update(visit: SaunaVisit, location: LatLng, form: VisitFormState): Promise<SaunaVisit>;
  delete(id: string): Promise<void>;
  deleteHistoryEntry(visit: SaunaVisit, index: number): Promise<SaunaVisit>;
  importBatch(visits: SaunaVisit[]): Promise<ImportResult>;
  /**
   * JSONエクスポート用に、写真を記録だけで完結する data URL へ置き換えた記録を返す。
   * apiモードの写真は画像エンドポイントの URL のため、そのまま書き出すと取り込み直しても
   * 写真が復元されない。写真を1枚でも取得できなければ、欠けたバックアップを作らないよう失敗させる。
   */
  prepareExport(visits: SaunaVisit[]): Promise<SaunaVisit[]>;
  /**
   * ブラウザで起きたエラーを開発者へ届ける。localモードは送り先が無いため何もしない。
   * 報告の失敗で元の処理を妨げないよう、呼び出し側（utils/errorReporter.ts）が例外を握る。
   */
  reportClientError(report: ClientErrorReport): Promise<void>;
}
