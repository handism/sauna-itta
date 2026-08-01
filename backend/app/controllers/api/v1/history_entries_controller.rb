module Api
  module V1
    class HistoryEntriesController < BaseController
      include VisitWritable

      def destroy
        visit = current_user.sauna_visits.find_by!(external_id: params[:sauna_visit_id])
        return render_error("last_history", "最後の履歴は削除できません。", :unprocessable_content) if visit.visit_history_entries.count <= 1

        entry = visit.visit_history_entries.find_by!(public_id: params[:history_id])
        stale_image_blobs = []

        VisitHistoryEntry.transaction do
          stale_image_blobs << entry.image.blob if entry.image.attached?
          entry.destroy!
        end
        purge_stale_image_blobs(stale_image_blobs)
        render json: { saunaVisit: serialized(visit) }
      end
    end
  end
end
