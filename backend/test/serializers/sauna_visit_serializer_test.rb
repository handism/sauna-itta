require "test_helper"

class SaunaVisitSerializerTest < ActiveSupport::TestCase
  test "最新履歴をトップレベルへ展開して既存形式を維持する" do
    user = User.create!(google_subject: "serializer", email: "serializer@example.com")
    visit = user.sauna_visits.create!(
      external_id: "legacy", name: "しきじ", latitude: 34.96, longitude: 138.41,
      status: "visited", legacy_visit_count: 5
    )
    visit.visit_history_entries.create!(visited_on: Date.new(2026, 1, 1), comment: "初回", rating: 4)
    latest = visit.visit_history_entries.create!(visited_on: Date.new(2026, 2, 1), comment: "最新", rating: 5)

    json = SaunaVisitSerializer.new(visit.reload).as_json

    assert_equal "legacy", json[:id]
    assert_equal latest.public_id, json[:history].last[:id]
    assert_equal "2026-02-01", json[:date]
    assert_equal "最新", json[:comment]
    assert_equal 5, json[:visitCount]
  end
end
