class SaunaVisit < ApplicationRecord
  STATUSES = %w[visited wishlist].freeze

  belongs_to :user
  has_many :visit_history_entries, -> { order(:visited_on, :created_at) }, dependent: :destroy

  # SaunaVisitSerializer は履歴ごとに写真の URL を作るため、添付と blob まで先読みする。
  # 一覧 (index) と書き込み後の再読み込み (VisitWritable#serialized) で同じ条件を使うこと。
  scope :with_history_images, -> { includes(visit_history_entries: { image_attachment: :blob }) }

  validates :external_id, :name, :status, presence: true
  validates :external_id, uniqueness: { scope: :user_id }
  validates :latitude, numericality: { in: -90..90 }
  validates :longitude, numericality: { in: -180..180 }
  validates :status, inclusion: { in: STATUSES }
  validates :legacy_visit_count, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :tags_are_strings

  before_validation { self.external_id = SecureRandom.uuid if external_id.blank? }
  before_destroy :capture_history_image_blobs, prepend: true
  after_destroy_commit :purge_history_image_blobs

  def visit_count
    [ legacy_visit_count.to_i, visit_history_entries.size ].max
  end

  private

  def tags_are_strings
    errors.add(:tags, "は文字列の配列で指定してください") unless tags.is_a?(Array) && tags.all? { |tag| tag.is_a?(String) }
  end

  def capture_history_image_blobs
    @history_image_blobs = visit_history_entries.includes(image_attachment: :blob).filter_map do |entry|
      entry.image.blob if entry.image.attached?
    end
  end

  def purge_history_image_blobs
    ImageBlobPurger.purge(@history_image_blobs || [], context: "サウナ記録の履歴画像削除")
  end
end
