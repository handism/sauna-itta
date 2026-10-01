require "test_helper"

class ImageBlobPurgerTest < ActiveSupport::TestCase
  test "同じblobが重なっても1回だけ破棄する" do
    calls = 0
    blob = Object.new
    blob.define_singleton_method(:purge_later) { calls += 1 }

    ImageBlobPurger.purge_later([ blob, blob ], context: "テスト")

    assert_equal 1, calls
  end

  test "破棄の失敗はログに残し、残りのblobの破棄を続ける" do
    failing = Object.new
    failing.define_singleton_method(:purge_later) { raise StandardError, "Purge failed" }
    purged = false
    succeeding = Object.new
    succeeding.define_singleton_method(:purge_later) { purged = true }

    messages = capture_rails_logger_errors do
      ImageBlobPurger.purge_later([ failing, succeeding ], context: "テスト画像の削除")
    end

    assert_includes messages, "テスト画像の削除に失敗しました: StandardError: Purge failed"
    assert purged, "1件目の失敗で2件目の破棄が止まっています"
  end
end
