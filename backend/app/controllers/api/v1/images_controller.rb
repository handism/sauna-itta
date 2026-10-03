module Api
  module V1
    class ImagesController < BaseController
      # 一覧の表示やエクスポートで写真の枚数ぶん呼ばれるため、他より大きくとる。
      # 条件付きGET（304）も数えるが、GCSからのダウンロードが連打されるのを防ぐのが目的
      limit_requests to: 600
      rescue_from ActiveSupport::MessageVerifier::InvalidSignature do
        render_error("not_found", "対象の記録が見つかりません。", :not_found)
      end

      def show
        blob = ActiveStorage::Blob.find_signed!(params[:signed_id])
        # 添付先の履歴がログインユーザーの記録に属するかを1クエリで確かめる。
        # image_attachment の関連が name / record_type の条件を付けるため、別の添付からは辿れない。
        owned = VisitHistoryEntry.joins(:sauna_visit, :image_attachment)
          .exists?(sauna_visits: { user_id: current_user.id }, active_storage_attachments: { blob_id: blob.id })
        raise ActiveRecord::RecordNotFound unless owned

        # 所有者だけに配信するため共有キャッシュには載せない。あわせて条件付きGETへ
        # 対応し、変わっていない写真でGCSからのダウンロードが再発生しないようにする
        # （blob.checksum は内容が変わると別blobになるため実質不変）。
        expires_in 5.minutes, public: false
        return unless stale?(etag: blob.checksum, last_modified: blob.created_at)

        response.headers["Content-Disposition"] = ActionDispatch::Http::ContentDisposition.format(
          disposition: "inline", filename: blob.filename.to_s
        )
        send_data blob.download, type: blob.content_type, disposition: "inline"
      end
    end
  end
end
