require "test_helper"

class Api::V1::ImportsControllerTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  setup do
    @user = User.create!(google_subject: "owner-subject", email: ApiAuthHelper::ALLOWED_EMAIL)
  end

  def base_visit(id)
    {
      id: id,
      name: "テストサウナ #{id}",
      lat: 35.0,
      lng: 139.0,
      area: "Tokyo",
      status: "visited",
      date: "2023-01-01",
      comment: "最高",
      rating: 5
    }
  end

  test "imports valid records successfully" do
    token = sign_in
    payload = [
      base_visit("id-1"),
      base_visit("id-2")
    ]

    assert_difference -> { SaunaVisit.count }, 2 do
      post imports_api_v1_sauna_visits_url, params: { saunaVisits: payload }, headers: csrf_header(token), as: :json
    end

    assert_response :success
    json = response.parsed_body
    assert_equal 2, json["added"]
    assert_equal 0, json["skipped"]
  end

  test "returns validation_error when payload is not an array" do
    token = sign_in

    post imports_api_v1_sauna_visits_url, params: { saunaVisits: "not-an-array" }, headers: csrf_header(token), as: :json
    assert_response :unprocessable_content
    json = response.parsed_body
    assert_equal "validation_error", json.dig("error", "code")
    assert_equal "取り込むデータは記録の配列で指定してください。", json.dig("error", "message")
  end

  test "returns unprocessable content when batch is too large" do
    token = sign_in
    payload = (1..11).map { |i| base_visit("id-#{i}") }

    post imports_api_v1_sauna_visits_url, params: { saunaVisits: payload }, headers: csrf_header(token), as: :json

    assert_response :unprocessable_content
    json = response.parsed_body
    assert_equal "batch_too_large", json.dig("error", "code")
  end

  test "returns validation_error when record lacks id" do
    token = sign_in
    payload = [
      base_visit("id-1"),
      base_visit(nil) # missing id
    ]

    post imports_api_v1_sauna_visits_url, params: { saunaVisits: payload }, headers: csrf_header(token), as: :json
    assert_response :unprocessable_content
    json = response.parsed_body
    assert_equal "validation_error", json.dig("error", "code")
    assert_equal "IDがない記録は取り込めません。", json.dig("error", "message")
  end

  test "skips duplicate records" do
    token = sign_in

    # Create an existing record
    existing = base_visit("id-existing")
    post imports_api_v1_sauna_visits_url, params: { saunaVisits: [ existing ] }, headers: csrf_header(token), as: :json
    assert_response :success

    # Payload with the existing record, a new one, and a duplicate within the payload
    payload = [
      existing,
      base_visit("id-new-1"),
      base_visit("id-new-1")
    ]

    assert_difference -> { SaunaVisit.count }, 1 do
      post imports_api_v1_sauna_visits_url, params: { saunaVisits: payload }, headers: csrf_header(token), as: :json
    end

    assert_response :success
    json = response.parsed_body
    assert_equal 1, json["added"]
    assert_equal 2, json["skipped"]
  end
end
