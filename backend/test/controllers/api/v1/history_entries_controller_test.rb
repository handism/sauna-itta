require "test_helper"

class Api::V1::HistoryEntriesControllerTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  setup do
    @user = User.create!(google_subject: "owner-subject", email: ApiAuthHelper::ALLOWED_EMAIL)
    @other_user = User.create!(google_subject: "other-subject", email: "other@example.com")

    @sauna_visit = @user.sauna_visits.create!(
      external_id: "visit-123",
      name: "Sauna 1",
      status: "visited",
      latitude: 35.0,
      longitude: 139.0
    )

    @history_entry1 = @sauna_visit.visit_history_entries.create!(
      public_id: "entry-1",
      visited_on: "2023-01-01"
    )

    @history_entry2 = @sauna_visit.visit_history_entries.create!(
      public_id: "entry-2",
      visited_on: "2023-01-02"
    )

    @other_visit = @other_user.sauna_visits.create!(
      external_id: "other-visit",
      name: "Other Sauna",
      status: "visited",
      latitude: 35.0,
      longitude: 139.0
    )

    @other_history_entry = @other_visit.visit_history_entries.create!(
      public_id: "other-entry",
      visited_on: "2023-01-01"
    )
  end

  test "destroy deletes history entry and returns saunaVisit json" do
    token = sign_in

    assert_difference("VisitHistoryEntry.count", -1) do
      delete "/api/v1/sauna_visits/#{@sauna_visit.external_id}/history_entries/#{@history_entry2.public_id}", headers: csrf_header(token)
    end

    assert_response :success

    json = response.parsed_body
    assert_not_nil json["saunaVisit"]
    assert_equal @sauna_visit.external_id, json["saunaVisit"]["id"]
  end

  test "destroy does not delete last history entry and returns unprocessable_content" do
    token = sign_in

    # Delete the first entry so only one is left
    @history_entry2.destroy!

    assert_no_difference("VisitHistoryEntry.count") do
      delete "/api/v1/sauna_visits/#{@sauna_visit.external_id}/history_entries/#{@history_entry1.public_id}", headers: csrf_header(token)
    end

    assert_response :unprocessable_content

    json = response.parsed_body
    assert_equal "last_history", json.dig("error", "code")
    assert_equal "最後の履歴は削除できません。", json.dig("error", "message")
  end

  test "destroy returns not_found if visit does not belong to user" do
    token = sign_in

    assert_no_difference("VisitHistoryEntry.count") do
      delete "/api/v1/sauna_visits/#{@other_visit.external_id}/history_entries/#{@other_history_entry.public_id}", headers: csrf_header(token)
    end

    assert_response :not_found
  end

  test "destroy returns not_found if history entry does not exist" do
    token = sign_in

    assert_no_difference("VisitHistoryEntry.count") do
      delete "/api/v1/sauna_visits/#{@sauna_visit.external_id}/history_entries/non-existent-entry", headers: csrf_header(token)
    end

    assert_response :not_found
  end

  test "destroy returns not_found if visit does not exist" do
    token = sign_in

    assert_no_difference("VisitHistoryEntry.count") do
      delete "/api/v1/sauna_visits/non-existent-visit/history_entries/#{@history_entry1.public_id}", headers: csrf_header(token)
    end

    assert_response :not_found
  end

  test "destroy deletes associated image if attached" do
    token = sign_in

    # Attach image
    @history_entry2.image.attach(
      io: StringIO.new(Base64.decode64(ApiAuthHelper::PNG_BASE64)),
      filename: "test.png",
      content_type: "image/png"
    )

    # Wait for attach to commit
    @history_entry2.save!
    assert @history_entry2.image.attached?

    ActiveJob::Base.queue_adapter = :test

    assert_difference("VisitHistoryEntry.count", -1) do
      delete "/api/v1/sauna_visits/#{@sauna_visit.external_id}/history_entries/#{@history_entry2.public_id}", headers: csrf_header(token)
    end

    assert_response :success
    assert_enqueued_with(job: ActiveStorage::PurgeJob)
  end
end
