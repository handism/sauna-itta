require "test_helper"

class Api::V1::SaunaVisitsControllerTest < ActionController::TestCase
  tests Api::V1::SaunaVisitsController

  test "visit_params permits allowed attributes and rejects unallowed ones" do
    params = ActionController::Parameters.new({
      saunaVisit: {
        name: "Test Sauna",
        lat: 35.0,
        lng: 139.0,
        area: "Tokyo",
        status: "visited",
        date: "2023-01-01",
        comment: "Great",
        rating: 5,
        image: "data:image/png;base64,...",
        appendHistory: true,
        lockVersion: 1,
        visitCount: 2,
        tags: [ "relax", "hot" ],
        unallowed_attribute: "hacker"
      }
    })

    @controller.params = params

    permitted_params = @controller.send(:visit_params)

    assert_equal "Test Sauna", permitted_params[:name]
    assert_equal 35.0, permitted_params[:lat]
    assert_equal 139.0, permitted_params[:lng]
    assert_equal "Tokyo", permitted_params[:area]
    assert_equal "visited", permitted_params[:status]
    assert_equal "2023-01-01", permitted_params[:date]
    assert_equal "Great", permitted_params[:comment]
    assert_equal 5, permitted_params[:rating]
    assert_equal "data:image/png;base64,...", permitted_params[:image]
    assert_equal true, permitted_params[:appendHistory]
    assert_equal 1, permitted_params[:lockVersion]
    assert_equal 2, permitted_params[:visitCount]
    assert_equal [ "relax", "hot" ], permitted_params[:tags]

    assert_nil permitted_params[:unallowed_attribute]
    assert_not permitted_params.key?(:unallowed_attribute)
  end

  test "visit_params requires saunaVisit key" do
    params = ActionController::Parameters.new({
      name: "Test Sauna"
    })

    @controller.params = params

    assert_raises(ActionController::ParameterMissing) do
      @controller.send(:visit_params)
    end
  end
end
