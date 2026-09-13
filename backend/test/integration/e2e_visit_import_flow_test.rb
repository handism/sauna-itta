require "test_helper"

class E2EVisitImportFlowTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  test "E2E: Full Visit Import Flow" do
    # Authenticate and get CSRF token
    csrf = sign_in

    # Prepare import payload with multiple records
    imported_payload = [
      valid_attributes.merge(id: "e2e-id-1", visitCount: 2),
      valid_attributes.merge(id: "e2e-id-2", visitCount: 1, name: "Another Sauna", lat: 36.0, lng: 140.0)
    ]

    # Perform the import POST request
    post "/api/v1/sauna_visits/imports", params: { saunaVisits: imported_payload }, headers: csrf_header(csrf), as: :json

    # Assert successful response and check added/skipped counts
    assert_response :success
    assert_equal 2, response.parsed_body["added"]
    assert_equal 0, response.parsed_body["skipped"]

    # Verify the records were actually saved to the database for the authenticated user
    owner = User.find_by!(email: ApiAuthHelper::ALLOWED_EMAIL)
    assert_equal 2, owner.sauna_visits.count

    visit_1 = owner.sauna_visits.find_by(external_id: "e2e-id-1")
    assert_not_nil visit_1
    assert_equal "北欧", visit_1.name

    visit_2 = owner.sauna_visits.find_by(external_id: "e2e-id-2")
    assert_not_nil visit_2
    assert_equal "Another Sauna", visit_2.name
  end
end
