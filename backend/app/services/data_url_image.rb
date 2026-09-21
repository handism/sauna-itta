require "base64"
require "stringio"

class DataUrlImage
  # 許可形式は VisitHistoryEntry::IMAGE_TYPE_EXTENSIONS を唯一の正とする。
  # ここへ一覧を書き写すと、モデルのバリデーションと data URL の受け口がずれる。
  SUBTYPE_PATTERN = Regexp.union(
    VisitHistoryEntry::ALLOWED_IMAGE_TYPES.map { |type| type.delete_prefix("image/") }
  ).freeze
  PATTERN = %r{\Adata:(image/(?:#{SUBTYPE_PATTERN.source}));base64,([A-Za-z0-9+/=\r\n]+)\z}.freeze

  def self.decode(value)
    match = PATTERN.match(value.to_s)
    raise ArgumentError, "画像形式が許可されていません。" unless match

    bytes = Base64.strict_decode64(match[2].delete("\r\n"))
    raise ArgumentError, "画像は1MB以下にしてください。" if bytes.bytesize > VisitHistoryEntry::MAX_IMAGE_BYTES

    content_type = match[1]
    detected_type = Marcel::MimeType.for(StringIO.new(bytes))
    raise ArgumentError, "画像の内容とMIME形式が一致しません。" unless detected_type == content_type

    {
      io: StringIO.new(bytes),
      filename: "visit-#{SecureRandom.uuid}.#{VisitHistoryEntry::IMAGE_TYPE_EXTENSIONS.fetch(content_type)}",
      content_type: content_type
    }
  rescue ArgumentError => error
    raise error if error.message.start_with?("画像")
    raise ArgumentError, "画像データを復号できません。"
  end
end
