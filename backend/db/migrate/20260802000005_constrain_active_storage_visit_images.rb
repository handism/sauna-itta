class ConstrainActiveStorageVisitImages < ActiveRecord::Migration[8.1]
  def change
    add_check_constraint :active_storage_blobs,
      "byte_size BETWEEN 0 AND 1048576",
      name: "active_storage_blobs_visit_image_size"
    add_check_constraint :active_storage_blobs,
      "content_type IS NULL OR content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif')",
      name: "active_storage_blobs_visit_image_mime"
  end
end
