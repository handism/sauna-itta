class CreateSaunaVisits < ActiveRecord::Migration[8.1]
  def change
    create_table :sauna_visits do |t|
      t.references :user, null: false, foreign_key: true
      t.string :external_id, null: false
      t.string :name, null: false
      t.decimal :latitude, precision: 10, scale: 7, null: false
      t.decimal :longitude, precision: 10, scale: 7, null: false
      t.string :area
      t.string :status, null: false, default: "visited"
      t.jsonb :tags, null: false, default: []
      t.integer :legacy_visit_count, null: false, default: 1
      t.integer :lock_version, null: false, default: 0
      t.timestamps
    end

    add_index :sauna_visits, %i[user_id external_id], unique: true
    add_check_constraint :sauna_visits, "latitude BETWEEN -90 AND 90", name: "sauna_visits_latitude_range"
    add_check_constraint :sauna_visits, "longitude BETWEEN -180 AND 180", name: "sauna_visits_longitude_range"
    add_check_constraint :sauna_visits, "status IN ('visited', 'wishlist')", name: "sauna_visits_status_values"
    add_check_constraint :sauna_visits, "legacy_visit_count >= 0", name: "sauna_visits_visit_count_nonnegative"
  end
end
