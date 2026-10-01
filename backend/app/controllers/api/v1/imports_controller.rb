module Api
  module V1
    class ImportsController < BaseController
      include VisitWritable

      # 1リクエストで受け付ける記録数。フロントの CHUNK_SIZE (useVisitImportExport.ts) と揃えること
      MAX_BATCH_SIZE = 10

      def create
        payload = params.require(:saunaVisits)
        raise ActionController::BadRequest, "取り込むデータは記録の配列で指定してください。" unless payload.is_a?(Array)
        if payload.size > MAX_BATCH_SIZE
          return render_error("batch_too_large", "一度に取り込めるのは#{MAX_BATCH_SIZE}件までです。", :unprocessable_content)
        end

        existing_external_ids = find_existing_external_ids(payload)
        result = process_payload(payload, existing_external_ids)

        render json: result
      end

      private

      def find_existing_external_ids(payload)
        # 重複判定を記録ごとの exists? で回さないよう、既存の external_id をまとめて引いておく。
        # 取り込み済みの分もループ内で足していくため、ペイロード内の重複も従来どおり弾ける。
        payload_external_ids = payload.filter_map { |raw| raw[:id]&.to_s if raw.is_a?(ActionController::Parameters) }
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
            raise ActionController::BadRequest, "取り込むデータは記録の配列で指定してください。" unless raw.is_a?(ActionController::Parameters)

            # 記録本体の許可キーは SaunaVisitsController と共有する (VisitWritable::VISIT_PERMITTED_KEYS)
            attributes = raw.permit(
              :id, *VISIT_PERMITTED_KEYS,
              history: [ :id, :date, :comment, :rating, :image ]
            ).to_h.deep_symbolize_keys

            external_id = attributes[:id].to_s
            raise ActionController::BadRequest, "IDがない記録は取り込めません。" if external_id.blank?

            if existing_external_ids.include?(external_id)
              skipped += 1
              next
            end

            if import_visit_unless_concurrently_added(attributes.merge(external_id: external_id))
              added += 1
            else
              skipped += 1
            end
            existing_external_ids.add(external_id)
          end
        end

        { added: added, skipped: skipped }
      end

      # 既存IDの確認 (find_existing_external_ids) から保存までの間に、同じ記録を取り込む
      # 別リクエスト（別タブでの同時インポートなど）が先にコミットすると、モデルの
      # uniqueness 検証は通っても DB の一意制約で RecordNotUnique になる。記録ごとに
      # セーブポイントを張り、その記録だけを取り消して重複としてスキップする。
      # 同じ external_id が保存済みでない一意制約違反（履歴IDの重複など）は握らずに上げる。
      def import_visit_unless_concurrently_added(attributes)
        SaunaVisit.transaction(requires_new: true) { import_visit(attributes) }
        true
      rescue ActiveRecord::RecordNotUnique
        raise unless current_user.sauna_visits.exists?(external_id: attributes[:external_id])

        false
      end

      def import_visit(attributes)
        visit = current_user.sauna_visits.build(external_id: attributes[:external_id])
        assign_visit_attributes(visit, attributes)
        histories = Array(attributes[:history])
        histories = [ attributes.slice(:date, :comment, :rating, :image) ] if histories.empty?

        histories.each do |history|
          normalized = history.deep_symbolize_keys
          entry = apply_history(visit, normalized, append: true, apply_image: false)
          entry.public_id = normalized[:id] if normalized[:id].present?
          import_history_image(entry, normalized, attributes[:external_id])
        end
        visit.save!
      end

      # 履歴は先に画像なしで build し、画像だけを後から試す。画像込みで build してから
      # 失敗時に build し直すと、失敗した側のエントリが関連に残って履歴が二重に保存される。
      # 不正な画像 (InvalidImage) はチャンクごとロールバックさせるため握らない。
      def import_history_image(entry, history, external_id)
        return unless history.key?(:image)

        apply_image(entry, history[:image])
      rescue DataUrlImage::InvalidImage, ActiveRecord::RecordInvalid
        raise
      rescue StandardError => error
        Rails.logger.warn("画像インポートに失敗しました (ID: #{external_id}): #{error.message}")
      end
    end
  end
end
