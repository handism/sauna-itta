class ArraySizeValidator
  def self.validate_payload!(payload, max_size:)
    raise ActionController::BadRequest, "取り込むデータは記録の配列で指定してください。" unless payload.is_a?(Array)
    payload.size <= max_size
  end

  def self.validate_histories!(histories, max_size:)
    if histories.size > max_size
      raise ActionController::BadRequest, "1件の記録に含められる履歴は#{max_size}件までです。"
    end
  end
end
