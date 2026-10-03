require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_view/railtie"

Bundler.require(*Rails.groups)

# ミドルウェアはスタック構築時に定数解決されるため、autoload には任せず明示的に読み込む
require_relative "../lib/middleware/static_asset_cache_headers"
require_relative "../lib/middleware/content_security_policy_header"
require_relative "../lib/middleware/request_body_limit"

module SaunaIttaBackend
  class Application < Rails::Application
    config.load_defaults 8.1
    config.autoload_lib(ignore: %w[assets tasks middleware])
    config.time_zone = "Tokyo"
    config.active_record.default_timezone = :utc
    config.active_job.queue_adapter = :async
    config.public_file_server.enabled = true
    # ActionDispatch::Static より外側に置き、配信されたレスポンスのヘッダを上書きする
    config.middleware.insert_before ActionDispatch::Static, StaticAssetCacheHeaders
    # 静的配信された index.html にも付けるため、同じく ActionDispatch::Static より外側に置く
    config.middleware.insert_before ActionDispatch::Static, ContentSecurityPolicyHeader
    # パラメータの解析や認証より前に、大きすぎるボディを弾く
    config.middleware.insert_before ActionDispatch::Static, RequestBodyLimit
    config.session_store :cookie_store,
      key: "_sauna_itta_session",
      secure: Rails.env.production?,
      httponly: true,
      same_site: :lax
  end
end
