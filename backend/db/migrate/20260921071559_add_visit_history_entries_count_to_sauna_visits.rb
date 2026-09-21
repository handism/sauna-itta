class AddVisitHistoryEntriesCountToSaunaVisits < ActiveRecord::Migration[8.1]
  def up
    add_column :sauna_visits, :visit_history_entries_count, :integer, default: 0, null: false

    SaunaVisit.reset_column_information
    SaunaVisit.find_each do |visit|
      SaunaVisit.reset_counters(visit.id, :visit_history_entries)
    end
  end

  def down
    remove_column :sauna_visits, :visit_history_entries_count
  end
end
