# サウナイッタ (sauna-itta) 🧖‍♂️🗺️

「サウナイッタ」は、自分が訪れたサウナを地図上に記録し、振り返ることができる「マイ・ととのいマップ」Webアプリケーションです。Next.js と React Leaflet を用いて構築されています。

## ✨ 主な機能 (Features)

- **サウナのピン留め**: 地図上をクリックして、新しく訪れたサウナのピンを立てることができます。
- **詳細情報の記録**: サウナの名前だけでなく、**写真**、**感想・メモ**（水風呂の温度、外気浴の雰囲気など）を記録可能です。
- **編集・削除機能**: 一度登録したサウナの記録は、後からいつでも編集や削除が可能です。
- **テーマ切り替え (Dark / Light)**: 画面右上から、目に優しいダークモードと明るいライトモードをワンタップで切り替えられます。
- **プライバシー考慮**: 全ての記録データはブラウザの `localStorage`（ローカルストレージ）に保存されます。アカウント登録や外部サーバーへのデータ同期は一切不要です。（※ブラウザのキャッシュをクリアするとデータが消える点にご注意ください）

## 🚀 技術スタック (Tech Stack)

- **フレームワーク**: [Next.js](https://nextjs.org/) (App Router)
- **UI / 状態管理**: React 19 / TypeScript
- **マップ描画**: [React Leaflet](https://react-leaflet.js.org/) & [Leaflet](https://leafletjs.com/) (+ OpenStreetMap)
- **スタイリング**: 標準 CSS (CSS Variables を用いたテーマ切り替え)
- **CI / CD**: GitHub Actions 経由での GitHub Pages 自動デプロイ

## 🛠 開発環境のセットアップ (Getting Started)

ローカル環境で開発を始める手順は以下の通りです。

```bash
# リポジトリのクローン
git clone <repository_url>
cd sauna-itta

# パッケージのインストール
npm install
# または yarn install / pnpm install / bun install

# 開発サーバーの起動
npm run dev
# または yarn dev / pnpm dev / bun dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) にアクセスすると、アプリケーションが立ち上がります。

## 🌐 デプロイについて (Deployment)

このプロジェクトは GitHub Pages へのデプロイ設定が含まれています（`.github/workflows/deploy.yml`）。
`main` ブランチに変更がプッシュされると、GitHub Actions がトリガーされて自動的にビルドおよびデプロイが行われます。

**注意:** デプロイを正常に機能させるには、GitHub リポジトリの `Settings > Pages > Build and deployment > Source` の項目を **「GitHub Actions」** に変更してください。
