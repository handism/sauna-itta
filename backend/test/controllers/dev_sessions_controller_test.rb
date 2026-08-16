require "test_helper"

class DevSessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @original_forgery_protection = ActionController::Base.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = false

    # We will redefine Rails.env for the tests in a way that respects test environment
    # but mocks the behavior for this specific controller safely.
  end

  teardown do
    ActionController::Base.allow_forgery_protection = @original_forgery_protection
  end

  def mock_rails_env(environment, &block)
    original_env = Rails.env
    Rails.define_singleton_method(:env) { ActiveSupport::StringInquirer.new(environment) }
    block.call
  ensure
    Rails.define_singleton_method(:env) { original_env }
  end

  test "returns not_found when not in development environment" do
    # When not in development, the route is not drawn in config/routes.rb.
    # However, since we are calling it directly, it should raise a RoutingError in test environment.

    begin
      Rails.application.routes.draw do
        post "/dev/login", to: "dev_sessions#create"
      end

      mock_rails_env("test") do
        post "/dev/login"
        assert_response :not_found
      end
    ensure
      Rails.application.reload_routes!
    end
  end

  test "returns not_found when ENABLE_DEV_LOGIN is not true" do
    original_enable = ENV["ENABLE_DEV_LOGIN"]

    begin
      Rails.application.routes.draw do
        post "/dev/login", to: "dev_sessions#create"
      end

      mock_rails_env("development") do
        ENV["ENABLE_DEV_LOGIN"] = "false"
        post "/dev/login"
        assert_response :not_found
      end
    ensure
      Rails.application.reload_routes!
      ENV["ENABLE_DEV_LOGIN"] = original_enable
    end
  end

  test "creates user and logs in when conditions are met" do
    original_enable = ENV["ENABLE_DEV_LOGIN"]
    original_email = ENV["DEV_LOGIN_EMAIL"]

    begin
      Rails.application.routes.draw do
        post "/dev/login", to: "dev_sessions#create"
      end

      mock_rails_env("development") do
        ENV["ENABLE_DEV_LOGIN"] = "true"
        ENV.delete("DEV_LOGIN_EMAIL") # Default fallback

        assert_difference("User.count", 1) do
          post "/dev/login"
        end

        assert_redirected_to "/"

        user = User.last
        assert_equal "development-user", user.google_subject
        assert_equal "developer@example.com", user.email
        assert_equal user.id, session[:user_id]
      end
    ensure
      Rails.application.reload_routes!
      ENV["ENABLE_DEV_LOGIN"] = original_enable
      ENV["DEV_LOGIN_EMAIL"] = original_email
    end
  end

  test "uses DEV_LOGIN_EMAIL from ENV if present" do
    original_enable = ENV["ENABLE_DEV_LOGIN"]
    original_email = ENV["DEV_LOGIN_EMAIL"]

    begin
      Rails.application.routes.draw do
        post "/dev/login", to: "dev_sessions#create"
      end

      mock_rails_env("development") do
        ENV["ENABLE_DEV_LOGIN"] = "true"
        ENV["DEV_LOGIN_EMAIL"] = "custom@example.com"

        assert_difference("User.count", 1) do
          post "/dev/login"
        end

        user = User.last
        assert_equal "custom@example.com", user.email
      end
    ensure
      Rails.application.reload_routes!
      ENV["ENABLE_DEV_LOGIN"] = original_enable
      ENV["DEV_LOGIN_EMAIL"] = original_email
    end
  end

  test "finds existing user instead of creating new one" do
    original_enable = ENV["ENABLE_DEV_LOGIN"]

    begin
      Rails.application.routes.draw do
        post "/dev/login", to: "dev_sessions#create"
      end

      mock_rails_env("development") do
        ENV["ENABLE_DEV_LOGIN"] = "true"

        User.create!(google_subject: "development-user", email: "existing@example.com")

        assert_no_difference("User.count") do
          post "/dev/login"
        end

        assert_redirected_to "/"

        user = User.last
        assert_equal "existing@example.com", user.email
        assert_equal user.id, session[:user_id]
      end
    ensure
      Rails.application.reload_routes!
      ENV["ENABLE_DEV_LOGIN"] = original_enable
    end
  end
end
