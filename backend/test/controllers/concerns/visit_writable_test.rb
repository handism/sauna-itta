require "test_helper"

class VisitWritableTest < ActiveSupport::TestCase
  class DummyController < ApplicationController
    include VisitWritable
  end

  setup do
    @controller = DummyController.new
    @user = User.create!(email: "test@example.com", google_subject: "123")
    @visit = SaunaVisit.create!(user: @user, external_id: "sauna1", name: "Sauna 1", latitude: 35.0, longitude: 139.0)
    @entry = VisitHistoryEntry.create!(sauna_visit: @visit, public_id: SecureRandom.uuid, visited_on: Date.today)
    @valid_base64_gif = "data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs="
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

    visit = SaunaVisit.new
    @controller.send(:assign_visit_attributes, visit, attributes)

    assert_equal "Super Sauna", visit.name
    assert_equal 35.681236, visit.latitude
    assert_equal 139.767125, visit.longitude
    assert_equal "Tokyo", visit.area
    assert_equal "active", visit.status
    assert_equal [ "tag1", "tag2" ], visit.tags
    assert_equal 5, visit.legacy_visit_count
  end

  test "assign_visit_attributes stringifies tags correctly" do
    attributes = {
      tags: [ 1, :tag2, "tag3" ]
    }

    visit = SaunaVisit.new
    @controller.send(:assign_visit_attributes, visit, attributes)

    assert_equal [ "1", "tag2", "tag3" ], visit.tags
  end

  test "assign_visit_attributes correctly maps nil or empty tags to an empty array" do
    # Scenario: nil
    visit = SaunaVisit.new
    @controller.send(:assign_visit_attributes, visit, { tags: nil })
    assert_equal [], visit.tags

    # Scenario: empty array
    visit = SaunaVisit.new
    @controller.send(:assign_visit_attributes, visit, { tags: [] })
    assert_equal [], visit.tags
  end

  test "assign_visit_attributes preserves existing legacy_visit_count if visitCount is omitted" do
    visit = SaunaVisit.new
    visit.legacy_visit_count = 10

    attributes = {
      name: "Another Sauna"
    }

    @controller.send(:assign_visit_attributes, visit, attributes)

    assert_equal "Another Sauna", visit.name
    assert_equal 10, visit.legacy_visit_count
  end

  test "apply_history_image returns early if :image key is not present" do
    stale_blobs = []
    @controller.send(:apply_history_image, @entry, { other: "value" }, stale_blobs)
    assert_empty stale_blobs
    assert_not @entry.image.attached?
  end

  test "apply_history_image detaches image and returns stale blob if :image is blank and image was attached" do
    # Attach an image first
    @entry.image.attach(io: StringIO.new(Base64.decode64("R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=")), filename: "test.gif", content_type: "image/gif")
    assert @entry.image.attached?
    original_blob = @entry.image.blob

    stale_blobs = []
    @controller.send(:apply_history_image, @entry, { image: "" }, stale_blobs)

    assert_not @entry.image.attached?
    assert_equal 1, stale_blobs.length
    assert_equal original_blob, stale_blobs.first
  end

  test "apply_history_image does not add to stale_blobs if :image is blank and no image was attached" do
    stale_blobs = []
    @controller.send(:apply_history_image, @entry, { image: "" }, stale_blobs)

    assert_not @entry.image.attached?
    assert_empty stale_blobs
  end

  test "apply_history_image attaches new image from base64 data URL" do
    stale_blobs = []
    @controller.send(:apply_history_image, @entry, { image: @valid_base64_gif }, stale_blobs)

    assert @entry.image.attached?
    assert_empty stale_blobs
    assert_equal "image/gif", @entry.image.blob.content_type
  end

  test "apply_history_image attaches new image and returns stale blob if replacing existing image with base64 data URL" do
    @entry.image.attach(io: StringIO.new(Base64.decode64("R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=")), filename: "test.gif", content_type: "image/gif")
    original_blob = @entry.image.blob

    stale_blobs = []
    @controller.send(:apply_history_image, @entry, { image: @valid_base64_gif }, stale_blobs)

    assert @entry.image.attached?
    assert_not_equal original_blob, @entry.image.blob
    assert_equal 1, stale_blobs.length
    assert_equal original_blob, stale_blobs.first
  end

  test "apply_history_image does nothing if :image starts with /api/v1/images/" do
    @entry.image.attach(io: StringIO.new(Base64.decode64("R0lGODlhAQABAIAAAP///wAAACwAAAAAAQABAAACAkQBADs=")), filename: "test.gif", content_type: "image/gif")
    original_blob = @entry.image.blob

    stale_blobs = []
    @controller.send(:apply_history_image, @entry, { image: "/api/v1/images/some-path" }, stale_blobs)

    assert @entry.image.attached?
    assert_equal original_blob, @entry.image.blob
    assert_empty stale_blobs
  end

  test "apply_history_image raises ArgumentError if :image is invalid URL" do
    stale_blobs = []
    error = assert_raises(ArgumentError) do
      @controller.send(:apply_history_image, @entry, { image: "http://example.com/image.jpg" }, stale_blobs)
    end
    assert_equal "画像URLが不正です。", error.message
  end

  test "purge_stale_image_blobs handles StandardError during purge_later and logs the error" do
    blob = Object.new
    def blob.id; 1; end
    def blob.purge_later
      raise StandardError, "Purge failed"
    end

    logger_messages = []
    dummy_logger = Object.new
    dummy_logger.define_singleton_method(:error) do |msg|
      logger_messages << msg
    end

    original_logger = Rails.logger
    begin
      Rails.define_singleton_method(:logger) { dummy_logger }
      @controller.send(:purge_stale_image_blobs, [ blob ])
    ensure
      Rails.define_singleton_method(:logger) { original_logger }
    end

    assert_includes logger_messages, "古い訪問画像の削除に失敗しました: StandardError: Purge failed"
  end
end
