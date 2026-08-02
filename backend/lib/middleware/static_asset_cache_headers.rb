# Next.jsの静的エクスポートのうち、内容ハッシュがファイル名に入るのは `/_next/static/`
# 配下だけ。`config.public_file_server.headers` は public/ 全体へ一律に付くため、そこで
# 長期キャッシュを指定すると index.html まで固定され、デプロイしても更新が届かなくなる。
# パスを見てハッシュ付き資産にだけ immutable を付けるためのミドルウェア。
class StaticAssetCacheHeaders
  IMMUTABLE_PREFIX = "/_next/static/"
  IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable"

  def initialize(app)
    @app = app
  end

  def call(env)
    status, headers, body = @app.call(env)
    if status == 200 && env["PATH_INFO"].to_s.start_with?(IMMUTABLE_PREFIX)
      headers["cache-control"] = IMMUTABLE_CACHE_CONTROL
    end
    [ status, headers, body ]
  end
end
