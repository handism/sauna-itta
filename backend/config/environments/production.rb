require "active_support/core_ext/integer/time"

Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = true
  config.consider_all_requests_local = false
  config.force_ssl = true
  config.assume_ssl = true
  config.log_level = ENV.fetch("RAILS_LOG_LEVEL", "info")
  config.log_tags = [ :request_id ]
  config.active_storage.service = :google
  config.active_support.report_deprecations = false
end
