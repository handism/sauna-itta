require "test_helper"
require_relative "../../../lib/middleware/request_body_limit"

class MiddlewareRequestBodyLimitTest < ActiveSupport::TestCase
  def setup
    @app = ->(env) { [ 200, env, [ "app response" ] ] }
    @middleware = RequestBodyLimit.new(@app)
    @max_bytes = RequestBodyLimit::MAX_BYTES
  end

  test "returns 413 Payload Too Large when path is under /api/ and content length exceeds limit" do
    env = Rack::MockRequest.env_for("/api/test", "CONTENT_LENGTH" => (@max_bytes + 1).to_s)
    status, headers, body = @middleware.call(env)

    assert_equal 413, status
    assert_equal "application/json; charset=utf-8", headers["content-type"]

    response_body = JSON.parse(body.first)
    assert_equal "payload_too_large", response_body["error"]["code"]
  end

  test "calls app when path is under /api/ and content length is exactly the limit" do
    env = Rack::MockRequest.env_for("/api/test", "CONTENT_LENGTH" => @max_bytes.to_s)
    status, _headers, body = @middleware.call(env)

    assert_equal 200, status
    assert_equal [ "app response" ], body
  end

  test "calls app when path is under /api/ and content length is well below the limit" do
    env = Rack::MockRequest.env_for("/api/test", "CONTENT_LENGTH" => "100")
    status, _headers, body = @middleware.call(env)

    assert_equal 200, status
    assert_equal [ "app response" ], body
  end

  test "calls app when path is under /api/ and content length is not provided" do
    env = Rack::MockRequest.env_for("/api/test")
    status, _headers, body = @middleware.call(env)

    assert_equal 200, status
    assert_equal [ "app response" ], body
  end

  test "calls app when path is not under /api/ even if content length exceeds limit" do
    env = Rack::MockRequest.env_for("/other/path", "CONTENT_LENGTH" => (@max_bytes + 1).to_s)
    status, _headers, body = @middleware.call(env)

    assert_equal 200, status
    assert_equal [ "app response" ], body
  end
end
