export type DataSource = "local" | "api";

export function resolveDataSource(value: string | undefined): DataSource {
  if (value === undefined || value === "local") return "local";
  if (value === "api") return "api";

  throw new Error(
    `NEXT_PUBLIC_DATA_SOURCE must be "local" or "api" (received: ${JSON.stringify(value)})`,
  );
}

export const DATA_SOURCE = resolveDataSource(process.env.NEXT_PUBLIC_DATA_SOURCE);

/**
 * 公開パスの接頭辞。localはGitHub Pagesのプロジェクトページ（/sauna-itta）、
 * apiはRailsがルートで配信するため空文字。next.config の basePath とアイコン・
 * マニフェスト・Service Worker の登録先はすべてここを参照し、"/sauna-itta" を直書きしないこと
 * （public/sw.js だけはビルドを通らないため、登録時のスコープから求めている）。
 */
export function resolveBasePath(dataSource: DataSource): string {
  return dataSource === "local" ? "/sauna-itta" : "";
}

export const BASE_PATH = resolveBasePath(DATA_SOURCE);
