require "base64"
require "stringio"

class DataUrlImage
  # 画像として受け付けられない入力。ArgumentError で表すと、無関係なプログラムの誤りまで
  # 「画像が不正」として 422 で返してしまうため、専用の例外に分ける。
  class InvalidImage < StandardError; end

  # 許可形式は VisitHistoryEntry::IMAGE_TYPE_EXTENSIONS を唯一の正とする。
  # ここへ一覧を書き写すと、モデルのバリデーションと data URL の受け口がずれる。
  SUBTYPE_PATTERN = Regexp.union(
    VisitHistoryEntry::ALLOWED_IMAGE_TYPES.map { |type| type.delete_prefix("image/") }
  ).freeze
  PATTERN = %r{\Adata:(image/(?:#{SUBTYPE_PATTERN.source}));base64,([A-Za-z0-9+/=\r\n]+)\z}.freeze

  def self.decode(value)
    match = PATTERN.match(value.to_s)
    raise InvalidImage, "画像形式が許可されていません。" unless match

    bytes = decode_base64(match[2])
    raise InvalidImage, "画像は1MB以下にしてください。" if bytes.bytesize > VisitHistoryEntry::MAX_IMAGE_BYTES

    content_type = match[1]
    detected_type = Marcel::MimeType.for(StringIO.new(bytes))
    raise InvalidImage, "画像の内容とMIME形式が一致しません。" unless detected_type == content_type

    {
      io: StringIO.new(bytes),
      filename: "visit-#{SecureRandom.uuid}.#{VisitHistoryEntry::IMAGE_TYPE_EXTENSIONS.fetch(content_type)}",
      content_type: content_type
    }
  end

  def self.decode_base64(encoded)
    Base64.strict_decode64(encoded.delete("\r\n"))
  rescue ArgumentError
    raise InvalidImage, "画像データを復号できません。"
  end
  private_class_method :decode_base64
end
