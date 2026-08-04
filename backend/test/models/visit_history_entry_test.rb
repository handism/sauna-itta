require "test_helper"

class VisitHistoryEntryTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(google_subject: "subject", email: "owner@example.com")
    @sauna_visit = @user.sauna_visits.create!(name: "テスト", latitude: 35, longitude: 139, status: "visited")
  end

  test "有効な属性で保存できること" do
    entry = @sauna_visit.visit_history_entries.build(visited_on: Time.zone.today, rating: 5, comment: "最高でした")
    assert entry.valid?
    assert entry.save
    assert entry.public_id.present?
  end

  test "visited_onが必須であること" do
    entry = @sauna_visit.visit_history_entries.build(rating: 5)
    assert_not entry.valid?
    assert entry.errors[:visited_on].present?
  end

  test "public_idが自動生成されること" do
    entry = @sauna_visit.visit_history_entries.build(visited_on: Time.zone.today)
    assert_nil entry.public_id
    entry.valid?
    assert entry.public_id.present?
  end

  test "ratingが0から5の範囲であること" do
    entry = @sauna_visit.visit_history_entries.build(visited_on: Time.zone.today)

    entry.rating = -1
    assert_not entry.valid?
    assert entry.errors[:rating].present?

    entry.rating = 6
    assert_not entry.valid?
    assert entry.errors[:rating].present?

    entry.rating = 0
    assert entry.valid?

    entry.rating = 5
    assert entry.valid?

    entry.rating = nil
    assert entry.valid?
  end

  test "許可された画像形式のみ保存できること" do
    entry = @sauna_visit.visit_history_entries.build(visited_on: Time.zone.today)

    # 許可されていない形式 (text/plain)
    entry.image.attach(io: StringIO.new("test"), filename: "test.txt", content_type: "text/plain")
    assert_not entry.valid?
    assert_includes entry.errors[:image], "の形式が許可されていません"

    # 許可されている形式 (image/png)
    png = Base64.decode64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=")
    entry.image.attach(io: StringIO.new(png), filename: "test.png", content_type: "image/png")
    assert entry.valid?
  end

  test "画像のサイズが1MB以下であること" do
    entry = @sauna_visit.visit_history_entries.build(visited_on: Time.zone.today)

    # 1MB以上の画像
    large_image = "a" * (1.megabyte + 1)
    entry.image.attach(io: StringIO.new(large_image), filename: "large.png", content_type: "image/png")

    assert_not entry.valid?
    assert_includes entry.errors[:image], "は1MB以下にしてください"
  end

  test "同一sauna_visit_id内でpublic_idがユニークであること" do
    entry1 = @sauna_visit.visit_history_entries.create!(visited_on: Time.zone.today)
    entry2 = @sauna_visit.visit_history_entries.build(visited_on: Time.zone.today)

    entry2.public_id = entry1.public_id
    assert_not entry2.valid?
    assert entry2.errors[:public_id].present?
  end
end
