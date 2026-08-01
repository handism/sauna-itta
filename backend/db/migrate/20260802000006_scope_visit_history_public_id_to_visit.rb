class ScopeVisitHistoryPublicIdToVisit < ActiveRecord::Migration[8.1]
  # 履歴IDは記録内で一意であれば足ります。グローバル一意のままだと、他ユーザーが
  # エクスポートしたJSONを取り込んだときに履歴IDが衝突して取り込めません。
  def change
    # expand: 新しい制約を先に張る
    add_index :visit_history_entries, [ :sauna_visit_id, :public_id ],
      unique: true, name: "index_visit_history_entries_on_visit_and_public_id"

    # contract: 旧制約と、複合インデックスの先頭カラムで代替できる単独インデックスを外す
    remove_index :visit_history_entries, :public_id,
      unique: true, name: "index_visit_history_entries_on_public_id"
    remove_index :visit_history_entries, :sauna_visit_id,
      name: "index_visit_history_entries_on_sauna_visit_id"
  end
end
