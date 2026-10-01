class RemoveRedundantSaunaVisitsUserIdIndex < ActiveRecord::Migration[8.1]
  # user_id 単独のインデックスは、一意制約 (user_id, external_id) の先頭カラムで代替できる。
  # 記録の書き込みごとに 2 本のインデックスを更新するだけになっているため外す。
  def change
    remove_index :sauna_visits, :user_id, name: "index_sauna_visits_on_user_id"
  end
end
