require "test_helper"

class DataUrlImageTest < ActiveSupport::TestCase
  test "SVGを拒否する" do
    assert_raises(ArgumentError) { DataUrlImage.decode("data:image/svg+xml;base64,PHN2Zz4=") }
  end

  test "PNGを復号する" do
    png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    result = DataUrlImage.decode("data:image/png;base64,#{png}")
    assert_equal "image/png", result[:content_type]
  end

  test "宣言MIMEと実データが異なる画像を拒否する" do
    assert_raises(ArgumentError) { DataUrlImage.decode("data:image/png;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==") }
  end
end
