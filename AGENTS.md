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
| `backend/AGENTS.md` | Rails API | 認可スコープ、インポート検証、写真の取り扱い、DB マイグレーション方針 |
| `infra/AGENTS.md` | GCP / Terraform | Secret 管理、デプロイ順序 |

**ファイル配置の規約**: 各ディレクトリとも実体は `AGENTS.md` で、`CLAUDE.md` はそれを指す相対シンボリックリンク (`ln -s AGENTS.md CLAUDE.md`) です。Claude Code は `CLAUDE.md`、その他のエージェントは `AGENTS.md` を読むため、この構成で両方に同じ内容が届きます。新しい領域別ファイルを追加する場合も同じ形式にし、`CLAUDE.md` を実体ファイルとして作らないでください（内容が二重管理になり、片方だけ古くなります）。

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

## データソース規約

- `NEXT_PUBLIC_DATA_SOURCE=local|api` で配布形態を切り替えます。localはGitHub Pages用の`/sauna-itta`、同梱JSON、`localStorage`、PWAを維持し、apiはbasePathなし・Rails API・オンライン必須でService Workerを登録しません。
- フロントの永続化は `repositories/` の `VisitRepository` 経由にします。Contextや画面から`fetch`または`localStorage`を直接呼ばないでください。CRUDは非同期で、Repository成功後だけ画面状態を更新します。
- localモードの同梱JSONは「保存がまだ無いときの初期データ」です。`getInitialVisits()` は保存があればそちらだけを正とし、同梱JSONを足し戻しません（足し戻す実装に戻すと、デモ記録の編集・削除が保存直後だけ反映され再読み込みで元へ戻ります）。
- JSONエクスポートは `Blob` + `URL.createObjectURL` で書き出します（`data:` URLへ戻さないこと。写真は最大1MBのBase64で含まれるため、数十件でURL長の上限に当たって無言で失敗します）。APIモードのエクスポートは写真を画像エンドポイントのURLとして書き出すため、localモードへ取り込んでも写真は復元されません。
- APIインポートは最大10件のチャンクを維持し、既存`external_id`をスキップして再実行可能にします。途中のチャンクで失敗した場合は必ず再読み込みし、確定済み件数とRepositoryのエラー理由を利用者へ通知します。JSON形式エラーとして一律表示しないでください。JSONエクスポートは両モードで維持します。
- インポートの結果は `ImportResult` の `added` と `skipped` を両方とも利用者へ伝えます。チャンクごとの途中経過トーストは残りのチャンクがある間だけ出し、最後のチャンクの結果は完了トーストにまとめること（チャンク数と同じ回数トーストを出すと、大量取り込みで通知が連続します）。`skipped` にはサーバーが弾いた重複と、画面上の記録と重複してリクエスト前に除外した分の両方を含めます。
- localモードのService Workerは静的資産と地図タイルのキャッシュを分離し、地図タイルはOpenStreetMapの明示的な許可ホストだけを最大200件保存します。activate時に削除してよいのは`sauna-itta-`接頭辞を持つ旧キャッシュだけです（GitHub Pagesの同一オリジンにある別アプリのキャッシュを削除しないこと）。キャッシュ方針を変えた場合は静的キャッシュのバージョンを更新してください。
- 統計画面は別ドキュメントのため`OPTIONAL_PRECACHE_ASSETS`で先読みしますが、必須資産の`cache.addAll`へ混ぜないでください（`addAll`は1つでも取得に失敗するとinstallごと失敗し、オフライン対応が丸ごと失われます）。任意の先読みは`Promise.allSettled`で取得できた分だけ保存します。
- 公共Nominatimへの地点検索は入力中のオートコンプリートにせず、検索ボタンまたはEnterによる明示操作だけで実行します。同一語句はメモリキャッシュし、連続実行は1秒間隔に制限します。接続先を変える場合は`NEXT_PUBLIC_GEOCODING_ENDPOINT`へNominatim互換URLを指定します。
- Google OAuthのrequest phaseはPOSTだけを許可し、`GET /api/v1/session`のCSRFトークンを`authenticity_token`として送信します。通常リンクやGET許可へ戻さないでください。
- Playwright E2Eは開発者が`frontend/`で任意実行する確認であり、GitHub Actionsの必須CIへ追加しません。通常CIの所要時間を増やさず、主要導線を実ブラウザで確認したいときに`npm run test:e2e`を実行します。

---

## 開発環境

- リポジトリは`frontend/`（Next.js）／`backend/`（Rails）／`infra/`（Terraform）のモノレポ構成です。ルートには`Dockerfile`、`docker-compose.yaml`、`README.md`等のリポジトリ横断ファイルだけを置きます。
- 本番イメージはルート`Dockerfile`（ビルドコンテキストはリポジトリルート）でAPIモードのNext.js静的成果物とRailsだけを組み込み、非rootでPumaを起動します。ローカルは`frontend`／`api`／`postgres`のDocker Composeを使用します。フロント依存関係は`frontend/Dockerfile.frontend.dev`のビルド時に`npm ci`でインストールします（ビルドコンテキストは`./frontend`）。APIは起動時に`/app/tmp/pids/server.pid`を除去し、`bin/rails db:prepare`の成功後にRailsを`exec`起動します。依存関係変更時は`docker-compose up --build`でフロントイメージを再ビルドしてください。
