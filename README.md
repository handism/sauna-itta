# サウナイッタ (sauna-itta)

サウナ訪問記録と行きたい施設をLeafletマップ上で管理する、Next.js 16＋Rails 8のモノレポです。配布先に応じて、オフライン対応デモと個人用クラウド版を同じフロントエンドから生成します。

## 2つの実行モード

| モード | `NEXT_PUBLIC_DATA_SOURCE` | データ | 配信 |
|---|---|---|---|
| GitHub Pagesデモ | `local`（既定） | 同梱JSON＋`localStorage` | `/sauna-itta`、PWA／Service Worker有効 |
| GCP個人版 | `api` | Rails API＋PostgreSQL＋非公開GCS | basePathなし、オンライン必須、Service Worker無効 |

APIモードは許可したGoogleアカウント1件だけが利用できます。オフライン編集キュー、競合マージ、公開共有、管理画面、サーバー側統計集計は対象外です。JSONエクスポートは両モードで利用でき、APIインポートは10件ずつ送信して既存IDを除外するため再実行できます。途中で通信に失敗した場合は、確定済み件数を表示してサーバー状態を再読み込みします。

localモードの同梱JSONは、localStorageへの保存がまだ無いときの初期データです。一度でも記録を編集・追加・削除すると以降は保存側だけが正になります（同梱JSONを毎回足し戻さないため、デモ記録の編集や削除も再読み込み後に残ります）。APIモードのエクスポートJSONは写真を `/api/v1/images/...` のURLとして書き出すため、そのファイルをlocalモードへ取り込んでも写真は表示されません（記録本体は取り込めます）。

## 主な機能

- 訪問済み／行きたいサウナの地図登録、検索、タグ・エリア・評価フィルター
- 複数回の訪問履歴、評価、コメント、クライアント側で1MB／1024px以下へ圧縮する写真
- レスポンシブなデスクトップサイドバー／モバイルボトムシート
- 月別件数、評価分布、訪問カレンダー、タグ、ホームサウナ等の統計画面
- ダーク／ライトテーマ、キーボード操作、ライブリージョン、モーション低減対応
- JSONバックアップ／インポート

## アーキテクチャ

```text
GitHub Pages (local)                 Cloud Run (api)
┌──────────────────────┐            ┌────────────────────────────┐
│ Next.js static export│            │ Rails / Puma               │
│ demo JSON            │            │ ├─ Next.js static export   │
│ localStorage + PWA   │            │ └─ /api, /auth, /images    │
└──────────────────────┘            └──────────┬─────────┬───────┘
                                               │         │
                                  ┌────────────▼─┐  ┌────▼──────────┐
                                  │ Cloud SQL 17 │  │ private GCS   │
                                  │ PostgreSQL   │  │ Active Storage│
                                  └──────────────┘  └───────────────┘
```

フロントの `VisitRepository` がlocalStorage実装とAPI実装を分離します。既存のContextはUI、CRUD、フィルター、編集、地図状態の責務分割を維持し、CRUDはサーバー成功後だけクライアント状態を更新します。APIはcamelCase JSONと `{ "error": { "code", "message", "details?" } }` の共通エラー形式を返します。

Railsは `User`、`SaunaVisit`、`VisitHistoryEntry` を `user_id` で分離します。任意の既存IDは `external_id` に保持し、新規IDにはUUIDを使います。写真はdata URLを復号・検証してActive Storageへ保存し、ログインユーザーで所有権を確認する画像エンドポイントだけから配信します。写真の削除・差し替えは記録更新と同じトランザクションで行い、更新が確定した後だけ古いblobを削除します。

localモードのService Workerは静的資産と地図タイルを別キャッシュへ保存します。OpenStreetMapタイルは最大200件に制限し、更新時はこのアプリの旧キャッシュだけを削除します。

## ディレクトリ

```text
frontend/            Next.jsフロントエンド（src/、public/、npm設定、開発用Dockerfile）
backend/             Rails 8.1.3 API／セッション／静的成果物配信
infra/               GCP Terraform（scripts/にstate bootstrap）
.github/workflows/   PR CI、Pages、GCP継続デプロイ
Dockerfile           APIモードNext.js＋Railsの本番イメージ
docker-compose.yaml  frontend／api／PostgreSQL 17
```

## フロントエンド開発

Node.js 22を使用します。npmコマンドは `frontend/` ディレクトリで実行します。

```bash
cd frontend
npm ci
npm run dev
npm run test
npm run test:coverage
npm run lint
npm run typecheck
npm run build:local
npm run build:api
```

`npm run build` は環境変数未指定時にlocalモードを生成します。`npm run test:coverage` は `vitest.config.ts` のカバレッジ閾値付きで実行し、CIもこちらを使います。

依存関係の更新はDependabot（`.github/dependabot.yml`）がnpm・Bundler・GitHub Actions・Dockerを毎週チェックします。

## Docker Composeでローカル起動

DockerとDocker Composeを用意し、必要に応じて `.env.example` を `.env` へコピーしてOAuth値を設定します。
（※ 環境によっては `docker compose` の代わりに `docker-compose` コマンドを使用してください）

```bash
docker-compose up --build
```

フロントの依存関係は `frontend/Dockerfile.frontend.dev` のビルド時に `npm ci` でインストールされます。APIは前回の異常終了で残ったRailsのPIDファイルを除去し、`bin/rails db:prepare` を実行してから起動します。`package.json` または `package-lock.json` を更新した場合も、フロントイメージへ依存関係を反映するため再度 `docker-compose up --build` を実行してください。

- フロント: `http://localhost:3000`
- Rails: `http://localhost:3001`
- 開発ログイン: `ENABLE_DEV_LOGIN=true` の場合だけ `POST http://localhost:3000/dev/login`

開発ログインはdevelopment環境でしかルーティングされず、本番には存在しません。写真は `backend_storage`、DBは `postgres_data` Dockerボリュームに残ります。

### 開発ログインの実行手順

`POST /dev/login` はCSRF保護の対象です。アドレスバーから開く（`GET`する）、またはCSRFトークンなしで`POST`するとログインできません。ブラウザで `http://localhost:3000` を開き、開発者ツールのコンソールで次を実行してください。

```js
const session = await fetch("/api/v1/session").then((response) => response.json());
await fetch("/dev/login", {
  method: "POST",
  headers: { "X-CSRF-Token": session.csrfToken },
});
location.reload();
```

ブラウザが表示するSelf-XSSの警告は、開発者ツールへ出る一般的な注意喚起です。内容を理解できないコードは貼り付けず、上記コードもローカルアプリの `/api/v1/session` と `/dev/login` にだけアクセスすることを確認してから実行してください。

`.env` に実際のOAuth情報を設定していない場合、Googleログイン用のクライアントIDは開発用ダミー値 `development-client-id` になります。この状態で「Googleでログイン」を選ぶと、Google側で `401: invalid_client` が表示されます。ローカル開発では上記の開発ログインを使うか、次節の手順でOAuthクライアントを設定してください。

## Google OAuth設定

Google Cloud ConsoleでOAuth 2.0ウェブクライアントを作り、承認済みリダイレクトURIを設定します。

- ローカル: `http://localhost:3000/auth/google_oauth2/callback`
- 本番: `https://SERVICE_HASH.asia-northeast1.run.app/auth/google_oauth2/callback`

`ALLOWED_GOOGLE_EMAIL` は大文字小文字を正規化した完全一致で検査されます。OAuthクライアントID／秘密鍵はローカルでは環境変数、本番ではSecret Managerから渡します。

## Rails API

主要エンドポイントは以下です。変更系はセッションCookieと `GET /api/v1/session` が返すCSRFトークンを必要とします。

- `GET /api/v1/session`、`DELETE /api/v1/session`
- `GET|POST /api/v1/sauna_visits`
- `PATCH|DELETE /api/v1/sauna_visits/:id`
- `DELETE /api/v1/sauna_visits/:id/history_entries/:history_id`
- `POST /api/v1/sauna_visits/imports`（最大10件）
- `GET /api/v1/images/:signed_id`

他ユーザーの外部ID／履歴／写真は404になります。更新は `lock_version` による楽観ロックを使い、競合時は409を返します。座標、ステータス、評価0〜5、写真MIME（JPEG／PNG／WebP／GIF。SVG不可）と復号後1MB上限を検証します。

Rails単体の検証:

```bash
cd backend
bundle install
bin/rails db:prepare
bin/rails test
bundle exec rubocop
bundle exec brakeman --no-pager
```

## GCP構築

Terraformは `asia-northeast1` に次を作成します。

- Cloud Run: 1 vCPU、512MiB、min 0／max 2、concurrency 10
- Cloud SQL PostgreSQL 17: `db-f1-micro`、単一ゾーン、SSD 10GB、日次バックアップ、PITRなし
- Public Access Prevention付き非公開GCS、Artifact Registry、Secret Manager
- 実行／デプロイ用サービスアカウント、GitHub Actions WIF
- 初期値月3,000円の50%／90%／100%予算通知

### 1. stateバケットのbootstrap

```bash
./infra/scripts/bootstrap-terraform-state.sh PROJECT_ID UNIQUE_STATE_BUCKET
terraform -chdir=infra init -backend-config="bucket=UNIQUE_STATE_BUCKET" -backend-config="prefix=sauna-itta"
```

stateバケットだけをbootstrapし、以後の基盤変更はTerraformへ集約します。

### 2. Secret値とDBパスワード

TerraformはSecretコンテナだけを作り、値をstateへ保存しません。`terraform apply` 後に値を手動登録します。

```bash
printf '%s' "$DATABASE_PASSWORD" | gcloud secrets versions add sauna-itta-database-password --data-file=-
printf '%s' "$GOOGLE_CLIENT_ID" | gcloud secrets versions add sauna-itta-google-client-id --data-file=-
printf '%s' "$GOOGLE_CLIENT_SECRET" | gcloud secrets versions add sauna-itta-google-client-secret --data-file=-
bundle exec rails secret | gcloud secrets versions add sauna-itta-rails-secret-key-base --data-file=-
gcloud sql users set-password postgres --instance=sauna-itta-postgres --password="$DATABASE_PASSWORD"
```

`terraform.tfvars.example` を参考に実値入り `terraform.tfvars` を作成します（Git管理対象外）。初回用イメージをArtifact Registryへpushしてから `terraform apply` してください。

Cloud RunはCloud SQLのUnix socketを使うためVPC Connectorは不要です。本番DBへデモseedは投入しません。local版からエクスポートしたJSONを画面で一度インポートします。

## 継続デプロイとロールバック

- `ci.yml`: npm検証、Rails test／RuboCop／Brakeman、Terraform format／validate、本番Docker build
- `pages.yml`: mainからlocalモードをGitHub Pagesへ配信
- `gcp-deploy.yml`: GCP基盤の構築完了後に手動実行します。WIF/OIDCで認証し、イメージを一度だけbuild・push。同一digestでmigration job成功後にCloud Runを更新

GitHub Environment `gcp-production` に `GCP_PROJECT_ID`、`GCP_WORKLOAD_IDENTITY_PROVIDER`、`GCP_DEPLOYER_SERVICE_ACCOUNT` をVariablesとして登録します。長期鍵はGitHub Secretsへ保存しません。

GCPデプロイは、未構築の環境で`main`へのpushが失敗し続けないよう、初期状態では`workflow_dispatch`による手動実行専用です。Terraform適用、Secret登録、上記Variablesの登録がすべて完了してからActions画面で実行してください。継続デプロイを有効にする場合は、その確認後に`gcp-deploy.yml`へ`main`の`push`トリガーを追加します。

アプリのロールバックはCloud Runコンソールまたは `gcloud run services update-traffic` で直前revisionへトラフィックを戻します。migrationは先に追加変更、後のリリースで削除するexpand/contract方式を守ります。

## バックアップ・復旧・費用

Cloud SQLは日次バックアップを有効にしますがPITRは無効です。復旧時はバックアップから新インスタンスへリストアし、接続先を切り替えて画像との整合性を確認します。GCSはオブジェクトバージョニングを有効にし、誤削除時は旧世代から復元します。定期的なJSONエクスポートも利用者側バックアップとして保管してください。

Cloud Runはscale-to-zeroしますがCloud SQLは停止しないため、アクセスがなくても固定費が残ります。Google Cloud無料トライアルは現在90日・$300ですが、Cloud SQLは無料枠対象外です。利用前に公式の[Google Cloud無料プログラム](https://docs.cloud.google.com/free/docs/free-cloud-features)と[Cloud SQL料金](https://cloud.google.com/sql/pricing)を確認し、不要になった試用基盤は削除してください。

Rails／Active Storageの仕様は[Railsリリース](https://www.rubyonrails.org/releases)と[Active Storageガイド](https://guides.rubyonrails.org/active_storage_overview.html)を参照してください。
