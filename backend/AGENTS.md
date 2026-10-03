# Rails バックエンド規約

このファイルは `backend/` 配下を編集するときに読み込まれます。フロント側のデータソース契約（`NEXT_PUBLIC_DATA_SOURCE` / `VisitRepository` / インポート仕様）はリポジトリルートの `AGENTS.md` を参照してください。

## API 設計・認可
- Railsの全記録取得は必ず`current_user.sauna_visits`からスコープし、他ユーザーの記録・履歴・写真は404にします。APIはcamelCase、エラーは`{ error: { code, message, details? } }`形式です。
- 変更系APIはセッション認証とCSRFを必須にし、`lock_version`競合は409を返します。記録の更新（`PATCH`）は`lockVersion`を必須とし、無ければ422にします（黙って通すとロック確認を経ずに上書きされます）。更新は`updated_at`を必ず書き換え、履歴の削除は`visit.touch`して、履歴（コメント・評価・写真）だけの変更でも親の`lock_version`を進めてください。親の列が変わらないと`UPDATE`が発行されず、同じ版を持つ別タブの更新が競合として検出されません。開発ログインはdevelopmentかつ`ENABLE_DEV_LOGIN=true`の場合だけ許可し、本番ルートを追加しないでください。
- Googleログインは`ALLOWED_GOOGLE_EMAIL`との一致に加えて、確認済みメール（`extra.raw_info.email_verified`、無ければ`info.email_verified`）であることも必須にします。メール一致がこのアプリ唯一の認可境界のため、片方だけの判定へ戻さないでください。テストの`google_auth_hash`は`email_verified:`を差し替えられます。
- Google OAuthのrequest phaseはOmniAuth 2の既定どおりPOSTだけを許可し、`omniauth-rails_csrf_protection`でRailsの`authenticity_token`を検証します。`allowed_request_methods`へGETを追加したり警告を抑制したりしないでください。Googleからのcallbackは従来どおりGETです。本番で`GOOGLE_CLIENT_ID`／`GOOGLE_CLIENT_SECRET`が未設定でも起動は止めず、`config/initializers/omniauth.rb`が起動時にエラーログを残します。マイグレーション用のCloud Run JobとCIのスモークテストはOAuthの値を渡さずに同じイメージを起動するため、起動時に例外で止める形へ変える場合は、先にそれらへ値を渡してください。
- 書き込み系の共通エラー応答（`ActiveRecord::RecordInvalid`→422 `validation_error`、画像の`DataUrlImage::InvalidImage`→422 `invalid_image`）は`VisitWritable`の`included do`が`rescue_from`で登録します。アクションごとに`rescue`を書き写す実装へ戻さないでください（あとから足した書き込みアクションだけ500になります）。`render_validation_error`は`Api::V1::BaseController`が持つため、`VisitWritable`のinclude先はその配下に限ること。画像の不正は必ず`DataUrlImage::InvalidImage`で表し、`ArgumentError`のような汎用の例外を`rescue_from`しないでください（無関係なプログラムの誤りまで`invalid_image`の422として隠れます）。また`BaseController`側で握ると、画像を書き込まない`ImagesController`まで`invalid_image`になります。
- 記録本体の許可キーは`VisitWritable::VISIT_PERMITTED_KEYS`を`SaunaVisitsController`と`ImportsController`で共有します。片方へキーを書き写すと、エクスポートしたJSONの取り込みと通常の作成・更新で受け付ける項目がずれます。
- 書き込み系レスポンスの再読み込み（`VisitWritable#serialized`）は`includes(visit_history_entries: { image_attachment: :blob })`で先読みします。`visit.reload`だけに戻すと、`SaunaVisitSerializer`が履歴ごとに添付を引いて履歴件数に比例したクエリが出ます（`api_v1_sauna_visits_test.rb`のクエリ数比較が検査しています）。
- 回数の上限は`Api::V1::BaseController.limit_requests`で宣言します（Rails 8の`rate_limit`を、専用のメモリストア`RATE_LIMIT_STORE`・ユーザーID単位・429 `rate_limited`の応答で包んだもの）。`rate_limit`を直接書いて`store:`を省くと、`Rails.cache`の設定次第で数えられなかったり、`by:`の既定（IP）でまとめて数えられたりします。`require_login`より後に宣言されるため未ログインは数えません。ストアはCloud Runのインスタンスごとのため、実際に通る回数は上限の最大2倍（`max_instance_count`）です。テストは`ApiAuthHelper`のsetupでストアを空にしています。
- ブラウザのエラー報告（`ClientErrorsController`）は利用者の入力として扱い、各項目を`FIELD_LIMITS`で切り詰めて1行のJSONでログへ出します（改行を含む値でログ行を偽装させないため、文字列を連結して出力しないこと）。

## インポート
- 履歴IDは記録内で一意です（`public_id` は `scope: :sauna_visit_id`）。グローバル一意へ戻すと、他ユーザーがエクスポートしたJSONを取り込んだときに履歴IDが衝突して取り込めなくなります。
- インポートの履歴は画像なしで build してから画像だけを添付します（`ImportsController#import_history_image`）。画像の保存以外の理由で添付に失敗したときは警告ログを残して画像なしで取り込み、`DataUrlImage::InvalidImage`だけはチャンクごとロールバックさせます。画像込みで build し、失敗時に build し直す実装へ戻さないでください（失敗した側のエントリが関連に残り、履歴が二重に保存されます）。
- インポートは記録ごとにセーブポイント（`transaction(requires_new: true)`）を張り、同時に別リクエストが同じ`external_id`を先にコミットしたことによる`ActiveRecord::RecordNotUnique`は、その記録だけを取り消して`skipped`に数えます（`ImportsController#import_visit_unless_concurrently_added`）。既存IDの事前確認やモデルの`uniqueness`検証は相手の未コミット分を見ないため、これを外すと同時インポートで500になります。同じ`external_id`が保存済みでない一意制約違反は握らずに上げ、`BaseController`が409 `duplicate`で返します（楽観ロックの競合`conflict`とはcodeを分けること。フロントは`conflict`だけを再読み込みの案内へ置き換えるため、同じcodeにすると重複の文言が画面に出ません）。
- 1記録あたりの履歴は`MAX_HISTORY_PER_VISIT`（1000件）までで、超えるとチャンクごと422にします。記録数の上限（`MAX_BATCH_SIZE`）だけでは履歴の配列が無制限になります。ボディ全体の大きさは`lib/middleware/request_body_limit.rb`がパラメータ解析より前に413で弾きます。
- インポートAPIのペイロード検証は`ActionController::BadRequest`へ集約し、配列でない`saunaVisits`・記録以外の要素・IDが無い記録をすべて422で返します。`attributes.fetch(:id)`の`KeyError`を直接rescueしないでください（`ActionController::ParameterMissing`は`KeyError`のサブクラスのため、キー欠落が「IDがない記録」として誤って報告されます）。

## 写真
- 写真はJPEG／PNG／WebP／GIFのdata URLだけを許可し、復号後1MB以下をRails validationでも検査します。許可形式と保存時の拡張子は`VisitHistoryEntry::IMAGE_TYPE_EXTENSIONS`を唯一の出所とし、`DataUrlImage`の`PATTERN`とファイル名もそこから組み立てます（`DataUrlImage`側へ一覧を書き写すと、モデルのバリデーションとdata URLの受け口がずれます）。フロントの`ALLOWED_IMAGE_MIME_TYPES`とも同じ集合に保つこと。SVGと任意URLを受け付けないでください。本番配信は所有者確認を行う認証付き画像エンドポイントに限定します。既存写真の削除・差し替えは他属性の保存と同じDBトランザクション内で添付を変更し、古いblobはコミット成功後だけ削除してください（バリデーション失敗や`lock_version`競合時に元写真を失わないこと）。履歴エントリの削除も同じ方針で、blobは`purge_stale_image_blobs`へ渡して`destroy!`のコミット後に破棄します（`destroy!`より前に`purge`を呼ぶと、削除が失敗したときに写真だけが失われます）。
- blobの破棄（失敗をログに残して握る処理を含む）は`ImageBlobPurger.purge`に集約しています。記録の削除（`SaunaVisit#purge_history_image_blobs`）と写真の差し替え・履歴の削除（`VisitWritable#purge_stale_image_blobs`）はどちらもこれを呼ぶため、呼び出し側で`blob.purge`と`rescue`を書き直さないでください。破棄はコミット後に同期の`purge`で行い、`purge_later`へ戻さないでください（ジョブは`:async`アダプタで動くため、Cloud Runがレスポンス後にCPUを絞ったりインスタンスを止めたりすると完了せず、GCSにオブジェクトが残ります）。
- `VisitHistoryEntry`の`has_one_attached :image`は`dependent: false`にして、Rails自身による破棄（履歴の削除・写真の差し替え時の`purge_later`）を止めています。既定の`:purge_later`へ戻すと、`ImageBlobPurger`と合わせて同じblobの破棄が二重に走ります。破棄の経路を足すときは、必ず`ImageBlobPurger`へ渡してください（テストは`assert_no_enqueued_jobs(only: ActiveStorage::PurgeJob)`で、ジョブに頼らずblobが消えることを検査しています）。
- 記録全体の削除で履歴写真を破棄するコールバックは`after_destroy_commit`を維持します。`after_destroy`へ戻すと、外部ストレージ上の画像削除後にDBトランザクションがロールバックして画像だけ失われます。履歴単体の削除は親の`SaunaVisit`を`with_lock`し、ロック内で残件数を再確認してから削除してください（同時削除で履歴が0件になるのを防ぎます）。
- 画像エンドポイントは所有者確認の後に `expires_in 5.minutes, public: false` と `stale?(etag: blob.checksum, last_modified: blob.created_at)` で条件付きGETへ応答します（共有キャッシュへ載せないこと、および `blob.download` をキャッシュヒット時に実行しないこと）。認可チェックより前に304を返す実装にしないでください。

## 静的成果物の配信
- Railsは`public/`へ同梱したAPIモードのNext.js成果物を配信します。長期キャッシュは`lib/middleware/static_asset_cache_headers.rb`が`/_next/static/`配下（内容ハッシュ付き）にだけ付けます。`config.public_file_server.headers`で一律に指定しないでください（`index.html`まで固定され、デプロイしても更新が届かなくなります）。
- HTMLのContent-Security-Policyは`lib/middleware/content_security_policy_header.rb`が付けます。`/`や`/stats`は`ActionDispatch::Static`がコントローラを通さずに返すため、Railsの`content_security_policy`設定へ移さないでください（静的配信されたHTMLにだけ付かなくなります）。inline scriptは配信するHTMLから求めたsha256ハッシュだけを許可し、`'unsafe-inline'`を足さないこと。本番イメージは`.gz`も同梱しており、gzipの本文は展開してからハッシュを求めます（展開せずに求めると全てのinline scriptが遮断されて画面が動きません）。外部オリジンを増やす場合（`NEXT_PUBLIC_GEOCODING_ENDPOINT`の差し替えなど）は、同ファイルの`*_SOURCES`へ追加してください。
- これらのミドルウェアはスタック構築時に定数解決されるため、`config/application.rb`で`require_relative`し、`autoload_lib`の`ignore`に`middleware`を入れています。

## DB
- DB変更はexpand/contract方式で後方互換に進めます。本番seedへ個人データやデモデータを追加しないでください。

## 検証
- Rails変更時は`backend/bin/rails test`、RuboCop、Brakeman、production Docker buildとhealth checkも実行します。
