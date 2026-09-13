require "test_helper"

class SaunaVisitSerializerTest < ActiveSupport::TestCase
  test "最新履歴をトップレベルへ展開して既存形式を維持する" do
    user = User.create!(google_subject: "serializer", email: "serializer@example.com")
    visit = user.sauna_visits.create!(
      external_id: "legacy", name: "しきじ", latitude: 34.96, longitude: 138.41,
      area: "静岡県", status: "visited", legacy_visit_count: 5, tags: [ "sauna" ]
    )
    visit.visit_history_entries.create!(visited_on: Date.new(2026, 1, 1), comment: "初回", rating: 4)
    latest = visit.visit_history_entries.create!(visited_on: Date.new(2026, 2, 1), comment: "最新", rating: 5)

    json = SaunaVisitSerializer.new(visit.reload).as_json

    assert_equal "legacy", json[:id]
    assert_equal "しきじ", json[:name]
    assert_equal 34.96, json[:lat]
    assert_equal 138.41, json[:lng]
    assert_equal "静岡県", json[:area]
    assert_equal "visited", json[:status]
    assert_equal [ "sauna" ], json[:tags]
    assert_equal 5, json[:visitCount]

    assert_equal "2026-02-01", json[:date]
    assert_equal "最新", json[:comment]
    assert_equal 5.0, json[:rating]

    assert_equal 2, json[:history].size
    assert_equal latest.public_id, json[:history].last[:id]
    assert_equal "2026-02-01", json[:history].last[:date]
    assert_equal "最新", json[:history].last[:comment]
    assert_equal 5.0, json[:history].last[:rating]
  end

  test "履歴がない場合は空の文字列を返す" do
    user = User.create!(google_subject: "serializer2", email: "serializer2@example.com")
    visit = user.sauna_visits.create!(
      external_id: "legacy2", name: "しきじ", latitude: 34.96, longitude: 138.41,
      status: "visited", legacy_visit_count: 5
    )

    json = SaunaVisitSerializer.new(visit.reload).as_json

    assert_equal "", json[:date]
    assert_equal "", json[:comment]
    assert_nil json[:rating]
    assert_empty json[:history]
  end
end
