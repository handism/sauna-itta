module Api
  module V1
    class ImagesController < BaseController
      def show
        blob = ActiveStorage::Blob.find_signed!(params[:signed_id])
        attachment = ActiveStorage::Attachment.find_by!(blob_id: blob.id, name: "image", record_type: "VisitHistoryEntry")
        current_user.sauna_visits.joins(:visit_history_entries)
          .find_by!(visit_history_entries: { id: attachment.record_id })

        response.headers["Cache-Control"] = "private, max-age=300"
        response.headers["Content-Disposition"] = ActionDispatch::Http::ContentDisposition.format(
          disposition: "inline", filename: blob.filename.to_s
        )
        send_data blob.download, type: blob.content_type, disposition: "inline"
      end
    end
  end
end
