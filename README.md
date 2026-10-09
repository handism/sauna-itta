# サウナイッタ (sauna-itta)

サウナ訪問記録と行きたい施設をLeafletマップ上で管理する、Next.js 16＋Rails 8のモノレポです。配布先に応じて、オフライン対応デモと個人用クラウド版を同じフロントエンドから生成します。

## 記録と振り返りの操作

- デスクトップの「記録する」から場所とサウナ名を指定し、行った記録は訪問日も入力して保存します。満足度・感想・写真・タグは「詳しく記録する（任意）」を開いて追加できます。編集時は詳細項目を開いた状態で表示し、閉じても入力内容は保持します。
- 一覧は施設名を最大2行、エリアと訪問情報を別行で表示します。本文の背景は不透明にして、地図の地名と重ならないようにしています。
- クイックフィルターには満足度4以上とよく使う地域・タグを各1件表示します。「地域・タグ」または詳細フィルターボタンから、全候補を分類して選べます。有効な条件はチップから個別に解除できます。
- 統計はサマリー、月別訪問数・満足度分布、訪問カレンダー、ホームサウナ・ランキング、タグ、都道府県の順で振り返れます。

## 2つの実行モード

| モード           | `NEXT_PUBLIC_DATA_SOURCE` | データ                           | 配信                                             |
| ---------------- | ------------------------- | -------------------------------- | ------------------------------------------------ |
| GitHub Pagesデモ | `local`（既定）           | 同梱JSON＋`localStorage`         | `/sauna-itta`、PWA／Service Worker有効           |
| GCP個人版        | `api`                     | Rails API＋PostgreSQL＋非公開GCS | basePathなし、オンライン必須、Service Worker無効 |

`NEXT_PUBLIC_DATA_SOURCE`は未指定時にlocalとなり、`local`／`api`以外の値はbasePath・Repository・Service Workerの混在構成を防ぐためビルドエラーになります。

APIモードは許可したGoogleアカウント1件だけが利用できます。ログアウトはサイドバーのメニュー（…）から行えます。別タブでログアウトするなどしてセッションが失われた場合は、次の操作の失敗をきっかけにセッションを取り直し、ログイン画面へ戻ります。オフライン編集キュー、競合マージ、公開共有、管理画面、サーバー側統計集計は対象外です。JSONエクスポートは両モードで利用でき、APIインポートは最大10件・約8MBずつに区切って送信し（写真入りの記録でCloud Runのリクエスト上限を超えないため）、既存IDを除外するため再実行できます。ファイルの形式が合わない場合は、何件目の記録のどの項目が正しくないかを表示します。途中で通信に失敗した場合は、確定済み件数を表示してサーバー状態を再読み込みします。

localモードの同梱JSONは、localStorageへの保存がまだ無いときの初期データです（apiモードのビルドでは空配列へ差し替え、配信物に含めません）。一度でも記録を編集・追加・削除すると以降は保存側だけが正になります（同梱JSONを毎回足し戻さないため、デモ記録の編集や削除も再読み込み後に残ります）。エクスポートJSONは両モードとも写真をdata URLとして含むため、モードやアカウントをまたいで取り込んでも写真が復元されます（APIモードはエクスポート時に写真をサーバーから取得します）。以前の版のAPIモードで書き出した、写真が `/api/v1/images/...` のURLになっているJSONは、写真だけを外して取り込み、外した枚数を通知します。複数タブで開いている場合も、保存は常に最新の保存値へ変更を当て、他タブの表示は `storage` イベントで自動的に更新されます。

## 主な機能

- 訪問済み／行きたいサウナの地図登録、検索、タグ・エリア・評価フィルター（一覧のタグを押すとそのタグで絞り込み）。3回以上行った施設のピンは一回り大きく金の縁取りで表示。行きたいの記録もクラスタにまとめ、行きたいを含むクラスタには緑の星の印を付ける
- 「場所」「記録の内容」「タグ」「これまでの訪問」に区切った登録フォーム（編集時は「新しい訪問を追加／前回の記録を修正」を切り替え、選んだ星をもう一度押すと評価を外せる。タグはEnterか「、」で1件ずつチップとして確定し、×で外せる。タグ候補はよく使うタグ順。地図で場所を選ぶとエリア欄へ都道府県＋市区町村を自動で入れる。場所やサウナ名が足りないまま保存を押すと、その箇所へ案内する）
- 一覧カード・地図ポップアップの「また行った」（行きたい記録は「行った！」）から、今日の訪問を追加する状態のフォームを直接開ける
- 複数回の訪問履歴、評価、コメント、クライアント側で1MB／1024px以下へ圧縮する写真（JPEG／PNG／WebP／GIFのみ。選択時に弾くため、保存してから形式で失敗しません）
- 日付は「2026年10月4日（日）」形式で表示し、行きたい記録には行った日を出さない。行った記録で評価が無いものは「未評価」と表示し、行きたい記録には（行ったから切り替えて評価が残っていても）星を出さない
- 地図は起動時にすべての記録が見える範囲へ合わせる（サイドバー・ボトムシートに隠れる分を除く）。一覧から選ぶと駅や地区の名前が読める縮尺（ズーム13）まで寄る
- レスポンシブなデスクトップサイドバー／モバイルボトムシート（モバイルの下部ナビはマップ・一覧・追加・統計。詳細フィルターは一覧の検索欄の横。検索欄と絞り込みの行は一覧をスクロールしても上に残る。リスト／カード表示はモバイルとデスクトップで別々に記憶。新規登録時は場所の選択状態をフォームと地図の両方に表示し、モバイルの場所選択中も施設名・住所で検索できる。検索で選んだ場所が画面外なら地図がそこへ移動。保存ボタンはフォーム下端に固定）
- 全期間／年ごとの切り替え（サマリー・ランキング・グラフ・タグ・カレンダーをその年の訪問だけで集計）、延べ訪問回数などのサマリー、月別件数（訪問の無い月も0件として表示）、評価分布（凡例付き、評価の高さを明るさの段階で表す配色）、直近1年（年を選んだときはその年の1〜12月）の訪問ヒートマップと訪問カレンダー（サマリーの直後に置き、最後に訪問した月から表示。横に表示中の月の訪問一覧を並べ、日を選ぶとその日の訪問に絞り込む）、都道府県制覇（47都道府県を北から南の順に並べ、未訪問も表示。広い画面では日本地図の形のタイルと地方ごとの制覇数で表示）、タグ（よく使う順に先頭だけ表示）、ホームサウナ・よく行く施設TOP 5（2回以上行った施設が無いときは案内／満足度順に切り替え）等の統計画面（記録が無いとき・行きたいだけのときは、統計が表示されるまでの手順を案内）
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

Googleログインは `ALLOWED_GOOGLE_EMAIL` と一致し、かつ確認済みのメールアドレスだけを通します。Railsは `User`、`SaunaVisit`、`VisitHistoryEntry` を `user_id` で分離します。任意の既存IDは `external_id` に保持し、新規IDにはUUIDを使います。写真はdata URLを復号・検証してActive Storageへ保存し、ログインユーザーで所有権を確認する画像エンドポイントだけから配信します。写真の削除・差し替えは記録更新と同じトランザクションで行い、更新が確定した後だけ古いblobを削除します。

localモードのService Workerは静的資産と地図タイルを別キャッシュへ保存します。OpenStreetMapタイルは最大200件に制限し、更新時はこのアプリの旧キャッシュだけを削除します。統計画面は必須資産とは別枠で先読みするため、一度も開かずにオフラインへ入っても遷移できます（先読みに失敗してもインストールは成功します）。キャッシュ書き込みはService Workerイベントの完了条件へ含め、ブラウザがバックグラウンド処理を途中終了して保存が欠落しないようにしています。

APIモードでは、Railsが同梱するNext.js成果物のうち内容ハッシュ付きの `/_next/static/` だけに長期キャッシュ（`immutable`）を付けます。`index.html` は毎回再検証されるため、デプロイした更新はすぐ届きます。

APIモードのHTMLにはContent-Security-Policyを付けます。inline scriptは `'unsafe-inline'` で許可せず、配信するHTMLに含まれるscriptのハッシュだけを許可します（ビルドのたびに変わるハッシュはRailsが配信時に求めるため、手で更新する必要はありません）。外部への通信は地図タイルと場所検索（OpenStreetMap）、Googleログインのリダイレクトだけを許可しています。GitHub Pages（localモード）はレスポンスヘッダを設定できないため対象外です。

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

Node.js 24 (LTS) を使用します。バージョンはリポジトリ直下の `.nvmrc` と `frontend/package.json` の `engines` に記載しているため、nvm利用時は `nvm use` で切り替えられます。それより古いNode.jsでは `npm run test` が実行前に版の不一致を伝えて止まります（`nodeVersion.test.ts` が `engines` と `.nvmrc` の一致を検査します）。npmコマンドは `frontend/` ディレクトリで実行します。

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
npm run playwright:install
npm run test:e2e
```

`npm run build` は環境変数未指定時にlocalモードを生成します。`npm run test:coverage` は `vitest.config.ts` のカバレッジ閾値付きで実行し、CIもこちらを使います。

Playwright E2Eはローカルで任意に行う実ブラウザ確認です。初回だけ`npm run playwright:install`でChromiumを用意し、`npm run test:e2e`（対話的に確認する場合は`npm run test:e2e:ui`）を実行してください。開発速度を維持するためGitHub Actionsの必須CIには含めていません。localモードのテーマ保持、統計導線、地点検索の明示実行、モバイルのボトムシートを検査します。

地点検索は公共Nominatimの利用方針に合わせ、入力中には送信せず検索ボタンまたはEnterで実行します。同一語句はブラウザ内でキャッシュし、連続検索は1秒間隔です。地図で選んだ場所からエリアを補う逆ジオコーディング（同じ接続先の`/reverse`）も、場所を選び直してから1秒待って最後の1回だけ送ります。Nominatim互換サービスへ切り替える場合はビルド時に`NEXT_PUBLIC_GEOCODING_ENDPOINT`を指定します。

依存関係の更新はDependabot（`.github/dependabot.yml`）がnpm・Bundler・GitHub Actions・Docker・Terraform（Google provider。majorは対象外）を毎週チェックします。

## Docker Composeでローカル起動

DockerとDocker Composeを用意し、必要に応じて `.env.example` を `.env` へコピーしてOAuth値を設定します。

```bash
docker compose up --build
```

フロントの依存関係は `frontend/Dockerfile.frontend.dev` のビルド時に `npm ci` でインストールされます。APIは前回の異常終了で残ったRailsのPIDファイルを除去し、`bin/rails db:prepare` を実行してから起動します。`package.json` または `package-lock.json` を更新した場合も、フロントイメージへ依存関係を反映するため再度 `docker-compose up --build` を実行してください。

### Gemfileを更新したとき

APIのgemは名前付きボリューム `backend_bundle` を `/usr/local/bundle` へマウントして保持します。名前付きボリュームは空のときだけイメージの中身で初期化されるため、`Gemfile` や `Gemfile.lock` を更新しても**`--build` では反映されません**。イメージのビルドは成功するのに起動時だけ `Bundler::GemNotFound` で落ちる場合はこれが原因です。次のコマンドでボリューム側へ反映してください。

```bash
docker compose run --rm --no-deps api bundle install --jobs 4 --retry 3
```

`docker volume rm sauna-itta_backend_bundle` してから `docker compose up` でも、ボリュームが再作成されるため解消します。ただし `docker compose down -v` は `postgres_data` も削除してローカルの開発用DBが失われるため使わないでください。

- フロント: `http://localhost:3000`
- Rails: `http://localhost:3001`
- 開発ログイン: `ENABLE_DEV_LOGIN=true` の場合だけ `POST http://localhost:3000/dev/login`

開発ログインはdevelopment環境でしかルーティングされず、本番には存在しません。写真は `backend_storage`、DBは `postgres_data` Dockerボリュームに残ります。

### 開発ログインの実行手順

`POST /dev/login` はCSRF保護の対象です。アドレスバーから開く（`GET`する）、またはCSRFトークンなしで`POST`するとログインできません。ブラウザで `http://localhost:3000` を開き、開発者ツールのコンソールで次を実行してください。

```js
const session = await fetch("/api/v1/session").then((response) =>
  response.json(),
);
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

Googleログインの開始は`GET /api/v1/session`が返すCSRFトークンを含むPOSTフォームで行います。`/auth/google_oauth2`をアドレスバーからGETしてもログインは開始されません。

## Rails API

主要エンドポイントは以下です。変更系はセッションCookieと `GET /api/v1/session` が返すCSRFトークンを必要とします。

- `GET /api/v1/session`、`DELETE /api/v1/session`
- `GET|POST /api/v1/sauna_visits`（一覧は `limit`（最大200）と `cursor` でページ単位に取得し、応答の `nextCursor` が `null` になるまで辿ります。`limit` を付けない呼び出しは従来どおり全件を返します）
- `PATCH|DELETE /api/v1/sauna_visits/:id`
- `DELETE /api/v1/sauna_visits/:id/history_entries/:history_id`
- `POST /api/v1/sauna_visits/imports`（最大10件、1記録あたりの履歴は最大1000件。旧形式の訪問回数`visitCount`はこのエンドポイントだけが受け付けます）
- `GET /api/v1/images/:signed_id`
- `POST /api/v1/client_errors`（ブラウザで起きたエラーを受け取り、`"event":"client_error"` を含む1行のJSONとしてログへ残します。ログイン中だけ受け付けます）

`/api/` へのリクエストボディは24MBまでで、超えると413（`payload_too_large`）を返します。フロントのインポートは約8MBずつに区切って送るため、この上限には通常かかりません。各APIはユーザーごとに1分あたりの回数を制限し、超えると429（`rate_limited`）を返します（一覧120回、作成・更新・削除60回、インポート60回、画像600回、エラー報告10回。Cloud Runのインスタンスごとに数えます）。

履歴を1件削除すると、旧形式から引き継いだ訪問回数も残りの履歴件数まで下がります（localモードと同じ扱い）。

他ユーザーの外部ID／履歴／写真は404になります。更新は `lock_version` による楽観ロックを使い、`lockVersion` の無い更新は422、競合時は409（`error.code`は楽観ロックの競合が`conflict`、同時操作による一意制約の重複が`duplicate`）を返します。履歴だけの変更や履歴の削除でも `lock_version` は進みます。座標、ステータス、評価0〜5、写真MIME（JPEG／PNG／WebP／GIF。SVG不可）と復号後1MB上限を検証します。インポートの件数上限・写真の形式とサイズ上限はフロントの`frontend/src/components/sauna-map/utils/apiLimits.json`と共有しており、`backend/test/contract/frontend_api_limits_test.rb`が一致を検査します。

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
- Public Access Prevention付き非公開GCS（バージョニング、非現行世代は既定30日後に削除）、Artifact Registry、Secret Manager
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

- `ci.yml`: npm検証、Rails test／RuboCop／Brakeman、Terraform format／validate、本番Docker build／DB準備／`GET /up`スモークテスト
- `pages.yml`: mainからlocalモードをGitHub Pagesへ配信
- `gcp-deploy.yml`: GCP基盤の構築完了後に手動実行します。WIF/OIDCで認証し、イメージを一度だけbuild・push。同一digestでmigration job成功後にCloud Runを更新

GitHub Environment `gcp-production` に `GCP_PROJECT_ID`、`GCP_WORKLOAD_IDENTITY_PROVIDER`、`GCP_DEPLOYER_SERVICE_ACCOUNT` をVariablesとして登録します。長期鍵はGitHub Secretsへ保存しません。

GCPデプロイは、未構築の環境で`main`へのpushが失敗し続けないよう、初期状態では`workflow_dispatch`による手動実行専用です。Terraform適用、Secret登録、上記Variablesの登録がすべて完了してからActions画面で実行してください。継続デプロイを有効にする場合は、その確認後に`gcp-deploy.yml`へ`main`の`push`トリガーを追加します。

アプリのロールバックはCloud Runコンソールまたは `gcloud run services update-traffic` で直前revisionへトラフィックを戻します。migrationは先に追加変更、後のリリースで削除するexpand/contract方式を守ります。

## バックアップ・復旧・費用

Cloud SQLは日次バックアップを有効にしますがPITRは無効です。復旧時はバックアップから新インスタンスへリストアし、接続先を切り替えて画像との整合性を確認します。GCSはオブジェクトバージョニングを有効にし、誤削除時は旧世代から復元します。削除済み写真を無期限に保持しないよう、非現行世代は`photo_version_retention_days`（既定30日）後にライフサイクル削除します。定期的なJSONエクスポートも利用者側バックアップとして保管してください。

Cloud Runはscale-to-zeroしますがCloud SQLは停止しないため、アクセスがなくても固定費が残ります。Google Cloud無料トライアルは現在90日・$300ですが、Cloud SQLは無料枠対象外です。利用前に公式の[Google Cloud無料プログラム](https://docs.cloud.google.com/free/docs/free-cloud-features)と[Cloud SQL料金](https://cloud.google.com/sql/pricing)を確認し、不要になった試用基盤は削除してください。

Rails／Active Storageの仕様は[Railsリリース](https://www.rubyonrails.org/releases)と[Active Storageガイド](https://guides.rubyonrails.org/active_storage_overview.html)を参照してください。

## 非同期読み込みの競合対策

- `useVisitSession`は初回読み込み・再読み込み・セッション再取得の世代を共有し、最新の操作だけが一覧・認証・エラー・読み込み中状態を反映します。ログアウト後のリセットとアンマウントでは古い取得を無効化し、無効化された`reload`は`false`を返します。`ApiVisitRepository`もセッション取得の世代を管理し、古い応答で内部のCSRFトークンや認証状態を戻さないようにします。
