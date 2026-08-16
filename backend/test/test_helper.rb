ENV["RAILS_ENV"] ||= "test"
require_relative "../config/environment"
require "rails/test_help"
require_relative "support/api_auth_helper"

class ActiveSupport::TestCase
  parallelize(workers: 1)
  include ActiveJob::TestHelper
end
