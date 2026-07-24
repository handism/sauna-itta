# サウナイッタ (sauna-itta)

「サウナイッタ」は、訪れたサウナや行きたいサウナを地図上に記録し、あとから振り返るためのマイととのいマップです。  
Next.js 16 (App Router) + React Leaflet で構築されており、データはすべてブラウザの `localStorage` に保存されます。

---

## 🌟 主な機能

- **インタラクティブなサウナマップ**
  - OpenStreetMap ＆ Leaflet による地図表示
  - マーカーの自動クラスタリング機能（ズーム度合いに応じた集約表示）
  - 現在地移動、マップ範囲連動フィルタリング
- **充実した訪問記録・編集機能**
  - サウナ情報の登録（訪問済み / 行きたい）
  - Nominatim API を用いた地点・施設名検索（キーワード入力で位置・住所・施設名を自動補完＆マップ移動）
  - 基本情報（サウナ名、エリア、住所、ピン位置、満足度 ★1〜5、写真添付）
  - 複数回の訪問履歴管理（日付、水風呂温度、サウナ室温度、ととのい度、メモ）
  - 画像の自動クライアントサイド圧縮（最大1MB / 1024px）
- **高度な検索・フィルタリング**
  - キーワード検索、訪問ステータス（訪問済み/行きたい）、最低満足度、タグ絞り込み
  - マップ表示範囲内のサウナのみ抽出表示する連動機能
- **レスポンシブ UI / デザイン**
  - デスク: デスク用サイドバーレイアウト
  - モバイル: スワイプ操作対応ボトムシート ＆ ボトムナビゲーション
  - ダークモード / ライトテーマ切り替え
  - デザイントークンに基づく統一感のあるUIスタイル
- **統計ダッシュボード (`/stats`)**
  - 訪問サウナ数、行きたい数、平均満足度、エリア制覇率
  - 月別訪問数グラフ（Recharts）、満足度分布グラフ
  - 訪問カレンダー（React Calendar）、タグクラウド、ホームサウナカード、トップサウナ
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
│   │   └── RatingDistributionChart.tsx
│   └── sauna-map/            # メインマップ機能の設計単位
│       ├── SaunaMap.tsx      # ルートエントリポイント
│       ├── context/          # 状態管理 (モジュール化された Context)
│       │   ├── SaunaMapContext.tsx      # 全体統合コンテキスト
│       │   ├── VisitsDataContext.tsx    # 訪問データ CRUD 状態
│       │   ├── EditorContext.tsx        # フォーム・編集状態ステートマシン
│       │   ├── UIContext.tsx            # モーダル・テーマ・UI状態
│       │   └── MapStateContext.tsx      # マップ表示・フィルター状態
│       ├── components/       # 分割された UI コンポーネント群
│       │   ├── DesktopSidebar.tsx       # デスクトップ用サイドバー
│       │   ├── BottomSheet.tsx          # モバイル用ボトムシート
│       │   ├── MobileNavBar.tsx         # モバイル用ボトムナビ
│       │   ├── VisitForm.tsx            # 登録/編集フォーム
│       │   ├── VisitList.tsx            # サウナ一覧
│       │   ├── SaunaMarkerPopup.tsx     # マーカーポップアップ
│       │   ├── MapClusterControl.tsx    # クラスタリング制御
│       │   ├── MapZoomControl.tsx       # ズームコントロール
│       │   └── Toast.tsx, etc.
│       ├── hooks/            # ドメイン・UIのカスタムフック群
│       ├── types/            # 型定義 (domain.ts / ui.ts)
│       ├── utils/            # ユーティリティ (geo.ts, form.ts, image.ts, etc.)
│       └── styles/           # 構成要素ごとに分離された CSS スタイル
└── data/
    └── sauna-visits.json     # 初期ロード用シードデータ
```

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
npm run lint     # ESLint による静的解析
npm run test     # Vitest による単体テスト・フックテスト実行
```

---

## 💾 データ保存 ＆ 静的デプロイ

- **データ保存**: すべてのデータはブラウザの `localStorage`（キー: `sauna-itta_visits`, `sauna-itta_theme`）に保存されます。
- **GitHub Pages デプロイ**: `.github/workflows/deploy.yml` により、`main` ブランチへ Push された際に GitHub Pages へ自動デプロイされます (`basePath: "/sauna-itta"` 設定済み)。
