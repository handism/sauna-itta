class SaunaVisitSerializer
  def initialize(visit)
    @visit = visit
  end

  def as_json(*)
    latest = @visit.visit_history_entries.last
    {
      id: @visit.external_id,
      name: @visit.name,
      lat: @visit.latitude.to_f,
      lng: @visit.longitude.to_f,
      area: @visit.area,
      status: @visit.status,
      tags: @visit.tags,
      visitCount: @visit.visit_count,
      lockVersion: @visit.lock_version,
      date: latest&.visited_on&.iso8601 || "",
      comment: latest&.comment || "",
      rating: latest&.rating&.to_f,
      image: image_url(latest),
      history: @visit.visit_history_entries.map { |entry| history_json(entry) }
    }.compact
  end

  private

  def history_json(entry)
    {
      id: entry.public_id,
      date: entry.visited_on.iso8601,
      comment: entry.comment,
      rating: entry.rating&.to_f,
      image: image_url(entry)
    }.compact
  end

  def image_url(entry)
    return unless entry&.image&.attached?
    "/api/v1/images/#{entry.image.blob.signed_id}"
  end
end
