require "test_helper"

class HealthControllerTest < ActionDispatch::IntegrationTest
  test "should get show and return ok" do
    get "/up"
    assert_response :success
    assert_equal "ok", response.body
  end

  test "should return service unavailable when database is down" do
    ActiveRecord::Base.connection.stub(:select_value, ->(*) { raise ActiveRecord::ActiveRecordError }) do
      get "/up"
      assert_response :service_unavailable
      assert_equal "database unavailable", response.body
    end
  end
end
