# サウナイッタ (sauna-itta)

「サウナイッタ」は、訪れたサウナや行きたいサウナを地図上に記録し、あとから振り返るためのマイととのいマップです。  
Next.js 16 (App Router) + React Leaflet で構築されており、データはすべてブラウザの `localStorage` に保存されます。

---

## 🌟 主な機能

- **インタラクティブなサウナマップ**
  - OpenStreetMap ＆ Leaflet による地図表示
  - マーカーの自動クラスタリング機能（ズーム度合いに応じた集約表示）
  - 現在地移動およびマップ上への現在地インジケーター（パルス波紋アニメーション・精度円）表示
  - 選択中のサウナマーカーに対するパルス発光アニメーション
  - マップ範囲連動フィルタリング
- **充実した訪問記録・編集機能**
  - サウナ情報の登録（訪問済み / 行きたい）
  - Nominatim API を用いた地点・施設名検索（キーワード入力で位置・住所・施設名を自動補完＆マップ移動）
  - 基本情報（サウナ名、エリア、住所、ピン位置、満足度 ★1〜5、写真添付）
  - 複数回の訪問履歴管理（日付、水風呂温度、サウナ室温度、ととのい度、メモ）
  - 訪問履歴の削除前確認（対象日を表示して誤操作を防止）
  - 画像の自動クライアントサイド圧縮（最大1MB / 1024px）
- **高度な検索・フィルタリング**
  - キーワード検索、訪問ステータス（訪問済み/行きたい）、最低満足度、タグ絞り込み
  - アクティブな絞り込み条件の個別チップ表示（ワンタップで項目別解除・全解除が可能）
  - マップ表示範囲内のサウナのみ抽出表示する連動機能
  - 記録が増えても軽快に動く増分レンダリング（スクロールに応じて描画を拡張）
  - モバイルで横スクロール可能なクイックフィルターに操作ヒントを表示
- **レスポンシブ UI / デザイン**
  - デスク: デスク用サイドバーレイアウト
  - モバイル: スワイプ操作対応ボトムシート ＆ ボトムナビゲーション（選択中の施設バッジからワンタップでシート最小化＆地図確認が可能）
  - 768px 未満をモバイルとしてJS・CSSのレイアウト境界を統一
  - ダークモード / ライトテーマ切り替え（初回は OS の `prefers-color-scheme` に追従、初期描画前に適用してちらつきを防止）
  - デザイントークンに基づく統一感のあるUIスタイル
- **アクセシビリティ**
  - 全操作要素へのキーボードフォーカスリング、モーダルのフォーカストラップ
  - 地点検索サジェストの矢印キー操作、ボトムシートのキーボード開閉
  - モバイル操作要素の44pxタッチターゲット、グラフ数値のスクリーンリーダー向けデータ表
  - `prefers-reduced-motion` に応じたアニメーション抑制
- **統計ダッシュボード (`/stats`)**
  - 訪問サウナ数、行きたい数、平均満足度、エリア制覇率
  - 月別訪問数グラフ（Recharts）、満足度分布グラフ
  - 訪問カレンダー（React Calendar）、タグクラウド、ホームサウナカード、トップサウナ
  - MY HOME SAUNA ＆ よく行くサウナ TOP 5 からの「📍 地図で見る」対話リンク（`?id=xxx` を介した地図側での初期選択・カメラ移動・モバイルシート最小化連携）
- **PWA (Progressive Web App) 対応**
  - Web App Manifest ＆ インストール可能アイコンアセット対応
  - Service Worker (`sw.js`) による静的アセットおよびマップタイルのオフラインキャッシュ対応（サウナ室内や地下でも動作）
- **データ管理・バックアップ**
  - JSON エクスポート / インポート（ID重複除外マージ）
  - データ永続化（`localStorage`）

---

## 🛠 技術スタック

- **Framework**: Next.js 16 (App Router, Static Export)
- **Core UI**: React 19 + TypeScript (React Compiler 有効)
- **Map / Geospatial**: React Leaflet 5 / Leaflet 1.9 / React Leaflet Cluster / OpenStreetMap
- **Icons**: Lucide React
- **Validation**: Zod 4
- **Visualization**: Recharts 3, React Calendar 6
- **Styling**: Vanilla CSS Modules + CSS Design Tokens
- **Testing**: Vitest 4 + React Testing Library + jsdom
- **Linting**: ESLint 9

---

## 📁 ディレクトリ構成

```text
src/
├── app/                      # Next.js App Router ページ構成
│   ├── layout.tsx            # 全体レイアウト
│   ├── page.tsx              # メインマップ画面 (/)
│   ├── globals.css           # グローバルCSS
│   └── stats/                # 統計ダッシュボード (/stats)
│       ├── page.tsx
│       ├── stats.module.css
│       ├── calendar.css
│       ├── components/       # 統計用コンポーネント
│       └── hooks/            # 統計データ集計フック
├── components/
│   ├── charts/               # 汎用グラフコンポーネント (Recharts)
│   │   ├── MonthlyVisitsChart.tsx
│   │   ├── RatingDistributionChart.tsx
│   │   ├── ChartEmptyState.tsx        # データ無し時の共通表示
│   │   └── chartTheme.ts              # グラフ共通の配色・ツールチップ
│   └── sauna-map/            # メインマップ機能の設計単位
│       ├── SaunaMap.tsx      # ルートエントリポイント
│       ├── context/          # 状態管理 (モジュール化された Context)
│       │   ├── SaunaMapContext.tsx      # Provider の合成と各 Hook の再エクスポート
│       │   ├── VisitsCRUDContext.tsx    # 訪問データ本体・インポート/エクスポート
│       │   ├── VisitFiltersContext.tsx  # フィルター状態/操作・絞り込み結果・統計
│       │   ├── EditorContext.tsx        # フォーム・編集状態ステートマシン
│       │   ├── UIContext.tsx            # モーダル・テーマ・画面幅・UI状態/操作
│       │   └── MapStateContext.tsx      # マップ表示・選択/ホバー状態
│       ├── components/       # 分割された UI コンポーネント群
│       │   ├── DesktopSidebar.tsx       # デスクトップ用サイドバー
│       │   ├── BottomSheet.tsx          # モバイル用ボトムシート
│       │   ├── MobileNavBar.tsx         # モバイル用ボトムナビ
│       │   ├── VisitForm.tsx            # 登録/編集フォーム
│       │   ├── VisitList.tsx            # サウナ一覧
│       │   ├── SaunaMarkerPopup.tsx     # マーカーポップアップ
│       │   ├── CurrentLocationMarker.tsx # 現在地マーカーインジケーター
│       │   ├── MapClusterControl.tsx    # クラスタリング制御
│       │   ├── MapZoomControl.tsx       # ズームコントロール
│       │   ├── FilterPanel.tsx          # インライン詳細フィルターパネル
│       │   └── Toast.tsx, etc.
│       ├── hooks/            # ドメイン・UIのカスタムフック群
│       ├── types/            # 型定義 (domain.ts / ui.ts)
│       ├── utils/            # ユーティリティ (geo.ts, form.ts, image.ts, theme.ts, motion.ts,
│       │                     #   storage.ts = localStorage の安全な読み書き,
│       │                     #   visitStatus.ts = 記録ステータスの判定, date.ts, etc.)
│       └── styles/           # 構成要素ごとに分離された CSS スタイル
└── data/
    └── sauna-visits.json     # 初期ロード用シードデータ
```

Context は状態と操作を分離しており、操作だけを使う箇所は `useSaunaUIActions` / `useVisitFilterActions` / `useSaunaEditorActions`、画面幅だけを使う箇所は `useSaunaViewport` を購読します。これにより、検索入力やモーダル開閉が無関係な Provider へ連鎖する再レンダリングを抑えています。

---

## 🚀 セットアップ ＆ 開発

### インストール

```bash
git clone <repository_url>
cd sauna-itta
npm install
```

### スクリプト一覧

```bash
npm run dev      # 開発サーバー起動 (http://localhost:3000)
npm run build    # 本番ビルド (./out 配下へ静的エクスポート)
npm run start    # ビルド結果の起動確認
npm run lint      # ESLint による静的解析
npm run typecheck # tsc --noEmit による型検査（テストファイルを含む）
npm run test      # Vitest による単体テスト・フックテスト実行
```

---

## 💾 データ保存 ＆ 静的デプロイ

- **データ保存**: すべてのデータはブラウザの `localStorage`（キー: `sauna-itta_visits`, `sauna-itta_theme`）に保存されます。
- **GitHub Pages デプロイ**: `.github/workflows/deploy.yml` により、`main` ブランチへ Push された際に GitHub Pages へ自動デプロイされます (`basePath: "/sauna-itta"` 設定済み)。
