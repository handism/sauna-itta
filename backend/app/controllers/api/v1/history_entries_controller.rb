module Api
  module V1
    class HistoryEntriesController < BaseController
      include VisitWritable

      def destroy
        visit = current_user.sauna_visits.find_by!(external_id: params[:sauna_visit_id])
        stale_image_blobs = []
        last_history = false

        # 親レコードをロックして件数確認と削除を直列化する。別タブから同時に
        # 2件の履歴を削除しても、最後の1件が消えないようにする。
        visit.with_lock do
          if visit.visit_history_entries.count <= 1
            last_history = true
            next
          end

          entry = visit.visit_history_entries.find_by!(public_id: params[:history_id])
          stale_image_blobs << entry.image.blob if entry.image.attached?
          entry.destroy!
        end
        return render_error("last_history", "最後の履歴は削除できません。", :unprocessable_content) if last_history

        purge_stale_image_blobs(stale_image_blobs)
        render json: { saunaVisit: serialized(visit) }
      end
    end
  end
end
