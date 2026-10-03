# AGENTS.md

このファイルは、AI エージェント（Antigravity, Claude Code, Cursor 等）が本プロジェクト「sauna-itta」を理解し、一貫した品質とポリシーで開発を行うための指示書および開発ガイダンスです。

---

## 🚨 基本ルール (MANDATORY RULES)

- **言語**: 全てのやりとり、提案、ドキュメント、コードコメント、Implementation Plan、Walkthrough、コミットメッセージは**必ず日本語**で出力してください。
- **検証の徹底**: コードや設定を変更した場合は、必ず `frontend/` ディレクトリで `npm run test`（CIと同じ閾値で確認するなら `npm run test:coverage`）および `npm run lint` / `npm run typecheck` / `npm run build` を実行してパスしたことを確認してください。特に `npm run typecheck` は省略しないこと（Vitest は型検査をせず、`next build` もページから到達しない `*.test.*` を検査しないため、テストファイルの型崩れはこのコマンドでしか検出できません）。両モードに関係する変更では `npm run build:local` と `npm run build:api` も実行します。
- **ドキュメントの維持・最新化**: 新機能の追加、仕様変更、アーキテクチャの更新、開発スクリプトの変更等を行った場合は、必ず本ファイル（および下記の領域別 `AGENTS.md`）と `README.md` を同時に更新し、常にプロジェクトドキュメントを最新の状態に維持してください。

---

## 📐 領域別の詳細規約

詳細な規約は、対象ディレクトリを編集するときに読み込まれる領域別ファイルに分割しています。該当領域を触る際は必ず参照してください。

| ファイル | 対象 | 内容 |
| --- | --- | --- |
| `frontend/src/components/sauna-map/AGENTS.md` | 地図・訪問記録の実装全般 | 状態管理 (`SaunaMapContext`) の Provider 分割方針、コンポーネント／ユーティリティの使い分け、増分レンダリング |
| `frontend/src/AGENTS.md` | フロントエンド全般 | CSS デザイントークン・テーマ、アクセシビリティ ＆ モーション |
| `frontend/AGENTS.md` | フロントエンドの配布形態 | `NEXT_PUBLIC_DATA_SOURCE` の切り替え、`VisitRepository`、JSONエクスポート、Service Worker |
| `backend/AGENTS.md` | Rails API | 認可スコープ、インポート検証、写真の取り扱い、DB マイグレーション方針 |
| `infra/AGENTS.md` | GCP / Terraform | Secret 管理、デプロイ順序 |

**ファイル配置の規約**: 各ディレクトリとも実体は `AGENTS.md` で、`CLAUDE.md` はそれを指す相対シンボリックリンク (`ln -s AGENTS.md CLAUDE.md`) です。Claude Code は `CLAUDE.md`、その他のエージェントは `AGENTS.md` を読むため、この構成で両方に同じ内容が届きます。新しい領域別ファイルを追加する場合も同じ形式にし、`CLAUDE.md` を実体ファイルとして作らないでください（内容が二重管理になり、片方だけ古くなります）。

---

## ⚠️ 重要な制約・注意事項

1. **静的サイト制約**:
   - localモードにはバックエンド API やサーバーサイド DB への依存を持ち込まないでください。apiモードの永続化は`VisitRepository`経由のRails APIに限定します。
   - アセットパスや内部リンク生成時、localモードのGitHub Pages用`basePath` (`/sauna-itta`) とapiモードのbasePathなしを両立してください。パスの接頭辞は`frontend/dataSource.ts`の`BASE_PATH`から取得し、直書きしないこと（詳細は`frontend/AGENTS.md`）。
2. **パフォーマンス・画像圧縮**:
   - ユーザーがアップロードした画像は `browser-image-compression` で圧縮し、Base64 として `localStorage` に保持します（最大 1MB / 1024px）。
3. **React Compiler**:
   - `next.config.ts` で React Compiler が有効化されています。不要な再レンダリングや依存配列・再計算のバグを生む非純粋な関数定義・レンダリング内副作用を避けてください。

---

## データソース規約

配布形態（`NEXT_PUBLIC_DATA_SOURCE`）の切り替え、`VisitRepository`、JSONエクスポート、Service Workerの具体的な規約は `frontend/AGENTS.md` にあります。ここにはフロント・バックエンド双方に関わる契約だけを置きます。

- APIインポートは最大10件のチャンクを維持し、既存`external_id`をスキップして再実行可能にします。途中のチャンクで失敗した場合は必ず再読み込みし、確定済み件数とRepositoryのエラー理由を利用者へ通知します。再読み込み（`useVisitSession`の`reload`）は失敗を例外ではなく戻り値`false`で返し、内容は`loadError`へ入れます。インポートは戻り値で判定し、再読み込みに失敗したことを失敗時のエラートースト・成功時の完了トーストの両方へ追記してください（`try/catch`で拾う形へ戻すと、その分岐は本番で一度も通りません）。JSON形式エラーとして一律表示しないでください。JSONエクスポートは両モードで維持します。
- インポートの結果は `ImportResult` の `added` と `skipped` を両方とも利用者へ伝えます。チャンクごとの途中経過トーストは残りのチャンクがある間だけ出し、最後のチャンクの結果は完了トーストにまとめること（チャンク数と同じ回数トーストを出すと、大量取り込みで通知が連続します）。`skipped` にはサーバーが弾いた重複と、画面上の記録と重複してリクエスト前に除外した分の両方を含めます。
- 履歴エントリを1件削除したときの訪問回数は、両モードとも残りの履歴件数まで切り下げます（localは`getVisitsWithRemovedHistory`、apiは`HistoryEntriesController#truncate_legacy_visit_count`）。旧形式から引き継いだ回数（localの`visitCount`／apiの`legacy_visit_count`）を維持する実装へ戻すと、インポートした記録だけ「履歴を消したのに訪問回数が減らない」状態がモード間で食い違います。
- 409 の応答は `error.code` で2種類を区別します。楽観ロックの競合（`StaleObjectError`）は`conflict`、一意制約の重複（`RecordNotUnique`）は`duplicate`です。フロントの`toUserMessage`は409のうち`conflict`だけを「再読み込みしてからもう一度」の案内へ置き換え、`duplicate`はサーバーの文言をそのまま表示します。同じcodeへ戻したり、statusの409で一律に判定したりすると、重複の文言が画面に一度も出なくなります。Repositoryの失敗は両モードとも`RepositoryError`で投げます（localモードも`not_found`／`storage_failed`のcodeを持ちます）。
- Google OAuthのrequest phaseはPOSTだけを許可し、`GET /api/v1/session`のCSRFトークンを`authenticity_token`として送信します。通常リンクやGET許可へ戻さないでください。ログアウト（`DELETE /api/v1/session`）はRailsの`reset_session`でCSRFトークンを作り直すため、フロントはログアウト後に`useVisitSession`の`resetSession`でセッションを取り直し、新しいトークンへ差し替えます（ログイン前のトークンを持ち続けると、ログイン画面のPOSTが`invalid_csrf`で失敗します）。
- セッションの喪失（別タブでのログアウトなど）は、GETでは401 `unauthenticated`、変更系ではCSRF検証が`require_login`より先に走るため422 `invalid_csrf`として返ります。フロントは両方を`useVisitSession`の`isSessionLostError`でセッションの喪失とみなし、`revalidateSessionOnError`でセッションを取り直します（未ログインならログイン画面へ戻して記録を空にし、別タブで再ログイン済みなら新しいCSRFトークンへ差し替えます）。保存系は`useSaunaVisits`の`runMutation`、インポート・エクスポートは`withSessionRevalidation`、ログアウトは失敗時に呼びます。`reload`が401を受けて未ログインに戻った場合は`loadError`へ入れません（`ApiAccessGate`はエラーを優先して「再読み込み」だけを出し、ログインへ進めなくなります）。片方のcodeだけを見る形へ戻すと、保存・削除の失敗からログイン画面へ戻れません。
- APIの一覧（`GET /api/v1/sauna_visits`）は`limit`／`cursor`のページ取得で、フロントの`ApiVisitRepository#list`が`nextCursor`の無くなるまで辿ります。ページの並びは主キーの降順で、`updated_at`をカーソルにしないでください（取得の合間に更新された記録がカーソルより前へ移り、どのページにも現れなくなります）。`limit`の無い呼び出しは全件を返す互換動作のまま残します（デプロイ直後に古い版のフロントが残っていても、記録の一部だけが表示される状態にしないため）。表示順は画面側で並べ替えます。
- `/api/`へのリクエストボディは`RequestBodyLimit`（24MB）で413 `payload_too_large`、回数の上限は`rate_limit`で429 `rate_limited`を返します。フロントのインポートは`chunkVisitsForImport`で件数（10件）とJSONの大きさ（`MAX_CHUNK_BYTES`＝8MB）の両方でチャンクを分けます。件数だけで区切る形へ戻すと、写真の多い記録の取り込みが413で失敗します。ボディの上限はCloud Runのリクエスト上限（32MiB）より小さく保ってください（超えるとCloud RunがJSONでない応答で拒否し、理由を表示できません）。
- ブラウザのエラーは`utils/errorReporter.ts`の`reportError`から`VisitRepository.reportClientError`へ渡し、apiモードは`POST /api/v1/client_errors`でRailsのログ（Cloud Logging）へ残します（localモードは送りません）。`ErrorBoundary`の`componentDidCatch`と、ルートレイアウトの`ClientErrorReporter`（`window`の`error`／`unhandledrejection`）が呼びます。報告の失敗は握りつぶし、1ページあたり`MAX_REPORTS_PER_PAGE`件・同じエラーは1回までに抑えます。
- Playwright E2Eは開発者が`frontend/`で任意実行する確認であり、GitHub Actionsの必須CIへ追加しません。通常CIの所要時間を増やさず、主要導線を実ブラウザで確認したいときに`npm run test:e2e`を実行します。

---

## 開発環境

- リポジトリは`frontend/`（Next.js）／`backend/`（Rails）／`infra/`（Terraform）のモノレポ構成です。ルートには`Dockerfile`、`docker-compose.yaml`、`README.md`等のリポジトリ横断ファイルだけを置きます。
- 本番イメージはルート`Dockerfile`（ビルドコンテキストはリポジトリルート）でAPIモードのNext.js静的成果物とRailsだけを組み込み、非rootでPumaを起動します。ローカルは`frontend`／`api`／`postgres`のDocker Composeを使用します。フロント依存関係は`frontend/Dockerfile.frontend.dev`のビルド時に`npm ci`でインストールします（ビルドコンテキストは`./frontend`）。APIは起動時に`/app/tmp/pids/server.pid`を除去し、`bin/rails db:prepare`の成功後にRailsを`exec`起動します。依存関係変更時は`docker-compose up --build`でフロントイメージを再ビルドしてください。APIのgemは名前付きボリューム`backend_bundle`が`/usr/local/bundle`を覆うため`--build`では更新されません。`Gemfile`変更時は`docker compose run --rm --no-deps api bundle install`でボリューム側へ反映します（`docker compose down -v`は`postgres_data`まで削除するため使わないこと）。
- CIのNode.js／Rubyのバージョンは、`.nvmrc`／`backend/.ruby-version`から読みます（`node-version-file`、`ruby-version`は省略）。ワークフローへバージョンを直接書かないでください。DockerfileのベースイメージはDependabotが更新するため、`.ruby-version`と食い違ったら揃えます。
- CIの本番イメージ検証はビルドだけで終えず、PostgreSQLへ`db:prepare`したうえでproductionコンテナを起動し、`GET /up`が成功するところまで確認します。スモークテストでは外部GCSへ接続しないよう`ACTIVE_STORAGE_SERVICE=local`を指定します。環境変数はワークフロー内の`smoke.env`の1か所にまとめ、DB準備とコンテナ起動の両方へ`--env-file`で渡します。イメージのビルドはbuildxのGitHub Actionsキャッシュ（`type=gha`）を使います。
