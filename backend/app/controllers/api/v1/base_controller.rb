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
      rescue_from ActiveRecord::RecordNotDestroyed do
        render_error("delete_failed", "記録を削除できませんでした。", :unprocessable_content)
      end
      rescue_from ActionController::ParameterMissing do |error|
        render_error("validation_error", "#{error.param}が指定されていません。", :unprocessable_content)
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
