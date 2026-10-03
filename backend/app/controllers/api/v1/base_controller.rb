module Api
  module V1
    class BaseController < ApplicationController
      before_action :require_login

      # rate_limit の回数を数える場所。Rails.cache は環境ごとに null_store などへ変わり得るため、
      # 専用のメモリストアを使う。Cloud Run のインスタンスごとに数える（最大2台）ため、
      # 実際に通る回数は上限の最大2倍になる。目的は暴走・連打からの保護で、厳密な課金管理ではない。
      RATE_LIMIT_STORE = ActiveSupport::Cache::MemoryStore.new(size: 8.megabytes)

      # 各コントローラの rate_limit はこれを通して宣言する。before_action は宣言順に走るため、
      # require_login より後になり、未ログインのリクエストは数えずに401で返る（by の current_user が必ずある）。
      def self.limit_requests(to:, within: 1.minute, **options)
        rate_limit to: to, within: within, store: RATE_LIMIT_STORE,
          by: -> { current_user.id }, with: -> { render_rate_limited }, **options
      end

      rescue_from ActiveRecord::RecordNotFound do
        render_error("not_found", "対象の記録が見つかりません。", :not_found)
      end
      rescue_from ActiveRecord::StaleObjectError do
        render_error("conflict", "別の画面で記録が更新されています。", :conflict)
      end
      # モデルの uniqueness 検証は同時に走った別リクエストの未コミット分を見ないため、
      # すり抜けた重複は DB の一意制約で RecordNotUnique になる。500 にせず競合として返す。
      # 楽観ロックの競合 (conflict) とは code を分ける。フロントの toUserMessage は conflict を
      # 「再読み込みして」の案内へ置き換えるため、同じ code にするとこの文言が画面に出ない。
      rescue_from ActiveRecord::RecordNotUnique do
        render_error("duplicate", "同時に行われた別の操作と重複したため保存できませんでした。", :conflict)
      end
      rescue_from ActiveRecord::RecordNotDestroyed do
        render_error("delete_failed", "記録を削除できませんでした。", :unprocessable_content)
      end
      rescue_from ActionController::ParameterMissing do |error|
        render_error("validation_error", "#{error.param}が指定されていません。", :unprocessable_content)
      end
      rescue_from ActionController::BadRequest do |error|
        render_error("validation_error", error.message, :unprocessable_content)
      end

      private

      def require_login
        render_error("unauthenticated", "ログインが必要です。", :unauthorized) unless current_user
      end

      def render_rate_limited
        render_error("rate_limited", "短時間に操作が集中しています。少し待ってからもう一度お試しください。", :too_many_requests)
      end

      def render_validation_error(record)
        render_error("validation_error", "入力内容を確認してください。", :unprocessable_content,
          details: record.errors.to_hash)
      end
    end
  end
end
