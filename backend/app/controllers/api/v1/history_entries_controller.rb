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
          truncate_legacy_visit_count(visit)
        end
        return render_error("last_history", "最後の履歴は削除できません。", :unprocessable_content) if last_history

        purge_stale_image_blobs(stale_image_blobs)
        render json: { saunaVisit: serialized(visit) }
      end

      private

      # 旧形式から引き継いだ訪問回数 (legacy_visit_count) が残りの履歴より多いままだと、
      # 履歴を消したのに画面の「訪問回数」が減らない。localモードの
      # getVisitsWithRemovedHistory は残件数へ揃えるため、api側も同じ扱いにする
      # （両モードで同じ操作の結果が変わらないようにすること）。
      def truncate_legacy_visit_count(visit)
        remaining = visit.visit_history_entries.count
        return if visit.legacy_visit_count <= remaining

        visit.update!(legacy_visit_count: remaining)
      end
    end
  end
end
