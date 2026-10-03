require "digest"
require "zlib"

# HTML 応答へ Content-Security-Policy を付ける。
#
# 画面は Next.js の静的エクスポートで、`ActionDispatch::Static`（`/` や `/stats` の
# index.html）と `StaticController` の `send_file` の両方から配信される。前者はコントローラを
# 通らないため、Rails の `content_security_policy` 設定ではなくミドルウェアで付ける。
#
# Next.js は RSC のペイロードやテーマ初期化を inline script として HTML へ埋め込むため、
# `'unsafe-inline'` を許すと XSS への防御にならない。配信する HTML の inline script を
# その場でハッシュ化し、`script-src` へ `'sha256-...'` として列挙する（ビルドごとに
# 中身が変わってもハッシュを手で更新する必要がない）。結果はファイルの中身ごとに覚えておく。
#
# 本番イメージは HTML を gzip 済みの `.gz` でも同梱し、`ActionDispatch::Static` が
# Accept-Encoding に応じてそちらを返す。圧縮されたバイト列からは script を見つけられず、
# 全ての inline script が遮断されて画面が動かなくなるため、gzip は展開してからハッシュを求める
# （応答の本文は圧縮されたまま返す）。それ以外の符号化は解釈できないため、ポリシーを付けない。
#
# 外部オリジンは地図タイル（OpenStreetMap）・場所検索（Nominatim）・Google ログインの
# リダイレクト先だけ。NEXT_PUBLIC_GEOCODING_ENDPOINT で検索先を差し替えた場合は
# CONNECT_SOURCES へも追加すること（追加しないと場所検索がブラウザに遮断される）。
class ContentSecurityPolicyHeader
  INLINE_SCRIPT = %r{<script(?![^>]*\ssrc=)[^>]*>(.*?)</script>}m

  TILE_SOURCES = %w[https://tile.openstreetmap.org https://*.tile.openstreetmap.org].freeze
  CONNECT_SOURCES = %w[https://nominatim.openstreetmap.org].freeze
  # Google ログインは POST /auth/google_oauth2 から Google へリダイレクトする。
  # Chrome は form-action をリダイレクト先にも適用するため、Google のオリジンも許可する。
  FORM_ACTION_SOURCES = %w[https://accounts.google.com].freeze

  CACHE_LIMIT = 32

  def initialize(app)
    @app = app
    @policies = {}
    @mutex = Mutex.new
  end

  def call(env)
    status, headers, body = @app.call(env)
    # HEAD は本文が無くハッシュを求められない（Content-Length も GET の値のまま残す）
    return [ status, headers, body ] if env["REQUEST_METHOD"] == "HEAD" || !html?(headers)

    content = read_body(body)
    policy = policy_for(content, headers["content-encoding"].to_s)
    headers["content-security-policy"] = policy if policy
    headers["content-length"] = content.bytesize.to_s if headers.key?("content-length")
    [ status, headers, [ content ] ]
  end

  private

  def html?(headers)
    headers["content-type"].to_s.start_with?("text/html") && !headers.key?("content-security-policy")
  end

  def read_body(body)
    buffer = +""
    body.each { |chunk| buffer << chunk }
    buffer
  ensure
    body.close if body.respond_to?(:close)
  end

  def decode(content, encoding)
    case encoding
    when "", "identity" then content
    when "gzip" then Zlib.gunzip(content)
    end
  rescue Zlib::Error
    nil
  end

  # 同じファイルの配信で毎回展開とハッシュ計算をしないよう、配信した本文ごとに覚えておく
  def policy_for(content, encoding)
    key = Digest::SHA256.digest("#{encoding}\n#{content}")
    @mutex.synchronize do
      return @policies[key] if @policies.key?(key)

      html = decode(content, encoding)
      @policies.clear if @policies.size >= CACHE_LIMIT
      @policies[key] = html && build_policy(html)
    end
  end

  def build_policy(html)
    script_hashes = html.scan(INLINE_SCRIPT).flatten.reject(&:empty?).uniq.map do |script|
      "'sha256-#{Digest::SHA256.base64digest(script)}'"
    end

    [
      "default-src 'self'",
      "script-src 'self' #{script_hashes.join(' ')}".strip,
      # Leaflet と React の style 属性が使うため、スタイルだけは inline を許す
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: #{TILE_SOURCES.join(' ')}",
      "font-src 'self'",
      "connect-src 'self' #{CONNECT_SOURCES.join(' ')}",
      "worker-src 'self'",
      "manifest-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self' #{FORM_ACTION_SOURCES.join(' ')}",
      "frame-ancestors 'none'"
    ].join("; ")
  end
end
