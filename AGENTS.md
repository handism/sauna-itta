# AGENTS.md

このファイルは、AI エージェント（Antigravity, Claude Code, Cursor 等）が本プロジェクト「sauna-itta」を理解し、一貫した品質とポリシーで開発を行うための指示書および開発ガイダンスです。

---

## 🚨 基本ルール (MANDATORY RULES)

- **言語**: 全てのやりとり、提案、ドキュメント、コードコメント、Implementation Plan、Walkthrough、コミットメッセージは**必ず日本語**で出力してください。
- **検証の徹底**: コードや設定を変更した場合は、必ず `npm run test` および `npm run lint` / `npm run typecheck` / `npm run build` を実行してパスしたことを確認してください。特に `npm run typecheck` は省略しないこと（Vitest は型検査をせず、`next build` もページから到達しない `*.test.*` を検査しないため、テストファイルの型崩れはこのコマンドでしか検出できません）。
- **ドキュメントの維持・最新化**: 新機能の追加、仕様変更、アーキテクチャの更新、開発スクリプトの変更等を行った場合は、必ず `AGENTS.md`（および連動する `CLAUDE.md`）と `README.md` を同時に更新し、常にプロジェクトドキュメントを最新の状態に維持してください。

---

## 📌 プロジェクト概要

「サウナイッタ (sauna-itta)」は、サウナ訪問記録や行きたいサウナを Leaflet マップ上に記録・視覚化するクライアントサイド専用 Next.js アプリです。すべてのデータはブラウザの `localStorage` に保存され、GitHub Pages に静的エクスポートされて運用されています。

---

## 📐 アーキテクチャ ＆ コーディング規範

### 1. 状態管理構造 (`SaunaMapContext`)
状態管理は巨大な単一ステートを避け、責務ごとの専門 Provider にモジュール分割されています（`src/components/sauna-map/context/` 参照）。コンポーネントやロジックを追加する際は適切な Context / Hook を利用・拡充してください。

- **専用フックを直接使うこと**: 消費側は `useSaunaUI` / `useVisitsCRUD` / `useVisitFiltersContext` / `useSaunaEditor` / `useSaunaMapState` のうち、実際に必要なものだけを個別に呼びます。複数の Context を 1 オブジェクトに束ねるフック（旧 `useSaunaMap` / 旧 `useSaunaVisitsData`）は、どれか 1 つの状態変化で全消費側が再レンダリングされるため復活させないでください。
- **Provider は `SaunaMapContext.tsx` に一本化**: `SaunaMapProvider` が `UIProvider` → `VisitsCRUDProvider` → `VisitFiltersProvider` → `EditorProvider` → `MapStateProvider` を直接入れ子にします。複数 Provider をまとめるだけの中間ファイルは作らないでください（旧 `VisitsDataContext.tsx` は削除済み）。
- **訪問データとフィルターの分離**: 訪問データ本体・インポート/エクスポートは `useVisitsCRUD`、絞り込み結果・フィルター状態・統計は `useVisitFiltersContext` から取得します。CRUD しか使わない画面（`DesktopSidebar` など）がフィルターを購読すると、検索欄の 1 文字入力ごとに再レンダリングされます。
- **入力中のフォーム値は `useSaunaEditorForm` から**: 編集フォームの `form` / `setForm` / `imageUploading` は専用の `EditorFormContext` に分離しています（`useSaunaEditor` には含まれません）。これを EditorState 側へ戻すと、1 文字入力するたびに `SaunaMapContent` / `DesktopSidebar` / `VisitList` まで再レンダリング対象になります。同じ理由で、`useVisitForm` の `handleSubmit` は依存配列に `form` を入れず `formRef` から最新値を読み、`useEditorState` が返す操作関数は必ず `useCallback` で参照を安定させること（`SaunaMapContext.test.tsx` の「フォーム入力で EditorState / EditorActions の参照が変わらないこと」が検査しています）。
- **タグ絞り込みの初期値は URL から**: 統計ページのタグクラウドは `/?tag=...` で地図へ遷移し、`useVisitFilters` の `getInitialFilters()` がこれを `selectedTag` の初期値として読みます。地図は `ssr: false` で描画されるため初期値算出で `window` を参照して構いません。
- **モバイルのシート位置制御は Context 側に集約**: 編集の開始／終了に伴う `snapPosition` の切り替えは `MapStateContext` の `handleEditVisit` / `handleCancelEditing` が担います。画面コンポーネント側で `startEditing` + `setSnapPosition` を組み合わせて再実装しないでください。

### 2. ディレクトリ ＆ コンポーネント構造
- **コンポーネント分離**: View (プレゼンテーション) と Controller (ロジック・フック) を適切に分離してください。
- **レスポンシブ設計**: PC表示 (`DesktopSidebar.tsx`) と モバイル表示 (`BottomSheet.tsx`, `MobileNavBar.tsx`) の責務を明確に分けること。
- **型定義**: `src/components/sauna-map/types/` 内の `domain.ts` (ドメインモデル) と `ui.ts` (UI・フィルター型) に集約し、`any` 型や不必要なキャストを排除すること。
- **ユーティリティ**: 純粋関数ロジックは `src/components/sauna-map/utils/` に抽出し、単体テストを記述すること。
- **訪問回数の算出**: 訪問回数は必ず `utils/visitHistory.ts` の `getVisitCount()` を使うこと（`history.length` と `visitCount` の両方を考慮します）。地図側と統計ページで別々に導出すると、旧形式データで表示が食い違います。訪問回数による順位付けは `rankVisitsByCount()` に集約しています（同数のときの並びまで揃わないと、「MY HOME SAUNA」と「よく行く施設 TOP 5」で 1 位が食い違います）。
- **訪問リストの行コンポーネント**: `VisitCompactItem` / `VisitCardItem` は表示密度が違うだけなので、props 型と `memo` の比較関数は `components/visitItem.ts` の `VisitItemProps` / `areVisitItemPropsEqual` を共有します。片方にだけ props を足すと比較関数の更新漏れで表示が古いまま残るため、個別に再定義しないこと。
- **テーマフックは 1 本**: 地図側・統計ページとも `hooks/useTheme.ts` を使います。統計ページのように静的プリレンダリングされる画面は `useTheme({ deferred: true })` で開始し、他のクライアント専用初期化と同じタイミングで `syncFromStorage()` を呼ぶこと（マウント直後に既定値でクラスを適用すると、`layout.tsx` のインラインスクリプトが付けた `light-theme` を剥がしてちらつきます）。
- **タグ集計**: タグの出現回数は `utils/visitHistory.ts` の `countTags()` に集約しています（`getPopularTags()` はその薄いラッパー）。コンポーネント内で `visit.tags` を数え直さないこと。
- **写真プレビュー**: 写真の拡大は必ず `components/common.tsx` の `VisitImagePreview` 経由にすること（素の `img` に `onClick` を付けるとキーボードから開けません）。同コンポーネントは sanitize 済みの `src` を受け取るため、`sanitizeImageUrl()` の呼び出しは各コンポーネントで 1 レンダーにつき 1 回だけにします。
- **グラフ**: Recharts の配色・ツールチップは `components/charts/chartTheme.ts` の `getChartColors()` / `getTooltipStyle()` を、空データ表示は `ChartEmptyState` を使うこと。チャート側でテーマ別の色分岐を直書きしないでください。
- **統計ページの履歴平坦化は 1 回だけ**: 訪問履歴の平坦化（`flattenVisitHistory()`）と `status === "visited"` の絞り込みは `useStatsData` の `visitedEntries` に集約しています。グラフやカレンダーは `visits` ではなく `FlatVisitHistoryEntry[]` を props で受け取ること。コンポーネントごとに `flattenVisitHistory(visits)` を呼ぶと、同じ走査を記録件数 × グラフ数だけ繰り返します。

### 3. CSS ＆ スタイリング
- Z-Index や共通カラー変数等のレイアウト値は `styles/base.css` 内の CSS デザイントークンを必ず参照・利用してください。
- **未定義トークンの禁止**: `var(--foo)` を書く際は `base.css` に定義があるか必ず確認すること（未定義変数は無言で無効化され、背景が透明になる等の不具合になります）。`var(--foo, #hex)` のようなフォールバックは書かないこと（未定義を隠すうえ、ダーク固定色がライトテーマに漏れます）。
- **重ね色は必ずトークン経由**: 面の上に薄く重ねる色（カード背景・ホバー等）に `rgba(255, 255, 255, ...)` を直書きすると、ライトテーマで白地に白が乗って消えます。`--overlay-subtle` / `--overlay-hover` を使うこと。同様に、`--glass-hover` はライトテーマでほぼ白になるため、その上に `color: #fff` を固定しないこと。
- **エラー色**: 面には `--error`、文字色には `--error-text` を使うこと（`--error` をそのまま小さな文字に使うとライトテーマでコントラスト比 4.5:1 を下回ります）。
- **色トークンは `:root` と `.light-theme` の両方に定義すること**: 片方だけに定義すると、ダーク前提の濃い色がライトテーマへそのまま漏れます（`--secondary` の濃紺がライトのサイドバーに乗る、`--star-color` が白地で 1.8:1 になる等）。意図的に共有する場合は `styles/tokens.test.ts` の `SHARED_ON_PURPOSE` に理由付きで追記します。グラデーションの 2 色目のようなペアの色も直書きせずトークン化すること（`--accent-water-deep` / `--accent-wishlist-deep`）。
- **影は `--shadow-*` トークンを使うこと**: `box-shadow` に `rgba(0, 0, 0, ...)` を直書きすると、ライトテーマで明るい背景に濃い黒の影が落ちます。面の浮き上がりは `--shadow-sm` → `--shadow-md` → `--shadow-lg` → `--shadow-xl`、画面下端からせり上がる面（ボトムシート等）は `--shadow-up` を使います。**地図上のマーカー・クラスタだけは `--shadow-marker-sm` / `--shadow-marker` / `--shadow-marker-lifted`** を使うこと（これらは両テーマ共通です。ライトで弱めると地図タイルに溶けて位置が読めなくなります）。`--primary-glow` などの発光は影トークンの後ろに並べて追加します。
- **クラス名の綴り**: CSS のクラス名がコンポーネント側に存在するかも `styles/tokens.test.ts` が検査します（`mobile-nav-icon-add` と `mobile-nav-icon--add` のような綴り違いは誰もエラーにしてくれず、スタイルが当たらないまま放置されるため）。テンプレートリテラルで修飾子を組み立てる場合は、同テストの `IGNORED_PREFIXES` に追記してください。
- **要素セレクタで文字色を一括指定しないこと**: 既定の文字色は `html`/`body` の `color` から継承させます。`span` / `div` にまで色を固定すると、色付きの面の中の子要素が親の色を継承できなくなり、「button の中身は span で構成する」方針と衝突します（`base.css` 末尾のコメント参照）。
- **トグルの活性クラス**は `is-active` に統一しています（`--active` 系の BEM 修飾子を新規に増やさないこと）。地図上のコントロールは `MapControlButton` の `active` prop に任せると `is-active` と `aria-pressed` が同時に付きます。
- 上記の CSS 規約は `styles/tokens.test.ts` が静的検査しています。意図的な例外を追加する場合は、同テストの許可リストに理由付きで追記してください。
- **タッチターゲット**: 操作要素は最低 24px、モバイル（`max-width: 768px`）では 44px 以上を確保してください。44px 保証は各 CSS ファイル末尾の `@media (max-width: 768px)` ブロックにまとまっています（`visit-list.css` = 検索・並び順・チップ、`visit-form.css` = 入力とボタン、`visit-card.css` = カードとタグ、`modal.css` = モーダルとトースト、統計ページは `stats.module.css` の `max-width: 720px`）。新しい操作要素を追加したら、既定サイズが小さいもの（アイコンのみのボタン、チップ等）を対応するブロックへ必ず追記すること。
- **フォント**: `--font-main` は `layout.tsx` の `next/font` (Outfit) が注入する `--font-outfit` を参照します。CSS からの Web フォント `@import` は追加しないでください（PWA のオフライン動作を壊します）。

### 4. アクセシビリティ ＆ モーション
- `base.css` のグローバル `:focus-visible` リングを維持してください。`outline: none` を書く際は代替の可視化を必ず用意すること。
- クリック可能な要素は `div` ではなく `button` / `a` を使い、`aria-expanded` / `aria-pressed` / `aria-current` で状態を公開すること。
- **対話要素を入れ子にしないこと**: 訪問リストの各行は、編集ボタン・タグ・経路リンクを内包するため行全体を `role="button"` にできません。開閉／選択のトグルは見出しの中のボタン（`<h3><button aria-expanded>`＝WAI-ARIA のアコーディオンパターン）とし、編集ボタンは必ずその**兄弟要素**に置きます（`VisitCompactItem` / `VisitCardItem` 参照）。`button` の子は phrasing content に限られるため、中身は `span` で構成してください。
- **`tablist` を絞り込みトグルに使わないこと**: 対応する `tabpanel` と矢印キーによる roving tabindex が無い状態で `role="tab"` を使うのは誤用です。ステータス絞り込み（`VisitListSearch`）のような排他トグル群は `role="group"` + `aria-pressed` で公開します。
- **`listbox` を名乗るならキーボード操作を必ず実装すること**: 並び順ドロップダウン（`SortSelect`）は WAI-ARIA の Listbox パターンで実装しています。展開時はフォーカスを `ul[role="listbox"]`（`tabIndex={-1}`）へ移し、ハイライト位置は `aria-activedescendant` で公開します（個々の `li` はフォーカスを持ちません）。↑↓（端で循環）・Home・End で移動、Enter / Space で確定、Escape で確定せず閉じてトリガーへフォーカスを戻す、Tab で確定せず閉じる、までが最低要件です。`role="option"` を `onClick` だけで実装するとマウス専用の UI になります。ハイライトの見た目は `.quick-sort-option.is-active`（選択中の `.is-selected` と重なるため枠線で区別）が担当します。
- フォームの `label` は `htmlFor` と `id` で入力欄と紐づけること。ボタン群には `role="group"` + `aria-labelledby`（`.form-group-label`）を使用します。placeholder はラベルの代わりになりません（検索欄は `.sr-only` のラベルを付ける）。
- 絞り込み結果の件数など、操作の結果として変わる情報は `role="status"` + `aria-live="polite"` のライブリージョンで伝えること（`VisitListHeader` の `.sr-only` 要素）。見た目の数字だけを更新しても支援技術には伝わりません。
- アニメーションは `prefers-reduced-motion` を尊重すること。CSS は `base.css` の共通ブロックが担い、JS 由来のもの（Leaflet の `flyTo`、`scrollIntoView`）は `utils/motion.ts` の `prefersReducedMotion()` / `getScrollBehavior()` を経由させます。
- テーマは初期描画前に `layout.tsx` のインラインスクリプトが `html` へ `light-theme` を付与します（ちらつき防止）。判定ロジックを変更する際は `utils/theme.ts` の `getInitialTheme()` と必ず揃えてください。保存値が無い場合は OS の `prefers-color-scheme` に従います。

### 5. パフォーマンス
- 訪問リスト（`VisitList.tsx`）は全件を一度に描画せず、`INITIAL_RENDER_COUNT` 件から `IntersectionObserver` で `CHUNK_SIZE` ずつ描画を伸ばす増分レンダリング方式です。描画件数は state ではなくレンダー中に導出しているため、`useEffect` 内で `setState` を呼ぶ実装（React Compiler / `react-hooks/set-state-in-effect` に抵触）へ戻さないでください。

### 6. テストとリファクタリング
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
