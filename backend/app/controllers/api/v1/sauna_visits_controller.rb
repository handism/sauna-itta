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
        assign_visit_attributes(visit, attributes)
        entry = apply_history(visit, attributes, append: true)

        SaunaVisit.transaction do
          visit.save!
          entry.save!
        end
        render json: { saunaVisit: serialized(visit) }, status: :created
      rescue ActiveRecord::RecordInvalid => error
        render_validation_error(error.record)
      rescue ArgumentError => error
        render_error("invalid_image", error.message, :unprocessable_content)
      end

      def update
        visit = scoped_visit
        attributes = visit_params
        visit.lock_version = attributes[:lockVersion] if attributes[:lockVersion].present?
        assign_visit_attributes(visit, attributes)
        entry = apply_history(visit, attributes, append: ActiveModel::Type::Boolean.new.cast(attributes[:appendHistory]))

        SaunaVisit.transaction do
          visit.save!
          entry.save!
        end
        render json: { saunaVisit: serialized(visit) }
      rescue ActiveRecord::RecordInvalid => error
        render_validation_error(error.record)
      rescue ArgumentError => error
        render_error("invalid_image", error.message, :unprocessable_content)
      end

      def destroy
        scoped_visit.destroy!
        head :no_content
      end

      private

      def scoped_visit
        current_user.sauna_visits.find_by!(external_id: params[:id])
      end

      def visit_params
        params.require(:saunaVisit).permit(
          :name, :lat, :lng, :area, :status, :date, :comment, :rating, :image,
          :appendHistory, :lockVersion, :visitCount, tags: []
        )
      end
    end
  end
end
