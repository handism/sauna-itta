class CreateVisitHistoryEntries < ActiveRecord::Migration[8.1]
  def change
    create_table :visit_history_entries do |t|
      t.references :sauna_visit, null: false, foreign_key: true
      t.string :public_id, null: false
      t.date :visited_on, null: false
      t.text :comment, null: false, default: ""
      t.decimal :rating, precision: 2, scale: 1
      t.timestamps
    end
    add_index :visit_history_entries, :public_id, unique: true
    add_check_constraint :visit_history_entries,
      "rating IS NULL OR (rating >= 0 AND rating <= 5)",
      name: "visit_history_entries_rating_range"
  end
end
