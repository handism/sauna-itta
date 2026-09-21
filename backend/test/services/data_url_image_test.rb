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

  # 許可形式の一覧をここへ書き写すと、モデルのバリデーションと data URL の受け口が
  # ずれる。どちらも VisitHistoryEntry::IMAGE_TYPE_EXTENSIONS から導かれることを固定する。
  test "受け付けるMIMEはモデルの許可一覧と一致する" do
    accepted = VisitHistoryEntry::ALLOWED_IMAGE_TYPES.select do |type|
      DataUrlImage::PATTERN.match?("data:#{type};base64,AAAA")
    end
    assert_equal VisitHistoryEntry::ALLOWED_IMAGE_TYPES, accepted

    assert_not DataUrlImage::PATTERN.match?("data:image/bmp;base64,AAAA")
  end

  test "保存する拡張子はモデルの対応表から決まる" do
    png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
    result = DataUrlImage.decode("data:image/png;base64,#{png}")
    assert_equal VisitHistoryEntry::IMAGE_TYPE_EXTENSIONS.fetch("image/png"), File.extname(result[:filename]).delete(".")
  end
end
