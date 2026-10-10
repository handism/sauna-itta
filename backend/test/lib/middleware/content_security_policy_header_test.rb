require "test_helper"

class ContentSecurityPolicyHeaderMiddlewareTest < ActiveSupport::TestCase
  def setup
    @app = ->(env) { [ 200, env["mock.headers"] || { "content-type" => "text/html" }, env["mock.body"] || [ "<html><head><script>alert(1)</script></head><body>Hello</body></html>" ] ] }
    @middleware = ContentSecurityPolicyHeader.new(@app)
  end

  def test_adds_csp_header_with_script_hashes
    env = { "REQUEST_METHOD" => "GET" }
    status, headers, body = @middleware.call(env)

    assert_equal 200, status
    assert_includes headers["content-security-policy"], "script-src 'self' 'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='"
    assert_equal [ "<html><head><script>alert(1)</script></head><body>Hello</body></html>" ], body
  end

  def test_ignores_non_html
    env = { "REQUEST_METHOD" => "GET", "mock.headers" => { "content-type" => "application/json" } }
    status, headers, _body = @middleware.call(env)

    assert_nil headers["content-security-policy"]
  end

  def test_ignores_head_requests
    env = { "REQUEST_METHOD" => "HEAD", "mock.headers" => { "content-type" => "text/html" } }
    status, headers, _body = @middleware.call(env)

    assert_nil headers["content-security-policy"]
  end

  def test_handles_gzip_encoding
    html = "<html><head><script>alert('gzip')</script></head><body>Hello</body></html>"
    gzipped = StringIO.new.tap { |io| Zlib::GzipWriter.wrap(io) { |gz| gz.write(html) } }.string

    env = {
      "REQUEST_METHOD" => "GET",
      "mock.headers" => { "content-type" => "text/html", "content-encoding" => "gzip" },
      "mock.body" => [ gzipped ]
    }

    status, headers, body = @middleware.call(env)
    assert_equal 200, status
    assert_equal [ gzipped ], body

    # Hash of "alert('gzip')"
    # Expected base64 digest
    digest = Digest::SHA256.base64digest("alert('gzip')")
    assert_includes headers["content-security-policy"], "script-src 'self' 'sha256-#{digest}'"
  end

  def test_handles_invalid_gzip_encoding
    env = {
      "REQUEST_METHOD" => "GET",
      "mock.headers" => { "content-type" => "text/html", "content-encoding" => "gzip" },
      "mock.body" => [ "not gzipped content" ]
    }

    status, headers, _body = @middleware.call(env)
    assert_equal 200, status
    assert_nil headers["content-security-policy"]
  end

  def test_multiple_inline_scripts
    env = {
      "REQUEST_METHOD" => "GET",
      "mock.headers" => { "content-type" => "text/html" },
      "mock.body" => [ "<html><head><script>alert(1)</script><script>alert(2)</script></head><body>Hello</body></html>" ]
    }

    status, headers, _body = @middleware.call(env)

    digest1 = Digest::SHA256.base64digest("alert(1)")
    digest2 = Digest::SHA256.base64digest("alert(2)")

    assert_includes headers["content-security-policy"], "script-src 'self' 'sha256-#{digest1}' 'sha256-#{digest2}'"
  end

  def test_external_scripts_are_ignored
    env = {
      "REQUEST_METHOD" => "GET",
      "mock.headers" => { "content-type" => "text/html" },
      "mock.body" => [ "<html><head><script src='app.js'></script></head><body>Hello</body></html>" ]
    }

    status, headers, _body = @middleware.call(env)

    assert_includes headers["content-security-policy"], "script-src 'self'"
    refute_match(/sha256-/, headers["content-security-policy"])
  end

  def test_cache_limit
    # To test caching, we need a single instance of the middleware.
    # The middleware caches by: key = Digest::SHA256.digest("#{encoding}\n#{content}")
    # It does NOT cache the response itself, it caches the built policy per encoding+content.
    # The cache limit is 32.

    # Fill the cache
    (ContentSecurityPolicyHeader::CACHE_LIMIT + 1).times do |i|
      env = {
        "REQUEST_METHOD" => "GET",
        "mock.headers" => { "content-type" => "text/html" },
        "mock.body" => [ "<html><head><script>alert(#{i})</script></head><body>Hello</body></html>" ]
      }
      @middleware.call(env)
    end

    # Send another one and check if it is still correct
    env = {
      "REQUEST_METHOD" => "GET",
      "mock.headers" => { "content-type" => "text/html" },
      "mock.body" => [ "<html><head><script>alert('new')</script></head><body>Hello</body></html>" ]
    }
    status, headers, _body = @middleware.call(env)
    digest = Digest::SHA256.base64digest("alert('new')")
    assert_includes headers["content-security-policy"], "script-src 'self' 'sha256-#{digest}'"
  end

  def test_content_length_updated
    env = {
      "REQUEST_METHOD" => "GET",
      "mock.headers" => { "content-type" => "text/html", "content-length" => "10" },
      "mock.body" => [ "<html></html>" ]
    }

    status, headers, _body = @middleware.call(env)
    assert_equal "13", headers["content-length"] # "<html></html>".bytesize
  end
end
