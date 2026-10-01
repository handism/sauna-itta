module Api
  module V1
    class SaunaVisitsController < BaseController
      include VisitWritable

      def index
        visits = current_user.sauna_visits.includes(visit_history_entries: { image_attachment: :blob })
          .order(updated_at: :desc)
        render json: { saunaVisits: visits.map { |visit| SaunaVisitSerializer.new(visit).as_json } }
      end

      def create
        visit = current_user.sauna_visits.build
        attributes = visit_params

        save_visit_in_transaction(visit, attributes, append: true)
        render json: { saunaVisit: serialized(visit) }, status: :created
      end

      def update
        visit = scoped_visit
        attributes = visit_params
        stale_image_blobs = []

        # lockVersion が無い更新を黙って通すと、楽観ロックを経ずに他タブの変更を上書きする
        raise ActionController::ParameterMissing, :lockVersion if attributes[:lockVersion].blank?

        visit.lock_version = attributes[:lockVersion]
        # 履歴（コメント・評価・写真）だけの変更では親の列が変わらず UPDATE が発行されないため、
        # lock_version が進まず、同じ版を持つ別タブの更新が競合にならない。
        # updated_at を必ず書き換えて、どの更新でも親行のロック確認と lock_version の加算を通す。
        visit.updated_at = Time.current
        save_visit_in_transaction(
          visit,
          attributes,
          append: ActiveModel::Type::Boolean.new.cast(attributes[:appendHistory]),
          stale_image_blobs: stale_image_blobs
        )
        purge_stale_image_blobs(stale_image_blobs)
        render json: { saunaVisit: serialized(visit) }
      end

      def destroy
        scoped_visit.destroy!
        head :no_content
      end

      private

      def save_visit_in_transaction(visit, attributes, append:, stale_image_blobs: [])
        SaunaVisit.transaction do
          assign_visit_attributes(visit, attributes)
          entry = apply_history(visit, attributes, append: append)
          visit.save!
          raise ActiveRecord::RecordInvalid.new(entry) unless entry.valid?

          apply_history_image(entry, attributes, stale_image_blobs)
          entry.save!
        end
      end

      def scoped_visit
        current_user.sauna_visits.find_by!(external_id: params[:id])
      end

      def visit_params
        params.require(:saunaVisit).permit(*VISIT_PERMITTED_KEYS)
      end
    end
  end
end
