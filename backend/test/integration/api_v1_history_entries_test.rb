require "test_helper"

class ApiV1HistoryEntriesTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "最後の履歴は削除できない" do
    csrf = sign_in
    visit = create_visit(csrf)

    delete history_path(visit, visit.fetch("history").first.fetch("id")), headers: csrf_header(csrf)

    assert_response :unprocessable_content
    assert_equal "last_history", response.parsed_body.dig("error", "code")
    assert_equal 1, owner.sauna_visits.sole.visit_history_entries.count
  end

  test "destroy is successful when user deletes an entry without an image" do
    csrf = sign_in
    visit = create_visit(csrf)
    visit = append_history(csrf, visit, comment: "2回目")
    assert_equal 2, visit.fetch("history").size

    removed = visit.fetch("history").first
    delete history_path(visit, removed.fetch("id")), headers: csrf_header(csrf)

    assert_response :success
    remaining = response.parsed_body.dig("saunaVisit", "history")
    assert_equal 1, remaining.size
    assert_equal "2回目", remaining.sole.fetch("comment")
  end


  test "履歴を削除すると残りの履歴と写真だけが返る" do
    csrf = sign_in
    visit = create_visit(csrf, image: png_data_url)
    visit = append_history(csrf, visit, comment: "2回目")
    assert_equal 2, visit.fetch("history").size

    removed = visit.fetch("history").first
    blob = ActiveStorage::Blob.find_signed!(removed.fetch("image").split("/").last)

    delete history_path(visit, removed.fetch("id")), headers: csrf_header(csrf)

    assert_response :success
    remaining = response.parsed_body.dig("saunaVisit", "history")
    assert_equal 1, remaining.size
    assert_equal "2回目", remaining.sole.fetch("comment")
    assert_not ActiveStorage::Blob.exists?(blob.id), "削除した履歴の写真blobが残っています"
  end

  test "履歴の件数確認と削除を親レコードのロック内で行う" do
    csrf = sign_in
    visit = create_visit(csrf)
    visit = append_history(csrf, visit, comment: "2回目")
    queries = []
    subscriber = ActiveSupport::Notifications.subscribe("sql.active_record") do |*, payload|
      queries << payload[:sql]
    end

    delete history_path(visit, visit.fetch("history").first.fetch("id")), headers: csrf_header(csrf)

    assert_response :success
    assert queries.any? { |sql| sql.include?("sauna_visits") && sql.include?("FOR UPDATE") },
      "履歴削除時に親の訪問記録をロックしていません"
  ensure
    ActiveSupport::Notifications.unsubscribe(subscriber) if subscriber
  end

  test "履歴の削除に失敗したときは写真を残す" do
    csrf = sign_in
    visit = create_visit(csrf, image: png_data_url)
    visit = append_history(csrf, visit, comment: "2回目")
    removed = visit.fetch("history").first
    blob = ActiveStorage::Blob.find_signed!(removed.fetch("image").split("/").last)

    with_failing_destroy do
      delete history_path(visit, removed.fetch("id")), headers: csrf_header(csrf)
      assert_response :unprocessable_content
    end

    assert ActiveStorage::Blob.exists?(blob.id), "削除に失敗したのに写真blobが消えています"
    assert_equal 2, owner.sauna_visits.sole.visit_history_entries.count
  end

  test "他ユーザーの履歴は削除できない" do
    csrf = sign_in
    other = User.create!(google_subject: "other", email: "other@example.com")
    other_visit = other.sauna_visits.create!(name: "他人", latitude: 35, longitude: 139, status: "visited")
    2.times { |index| other_visit.visit_history_entries.create!(visited_on: Date.new(2026, 7, index + 1)) }

    delete "/api/v1/sauna_visits/#{other_visit.external_id}/history_entries/" \
      "#{other_visit.visit_history_entries.first.public_id}", headers: csrf_header(csrf)

    assert_response :not_found
    assert_equal 2, other_visit.visit_history_entries.count
  end

  test "存在しない履歴IDは404を返す" do
    csrf = sign_in
    visit = create_visit(csrf)
    append_history(csrf, visit, comment: "2回目")

    delete history_path(visit, "missing-history-id"), headers: csrf_header(csrf)

    assert_response :not_found
    assert_equal "not_found", response.parsed_body.dig("error", "code")
  end

  test "履歴削除にもCSRFトークンを要求する" do
    csrf = sign_in
    visit = create_visit(csrf)
    visit = append_history(csrf, visit, comment: "2回目")

    delete history_path(visit, visit.fetch("history").first.fetch("id"))

    assert_response :unprocessable_content
    assert_equal "invalid_csrf", response.parsed_body.dig("error", "code")
  end

  private

  def owner
    User.find_by!(email: ApiAuthHelper::ALLOWED_EMAIL)
  end

  # 削除そのものを失敗させ、写真blobの破棄がコミット後に限られることを確かめる
  def with_failing_destroy
    failure = ->(record) { raise ActiveRecord::RecordNotDestroyed.new("強制失敗", record) }
    VisitHistoryEntry.set_callback(:destroy, :before, failure)
    yield
  ensure
    VisitHistoryEntry.skip_callback(:destroy, :before, failure, raise: false)
  end

  def history_path(visit, history_id)
    "/api/v1/sauna_visits/#{visit.fetch('id')}/history_entries/#{history_id}"
  end

  def create_visit(csrf, **overrides)
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(overrides) },
      headers: csrf_header(csrf), as: :json
    assert_response :created
    response.parsed_body.fetch("saunaVisit")
  end

  def append_history(csrf, visit, **overrides)
    patch "/api/v1/sauna_visits/#{visit.fetch('id')}", params: {
      saunaVisit: valid_attributes.merge(
        appendHistory: true, date: "2026-08-03", lockVersion: visit.fetch("lockVersion"), **overrides
      )
    }, headers: csrf_header(csrf), as: :json
    assert_response :success
    response.parsed_body.fetch("saunaVisit")
  end
end
