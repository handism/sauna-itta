ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)
require "bundler/setup"
require "bootsnap/setup" if ENV.fetch("DISABLE_BOOTSNAP", "0") != "1"
