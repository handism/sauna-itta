require "test_helper"

class Api::V1::BaseControllerTest < ActionDispatch::IntegrationTest
  class DummyController < Api::V1::BaseController
    def index
      render json: { success: true }
    end

    def raise_not_found
      raise ActiveRecord::RecordNotFound
    end

    def raise_stale_object
      raise ActiveRecord::StaleObjectError.new(User.new, "update")
    end

    def raise_not_destroyed
      raise ActiveRecord::RecordNotDestroyed.new("cannot destroy", User.new)
    end

    def raise_parameter_missing
      raise ActionController::ParameterMissing, :name
    end

    def trigger_validation_error
      user = User.new
      user.errors.add(:base, "invalid input")
      render_validation_error(user)
    end
  end

  setup do
    Rails.application.routes.draw do
      get "/dummy_api_index", to: "api/v1/base_controller_test/dummy#index"
      get "/dummy_api_not_found", to: "api/v1/base_controller_test/dummy#raise_not_found"
      get "/dummy_api_stale_object", to: "api/v1/base_controller_test/dummy#raise_stale_object"
      get "/dummy_api_not_destroyed", to: "api/v1/base_controller_test/dummy#raise_not_destroyed"
      get "/dummy_api_parameter_missing", to: "api/v1/base_controller_test/dummy#raise_parameter_missing"
      get "/dummy_api_validation_error", to: "api/v1/base_controller_test/dummy#trigger_validation_error"

      # Mock route to set session for authentication
      get "/dummy_api_login/:id", to: ->(env) {
        request = ActionDispatch::Request.new(env)
        request.session[:user_id] = env["action_dispatch.request.path_parameters"][:id].to_i
        [ 200, { "Content-Type" => "text/plain" }, [ "Logged in" ] ]
      }
    end
  end

  teardown do
    Rails.application.reload_routes!
  end

  test "require_login renders unauthorized if not logged in" do
    get "/dummy_api_index"
    assert_response :unauthorized
    json = JSON.parse(response.body)
    assert_equal "unauthenticated", json["error"]["code"]
    assert_equal "ログインが必要です。", json["error"]["message"]
  end

  test "require_login allows access if logged in" do
    user = User.create!(google_subject: "123", email: "test@example.com")
    get "/dummy_api_login/#{user.id}"

    get "/dummy_api_index"
    assert_response :success
    json = JSON.parse(response.body)
    assert_equal true, json["success"]
  end

  test "rescues from ActiveRecord::RecordNotFound" do
    user = User.create!(google_subject: "123", email: "test@example.com")
    get "/dummy_api_login/#{user.id}"

    get "/dummy_api_not_found"
    assert_response :not_found
    json = JSON.parse(response.body)
    assert_equal "not_found", json["error"]["code"]
    assert_equal "対象の記録が見つかりません。", json["error"]["message"]
  end

  test "rescues from ActiveRecord::StaleObjectError" do
    user = User.create!(google_subject: "123", email: "test@example.com")
    get "/dummy_api_login/#{user.id}"

    get "/dummy_api_stale_object"
    assert_response :conflict
    json = JSON.parse(response.body)
    assert_equal "conflict", json["error"]["code"]
    assert_equal "別の画面で記録が更新されています。", json["error"]["message"]
  end

  test "rescues from ActiveRecord::RecordNotDestroyed" do
    user = User.create!(google_subject: "123", email: "test@example.com")
    get "/dummy_api_login/#{user.id}"

    get "/dummy_api_not_destroyed"
    assert_response :unprocessable_content
    json = JSON.parse(response.body)
    assert_equal "delete_failed", json["error"]["code"]
    assert_equal "記録を削除できませんでした。", json["error"]["message"]
  end

  test "rescues from ActionController::ParameterMissing" do
    user = User.create!(google_subject: "123", email: "test@example.com")
    get "/dummy_api_login/#{user.id}"

    get "/dummy_api_parameter_missing"
    assert_response :unprocessable_content
    json = JSON.parse(response.body)
    assert_equal "validation_error", json["error"]["code"]
    assert_equal "nameが指定されていません。", json["error"]["message"]
  end

  test "render_validation_error formats correctly" do
    user = User.create!(google_subject: "123", email: "test@example.com")
    get "/dummy_api_login/#{user.id}"

    get "/dummy_api_validation_error"
    assert_response :unprocessable_content
    json = JSON.parse(response.body)
    assert_equal "validation_error", json["error"]["code"]
    assert_equal "入力内容を確認してください。", json["error"]["message"]
    assert_equal ["invalid input"], json["error"]["details"]["base"]
  end
end
