module Api
  module V1
    class ImportsController < BaseController
      include VisitWritable

      # ペイロードの形が不正なとき（ActionController::ParameterMissing が KeyError の
      # サブクラスであるため、fetch の KeyError をそのまま拾うと取り違えます）
      class InvalidPayload < StandardError; end

      rescue_from InvalidPayload do |error|
        render_error("validation_error", error.message, :unprocessable_content)
      end

      def create
        payload = params.require(:saunaVisits)
        raise InvalidPayload, "取り込むデータは記録の配列で指定してください。" unless payload.is_a?(Array)
        return render_error("batch_too_large", "一度に取り込めるのは10件までです。", :unprocessable_content) if payload.size > 10

        existing_external_ids = find_existing_external_ids(payload)
        result = process_payload(payload, existing_external_ids)

        render json: result
      rescue ActiveRecord::RecordInvalid => error
        render_validation_error(error.record)
      rescue ArgumentError => error
        render_error("invalid_image", error.message, :unprocessable_content)
      end

      private

      def find_existing_external_ids(payload)
        # 重複判定を記録ごとの exists? で回さないよう、既存の external_id をまとめて引いておく。
        # 取り込み済みの分もループ内で足していくため、ペイロード内の重複も従来どおり弾ける。
        payload_external_ids = payload.filter_map { |raw| raw[:id].to_s if raw.is_a?(ActionController::Parameters) }
        current_user.sauna_visits
          .where(external_id: payload_external_ids)
          .pluck(:external_id)
          .to_set
      end

      def process_payload(payload, existing_external_ids)
        added = 0
        skipped = 0

        SaunaVisit.transaction do
          payload.each do |raw|
            raise InvalidPayload, "取り込むデータは記録の配列で指定してください。" unless raw.is_a?(ActionController::Parameters)

            # 許可キーは SaunaVisitsController#visit_params と揃える（エクスポートしたJSONを
            # そのまま取り込むため、lockVersion / appendHistory も届く）
            attributes = raw.permit(
              :id, :name, :lat, :lng, :area, :status, :date, :comment, :rating, :image,
              :appendHistory, :lockVersion, :visitCount, tags: [],
              history: [ :id, :date, :comment, :rating, :image ]
            ).to_h.deep_symbolize_keys

            external_id = attributes[:id].to_s
            raise InvalidPayload, "IDがない記録は取り込めません。" if external_id.blank?

            if existing_external_ids.include?(external_id)
              skipped += 1
              next
            end

            import_visit(attributes.merge(external_id: external_id))
            existing_external_ids.add(external_id)
            added += 1
          end
        end

        { added: added, skipped: skipped }
      end

      def import_visit(attributes)
        visit = current_user.sauna_visits.build(external_id: attributes[:external_id])
        assign_visit_attributes(visit, attributes)
        visit.legacy_visit_count = attributes[:visitCount].to_i if attributes[:visitCount]
        histories = Array(attributes[:history])
        histories = [ attributes.slice(:date, :comment, :rating, :image) ] if histories.empty?

        histories.each do |history|
          normalized = history.deep_symbolize_keys
          entry = begin
            apply_history(visit, normalized, append: true, apply_image: true)
          rescue StandardError => error
            raise if error.is_a?(ArgumentError) || error.is_a?(ActiveRecord::RecordInvalid)

            Rails.logger.warn("画像インポートに失敗しました (ID: #{attributes[:external_id]}): #{error.message}")
            apply_history(visit, normalized, append: true, apply_image: false)
          end
          entry.public_id = normalized[:id] if normalized[:id].present?
        end
        visit.save!
      end
    end
  end
end
