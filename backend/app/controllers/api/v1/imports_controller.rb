module Api
  module V1
    class ImportsController < BaseController
      include VisitWritable

      def create
        payload = params.require(:saunaVisits)
        return render_error("batch_too_large", "一度に取り込めるのは10件までです。", :unprocessable_content) if payload.size > 10

        added = 0
        skipped = 0
        SaunaVisit.transaction do
          payload.each do |raw|
            attributes = raw.permit!.to_h.deep_symbolize_keys
            external_id = attributes.fetch(:id).to_s
            if current_user.sauna_visits.exists?(external_id: external_id)
              skipped += 1
              next
            end

            import_visit(attributes.merge(external_id: external_id))
            added += 1
          end
        end
        render json: { added: added, skipped: skipped }
      rescue ActiveRecord::RecordInvalid => error
        render_validation_error(error.record)
      rescue KeyError
        render_error("validation_error", "IDがない記録は取り込めません。", :unprocessable_content)
      rescue ArgumentError => error
        render_error("invalid_image", error.message, :unprocessable_content)
      end

      private

      def import_visit(attributes)
        visit = current_user.sauna_visits.build(external_id: attributes[:external_id])
        assign_visit_attributes(visit, attributes)
        visit.legacy_visit_count = attributes[:visitCount].to_i if attributes[:visitCount]
        histories = Array(attributes[:history])
        histories = [ attributes.slice(:date, :comment, :rating, :image) ] if histories.empty?

        histories.each do |history|
          normalized = history.deep_symbolize_keys
          entry = apply_history(visit, normalized, append: true)
          entry.public_id = normalized[:id] if normalized[:id].present?
        end
        visit.save!
      end
    end
  end
end
