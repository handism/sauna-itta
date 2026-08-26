require "test_helper"

class VisitWritableTest < ActiveSupport::TestCase
  class DummyController
    include VisitWritable
  end

  def setup
    @controller = DummyController.new
  end

  test "purge_stale_image_blobs handles StandardError during purge_later and logs the error" do
    blob = Object.new
    def blob.id; 1; end
    def blob.purge_later
      raise StandardError, "Purge failed"
    end

    logger_messages = []
    dummy_logger = Object.new
    dummy_logger.define_singleton_method(:error) do |msg|
      logger_messages << msg
    end

    original_logger = Rails.logger
    begin
      Rails.define_singleton_method(:logger) { dummy_logger }
      @controller.send(:purge_stale_image_blobs, [ blob ])
    ensure
      Rails.define_singleton_method(:logger) { original_logger }
    end

    assert_includes logger_messages, "古い訪問画像の削除に失敗しました: StandardError: Purge failed"
  end
end
