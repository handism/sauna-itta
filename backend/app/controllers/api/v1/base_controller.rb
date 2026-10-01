module Api
  module V1
    class BaseController < ApplicationController
      before_action :require_login

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

      def render_validation_error(record)
        render_error("validation_error", "入力内容を確認してください。", :unprocessable_content,
          details: record.errors.to_hash)
      end
    end
  end
end
