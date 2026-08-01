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

  def apply_history(visit, attributes, append:)
    entry = append ? visit.visit_history_entries.build : visit.visit_history_entries.last
    entry ||= visit.visit_history_entries.build
    entry.assign_attributes(
      visited_on: attributes[:date].presence || Time.zone.today,
      comment: attributes[:comment].to_s,
      rating: attributes[:rating]
    )
    apply_image(entry, attributes[:image]) if attributes.key?(:image)
    entry
  end

  def apply_image(entry, value)
    if value.blank?
      entry.image.purge if entry.image.attached?
    elsif value.to_s.start_with?("data:")
      entry.image.attach(DataUrlImage.decode(value))
    elsif !value.to_s.start_with?("/api/v1/images/")
      raise ArgumentError, "画像URLが不正です。"
    end
  end

  def serialized(visit)
    SaunaVisitSerializer.new(visit.reload).as_json
  end
end
