# Rails バックエンド規約

このファイルは `backend/` 配下を編集するときに読み込まれます。フロント側のデータソース契約（`NEXT_PUBLIC_DATA_SOURCE` / `VisitRepository` / インポート仕様）はリポジトリルートの `AGENTS.md` を参照してください。

## API 設計・認可
- Railsの全記録取得は必ず`current_user.sauna_visits`からスコープし、他ユーザーの記録・履歴・写真は404にします。APIはcamelCase、エラーは`{ error: { code, message, details? } }`形式です。
- 変更系APIはセッション認証とCSRFを必須にし、`lock_version`競合は409を返します。開発ログインはdevelopmentかつ`ENABLE_DEV_LOGIN=true`の場合だけ許可し、本番ルートを追加しないでください。
- Googleログインは`ALLOWED_GOOGLE_EMAIL`との一致に加えて、確認済みメール（`extra.raw_info.email_verified`、無ければ`info.email_verified`）であることも必須にします。メール一致がこのアプリ唯一の認可境界のため、片方だけの判定へ戻さないでください。テストの`google_auth_hash`は`email_verified:`を差し替えられます。
- Google OAuthのrequest phaseはOmniAuth 2の既定どおりPOSTだけを許可し、`omniauth-rails_csrf_protection`でRailsの`authenticity_token`を検証します。`allowed_request_methods`へGETを追加したり警告を抑制したりしないでください。Googleからのcallbackは従来どおりGETです。
- 書き込み系レスポンスの再読み込み（`VisitWritable#serialized`）は`includes(visit_history_entries: { image_attachment: :blob })`で先読みします。`visit.reload`だけに戻すと、`SaunaVisitSerializer`が履歴ごとに添付を引いて履歴件数に比例したクエリが出ます（`api_v1_sauna_visits_test.rb`のクエリ数比較が検査しています）。

## インポート
- 履歴IDは記録内で一意です（`public_id` は `scope: :sauna_visit_id`）。グローバル一意へ戻すと、他ユーザーがエクスポートしたJSONを取り込んだときに履歴IDが衝突して取り込めなくなります。
- インポートAPIのペイロード検証は`ActionController::BadRequest`へ集約し、配列でない`saunaVisits`・記録以外の要素・IDが無い記録をすべて422で返します。`attributes.fetch(:id)`の`KeyError`を直接rescueしないでください（`ActionController::ParameterMissing`は`KeyError`のサブクラスのため、キー欠落が「IDがない記録」として誤って報告されます）。

## 写真
- 写真はJPEG／PNG／WebP／GIFのdata URLだけを許可し、復号後1MB以下をRails validationでも検査します。SVGと任意URLを受け付けないでください。本番配信は所有者確認を行う認証付き画像エンドポイントに限定します。既存写真の削除・差し替えは他属性の保存と同じDBトランザクション内で添付を変更し、古いblobはコミット成功後だけ削除してください（バリデーション失敗や`lock_version`競合時に元写真を失わないこと）。履歴エントリの削除も同じ方針で、blobは`purge_stale_image_blobs`へ渡して`destroy!`のコミット後に破棄します（`destroy!`より前に`purge`を呼ぶと、削除が失敗したときに写真だけが失われます）。
- 記録全体の削除で履歴写真を破棄するコールバックは`after_destroy_commit`を維持します。`after_destroy`へ戻すと、外部ストレージ上の画像削除後にDBトランザクションがロールバックして画像だけ失われます。履歴単体の削除は親の`SaunaVisit`を`with_lock`し、ロック内で残件数を再確認してから削除してください（同時削除で履歴が0件になるのを防ぎます）。
- 画像エンドポイントは所有者確認の後に `expires_in 5.minutes, public: false` と `stale?(etag: blob.checksum, last_modified: blob.created_at)` で条件付きGETへ応答します（共有キャッシュへ載せないこと、および `blob.download` をキャッシュヒット時に実行しないこと）。認可チェックより前に304を返す実装にしないでください。

## 静的成果物の配信
- Railsは`public/`へ同梱したAPIモードのNext.js成果物を配信します。長期キャッシュは`lib/middleware/static_asset_cache_headers.rb`が`/_next/static/`配下（内容ハッシュ付き）にだけ付けます。`config.public_file_server.headers`で一律に指定しないでください（`index.html`まで固定され、デプロイしても更新が届かなくなります）。
- このミドルウェアはスタック構築時に定数解決されるため、`config/application.rb`で`require_relative`し、`autoload_lib`の`ignore`に`middleware`を入れています。

## DB
- DB変更はexpand/contract方式で後方互換に進めます。本番seedへ個人データやデモデータを追加しないでください。

## 検証
- Rails変更時は`backend/bin/rails test`、RuboCop、Brakeman、production Docker buildとhealth checkも実行します。
