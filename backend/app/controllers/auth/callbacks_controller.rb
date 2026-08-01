module Auth
  class CallbacksController < ApplicationController
    skip_forgery_protection only: :create

    def create
      auth = request.env.fetch("omniauth.auth")
      email = auth.dig("info", "email").to_s.downcase
      allowed_email = ENV.fetch("ALLOWED_GOOGLE_EMAIL").downcase
      unless email == allowed_email
        reset_session
        return redirect_to "/?authError=forbidden", alert: "このアカウントは許可されていません。"
      end

      user = User.find_or_initialize_by(google_subject: auth.fetch("uid"))
      user.update!(email: email)
      reset_session
      session[:user_id] = user.id
      redirect_to "/"
    end

    def failure
      redirect_to "/?authError=failed", alert: "Googleログインに失敗しました。"
    end
  end
end
