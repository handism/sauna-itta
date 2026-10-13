# サウナイッタ (sauna-itta)

サウナの訪問記録と行きたい施設をLeafletの地図上で管理するアプリです。Next.js 16＋Rails 8のモノレポで、同じフロントエンドからオフライン対応のデモ版と個人用クラウド版を生成します。

## 主な機能

- 訪問済み／行きたいサウナの地図登録（ピンのクラスタ表示、3回以上行った施設は金の縁取り）
- 訪問履歴・満足度・感想・タグ・写真（クライアント側で1MB／1024px以下へ圧縮）の記録。一覧や地図から「また行った」で今日の訪問を追加
- 検索、地域・タグ・満足度での絞り込み
- 統計（サマリー、月別訪問数・満足度分布、訪問カレンダー、ホームサウナ・ランキング、タグ、都道府県制覇）。全期間／年ごとに切り替え可能
- デスクトップのサイドバー／モバイルのボトムシート、ダーク／ライトテーマ、キーボード操作・モーション低減対応
- JSONでのバックアップ／インポート（両モード共通。写真もdata URLとして含むため、モードをまたいで移行可能）

## 2つの実行モード

| モード           | `NEXT_PUBLIC_DATA_SOURCE` | データ                           | 配信                                             |
| ---------------- | ------------------------- | -------------------------------- | ------------------------------------------------ |
| GitHub Pagesデモ | `local`（既定）           | 同梱JSON＋`localStorage`         | `/sauna-itta`、PWA／Service Worker有効           |
| GCP個人版        | `api`                     | Rails API＋PostgreSQL＋非公開GCS | basePathなし、オンライン必須、Service Worker無効 |

- 未指定時は`local`です。`local`／`api`以外の値はビルドエラーになります。
- localモードの同梱JSONは、`localStorage`に保存が無いときだけ使う初期データです。
- apiモードは許可した1つのGoogleアカウントだけが利用できます。オフライン編集、公開共有、管理画面は対象外です。

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

フロントの`VisitRepository`がlocalStorage実装とAPI実装を切り替えます。Railsはユーザーごとに記録を分離し、写真はActive Storageへ保存して所有者だけに配信します。

```text
frontend/            Next.jsフロントエンド
backend/             Rails 8.1 API／セッション／静的成果物配信
infra/               GCP Terraform（scripts/にstate bootstrap）
.github/workflows/   CI、GitHub Pages、GCPデプロイ
Dockerfile           APIモードの本番イメージ（Next.js＋Rails）
docker-compose.yaml  ローカル開発（frontend／api／PostgreSQL 17）
```

実装上の規約は`AGENTS.md`（ルートと各ディレクトリ）にまとめています。

## フロントエンド開発

Node.js 24を使います（`.nvmrc`。nvm利用時は`nvm use`）。コマンドは`frontend/`で実行します。

```bash
cd frontend
npm ci
npm run dev             # 開発サーバー
npm run test            # Vitest（CIと同じ閾値は npm run test:coverage）
npm run lint
npm run typecheck
npm run build:local     # localモード（npm run build も同じ）
npm run build:api       # apiモード
```

Playwright E2Eは任意のローカル確認で、必須CIには含めていません。初回だけ`npm run playwright:install`を実行し、`npm run test:e2e`（対話的には`npm run test:e2e:ui`）で実行します。

場所検索は公共Nominatimを使います。別のNominatim互換サービスを使う場合はビルド時に`NEXT_PUBLIC_GEOCODING_ENDPOINT`を指定します。

## Docker Composeでローカル起動

必要に応じて`.env.example`を`.env`へコピーしてOAuth値を設定し、起動します。

```bash
docker compose up --build
```

- フロント: `http://localhost:3000`
- Rails: `http://localhost:3001`

`package.json`を更新したときは`--build`で再ビルドします。`Gemfile`を更新したときは、gemが名前付きボリュームに保持されているため`--build`では反映されません（起動時に`Bundler::GemNotFound`になります）。次で反映してください。

```bash
docker compose run --rm --no-deps api bundle install
```

`docker compose down -v`は開発用DB（`postgres_data`）も削除するため使わないでください。

### 開発ログイン

`ENABLE_DEV_LOGIN=true`（Docker Composeの既定）のとき、development環境だけで`POST /dev/login`が使えます。CSRFトークンが必要なため、`http://localhost:3000`を開いて開発者ツールのコンソールで実行します。

```js
const session = await fetch("/api/v1/session").then((r) => r.json());
await fetch("/dev/login", {
  method: "POST",
  headers: { "X-CSRF-Token": session.csrfToken },
});
location.reload();
```

OAuth情報を設定していない状態で「Googleでログイン」を選ぶと、Google側で`401: invalid_client`になります。

## Google OAuth設定

Google Cloud ConsoleでOAuth 2.0ウェブクライアントを作成し、承認済みリダイレクトURIを登録します。

- ローカル: `http://localhost:3000/auth/google_oauth2/callback`
- 本番: `https://SERVICE_HASH.asia-northeast1.run.app/auth/google_oauth2/callback`

ログインできるのは`ALLOWED_GOOGLE_EMAIL`と一致する確認済みメールアドレスだけです。クライアントID／秘密鍵はローカルでは環境変数、本番ではSecret Managerから渡します。

## Rails API

変更系はセッションCookieと、`GET /api/v1/session`が返すCSRFトークンが必要です。

| エンドポイント                                           | 内容                                           |
| -------------------------------------------------------- | ---------------------------------------------- |
| `GET｜DELETE /api/v1/session`                            | セッション取得／ログアウト                     |
| `GET｜POST /api/v1/sauna_visits`                         | 一覧（`limit`／`cursor`でページ取得）／作成    |
| `PATCH｜DELETE /api/v1/sauna_visits/:id`                 | 更新（`lockVersion`による楽観ロック）／削除    |
| `DELETE /api/v1/sauna_visits/:id/history_entries/:hid`   | 訪問履歴1件の削除                              |
| `POST /api/v1/sauna_visits/imports`                      | インポート（1リクエスト最大10件）              |
| `GET /api/v1/images/:signed_id`                          | 写真の取得                                     |
| `POST /api/v1/client_errors`                             | ブラウザのエラー報告（ログへ記録）             |

エラーは`{ "error": { "code", "message", "details?" } }`形式で返します。リクエストボディは24MBまで（超過は413）、回数はユーザーごとに制限しています（超過は429）。

```bash
cd backend
bundle install
bin/rails db:prepare
bin/rails test
bundle exec rubocop
bundle exec brakeman --no-pager
```

## GCP構築

Terraformは`asia-northeast1`に次を作成します。

- Cloud Run（1 vCPU、512MiB、最大2インスタンス、scale-to-zero）
- Cloud SQL PostgreSQL 17（`db-f1-micro`、単一ゾーン、日次バックアップ）
- 非公開GCS（バージョニング有効、非現行世代は既定30日で削除）、Artifact Registry、Secret Manager
- サービスアカウント、GitHub Actions用Workload Identity Federation、予算通知

### 1. stateバケットのbootstrap

```bash
./infra/scripts/bootstrap-terraform-state.sh PROJECT_ID UNIQUE_STATE_BUCKET
terraform -chdir=infra init -backend-config="bucket=UNIQUE_STATE_BUCKET" -backend-config="prefix=sauna-itta"
```

### 2. tfvarsとapply

`infra/terraform.tfvars.example`を参考に`terraform.tfvars`を作成します（Git管理対象外）。初回用イメージをArtifact Registryへpushしてから`terraform apply`します。

### 3. Secret値の登録

TerraformはSecretの入れ物だけを作り、値はstateへ保存しません。apply後に手動で登録します。

```bash
printf '%s' "$DATABASE_PASSWORD" | gcloud secrets versions add sauna-itta-database-password --data-file=-
printf '%s' "$GOOGLE_CLIENT_ID" | gcloud secrets versions add sauna-itta-google-client-id --data-file=-
printf '%s' "$GOOGLE_CLIENT_SECRET" | gcloud secrets versions add sauna-itta-google-client-secret --data-file=-
bundle exec rails secret | gcloud secrets versions add sauna-itta-rails-secret-key-base --data-file=-
gcloud sql users set-password postgres --instance=sauna-itta-postgres --password="$DATABASE_PASSWORD"
```

本番DBへデモデータは投入しません。必要ならlocal版でエクスポートしたJSONを画面からインポートします。

## CI・デプロイ

- `ci.yml`: フロントの検証、Rails test／RuboCop／Brakeman、Terraform validate、本番イメージのビルドと起動確認
- `pages.yml`: mainからlocalモードをGitHub Pagesへ配信
- `gcp-deploy.yml`: イメージをbuild・pushし、migration成功後にCloud Runを更新（手動実行）

GitHub Environment `gcp-production`のVariablesに`GCP_PROJECT_ID`、`GCP_WORKLOAD_IDENTITY_PROVIDER`、`GCP_DEPLOYER_SERVICE_ACCOUNT`を登録します。長期鍵は使いません。GCP環境の構築前に失敗し続けないよう、`gcp-deploy.yml`は手動実行（`workflow_dispatch`）だけにしています。継続デプロイにする場合は`main`への`push`トリガーを追加してください。

ロールバックはCloud Runで直前のrevisionへトラフィックを戻します。migrationは追加→後のリリースで削除のexpand/contract方式を守ります。

依存関係はDependabotが毎週更新を確認します。

## バックアップと費用

- Cloud SQLは日次バックアップ（PITRなし）です。復旧時は新インスタンスへリストアして接続先を切り替えます。
- 写真はGCSのバージョニングで誤削除から復元できます。
- 利用者側でも定期的にJSONエクスポートを保管してください。
- Cloud Runはscale-to-zeroしますが、Cloud SQLは常時課金されます（無料枠対象外）。[Cloud SQL料金](https://cloud.google.com/sql/pricing)を確認し、不要になった基盤は削除してください。
