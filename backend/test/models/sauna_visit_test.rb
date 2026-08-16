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
