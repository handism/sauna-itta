require "test_helper"
require "base64"
require "stringio"

class Api::V1::ImagesControllerTest < ActionController::TestCase
  tests Api::V1::ImagesController

  setup do
    @user = User.create!(google_subject: "owner-subject", email: "owner@example.com")
    session[:user_id] = @user.id

    @sauna_visit = SaunaVisit.create!(
      user: @user,
      name: "Test Sauna",
      latitude: 35.0,
      longitude: 139.0,
      external_id: "ext-1",
      status: "visited",
      legacy_visit_count: 1,
      lock_version: 0
    )

    @visit_history_entry = VisitHistoryEntry.create!(
      sauna_visit: @sauna_visit,
      visited_on: Date.today,
      rating: 5,
      comment: "Great"
    )

    # attach image
    png_data = Base64.decode64("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")
    @visit_history_entry.image.attach(
      io: StringIO.new(png_data),
      filename: "test.png",
      content_type: "image/png"
    )

    @blob = @visit_history_entry.image.blob
    @signed_id = @blob.signed_id
  end

  test "show renders not_found when InvalidSignature is raised" do
    get :show, params: { signed_id: "invalid" }
    assert_response :not_found
    json = JSON.parse(response.body)
    assert_equal "not_found", json.dig("error", "code")
  end

  test "show successfully renders image for the owner" do
    get :show, params: { signed_id: @signed_id }
    assert_response :success
    assert_equal "image/png", response.media_type
    assert_includes response.headers["Cache-Control"], "private"
    assert_includes response.headers["Content-Disposition"], "inline"
    assert response.headers["ETag"].present?
  end

  test "show renders not_modified when ETag matches" do
    get :show, params: { signed_id: @signed_id }
    assert_response :success
    etag = response.headers["ETag"]

    request.headers["If-None-Match"] = etag
    get :show, params: { signed_id: @signed_id }
    assert_response :not_modified
    assert_predicate response.body, :empty?
  end

  test "show renders not_found when attachment does not exist" do
    ActiveStorage::Attachment.destroy_all
    get :show, params: { signed_id: @signed_id }
    assert_response :not_found
    json = JSON.parse(response.body)
    assert_equal "not_found", json.dig("error", "code")
  end

  test "show renders not_found when user does not own the visit" do
    other_user = User.create!(google_subject: "other-subject", email: "other@example.com")
    session[:user_id] = other_user.id

    get :show, params: { signed_id: @signed_id }
    assert_response :not_found
    json = JSON.parse(response.body)
    assert_equal "not_found", json.dig("error", "code")
  end

  test "show requires login" do
    session[:user_id] = nil
    get :show, params: { signed_id: @signed_id }
    assert_response :unauthorized
  end
end
