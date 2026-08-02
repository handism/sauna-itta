class SaunaVisitSerializer
  def initialize(visit)
    @visit = visit
  end

  def as_json(*)
    {
      **base_attributes,
      **location_attributes,
      **latest_visit_attributes,
      **history_attributes
    }.compact
  end

  private

  def base_attributes
    {
      id: @visit.external_id,
      name: @visit.name,
      area: @visit.area,
      status: @visit.status,
      tags: @visit.tags,
      visitCount: @visit.visit_count,
      lockVersion: @visit.lock_version
    }
  end

  def location_attributes
    {
      lat: @visit.latitude.to_f,
      lng: @visit.longitude.to_f
    }
  end

  def latest_visit_attributes
    latest = @visit.visit_history_entries.last
    {
      date: latest&.visited_on&.iso8601 || "",
      comment: latest&.comment || "",
      rating: latest&.rating&.to_f,
      image: image_url(latest)
    }
  end

  def history_attributes
    {
      history: @visit.visit_history_entries.map { |entry| history_json(entry) }
    }
  end

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
