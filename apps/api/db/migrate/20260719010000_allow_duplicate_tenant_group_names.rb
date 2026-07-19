class AllowDuplicateTenantGroupNames < ActiveRecord::Migration[8.1]
  def change
    remove_index :groups, :name, unique: true
    add_index :groups, :name
  end
end
