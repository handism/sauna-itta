# Rails バックエンド規約

このファイルは `backend/` 配下を編集するときに読み込まれます。フロント側のデータソース契約（`NEXT_PUBLIC_DATA_SOURCE` / `VisitRepository` / インポート仕様）はリポジトリルートの `AGENTS.md` を参照してください。

## API 設計・認可
- Railsの全記録取得は必ず`current_user.sauna_visits`からスコープし、他ユーザーの記録・履歴・写真は404にします。APIはcamelCase、エラーは`{ error: { code, message, details? } }`形式です。
- 変更系APIはセッション認証とCSRFを必須にし、`lock_version`競合は409を返します。開発ログインはdevelopmentかつ`ENABLE_DEV_LOGIN=true`の場合だけ許可し、本番ルートを追加しないでください。

## インポート
- 履歴IDは記録内で一意です（`public_id` は `scope: :sauna_visit_id`）。グローバル一意へ戻すと、他ユーザーがエクスポートしたJSONを取り込んだときに履歴IDが衝突して取り込めなくなります。
- インポートAPIのペイロード検証は`ImportsController::InvalidPayload`へ集約し、配列でない`saunaVisits`・記録以外の要素・IDが無い記録をすべて422で返します。`attributes.fetch(:id)`の`KeyError`を直接rescueしないでください（`ActionController::ParameterMissing`は`KeyError`のサブクラスのため、キー欠落が「IDがない記録」として誤って報告されます）。

## 写真
- 写真はJPEG／PNG／WebP／GIFのdata URLだけを許可し、復号後1MB以下をRails validationでも検査します。SVGと任意URLを受け付けないでください。本番配信は所有者確認を行う認証付き画像エンドポイントに限定します。既存写真の削除・差し替えは他属性の保存と同じDBトランザクション内で添付を変更し、古いblobはコミット成功後だけ削除してください（バリデーション失敗や`lock_version`競合時に元写真を失わないこと）。履歴エントリの削除も同じ方針で、blobは`purge_stale_image_blobs`へ渡して`destroy!`のコミット後に破棄します（`destroy!`より前に`purge`を呼ぶと、削除が失敗したときに写真だけが失われます）。

## DB
- DB変更はexpand/contract方式で後方互換に進めます。本番seedへ個人データやデモデータを追加しないでください。

## 検証
- Rails変更時は`backend/bin/rails test`、RuboCop、Brakeman、production Docker buildとhealth checkも実行します。
