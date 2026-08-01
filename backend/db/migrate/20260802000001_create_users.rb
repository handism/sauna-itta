class CreateUsers < ActiveRecord::Migration[8.1]
  def change
    create_table :users do |t|
      t.string :google_subject, null: false
      t.string :email, null: false
      t.timestamps
    end
    add_index :users, :google_subject, unique: true
    add_index :users, "lower(email)", unique: true, name: "index_users_on_lower_email"
  end
end
