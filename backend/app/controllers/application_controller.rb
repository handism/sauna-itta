class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  rescue_from ActionController::InvalidAuthenticityToken do
    render_error("invalid_csrf", "CSRFトークンが不正です。", :unprocessable_content)
  end

  private

  def current_user
    @current_user ||= User.find_by(id: session[:user_id])
  end

  def render_error(code, message, status, details: nil)
    body = { error: { code: code, message: message } }
    body[:error][:details] = details if details.present?
    render json: body, status: status
  end
end
