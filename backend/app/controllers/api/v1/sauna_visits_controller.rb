module Api
  module V1
    class SaunaVisitsController < BaseController
      include VisitWritable

      # 一覧はページ単位で取るため、1回の読み込みで数回呼ばれる
      limit_requests to: 120, only: :index, name: "read"
      limit_requests to: 60, only: %i[create update destroy], name: "write"

      # 1ページの既定件数と上限
      DEFAULT_PAGE_SIZE = 100
      MAX_PAGE_SIZE = 200

      # limit を指定したときだけページ単位で返す。指定が無い呼び出しは従来どおり全件を返す
      # （デプロイ直後に古い版のフロントが残っていても、記録の一部だけが表示される状態にしない）。
      #
      # ページの並びは主キーの降順にする。updated_at はページ取得の合間に更新された記録が
      # カーソルより前へ移り、どのページにも現れなくなるため、カーソルには使えない。
      def index
        visits = current_user.sauna_visits.includes(visit_history_entries: { image_attachment: :blob })
        return render_all(visits) unless params.key?(:limit)

        page_size = page_size_param
        visits = visits.order(id: :desc).limit(page_size + 1)
        visits = visits.where(id: ...cursor_param) if params[:cursor].present?
        page = visits.to_a
        has_more = page.size > page_size
        page = page.first(page_size)

        render json: {
          saunaVisits: page.map { |visit| SaunaVisitSerializer.new(visit).as_json },
          nextCursor: has_more ? encode_cursor(page.last.id) : nil
        }
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

      def render_all(visits)
        visits = visits.order(updated_at: :desc)
        render json: { saunaVisits: visits.map { |visit| SaunaVisitSerializer.new(visit).as_json } }
      end

      def page_size_param
        size = Integer(params[:limit], exception: false)
        raise ActionController::BadRequest, "limitは1以上の整数で指定してください。" unless size&.positive?

        [ size, MAX_PAGE_SIZE ].min
      end

      # カーソルは中身を約束しない文字列として返す（フロントは受け取った値をそのまま送り返す）
      def encode_cursor(id)
        Base64.urlsafe_encode64(id.to_s, padding: false)
      end

      def cursor_param
        id = Integer(Base64.urlsafe_decode64(params[:cursor].to_s), exception: false)
        raise ActionController::BadRequest, "cursorが不正です。" unless id&.positive?

        id
      rescue ArgumentError
        raise ActionController::BadRequest, "cursorが不正です。"
      end

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
