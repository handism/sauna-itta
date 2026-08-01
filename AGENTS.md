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

- **専用フックを直接使うこと**: 消費側は `useSaunaUI` / `useVisitsCRUD` / `useVisitFiltersContext` / `useSaunaEditor` / `useSaunaMapState` のうち、実際に必要なものだけを個別に呼びます。さらに操作関数だけなら `useSaunaUIActions` / `useVisitFilterActions` / `useSaunaEditorActions` / `useSaunaMapActions`、状態のみなら `useSaunaMapStateValue`、画面幅判定だけなら `useSaunaViewport` を使ってください。複数の Context を 1 オブジェクトに束ねるフック（旧 `useSaunaMap` / 旧 `useSaunaVisitsData`）は、どれか 1 つの状態変化で全消費側が再レンダリングされるため復活させないでください。
- **Provider 間は最小の Context だけを購読すること**: `VisitsCRUDProvider` は `useSaunaUIActions()`、`EditorProvider` は `useSaunaViewport()` + `useSaunaUIActions()` + `useVisitFilterActions()`、`MapStateProvider` は `useSaunaViewport()` を使います。ここで統合フックへ戻すと、モーダル開閉・検索入力・テーマ変更が無関係な Provider まで連鎖的に再レンダリングさせます。
- **操作関数しか要らない消費側は `useSaunaEditorActions` / `useSaunaMapActions` を使うこと**: `useSaunaEditor()` や `useSaunaMapState()` は state と actions を束ねるため、これを購読すると無関係な状態変更でも再レンダリング対象になります。`MapStateProvider`（`startEditing` / `cancelEditing` / `startCreate` のみ）と `VisitList` / `DesktopSidebar` は `useSaunaEditorActions()`、`VisitForm` は `useSaunaMapActions()` を使うこと。
- **Provider は `SaunaMapContext.tsx` に一本化**: `SaunaMapProvider` が `UIProvider` → `VisitsCRUDProvider` → `VisitFiltersProvider` → `EditorProvider` → `MapStateProvider` を直接入れ子にします。複数 Provider をまとめるだけの中間ファイルは作らないでください（旧 `VisitsDataContext.tsx` は削除済み）。
- **訪問データとフィルターの分離**: 訪問データ本体・インポート/エクスポートは `useVisitsCRUD`、絞り込み結果・フィルター状態・統計は `useVisitFiltersContext` から取得します。CRUD しか使わない画面（`DesktopSidebar` など）がフィルターを購読すると、検索欄の 1 文字入力ごとに再レンダリングされます。
- **入力中のフォーム値は `useSaunaEditorForm` から**: 編集フォームの `form` / `setForm` / `imageUploading` は専用の `EditorFormContext` に分離しています（`useSaunaEditor` には含まれません）。これを EditorState 側へ戻すと、1 文字入力するたびに `SaunaMapContent` / `DesktopSidebar` / `VisitList` まで再レンダリング対象になります。同じ理由で、`useVisitForm` の `handleSubmit` は依存配列に `form` を入れず `formRef` から最新値を読み、`useEditorState` が返す操作関数は必ず `useCallback` で参照を安定させること（`SaunaMapContext.test.tsx` の「フォーム入力で EditorState / EditorActions の参照が変わらないこと」が検査しています）。
- **タグ絞り込みの初期値は URL から**: 統計ページのタグクラウドは `/?tag=...` で地図へ遷移し、`useVisitFilters` の `getInitialFilters()` がこれを `selectedTag` の初期値として読みます。地図は `ssr: false` で描画されるため初期値算出で `window` を参照して構いません。
- **地図のディープリンク選択は `queueMicrotask` 経由で行うこと**: 統計ページ等から `/?id=xxx` で遷移した際の初期自動選択（`useMapViewState`）は、カスケードレンダリング防止ルール (`eslint react-hooks/set-state-in-effect`) を満たすため `queueMicrotask` 内で `setSelectedId` / `setMapTargetOverride` を呼び出し、モバイル時はシートを最小化 (`"min"`) します。
- **モバイルのシート位置制御は Context 側に集約**: 編集の開始／終了に伴う `snapPosition` の切り替えは `MapStateContext` の `handleEditVisit` / `handleCancelEditing` / `handleEditingFinished` が担います。画面コンポーネント側で `startEditing` + `setSnapPosition` を組み合わせて再実装しないでください。
- **編集の終了は必ず `MapStateContext` 経由にすること**: `VisitForm` のキャンセルは `EditorContext` の `cancelEditing` ではなく `handleCancelEditing()` を呼びます。保存の完了は `handleSubmit(e, handleEditingFinished)` のように完了コールバックを渡して伝えること（`EditorProvider` は `MapStateProvider` の親でシート位置を直接触れないため、`useVisitForm` の `handleSubmit` は保存成功時だけ `onCompleted` を呼ぶ設計にしてあります）。ここを `editor.cancelEditing()` の直接呼び出しに戻すと、モバイルで保存・キャンセルしてもシートが `full` のまま地図が隠れます。
- **訪問履歴の削除は確認後だけ実行すること**: `VisitHistorySection` は削除候補の index をローカル state に保持し、`ConfirmModal` で対象日を確認してから `onDeleteEntry` を呼びます。削除ボタンから `removeHistoryEntry()` を直接呼ぶ実装へ戻すと、スクロール中の誤タップで履歴が即時消去されます。

### 2. ディレクトリ ＆ コンポーネント構造
- **コンポーネント分離**: View (プレゼンテーション) と Controller (ロジック・フック) を適切に分離してください。
- **コンテナは props の上書き機構を持たないこと**: `VisitList` / `VisitForm` / `DesktopSidebar` / `ShareModal` は Context から値を集めて `*View` へ渡すだけのコンテナです。`Partial<...ViewProps>` を受け取って `props.x ?? ctx.x` と書く方式は復活させないでください（誰も props を渡しておらず、型エラーも握り潰します）。テストは props を直接渡せる `VisitListView` などの `*View` を描画すること。
- **レスポンシブ設計**: PC表示 (`DesktopSidebar.tsx`) と モバイル表示 (`BottomSheet.tsx`, `MobileNavBar.tsx`) の責務を明確に分けること。`MOBILE_BREAKPOINT = 768` は「768px 未満がモバイル」を意味するため、CSS はモバイル側を `@media (max-width: 767px)`、デスクトップ側を `@media (min-width: 768px)` にします（768px の両方へモバイルCSSを当てないこと）。ボトムシートの 1 段移動（タップ・↑↓キー・フリックの 3 経路）は `SNAP_ORDER` / `stepSnap()` に集約しており、端では `onSnapChange` を呼びません（`min` / `full` の分岐を各ハンドラへ書き戻さないこと）。また、選択中のサウナがある場合はモバイルボトムシート上部のバッジからワンタップでシートを最小化し地図を確認できます。
- **クイックフィルターチップの可視化**: 検索欄・ステータス絞り込み・カスタムフィルター（都道府県・評価など）のアクティブな条件は `QuickFilterChips` にまとめられ、リスト上部で個別に解除（×ボタン）できるようにしています。
- **型定義**: `src/components/sauna-map/types/` 内の `domain.ts` (ドメインモデル) と `ui.ts` (UI・フィルター型) に集約し、`any` 型や不必要なキャストを排除すること。
- **ユーティリティ**: 純粋関数ロジックは `src/components/sauna-map/utils/` に抽出し、単体テストを記述すること。
- **バウンディングボックス判定**: 緯度経度のバウンディングボックス判定には `utils/geo.ts` の `isInBounds()` を使うこと。
- **検索キーワードマッチング**: 検索文字列からの安全な正規表現生成および横断検索の判定には `utils/search.ts` の `createSearchRegex()` / `matchesSearchKeyword()` を使うこと。
- **保存ボタンの非活性判定**: バリデーションやアップロード状態に伴う保存ボタンブロック理由の取得には `utils/form.ts` の `getSubmitBlockedReason()` を使うこと。
- **記録のステータス判定**: `visit.status ?? "visited"` を直書きせず、`utils/visitStatus.ts` の `getVisitStatus()` / `isVisited()` / `isWishlist()` を使うこと（旧形式データの既定値の解釈が地図・一覧・統計でずれるのを防ぎます）。
- **`localStorage` は必ず `utils/storage.ts` 経由**: 読み書きは `readStorage()` / `writeStorage()` を使うこと。Safari のプライベートモードや容量超過では例外が飛ぶため、直接触ると 1 箇所の try/catch 漏れで画面が落ちます。`writeStorage()` の戻り値は「保存できたか」で、容量超過の通知（`useSaunaVisits`）に使っています。読めなかったときだけ既定値へ倒したい場合は `readStorage(key, onErrorValue)` の第 2 引数を使うこと（テーマ判定がこれに依存しています）。
- **今日の日付**: `new Date().toISOString().split("T")[0]` を書かず `utils/date.ts` の `getTodayDate()` を使うこと。UTC ではなく利用者のローカル日付を返すため、日本時間の深夜帯に前日になることを防ぎます（`form.ts` は `visitHistory.ts` に依存しているため、両方から使うこの関数だけ別モジュールに置いています）。
- **訪問回数の算出**: 訪問回数は必ず `utils/visitHistory.ts` の `getVisitCount()` を使うこと（`history.length` と `visitCount` の両方を考慮します）。地図側と統計ページで別々に導出すると、旧形式データで表示が食い違います。訪問回数による順位付けは `rankVisitsByCount()` に集約しています（同数のときの並びまで揃わないと、「MY HOME SAUNA」と「よく行く施設 TOP 5」で 1 位が食い違います）。
- **訪問リストの行コンポーネント**: `VisitCompactItem` / `VisitCardItem` は表示密度が違うだけなので、props 型と `memo` の比較関数は `components/visitItem.ts` の `VisitItemProps` / `areVisitItemPropsEqual` を共有します。片方にだけ props を足すと比較関数の更新漏れで表示が古いまま残るため、個別に再定義しないこと。
- **テーマフックは 1 本**: 地図側・統計ページとも `hooks/useTheme.ts` を使います。統計ページのように静的プリレンダリングされる画面は `useTheme({ deferred: true })` で開始し、他のクライアント専用初期化と同じタイミングで `syncFromStorage()` を呼ぶこと（マウント直後に既定値でクラスを適用すると、`layout.tsx` のインラインスクリプトが付けた `light-theme` を剥がしてちらつきます）。
- **タグ集計**: タグの出現回数は `utils/visitHistory.ts` の `countTags()` に集約しています（`getPopularTags()` はその薄いラッパー）。コンポーネント内で `visit.tags` を数え直さないこと。
- **写真プレビュー**: 写真の拡大は必ず `components/common.tsx` の `VisitImagePreview` 経由にすること（素の `img` に `onClick` を付けるとキーボードから開けません）。同コンポーネントは sanitize 済みの `src` を受け取るため、`sanitizeImageUrl()` の呼び出しは各コンポーネントで 1 レンダーにつき 1 回だけにします。
- **`data:` URL を URL パーサへ通さないこと**: 画像は最大 1MB の Base64 として保持されるため、`sanitizeImageUrl()` は `data:` を先頭の正規表現だけで判定し、`new URL()` は http(s)・相対パスの検証にのみ使います（40 件 × 1MB で 23ms → 0.01ms）。一覧の各行がレンダーのたびに呼ぶ関数なので、ここに文字列全体を走査する処理を足さないこと。許可する MIME は `SAFE_DATA_IMAGE` に列挙しており、SVG はスクリプトを埋め込めるため意図的に除外しています。
- **グラフ**: Recharts の配色・ツールチップは `components/charts/chartTheme.ts` の `getChartColors()` / `getTooltipStyle()` を、空データ表示は `ChartEmptyState` を使うこと。チャート側でテーマ別の色分岐を直書きしないでください。ツールチップだけに具体値を置かず、チャートと兄弟の `.sr-only` テーブルにも全データを出し、キーボード・支援技術から月別件数や評価別件数を取得できる状態を保つこと（`role="img"` の内側へ表を置くと子要素が読み上げ対象から外れます）。
- **統計ページの履歴平坦化は 1 回だけ**: 訪問履歴の平坦化（`flattenVisitHistory()`）と `status === "visited"` の絞り込みは `useStatsData` の `visitedEntries` に集約しています。グラフやカレンダーは `visits` ではなく `FlatVisitHistoryEntry[]` を props で受け取ること。コンポーネントごとに `flattenVisitHistory(visits)` を呼ぶと、同じ走査を記録件数 × グラフ数だけ繰り返します。
- **統計ページの順位付けも 1 回だけ**: `rankVisitsByCount()` の呼び出しは `useStatsData` の `rankedVisits` に集約しています。`HomeSaunaCard` / `TopSaunasCard` は `visits` ではなく `RankedVisit[]` を props で受け取ること（カードごとに呼ぶと同じ絞り込みと並べ替えを繰り返します）。
- **同じ数字を 2 か所で計算しないこと**: 平均満足度は `calculateStats()` の `stats.avgRating` が唯一の出所で、`RatingDistributionChart` は `avgRating` を props で受け取って表示します（グラフ側で再計算すると、サマリーと中央表示の数字がいずれ食い違います）。

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
- **タッチターゲット**: 操作要素は最低 24px、モバイル（`max-width: 767px`）では 44px 以上を確保してください。44px 保証は各 CSS ファイル末尾の `@media (max-width: 767px)` ブロックにまとまっています（`bottom-sheet.css` = モバイルナビ、`visit-list.css` = 検索・並び順・チップ、`visit-form.css` = 入力とボタン、`visit-card.css` = カード・タグ・履歴削除、`modal.css` = モーダルとトースト、統計ページは `stats.module.css` の `max-width: 720px`）。新しい操作要素を追加したら、既定サイズが小さいもの（アイコンのみのボタン、チップ等）を対応するブロックへ必ず追記すること。
- **静的カードにクリックの見た目を付けないこと**: 統計ページの `.glassCard` は情報表示用の共通面であり、カード自体には hover の浮上・強調を付けません。リンクやボタンを持つ場合は、その対話要素だけに hover / focus の反応を付け、カード全体がクリックできるように誤認させないでください。
- **横スクロールを隠さないこと**: クイックフィルターは横方向に項目が続くため、スクロールバーを完全に非表示にせず `scrollbar-width: thin` を維持します。候補が多い場合はモバイルで `.quick-filter-scroll-hint` を表示し、横スワイプ可能であることを視覚的に伝えてください。
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
   - localモードにはバックエンド API やサーバーサイド DB への依存を持ち込まないでください。apiモードの永続化は`VisitRepository`経由のRails APIに限定します。
   - アセットパスや内部リンク生成時、localモードのGitHub Pages用`basePath` (`/sauna-itta`) とapiモードのbasePathなしを両立してください。
2. **パフォーマンス・画像圧縮**:
   - ユーザーがアップロードした画像は `browser-image-compression` で圧縮し、Base64 として `localStorage` に保持します（最大 1MB / 1024px）。
3. **React Compiler**:
   - `next.config.ts` で React Compiler が有効化されています。不要な再レンダリングや依存配列・再計算のバグを生む非純粋な関数定義・レンダリング内副作用を避けてください。

---

## 7. Railsバックエンド・データソース規約

- `NEXT_PUBLIC_DATA_SOURCE=local|api` で配布形態を切り替えます。localはGitHub Pages用の`/sauna-itta`、同梱JSON、`localStorage`、PWAを維持し、apiはbasePathなし・Rails API・オンライン必須でService Workerを登録しません。
- フロントの永続化は `repositories/` の `VisitRepository` 経由にします。Contextや画面から`fetch`または`localStorage`を直接呼ばないでください。CRUDは非同期で、Repository成功後だけ画面状態を更新します。
- APIインポートは最大10件のチャンクを維持し、既存`external_id`をスキップして再実行可能にします。JSONエクスポートは両モードで維持します。
- Railsの全記録取得は必ず`current_user.sauna_visits`からスコープし、他ユーザーの記録・履歴・写真は404にします。APIはcamelCase、エラーは`{ error: { code, message, details? } }`形式です。
- 変更系APIはセッション認証とCSRFを必須にし、`lock_version`競合は409を返します。開発ログインはdevelopmentかつ`ENABLE_DEV_LOGIN=true`の場合だけ許可し、本番ルートを追加しないでください。
- 写真はJPEG／PNG／WebP／GIFのdata URLだけを許可し、復号後1MB以下をRails validationでも検査します。SVGと任意URLを受け付けないでください。本番配信は所有者確認を行う認証付き画像エンドポイントに限定します。
- DB変更はexpand/contract方式で後方互換に進めます。本番seedへ個人データやデモデータを追加しないでください。

## 8. インフラ・検証規約

- 本番イメージはルート`Dockerfile`でAPIモードのNext.js静的成果物とRailsだけを組み込み、非rootでPumaを起動します。ローカルは`frontend`／`api`／`postgres`のDocker Composeを使用します。フロント依存関係は`Dockerfile.frontend.dev`のビルド時に`npm ci`でインストールします。APIは起動時に`/app/tmp/pids/server.pid`を除去し、`bin/rails db:prepare`の成功後にRailsを`exec`起動します。依存関係変更時は`docker-compose up --build`でフロントイメージを再ビルドしてください。
- GCPは`infra/`のTerraformで管理します。Secret ManagerにはコンテナだけをTerraformで作り、秘密値やDBパスワードをtfvars、state、GitHub Secretsへ入れません。
- GCPデプロイは基盤・Secret・GitHub Environment Variablesの設定が完了するまで`workflow_dispatch`による手動実行専用にします。WIF/OIDCを使い、単一buildの同じdigestをmigration jobとCloud Runサービスへ順に反映します。migration成功前にサービスを更新しないでください。
- フロント変更時は従来の`npm run test`、`npm run lint`、`npm run typecheck`、`npm run build`に加え、両モードに関係する場合は`npm run build:local`と`npm run build:api`を実行します。
- Rails／インフラ変更時は`backend/bin/rails test`、RuboCop、Brakeman、`terraform fmt -check`、`terraform validate`、production Docker buildとhealth checkも実行します。
