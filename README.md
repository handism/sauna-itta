# サウナイッタ (sauna-itta)

「サウナイッタ」は、訪れたサウナや行きたいサウナを地図上に記録し、あとから振り返るためのマイととのいマップです。  
Next.js + React Leaflet で構築されており、データはブラウザの `localStorage` に保存されます。

## 主な機能

- 地図をタップしてサウナを登録（訪問済み / 行きたい）
- 名前・日付・感想・エリア・タグ・満足度（★1〜5）・訪問回数・写真を記録
- キーワード検索、ステータス、最低満足度、並び順で絞り込み
- 登録データの編集 / 削除
- JSON エクスポート / インポート（既存ID重複は除外してマージ）
- シェア用ビュー（一覧 + サマリ）
- 統計ダッシュボード（`/stats`）
  - 合計件数、行った/行きたい、記録期間、平均満足度、都道府県制覇
  - 月別訪問数、満足度分布チャート
- ダーク / ライトテーマ切り替え
- 現在地移動ボタン
- `alert/confirm` を使わない UI 通知
  - Toast（info/success/error）
  - ConfirmModal（削除確認）

## 技術スタック

- Framework: Next.js 16 (App Router)
- UI: React 19 + TypeScript
- Map: React Leaflet / Leaflet / OpenStreetMap
- Chart: Recharts
- Styling: Global CSS（`base.css` + `map.css` + `sidebar.css` + `modal.css`）
- Lint: ESLint 9

## ディレクトリ構成（主要部分）

```text
src/
  app/
    page.tsx
    stats/
      page.tsx
      stats.module.css
    styles/
      base.css
      sauna-map.css   # map/sidebar/modal の集約
      map.css
      sidebar.css
      modal.css
  components/
    SaunaMap.tsx      # 画面のオーケストレーション
    sauna-map/
      types.ts
      utils.ts
      hooks/
        useEditorState.ts
        useSaunaVisits.ts
        useVisitFilters.ts
      components/
        VisitForm.tsx
        VisitList.tsx
        VisitMarkers.tsx
        FilterModal.tsx
        ShareModal.tsx
        ConfirmModal.tsx
        Toast.tsx
        common.tsx
```

## セットアップ

```bash
git clone <repository_url>
cd sauna-itta
npm install
npm run dev
```

- アプリ: `http://localhost:3000`
- 統計: `http://localhost:3000/stats`

## スクリプト

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## データ保存について

- 保存先: `localStorage`
  - `sauna-itta_visits`
  - `sauna-itta_theme`
- サーバー同期は行いません。
- ブラウザストレージ削除時にデータは消えるため、必要に応じて JSON エクスポートでバックアップしてください。

## GitHub Pages デプロイ

`.github/workflows/deploy.yml` により、`main` ブランチ push 時に GitHub Pages へデプロイします。

必要設定:

- GitHub リポジトリの `Settings > Pages > Build and deployment > Source` を `GitHub Actions` にする

