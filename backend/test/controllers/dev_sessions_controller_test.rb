require "test_helper"

class DevSessionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    Rails.application.routes.draw do
      get "/up", to: "health#show"
      post "/dev/login", to: "dev_sessions#create"
      namespace :api do
        namespace :v1 do
          resource :session, only: %i[show]
        end
      end
      root "static#index"
    end
  end

  teardown do
    Rails.application.reload_routes!
  end

  def with_rails_env(environment)
    original_env = Rails.env
    Rails.env = environment
    yield
  ensure
    Rails.env = original_env
  end

  def with_env(vars)
    original = vars.keys.to_h { |k| [ k, ENV[k] ] }
    vars.each do |k, v|
      if v.nil?
        ENV.delete(k)
      else
        ENV[k] = v
      end
    end
    yield
  ensure
    original.each do |k, v|
      if v.nil?
        ENV.delete(k)
      else
        ENV[k] = v
      end
    end
  end

  def fetch_csrf_token
    get "/api/v1/session"
    assert_response :success
    response.parsed_body.fetch("csrfToken")
  end

  def csrf_headers(token = fetch_csrf_token)
    { "X-CSRF-Token" => token }
  end

  test "CSRFトークンがない場合は422を返す" do
    with_rails_env("development") do
      with_env("ENABLE_DEV_LOGIN" => "true") do
        post "/dev/login"
        assert_response :unprocessable_content
        json = JSON.parse(response.body)
        assert_equal "invalid_csrf", json["error"]["code"]
      end
    end
  end

  test "development環境以外では404を返す" do
    token = fetch_csrf_token
    with_rails_env("test") do
      with_env("ENABLE_DEV_LOGIN" => "true") do
        post "/dev/login", headers: csrf_headers(token)
        assert_response :not_found
      end
    end
  end

  test "ENABLE_DEV_LOGINがtrueでない場合は404を返す" do
    token = fetch_csrf_token
    with_rails_env("development") do
      with_env("ENABLE_DEV_LOGIN" => "false") do
        post "/dev/login", headers: csrf_headers(token)
        assert_response :not_found
      end

      with_env("ENABLE_DEV_LOGIN" => nil) do
        post "/dev/login", headers: csrf_headers(token)
        assert_response :not_found
      end
    end
  end

  test "条件を満たす場合は開発ユーザーを作成してログインしトップへリダイレクトする" do
    token = fetch_csrf_token
    with_rails_env("development") do
      with_env("ENABLE_DEV_LOGIN" => "true", "DEV_LOGIN_EMAIL" => nil) do
        assert_difference("User.count", 1) do
          post "/dev/login", headers: csrf_headers(token)
        end

        assert_redirected_to "/"

        user = User.last
        assert_equal "development-user", user.google_subject
        assert_equal "developer@example.com", user.email
        assert_equal user.id, session[:user_id]
      end
    end
  end

  test "DEV_LOGIN_EMAIL環境変数が設定されている場合はそのメールアドレスを使用する" do
    token = fetch_csrf_token
    with_rails_env("development") do
      with_env("ENABLE_DEV_LOGIN" => "true", "DEV_LOGIN_EMAIL" => "custom@example.com") do
        assert_difference("User.count", 1) do
          post "/dev/login", headers: csrf_headers(token)
        end

        user = User.last
        assert_equal "custom@example.com", user.email
        assert_equal user.id, session[:user_id]
      end
    end
  end

  test "既に開発ユーザーが存在する場合は新規作成せず既存ユーザーでログインする" do
    token = fetch_csrf_token
    with_rails_env("development") do
      with_env("ENABLE_DEV_LOGIN" => "true") do
        existing_user = User.create!(google_subject: "development-user", email: "existing@example.com")

        assert_no_difference("User.count") do
          post "/dev/login", headers: csrf_headers(token)
        end

        assert_redirected_to "/"
        assert_equal existing_user.id, session[:user_id]
      end
    end
  end

  test "ログイン時にセッションをリセットする" do
    token = fetch_csrf_token
    first_session_cookie = cookies[:_sauna_itta_session]

    with_rails_env("development") do
      with_env("ENABLE_DEV_LOGIN" => "true") do
        post "/dev/login", headers: csrf_headers(token)
        assert_redirected_to "/"
        assert_not_equal first_session_cookie, cookies[:_sauna_itta_session]
      end
    end
  end
end
