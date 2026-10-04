module VisitWritable
  extend ActiveSupport::Concern

  # 書き込み系で共通のエラー応答。アクションごとに rescue を書き写すと、
  # 新しい書き込みアクションを足したときだけ 500 になる。
  #
  # 画像の不正は apply_image / DataUrlImage.decode が DataUrlImage::InvalidImage で伝える。
  # ArgumentError のような汎用の例外を握ると、無関係なプログラムの誤りまで invalid_image の
  # 422 として隠れてしまう。Api::V1::BaseController ではなくこの concern に置くことで、
  # 画像を書き込まない ImagesController / SessionsController までは広げない。
  # render_validation_error は Api::V1::BaseController が持つため、include 先はその配下に限ること。
  included do
    rescue_from ActiveRecord::RecordInvalid do |error|
      render_validation_error(error.record)
    end

    rescue_from DataUrlImage::InvalidImage do |error|
      render_error("invalid_image", error.message, :unprocessable_content)
    end
  end

  # 記録本体として受け付けるキー。作成・更新 (SaunaVisitsController) と取り込み
  # (ImportsController) で共有する。エクスポートしたJSONをそのまま取り込むため、
  # 取り込み側も lockVersion / appendHistory を受け取れる必要がある。
  # 旧形式から引き継ぐ訪問回数 (visitCount) は取り込み専用のため、ここへは入れない
  # (ImportsController::IMPORT_PERMITTED_KEYS)。作成・更新で受け付けると、履歴と無関係に
  # legacy_visit_count を書き換えられ、訪問回数が履歴の件数と食い違う。
  VISIT_PERMITTED_KEYS = [
    :name, :lat, :lng, :area, :status, :date, :comment, :rating, :image,
    :appendHistory, :lockVersion, { tags: [] }
  ].freeze

  private

  def assign_visit_attributes(visit, attributes)
    visit.assign_attributes(
      name: attributes[:name],
      latitude: attributes[:lat],
      longitude: attributes[:lng],
      area: attributes[:area],
      status: attributes[:status],
      tags: Array(attributes[:tags]).map(&:to_s),
      # visitCount は取り込みだけが渡す。作成・更新では許可キーに無いため既存値を保つ
      legacy_visit_count: attributes[:visitCount] || visit.legacy_visit_count
    )
  end

  # 履歴の日付・コメント・評価だけを当てる。写真は呼び出し側が保存の段取りに合わせて
  # 後から当てる（作成・更新は apply_history_image、取り込みは記録ごとに apply_image）。
  def apply_history(visit, attributes, append:)
    entry = append ? visit.visit_history_entries.build : visit.visit_history_entries.last
    entry ||= visit.visit_history_entries.build
    entry.assign_attributes(
      visited_on: attributes[:date].presence || Time.zone.today,
      comment: attributes[:comment].to_s,
      rating: attributes[:rating]
    )
    entry
  end

  def apply_history_image(entry, attributes, stale_image_blobs)
    return unless attributes.key?(:image)

    stale_blob = apply_image(entry, attributes[:image])
    stale_image_blobs << stale_blob if stale_blob
  end

  def apply_image(entry, value)
    stale_blob = entry.image.blob if entry.image.attached?

    if value.blank?
      entry.image.detach if entry.image.attached?
    elsif value.to_s.start_with?("data:")
      entry.image.attach(DataUrlImage.decode(value))
    elsif !value.to_s.start_with?("/api/v1/images/")
      raise DataUrlImage::InvalidImage, "画像URLが不正です。"
    else
      stale_blob = nil
    end

    stale_blob
  end

  def purge_stale_image_blobs(blobs)
    ImageBlobPurger.purge(blobs, context: "古い訪問画像の削除")
  end

  # 書き込み後の再読み込み。index と同じく写真まで先読みする
  # （visit.reload だけだと履歴件数ぶんクエリが出る）。
  def serialized(visit)
    reloaded = current_user.sauna_visits.with_history_images.find(visit.id)
    SaunaVisitSerializer.new(reloaded).as_json
  end
end
