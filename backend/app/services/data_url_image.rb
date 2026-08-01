require "base64"
require "stringio"

class DataUrlImage
  PATTERN = %r{\Adata:(image/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\r\n]+)\z}.freeze
  EXTENSIONS = {
    "image/jpeg" => "jpg",
    "image/png" => "png",
    "image/webp" => "webp",
    "image/gif" => "gif"
  }.freeze

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
      filename: "visit-#{SecureRandom.uuid}.#{EXTENSIONS.fetch(content_type)}",
      content_type: content_type
    }
  rescue ArgumentError => error
    raise error if error.message.start_with?("画像")
    raise ArgumentError, "画像データを復号できません。"
  end
end
