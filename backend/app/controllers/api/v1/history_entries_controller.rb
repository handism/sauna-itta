module Api
  module V1
    class HistoryEntriesController < BaseController
      include VisitWritable

      def destroy
        visit = current_user.sauna_visits.find_by!(external_id: params[:sauna_visit_id])
        return render_error("last_history", "最後の履歴は削除できません。", :unprocessable_content) if visit.visit_history_entries.count <= 1

        entry = visit.visit_history_entries.find_by!(public_id: params[:history_id])
        entry.image.purge if entry.image.attached?
        entry.destroy!
        render json: { saunaVisit: serialized(visit) }
      end
    end
  end
end
