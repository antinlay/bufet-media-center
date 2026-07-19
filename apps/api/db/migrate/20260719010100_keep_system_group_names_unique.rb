class KeepSystemGroupNamesUnique < ActiveRecord::Migration[8.1]
  def change
    add_index :groups,
      :name,
      unique: true,
      where: "name IN ('All Registered Users', 'System Administrators')",
      name: "index_groups_on_unique_system_name"
  end
end
