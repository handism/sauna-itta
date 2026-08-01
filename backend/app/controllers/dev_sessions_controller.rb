class DevSessionsController < ApplicationController
  def create
    return head :not_found unless Rails.env.development? && ENV["ENABLE_DEV_LOGIN"] == "true"

    user = User.find_or_create_by!(google_subject: "development-user") do |record|
      record.email = ENV.fetch("DEV_LOGIN_EMAIL", "developer@example.com")
    end
    reset_session
    session[:user_id] = user.id
    redirect_to "/"
  end
end
