# フロントエンド規約（CSS ＆ アクセシビリティ）

このファイルは `frontend/src/` 配下を編集するときに読み込まれます。状態管理・コンポーネント構造の規約は `frontend/src/components/sauna-map/AGENTS.md`、全体方針はリポジトリルートの `AGENTS.md` を参照してください。

## 1. CSS ＆ スタイリング
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

## 2. アクセシビリティ ＆ モーション
- `base.css` のグローバル `:focus-visible` リングを維持してください。`outline: none` を書く際は代替の可視化を必ず用意すること。
- クリック可能な要素は `div` ではなく `button` / `a` を使い、`aria-expanded` / `aria-pressed` / `aria-current` で状態を公開すること。
- **対話要素を入れ子にしないこと**: 訪問リストの各行は、編集ボタン・タグ・経路リンクを内包するため行全体を `role="button"` にできません。開閉／選択のトグルは見出しの中のボタン（`<h3><button aria-expanded>`＝WAI-ARIA のアコーディオンパターン）とし、編集ボタンは必ずその**兄弟要素**に置きます（`VisitCompactItem` / `VisitCardItem` 参照）。`button` の子は phrasing content に限られるため、中身は `span` で構成してください。
- **`tablist` を絞り込みトグルに使わないこと**: 対応する `tabpanel` と矢印キーによる roving tabindex が無い状態で `role="tab"` を使うのは誤用です。ステータス絞り込み（`VisitListSearch`）のような排他トグル群は `role="group"` + `aria-pressed` で公開します。
- **`listbox` を名乗るならキーボード操作を必ず実装すること**: 並び順ドロップダウン（`SortSelect`）は WAI-ARIA の Listbox パターンで実装しています。展開時はフォーカスを `ul[role="listbox"]`（`tabIndex={-1}`）へ移し、ハイライト位置は `aria-activedescendant` で公開します（個々の `li` はフォーカスを持ちません）。↑↓（端で循環）・Home・End で移動、Enter / Space で確定、Escape で確定せず閉じてトリガーへフォーカスを戻す、Tab で確定せず閉じる、までが最低要件です。`role="option"` を `onClick` だけで実装するとマウス専用の UI になります。ハイライトの見た目は `.quick-sort-option.is-active`（選択中の `.is-selected` と重なるため枠線で区別）が担当します。
- フォームの `label` は `htmlFor` と `id` で入力欄と紐づけること。ボタン群には `role="group"` + `aria-labelledby`（`.form-group-label`）を使用します。placeholder はラベルの代わりになりません（検索欄は `.sr-only` のラベルを付ける）。
- 絞り込み結果の件数など、操作の結果として変わる情報は `role="status"` + `aria-live="polite"` のライブリージョンで伝えること（`VisitListHeader` の `.sr-only` 要素）。見た目の数字だけを更新しても支援技術には伝わりません。
- アニメーションは `prefers-reduced-motion` を尊重すること。CSS は `base.css` の共通ブロックが担い、JS 由来のもの（Leaflet の `flyTo`、`scrollIntoView`）は `utils/motion.ts` の `prefersReducedMotion()` / `getScrollBehavior()` を経由させます。
- テーマは初期描画前に `layout.tsx` のインラインスクリプトが `html` へ `light-theme` を付与します（ちらつき防止）。判定ロジックを変更する際は `utils/theme.ts` の `getInitialTheme()` と必ず揃えてください。保存値が無い場合は OS の `prefers-color-scheme` に従います。
