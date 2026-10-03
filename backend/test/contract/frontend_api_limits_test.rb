require "test_helper"

# フロントの上限値 (frontend/src/components/sauna-map/utils/apiLimits.json) と Rails 側の定数が
# 一致していることを検査する。片側だけ変えると、apiモードで保存・取り込みがサーバーに
# 弾かれて初めて食い違いに気付くことになる。
class FrontendApiLimitsTest < ActiveSupport::TestCase
  LIMITS_PATH = Rails.root.join("../frontend/src/components/sauna-map/utils/apiLimits.json")

  setup do
    unless LIMITS_PATH.exist?
      # backend/ だけをマウントする開発用コンテナではフロントのファイルが無い。CI では必ず検査する
      flunk "#{LIMITS_PATH} が見つかりません" if ENV["CI"]
      skip "フロントエンドのファイルが無い環境では検査しない"
    end
    @limits = JSON.parse(LIMITS_PATH.read)
  end

  test "インポートの1リクエストあたりの件数" do
    assert_equal Api::V1::ImportsController::MAX_BATCH_SIZE, @limits.fetch("importMaxBatchSize")
  end

  test "写真1枚のバイト数の上限" do
    assert_equal VisitHistoryEntry::MAX_IMAGE_BYTES, @limits.fetch("maxImageBytes")
  end

  test "受け付ける画像形式" do
    assert_equal VisitHistoryEntry::ALLOWED_IMAGE_TYPES.sort, @limits.fetch("allowedImageMimeTypes").sort
  end
end
