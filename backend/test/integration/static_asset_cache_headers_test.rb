require "test_helper"
require "fileutils"

class StaticAssetCacheHeadersTest < ActionDispatch::IntegrationTest
  IMMUTABLE = "public, max-age=31536000, immutable"

  setup do
    @hashed_asset = Rails.root.join("public/_next/static/chunks/cache-test.abc123.js")
    FileUtils.mkdir_p(@hashed_asset.dirname)
    File.write(@hashed_asset, "console.log('cache test')")

    @plain_asset = Rails.root.join("public/cache-test.html")
    File.write(@plain_asset, "<!doctype html><title>cache test</title>")
  end

  teardown do
    FileUtils.rm_f(@hashed_asset)
    FileUtils.rm_f(@plain_asset)
    # 自分が作った空ディレクトリだけを片付ける（ローカルのビルド成果物は消さない）
    dir = @hashed_asset.dirname
    while dir != Rails.root.join("public") && dir.directory? && dir.children.empty?
      Dir.rmdir(dir)
      dir = dir.parent
    end
  end

  test "ハッシュ付きの_next/static資産へ長期キャッシュを付ける" do
    get "/_next/static/chunks/cache-test.abc123.js"

    assert_response :success
    assert_equal IMMUTABLE, response.headers["cache-control"]
  end

  test "ハッシュを持たない資産へは長期キャッシュを付けない" do
    get "/cache-test.html"

    assert_response :success
    assert_not_equal IMMUTABLE, response.headers["cache-control"]
  end

  test "APIレスポンスのキャッシュ指定を書き換えない" do
    get "/api/v1/session"

    assert_response :success
    assert_not_equal IMMUTABLE, response.headers["cache-control"]
  end
end
