module VisitWritable
  extend ActiveSupport::Concern

  private

  def assign_visit_attributes(visit, attributes)
    visit.assign_attributes(
      name: attributes[:name],
      latitude: attributes[:lat],
      longitude: attributes[:lng],
      area: attributes[:area],
      status: attributes[:status],
      tags: Array(attributes[:tags]).map(&:to_s),
      legacy_visit_count: attributes[:visitCount] || visit.legacy_visit_count
    )
  end

  def apply_history(visit, attributes, append:, apply_image: true, stale_image_blobs: [])
    entry = append ? visit.visit_history_entries.build : visit.visit_history_entries.last
    entry ||= visit.visit_history_entries.build
    entry.assign_attributes(
      visited_on: attributes[:date].presence || Time.zone.today,
      comment: attributes[:comment].to_s,
      rating: attributes[:rating]
    )
    apply_history_image(entry, attributes, stale_image_blobs) if apply_image
    entry
  end

  def apply_history_image(entry, attributes, stale_image_blobs)
    return unless attributes.key?(:image) || attributes.key?('image')
    image_value = attributes[:image] || attributes['image']

    if image_value.blank? || image_value == 'DELETE'
      stale_image_blobs << entry.image.blob if entry.image.attached?
      entry.image.purge
    elsif image_value.is_a?(String) && image_value.start_with?('data:')
      stale_blob = apply_image(entry, image_value)
      stale_image_blobs << stale_blob if stale_blob
    elsif image_value.is_a?(String) && image_value.start_with?('/api/v1/images/')
      # No action needed, keep existing image
    else
      # Invalid URL or unexpected format, do nothing
    end
  end

  def apply_image(entry, value)
    stale_blob = entry.image.blob if entry.image.attached?

    if value.blank?
      entry.image.detach if entry.image.attached?
    elsif value.to_s.start_with?("data:")
      entry.image.attach(DataUrlImage.decode(value))
    elsif !value.to_s.start_with?("/api/v1/images/")
      raise ArgumentError, "画像URLが不正です。"
    else
      stale_blob = nil
    end

    stale_blob
  end

  def purge_stale_image_blobs(blobs)
    blobs.uniq(&:id).each do |blob|
      blob.purge_later
    rescue StandardError => error
      Rails.logger.error("古い訪問画像の削除に失敗しました: #{error.class}: #{error.message}")
    end
  end

  # 書き込み後の再読み込み。SaunaVisitSerializer は履歴ごとに image を参照するため、
  # index と同じく添付とblobを先読みする（visit.reload だけだと履歴件数ぶんクエリが出る）。
  def serialized(visit)
    reloaded = current_user.sauna_visits
      .includes(visit_history_entries: { image_attachment: :blob })
      .find(visit.id)
    SaunaVisitSerializer.new(reloaded).as_json
  end
end
