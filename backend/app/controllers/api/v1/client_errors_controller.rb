module Api
  module V1
    # ブラウザで起きたエラーを受け取り、Rails のログ（本番は Cloud Logging）へ残す。
    # 利用者の端末のエラーは console に出るだけでは開発者に届かないため、その受け口にする。
    #
    # 届く内容は利用者のブラウザが組み立てたもので信用できない。長さを切り詰め、
    # 1行の JSON としてログへ出す（改行を含む値でログ行を偽装させない）。
    class ClientErrorsController < BaseController
      # 同じエラーが描画のたびに繰り返されてもログを埋め尽くさないようにする
      limit_requests to: 10

      FIELD_LIMITS = {
        message: 1_000,
        stack: 8_000,
        componentStack: 8_000,
        source: 50,
        url: 2_000
      }.freeze

      def create
        payload = params.require(:clientError).permit(*FIELD_LIMITS.keys)
        report = FIELD_LIMITS.to_h { |key, limit| [ key, payload[key].to_s.truncate(limit) ] }
        raise ActionController::BadRequest, "messageを指定してください。" if report[:message].blank?

        Rails.logger.error(
          { event: "client_error", userId: current_user.id, userAgent: request.user_agent.to_s.truncate(500) }
            .merge(report.compact_blank)
            .to_json
        )
        head :no_content
      end
    end
  end
end
