require "test_helper"

class ApiRateLimitTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "上限を超えた呼び出しは429のrate_limitedで返す" do
    sign_in

    120.times do
      get "/api/v1/sauna_visits"
      assert_response :success
    end

    get "/api/v1/sauna_visits"
    assert_response :too_many_requests
    assert_equal "rate_limited", response.parsed_body.dig("error", "code")
  end

  test "読み取りの上限は書き込みの回数と別に数える" do
    csrf = sign_in

    120.times { get "/api/v1/sauna_visits" }
    get "/api/v1/sauna_visits"
    assert_response :too_many_requests

    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes },
      headers: csrf_header(csrf), as: :json
    assert_response :created
  end

  test "未ログインの呼び出しは数えずに401で返す" do
    121.times { get "/api/v1/sauna_visits" }

    assert_response :unauthorized
  end
end
