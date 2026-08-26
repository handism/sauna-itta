require "test_helper"

class HealthControllerTest < ActionDispatch::IntegrationTest
  test "should get show and return ok" do
    get "/up"
    assert_response :success
    assert_equal "ok", response.body
  end

  test "should return service unavailable when database is down" do
    original_method = ActiveRecord::Base.connection.method(:select_value)

    ActiveRecord::Base.connection.singleton_class.class_eval do
      alias_method :original_select_value, :select_value
      define_method(:select_value) do |*|
        raise ActiveRecord::ActiveRecordError
      end
    end

    begin
      get "/up"
      assert_response :service_unavailable
      assert_equal "database unavailable", response.body
    ensure
      ActiveRecord::Base.connection.singleton_class.class_eval do
        remove_method(:select_value)
        alias_method :select_value, :original_select_value
        remove_method(:original_select_value)
      end
    end
  end

  test "should return service unavailable when database connection is not established" do
    ActiveRecord::Base.singleton_class.class_eval do
      alias_method :original_connection, :connection
      define_method(:connection) do |*|
        raise ActiveRecord::ConnectionNotEstablished
      end
    end

    begin
      get "/up"
      assert_response :service_unavailable
      assert_equal "database unavailable", response.body
    ensure
      ActiveRecord::Base.singleton_class.class_eval do
        remove_method(:connection)
        alias_method :connection, :original_connection
        remove_method(:original_connection)
      end
    end
  end
end
