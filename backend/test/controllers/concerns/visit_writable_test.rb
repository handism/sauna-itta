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
end
