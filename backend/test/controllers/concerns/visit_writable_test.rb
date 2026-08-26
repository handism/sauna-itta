require "test_helper"

class VisitWritableTest < ActionController::TestCase
  class DummyController < ActionController::Base
    include VisitWritable
  end

  tests DummyController

  def setup
    @controller = DummyController.new
    @visit = SaunaVisit.new
  end

  test "assign_visit_attributes correctly maps standard frontend attributes to the model" do
    attributes = {
      name: "Super Sauna",
      lat: 35.681236,
      lng: 139.767125,
      area: "Tokyo",
      status: "active",
      tags: [ "tag1", "tag2" ],
      visitCount: 5
    }

    @controller.send(:assign_visit_attributes, @visit, attributes)

    assert_equal "Super Sauna", @visit.name
    assert_equal 35.681236, @visit.latitude
    assert_equal 139.767125, @visit.longitude
    assert_equal "Tokyo", @visit.area
    assert_equal "active", @visit.status
    assert_equal [ "tag1", "tag2" ], @visit.tags
    assert_equal 5, @visit.legacy_visit_count
  end

  test "assign_visit_attributes stringifies tags correctly" do
    attributes = {
      tags: [ 1, :tag2, "tag3" ]
    }

    @controller.send(:assign_visit_attributes, @visit, attributes)

    assert_equal [ "1", "tag2", "tag3" ], @visit.tags
  end

  test "assign_visit_attributes correctly maps nil or empty tags to an empty array" do
    # Scenario: nil
    @visit = SaunaVisit.new
    @controller.send(:assign_visit_attributes, @visit, { tags: nil })
    assert_equal [], @visit.tags

    # Scenario: empty array
    @visit = SaunaVisit.new
    @controller.send(:assign_visit_attributes, @visit, { tags: [] })
    assert_equal [], @visit.tags
  end

  test "assign_visit_attributes preserves existing legacy_visit_count if visitCount is omitted" do
    @visit.legacy_visit_count = 10

    attributes = {
      name: "Another Sauna"
    }

    @controller.send(:assign_visit_attributes, @visit, attributes)

    assert_equal "Another Sauna", @visit.name
    assert_equal 10, @visit.legacy_visit_count
  end
end
