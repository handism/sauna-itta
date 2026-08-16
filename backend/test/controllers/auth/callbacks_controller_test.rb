require "test_helper"

class Auth::CallbacksControllerTest < ActionDispatch::IntegrationTest
  test "failure redirects to root with authError" do
    get "/auth/failure"
    assert_redirected_to "/?authError=failed"
    assert_equal "Googleログインに失敗しました。", flash[:alert]
  end
end
