require "test_helper"

class SaunaVisitTest < ActiveSupport::TestCase
  setup do
    @user = User.create!(google_subject: "subject", email: "owner@example.com")
  end

  test "座標とステータスの境界を検証する" do
    visit = @user.sauna_visits.build(name: "テスト", latitude: 91, longitude: 181, status: "unknown")
    assert_not visit.valid?
    assert visit.errors[:latitude].present?
    assert visit.errors[:longitude].present?
    assert visit.errors[:status].present?
  end

  test "tagsが文字列の配列であることを検証する" do
    # 文字列の配列なら有効
    valid_visit = @user.sauna_visits.build(name: "テスト", latitude: 35, longitude: 139, status: "visited", tags: [ "ロウリュ", "水風呂" ])
    assert valid_visit.valid?

    # 配列でない場合（文字列）は無効
    invalid_visit_string = @user.sauna_visits.build(name: "テスト", latitude: 35, longitude: 139, status: "visited", tags: "ロウリュ")
    assert_not invalid_visit_string.valid?
    assert_equal [ "は文字列の配列で指定してください" ], invalid_visit_string.errors[:tags]

    # 配列でない場合（nil）は無効
    invalid_visit_nil = @user.sauna_visits.build(name: "テスト", latitude: 35, longitude: 139, status: "visited", tags: nil)
    assert_not invalid_visit_nil.valid?
    assert_equal [ "は文字列の配列で指定してください" ], invalid_visit_nil.errors[:tags]

    # 文字列以外の要素が含まれる配列は無効
    invalid_visit_mixed = @user.sauna_visits.build(name: "テスト", latitude: 35, longitude: 139, status: "visited", tags: [ "ロウリュ", 123 ])
    assert_not invalid_visit_mixed.valid?
    assert_equal [ "は文字列の配列で指定してください" ], invalid_visit_mixed.errors[:tags]
  end

  test "履歴件数と旧形式の下限の大きい方を訪問回数にする" do
    visit = @user.sauna_visits.create!(name: "テスト", latitude: 35, longitude: 139, status: "visited", legacy_visit_count: 3)
    visit.visit_history_entries.create!(visited_on: Date.new(2026, 8, 1), comment: "よい")
    assert_equal 3, visit.visit_count
  end

  test "記録削除時に履歴写真のblobも削除する" do
    visit = @user.sauna_visits.create!(name: "テスト", latitude: 35, longitude: 139, status: "visited")
    entry = visit.visit_history_entries.create!(visited_on: Date.new(2026, 8, 1), comment: "写真あり")
    png = Base64.decode64(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    )
    entry.image.attach(io: StringIO.new(png), filename: "visit.png", content_type: "image/png")
    blob_id = entry.image.blob.id

    perform_enqueued_jobs do
      visit.destroy!
    end

    assert_not ActiveStorage::Blob.exists?(blob_id)
  end

  test "記録削除がロールバックされたときは履歴写真のblobを残す" do
    visit = @user.sauna_visits.create!(name: "テスト", latitude: 35, longitude: 139, status: "visited")
    entry = visit.visit_history_entries.create!(visited_on: Date.new(2026, 8, 1), comment: "写真あり")
    png = Base64.decode64(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    )
    entry.image.attach(io: StringIO.new(png), filename: "visit.png", content_type: "image/png")
    visit_id = visit.id
    blob_id = entry.image.blob.id

    perform_enqueued_jobs do
      SaunaVisit.transaction do
        visit.destroy!
        raise ActiveRecord::Rollback
      end
    end

    assert SaunaVisit.exists?(visit_id)
    assert ActiveStorage::Blob.exists?(blob_id), "削除がロールバックされたのに写真blobが消えています"
  end
end
