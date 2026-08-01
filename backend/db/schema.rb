# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_08_02_000005) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.bigint "record_id", null: false
    t.string "record_type", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.string "content_type"
    t.datetime "created_at", null: false
    t.string "filename", null: false
    t.string "key", null: false
    t.text "metadata"
    t.string "service_name", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
    t.check_constraint "byte_size >= 0 AND byte_size <= 1048576", name: "active_storage_blobs_visit_image_size"
    t.check_constraint "content_type IS NULL OR (content_type::text = ANY (ARRAY['image/jpeg'::character varying, 'image/png'::character varying, 'image/webp'::character varying, 'image/gif'::character varying]::text[]))", name: "active_storage_blobs_visit_image_mime"
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "sauna_visits", force: :cascade do |t|
    t.string "area"
    t.datetime "created_at", null: false
    t.string "external_id", null: false
    t.decimal "latitude", precision: 10, scale: 7, null: false
    t.integer "legacy_visit_count", default: 1, null: false
    t.integer "lock_version", default: 0, null: false
    t.decimal "longitude", precision: 10, scale: 7, null: false
    t.string "name", null: false
    t.string "status", default: "visited", null: false
    t.jsonb "tags", default: [], null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["user_id", "external_id"], name: "index_sauna_visits_on_user_id_and_external_id", unique: true
    t.index ["user_id"], name: "index_sauna_visits_on_user_id"
    t.check_constraint "latitude >= '-90'::integer::numeric AND latitude <= 90::numeric", name: "sauna_visits_latitude_range"
    t.check_constraint "legacy_visit_count >= 0", name: "sauna_visits_visit_count_nonnegative"
    t.check_constraint "longitude >= '-180'::integer::numeric AND longitude <= 180::numeric", name: "sauna_visits_longitude_range"
    t.check_constraint "status::text = ANY (ARRAY['visited'::character varying::text, 'wishlist'::character varying::text])", name: "sauna_visits_status_values"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "google_subject", null: false
    t.datetime "updated_at", null: false
    t.index "lower((email)::text)", name: "index_users_on_lower_email", unique: true
    t.index ["google_subject"], name: "index_users_on_google_subject", unique: true
  end

  create_table "visit_history_entries", force: :cascade do |t|
    t.text "comment", default: "", null: false
    t.datetime "created_at", null: false
    t.string "public_id", null: false
    t.decimal "rating", precision: 2, scale: 1
    t.bigint "sauna_visit_id", null: false
    t.datetime "updated_at", null: false
    t.date "visited_on", null: false
    t.index ["public_id"], name: "index_visit_history_entries_on_public_id", unique: true
    t.index ["sauna_visit_id"], name: "index_visit_history_entries_on_sauna_visit_id"
    t.check_constraint "rating IS NULL OR rating >= 0::numeric AND rating <= 5::numeric", name: "visit_history_entries_rating_range"
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "sauna_visits", "users"
  add_foreign_key "visit_history_entries", "sauna_visits"
end
