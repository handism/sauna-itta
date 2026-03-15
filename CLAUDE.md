# CLAUDE.md

このファイルは、リポジトリ内のコードを操作する際に Claude Code (claude.ai/code) へ提供するガイダンスです。

## プロジェクト概要

**sauna-itta**（サウナイッタ）は、個人のサウナ訪問記録アプリです。訪問済みサウナとウィッシュリストをインタラクティブな地図上で管理できます。バックエンドなしの完全クライアントサイド Next.js アプリで、GitHub Pages に静的サイトとしてデプロイされています。

## コマンド

```bash
npm run dev      # 開発サーバー起動 (http://localhost:3000)
npm run build    # ./out へ静的エクスポート
npm run lint     # ESLint 実行
```

テストフレームワークは導入されていません。

## アーキテクチャ

**スタック:** Next.js 16 (App Router) + TypeScript + React Leaflet + Recharts
**データ:** すべてのデータはブラウザの `localStorage` に保存されます。バックエンドや API ルートはありません。
**デプロイ:** `next build` で静的エクスポート (`output: "export"`) を生成し、GitHub Pages の `/sauna-itta` ベースパス配下に公開します。

### ページ構成
- `/` — 地図インターフェース＋サイドバー (`src/app/page.tsx`)
- `/stats` — グラフ・統計ダッシュボード (`src/app/stats/page.tsx`)

### 状態管理
状態はすべてカスタムフックで管理されています（Context や Redux は使用していません）。

| フック | 責務 |
|--------|------|
| `useSaunaVisits` | CRUD 操作 + `localStorage` への永続化 (`sauna-itta_visits`) |
| `useEditorState` | エディターモードのステートマシン (`useReducer`) — 追加・編集・待機モード |
| `useVisitFilters` | フィルタリングロジックと集計統計 (`useMemo`) |
| `useUIState` | モーダル・メニューの開閉状態 |

`SaunaMap.tsx` はすべてのフックを束ねるオーケストレーションコンポーネントで、画像圧縮・JSON インポート/エクスポート・トースト通知も担当します。

### データモデル

主な `localStorage` キー:
- `sauna-itta_visits` — `SaunaVisit[]` の JSON 配列
- `sauna-itta_theme` — `"dark"` | `"light"`

`SaunaVisit` 型 (`src/components/sauna-map/types.ts` 参照) には、同一サウナへの複数回訪問を記録する `history: VisitHistoryEntry[]` フィールドがあります。ID は `Date.now().toString()` で生成されます。初回ロード時に `src/data/sauna-visits.json` のシードデータが localStorage にマージされますが、既存の ID は重複追加されません。

### 重要な制約
- `next.config.ts` で `basePath: "/sauna-itta"` が設定されています。本番環境のアセットパスやリンクはすべてこれを考慮する必要があります。
- 画像は base64 エンコードして localStorage に保存されます。アップロード時に `browser-image-compression` でクライアントサイド圧縮が適用されます（最大 1MB / 1024px）。
- React Compiler が有効です (`next.config.ts` の `reactCompiler: true`)。コンパイラを壊すパターンは避けてください。
- 地図・フォーム中心の SPA のため、インタラクティブなコンポーネントにはすべて `"use client"` ディレクティブが必要です。
