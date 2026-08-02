module Auth
  class CallbacksController < ApplicationController
    skip_forgery_protection only: :create

    def create
      auth = request.env.fetch("omniauth.auth")
      email = auth.dig("info", "email").to_s.downcase
      allowed_email = ENV.fetch("ALLOWED_GOOGLE_EMAIL").downcase
      unless email == allowed_email && email_verified?(auth)
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

    private

    # 許可メールとの一致がこのアプリ唯一の認可境界のため、メールの確認済みフラグも見る
    # （OIDC の email クレームは確認済みを保証しない）。Google は email_verified を必ず
    # 返すが、providerを差し替えてこのフラグが欠けると所有者もログインできなくなる点に注意。
    def email_verified?(auth)
      value = auth.dig("extra", "raw_info", "email_verified")
      value = auth.dig("info", "email_verified") if value.nil?
      ActiveModel::Type::Boolean.new.cast(value)
    end
  end
end
