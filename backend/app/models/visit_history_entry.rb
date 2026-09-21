class VisitHistoryEntry < ApplicationRecord
  # 許可する画像形式と、保存時に付ける拡張子。DataUrlImage も data URL の
  # パターンと拡張子をここから組み立てるため、形式を増減するときはここだけを変える
  # （フロントの ALLOWED_IMAGE_MIME_TYPES とも同じ集合に保つこと）。
  IMAGE_TYPE_EXTENSIONS = {
    "image/jpeg" => "jpg",
    "image/png" => "png",
    "image/webp" => "webp",
    "image/gif" => "gif"
  }.freeze
  ALLOWED_IMAGE_TYPES = IMAGE_TYPE_EXTENSIONS.keys.freeze
  MAX_IMAGE_BYTES = 1.megabyte

  belongs_to :sauna_visit
  has_one_attached :image

  validates :public_id, :visited_on, presence: true
  validates :public_id, uniqueness: { scope: :sauna_visit_id }
  validates :rating, numericality: { in: 0..5, allow_nil: true }
  validate :acceptable_image

  before_validation { self.public_id = SecureRandom.uuid if public_id.blank? }

  private

  def acceptable_image
    return unless image.attached?
    errors.add(:image, "の形式が許可されていません") unless ALLOWED_IMAGE_TYPES.include?(image.blob.content_type)
    errors.add(:image, "は1MB以下にしてください") if image.blob.byte_size > MAX_IMAGE_BYTES
  end
end
