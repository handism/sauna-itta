require "test_helper"

class ApiV1ClientErrorsTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "ブラウザのエラーを1行のJSONとしてログへ残す" do
    csrf = sign_in

    messages = capture_rails_logger_errors do
      post "/api/v1/client_errors", params: {
        clientError: { message: "boom\nfake log line", stack: "x" * 10_000, source: "window-error", url: "http://example.com/" }
      }, headers: csrf_header(csrf), as: :json
    end

    assert_response :no_content
    assert_equal 1, messages.size
    assert_not_includes messages.first, "\n"
    logged = JSON.parse(messages.first)
    assert_equal "client_error", logged["event"]
    assert_equal "boom\nfake log line", logged["message"]
    assert_equal 8_000, logged["stack"].size
    assert_equal "window-error", logged["source"]
  end

  test "messageの無い報告は422で返す" do
    csrf = sign_in

    post "/api/v1/client_errors", params: { clientError: { source: "window-error" } },
      headers: csrf_header(csrf), as: :json

    assert_response :unprocessable_content
  end

  test "未ログインでは受け付けない" do
    get "/api/v1/session"
    csrf = response.parsed_body.fetch("csrfToken")

    post "/api/v1/client_errors", params: { clientError: { message: "boom" } },
      headers: csrf_header(csrf), as: :json

    assert_response :unauthorized
  end

  test "CSRFトークンの無い報告は受け付けない" do
    sign_in

    post "/api/v1/client_errors", params: { clientError: { message: "boom" } }, as: :json

    assert_response :unprocessable_content
    assert_equal "invalid_csrf", response.parsed_body.dig("error", "code")
  end
end
