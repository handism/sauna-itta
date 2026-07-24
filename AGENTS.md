# AGENTS.md

このファイルは、AI エージェント（Antigravity, Claude Code, Cursor 等）が本プロジェクト「sauna-itta」を理解し、一貫した品質とポリシーで開発を行うための指示書および開発ガイダンスです。

---

## 🚨 基本ルール (MANDATORY RULES)

- **言語**: 全てのやりとり、提案、ドキュメント、コードコメント、Implementation Plan、Walkthrough、コミットメッセージは**必ず日本語**で出力してください。
- **検証の徹底**: コードや設定を変更した場合は、必ず `npm run test` および `npm run lint` / `npm run build` を実行してパスしたことを確認してください。
- **ドキュメントの維持・最新化**: 新機能の追加、仕様変更、アーキテクチャの更新、開発スクリプトの変更等を行った場合は、必ず `AGENTS.md`（および連動する `CLAUDE.md`）と `README.md` を同時に更新し、常にプロジェクトドキュメントを最新の状態に維持してください。

---

## 📌 プロジェクト概要

「サウナイッタ (sauna-itta)」は、サウナ訪問記録や行きたいサウナを Leaflet マップ上に記録・視覚化するクライアントサイド専用 Next.js アプリです。すべてのデータはブラウザの `localStorage` に保存され、GitHub Pages に静的エクスポートされて運用されています。

- **リポジトリ**: `sauna-itta`
- **主要スタック**: Next.js 16 (App Router) / React 19 / TypeScript / Vitest / React Leaflet / Recharts / Zod
- **静的出力設定**: `output: "export"`, `basePath: "/sauna-itta"`

---

## 🛠 開発コマンド一覧

```bash
npm run dev      # 開発サーバー起動 (http://localhost:3000)
npm run build    # 静的エクスポートビルド (./out)
npm run lint     # ESLint によるコード検証
npm run test     # Vitest による全テスト実行 (100+ テストケース)
```

---

## 📐 アーキテクチャ ＆ コーディング規範

### 1. 状態管理構造 (`SaunaMapContext`)
状態管理は巨大な単一ステートを避け、以下の 4 つの専門 Provider にモジュール分割されています。コンポーネントやロジックを追加する際は適切な Context / Hook を利用・拡充してください。

- **`VisitsDataContext`** (`useVisitsData`): `SaunaVisit[]` の CRUD 操作、`localStorage` 永続化
- **`EditorContext`** (`useEditorState`): 登録/編集フォームのモード・入力状態 (`useReducer`)
- **`UIContext`** (`useUIState`): モーダル開閉、テーマ (`dark`/`light`)、トースト通知、削除確認
- **`MapStateContext`** (`useMapState`): マップの座標・ズーム度、フィルター（検索、タグ、ステータス、満足度）

### 2. ディレクトリ ＆ コンポーネント構造
- **コンポーネント分離**: View (プレゼンテーション) と Controller (ロジック・フック) を適切に分離してください。
- **レスポンシブ設計**: PC表示 (`DesktopSidebar.tsx`) と モバイル表示 (`BottomSheet.tsx`, `MobileNavBar.tsx`) の責務を明確に分けること。
- **型定義**: `src/components/sauna-map/types/` 内の `domain.ts` (ドメインモデル) と `ui.ts` (UI・フィルター型) に集約し、`any` 型や不必要なキャストを排除すること。
- **ユーティリティ**: 純粋関数ロジックは `src/components/sauna-map/utils/` (`geo.ts`, `form.ts`, `image.ts`, `visitHistory.ts` 等) に抽出し、単体テストを記述すること。

### 3. CSS ＆ スタイリング
- スタイルは `src/components/sauna-map/styles/` 配下のコンポーネント別 CSS ファイルに分割・管理されています。
- Z-Index や共通カラー変数等のレイアウト値は `styles/base.css` 内の CSS デザイントークンを必ず参照・利用してください。

### 4. テストとリファクタリング
- テストフレームワークには **Vitest + React Testing Library + jsdom** を使用しています。
- 新機能の追加、ロジック・フック・ユーティリティの修正を行った場合は、必ず対応する `*.test.ts` / `*.test.tsx` を作成または追記し、リグレッションを防止してください。

---

## ⚠️ 重要な制約・注意事項

1. **静的サイト制約**:
   - バックエンド API や サーバーサイド DB への依存を追加しないでください。
   - アセットパスや内部リンク生成時、GitHub Pages 用の `basePath` ( `/sauna-itta` ) を壊さないよう留意してください。
2. **パフォーマンス・画像圧縮**:
   - ユーザーがアップロードした画像は `browser-image-compression` で圧縮し、Base64 として `localStorage` に保持します（最大 1MB / 1024px）。
3. **React Compiler**:
   - `next.config.ts` で React Compiler が有効化されています。不要な再レンダリングや依存配列・再計算のバグを生む非純粋な関数定義・レンダリング内副作用を避けてください。
