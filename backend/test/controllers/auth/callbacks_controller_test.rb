require "test_helper"

class Auth::CallbacksControllerTest < ActionDispatch::IntegrationTest
  setup do
    OmniAuth.config.test_mode = true
    @allowed_email = ENV.fetch("ALLOWED_GOOGLE_EMAIL", "sauna-admin@example.com").downcase
    ENV["ALLOWED_GOOGLE_EMAIL"] = @allowed_email
  end

  teardown do
    OmniAuth.config.mock_auth[:google_oauth2] = nil
    OmniAuth.config.test_mode = false
  end

  test "should create user and redirect on success with email_verified in extra.raw_info" do
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new({
      provider: "google_oauth2",
      uid: "123456789",
      info: {
        email: @allowed_email
      },
      extra: {
        raw_info: {
          email_verified: true
        }
      }
    })

    assert_difference("User.count", 1) do
      get "/auth/google_oauth2/callback"
    end

    user = User.find_by(google_subject: "123456789")
    assert_equal @allowed_email, user.email
    assert_equal user.id, session[:user_id]
    assert_redirected_to "/"
  end

  test "should log in existing user and redirect on success" do
    user = User.create!(google_subject: "987654321", email: @allowed_email)

    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new({
      provider: "google_oauth2",
      uid: "987654321",
      info: {
        email: @allowed_email
      },
      extra: {
        raw_info: {
          email_verified: true
        }
      }
    })

    assert_no_difference("User.count") do
      get "/auth/google_oauth2/callback"
    end

    assert_equal user.id, session[:user_id]
    assert_redirected_to "/"
  end

  test "should fail if email does not match ALLOWED_GOOGLE_EMAIL" do
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new({
      provider: "google_oauth2",
      uid: "123456789",
      info: {
        email: "unauthorized@example.com"
      },
      extra: {
        raw_info: {
          email_verified: true
        }
      }
    })

    assert_no_difference("User.count") do
      get "/auth/google_oauth2/callback"
    end

    assert_nil session[:user_id]
    assert_redirected_to "/?authError=forbidden"
  end

  test "should fail if email is not verified in extra.raw_info" do
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new({
      provider: "google_oauth2",
      uid: "123456789",
      info: {
        email: @allowed_email
      },
      extra: {
        raw_info: {
          email_verified: false
        }
      }
    })

    assert_no_difference("User.count") do
      get "/auth/google_oauth2/callback"
    end

    assert_nil session[:user_id]
    assert_redirected_to "/?authError=forbidden"
  end

  test "should succeed if email_verified is missing in extra.raw_info but true in info" do
    OmniAuth.config.mock_auth[:google_oauth2] = OmniAuth::AuthHash.new({
      provider: "google_oauth2",
      uid: "123456789",
      info: {
        email: @allowed_email,
        email_verified: true
      },
      extra: {
        raw_info: {}
      }
    })

    assert_difference("User.count", 1) do
      get "/auth/google_oauth2/callback"
    end

    user = User.find_by(google_subject: "123456789")
    assert_equal user.id, session[:user_id]
    assert_redirected_to "/"
  end

  test "failure action should redirect to authError=failed" do
    get "/auth/failure"
    assert_redirected_to "/?authError=failed"
  end
end
