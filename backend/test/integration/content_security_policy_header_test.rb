require "test_helper"
require "fileutils"

class ContentSecurityPolicyHeaderTest < ActionDispatch::IntegrationTest
  INLINE_SCRIPT = "self.__next_f.push([1,\"x\"])"

  setup do
    @page = Rails.root.join("public/csp-test.html")
    # public/ には追跡するファイルが無く、CI のチェックアウトにはディレクトリ自体が存在しない
    FileUtils.mkdir_p(@page.dirname)
    File.write(@page, <<~HTML)
      <!doctype html><title>csp</title>
      <script src="/_next/static/chunks/app.js" async=""></script>
      <script>#{INLINE_SCRIPT}</script>
    HTML
  end

  teardown do
    FileUtils.rm_f(@page)
    FileUtils.rm_f("#{@page}.gz")
  end

  test "HTMLのinline scriptだけをハッシュで許可する" do
    get "/csp-test.html"

    assert_response :success
    policy = response.headers["content-security-policy"]
    assert_includes policy, "'sha256-#{Digest::SHA256.base64digest(INLINE_SCRIPT)}'"
    script_src = policy.split("; ").find { |directive| directive.start_with?("script-src") }
    assert_equal "script-src 'self' 'sha256-#{Digest::SHA256.base64digest(INLINE_SCRIPT)}'", script_src
    assert_includes policy, "frame-ancestors 'none'"
    assert_includes policy, "object-src 'none'"
    # 本文を読み直しても中身と Content-Length を保つ
    assert_includes response.body, INLINE_SCRIPT
    assert_equal response.body.bytesize, response.headers["content-length"].to_i
  end

  test "JSONのAPIレスポンスには付けない" do
    get "/api/v1/session"

    assert_response :success
    assert_nil response.headers["content-security-policy"]
  end

  test "HEADは本文を読まずに通す" do
    head "/csp-test.html"

    assert_response :success
    assert_nil response.headers["content-security-policy"]
  end

  test "gzip済みのHTMLは展開してからハッシュを求め、本文は圧縮のまま返す" do
    Zlib::GzipWriter.open("#{@page}.gz") { |gz| gz.write(File.read(@page)) }

    get "/csp-test.html", headers: { "Accept-Encoding" => "gzip" }

    assert_response :success
    assert_equal "gzip", response.headers["content-encoding"]
    assert_includes response.headers["content-security-policy"],
      "'sha256-#{Digest::SHA256.base64digest(INLINE_SCRIPT)}'"
    assert_includes Zlib.gunzip(response.body), INLINE_SCRIPT
  end
end
