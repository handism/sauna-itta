Rails.application.configure do
  config.enable_reloading = false
  config.eager_load = ENV["CI"].present?
  config.public_file_server.enabled = true
  config.consider_all_requests_local = true
  config.action_controller.allow_forgery_protection = true
  config.active_storage.service = :test
  config.active_job.queue_adapter = :test
  config.active_support.deprecation = :stderr
end
