class AddSupabaseUidToUsers < ActiveRecord::Migration[8.1]
  def change
    add_column :users, :supabase_uid, :string
    add_index :users, :supabase_uid, unique: true
  end
end
