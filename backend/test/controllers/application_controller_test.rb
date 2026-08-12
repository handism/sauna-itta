require "test_helper"

class ApplicationControllerTest < ActionDispatch::IntegrationTest
  class DummyController < ApplicationController
    def index
      render json: { user_id: current_user&.id }
    end

    def raise_csrf
      raise ActionController::InvalidAuthenticityToken
    end

    def custom_error
      render_error("custom_code", "Custom message", :bad_request, details: "Custom details")
    end
  end

  setup do
    Rails.application.routes.draw do
      get "/dummy_index", to: "application_controller_test/dummy#index"
      get "/dummy_raise_csrf", to: "application_controller_test/dummy#raise_csrf"
      get "/dummy_custom_error", to: "application_controller_test/dummy#custom_error"

      # Mock route to set session
      get "/dummy_login/:id", to: ->(env) {
        request = ActionDispatch::Request.new(env)
        request.session[:user_id] = env["action_dispatch.request.path_parameters"][:id].to_i
        [ 200, { "Content-Type" => "text/plain" }, [ "Logged in" ] ]
      }
    end
  end

  teardown do
    Rails.application.reload_routes!
  end

  test "returns nil for current_user if not logged in" do
    get "/dummy_index"
    json = JSON.parse(response.body)
    assert_nil json["user_id"]
  end

  test "returns current_user if logged in" do
    user = User.create!(google_subject: "123", email: "test@example.com")

    get "/dummy_login/#{user.id}"
    get "/dummy_index"

    json = JSON.parse(response.body)
    assert_equal user.id, json["user_id"]
  end

  test "rescues from CSRF token error" do
    get "/dummy_raise_csrf"
    assert_response :unprocessable_content
    json = JSON.parse(response.body)
    assert_equal "invalid_csrf", json["error"]["code"]
    assert_equal "CSRFトークンが不正です。", json["error"]["message"]
  end

  test "render_error formats correctly with details" do
    get "/dummy_custom_error"
    assert_response :bad_request
    json = JSON.parse(response.body)
    assert_equal "custom_code", json["error"]["code"]
    assert_equal "Custom message", json["error"]["message"]
    assert_equal "Custom details", json["error"]["details"]
  end

  class DummyNoDetailsController < ApplicationController
    def custom_error_no_details
      render_error("custom_code", "Custom message", :bad_request)
    end
  end

  test "render_error formats correctly without details" do
    Rails.application.routes.draw do
      get "/dummy_custom_error_no_details", to: "application_controller_test/dummy_no_details#custom_error_no_details"
    end

    get "/dummy_custom_error_no_details"
    assert_response :bad_request
    json = JSON.parse(response.body)
    assert_equal "custom_code", json["error"]["code"]
    assert_equal "Custom message", json["error"]["message"]
    assert_nil json["error"]["details"]
  end
end
