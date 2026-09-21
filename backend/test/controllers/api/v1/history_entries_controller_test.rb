require "test_helper"

class Api::V1::HistoryEntriesControllerTest < ActionController::TestCase
  tests Api::V1::HistoryEntriesController

  setup do
    @original_forgery = ActionController::Base.allow_forgery_protection
    ActionController::Base.allow_forgery_protection = false

    @user = User.create!(google_subject: "test", email: "test@example.com")
    session[:user_id] = @user.id
    @visit = @user.sauna_visits.create!(
      name: "Test Sauna",
      latitude: 35.0,
      longitude: 139.0,
      status: "visited",
      external_id: "visit-123"
    )
  end

  teardown do
    ActionController::Base.allow_forgery_protection = @original_forgery
  end

  test "destroys history entry if count > 1" do
    entry1 = @visit.visit_history_entries.create!(visited_on: Date.today, public_id: "entry-1")
    entry2 = @visit.visit_history_entries.create!(visited_on: Date.today, public_id: "entry-2")

    delete :destroy, params: { sauna_visit_id: "visit-123", history_id: "entry-1" }

    assert_response :success
    assert_equal 1, @visit.visit_history_entries.count
    assert_equal "entry-2", @visit.visit_history_entries.first.public_id
  end

  test "fails to destroy last history entry" do
    entry = @visit.visit_history_entries.create!(visited_on: Date.today, public_id: "entry-1")

    delete :destroy, params: { sauna_visit_id: "visit-123", history_id: "entry-1" }

    assert_response :unprocessable_content
    json = JSON.parse(response.body)
    assert_equal "last_history", json["error"]["code"]
    assert_equal "最後の履歴は削除できません。", json["error"]["message"]
    assert_equal 1, @visit.visit_history_entries.count
  end

  test "returns 404 if sauna visit not found" do
    delete :destroy, params: { sauna_visit_id: "invalid-visit", history_id: "entry-1" }
    assert_response :not_found
  end

  test "returns 404 if history entry not found" do
    @visit.visit_history_entries.create!(visited_on: Date.today, public_id: "entry-1")
    @visit.visit_history_entries.create!(visited_on: Date.today, public_id: "entry-2")

    delete :destroy, params: { sauna_visit_id: "visit-123", history_id: "invalid-entry" }
    assert_response :not_found
  end
end
