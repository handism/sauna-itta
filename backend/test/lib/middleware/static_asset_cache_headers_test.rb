require "test_helper"
require_relative "../../../lib/middleware/static_asset_cache_headers"

class StaticAssetCacheHeadersMiddlewareTest < ActiveSupport::TestCase
  def setup
    @app = ->(env) { [ env.fetch("mock.status", 200), env.fetch("mock.headers", {}), [ "body" ] ] }
    @middleware = StaticAssetCacheHeaders.new(@app)
  end

  test "sets cache-control header when status is 200 and path matches immutable prefix" do
    env = { "PATH_INFO" => "/_next/static/css/main.css", "mock.status" => 200, "mock.headers" => {} }
    status, headers, body = @middleware.call(env)

    assert_equal 200, status
    assert_equal StaticAssetCacheHeaders::IMMUTABLE_CACHE_CONTROL, headers["cache-control"]
    assert_equal [ "body" ], body
  end

  test "does not set cache-control header when status is not 200" do
    env = { "PATH_INFO" => "/_next/static/css/main.css", "mock.status" => 404, "mock.headers" => {} }
    status, headers, body = @middleware.call(env)

    assert_equal 404, status
    assert_nil headers["cache-control"]
    assert_equal [ "body" ], body
  end

  test "does not set cache-control header when path does not match immutable prefix" do
    env = { "PATH_INFO" => "/images/logo.png", "mock.status" => 200, "mock.headers" => {} }
    status, headers, body = @middleware.call(env)

    assert_equal 200, status
    assert_nil headers["cache-control"]
    assert_equal [ "body" ], body
  end

  test "does not set cache-control header when PATH_INFO is nil" do
    env = { "mock.status" => 200, "mock.headers" => {} }
    status, headers, body = @middleware.call(env)

    assert_equal 200, status
    assert_nil headers["cache-control"]
    assert_equal [ "body" ], body
  end

  test "does not overwrite existing cache-control header if path does not match" do
    env = { "PATH_INFO" => "/api/data", "mock.status" => 200, "mock.headers" => { "cache-control" => "no-cache" } }
    status, headers, body = @middleware.call(env)

    assert_equal 200, status
    assert_equal "no-cache", headers["cache-control"]
  end
end
