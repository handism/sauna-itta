import type { LatLng, SaunaVisit, VisitFormState } from "../types";

export type DataSource = "local" | "api";

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
  update(id: string, location: LatLng, form: VisitFormState): Promise<SaunaVisit>;
  delete(id: string): Promise<void>;
  deleteHistoryEntry(visit: SaunaVisit, index: number): Promise<SaunaVisit>;
  importBatch(visits: SaunaVisit[]): Promise<ImportResult>;
}
