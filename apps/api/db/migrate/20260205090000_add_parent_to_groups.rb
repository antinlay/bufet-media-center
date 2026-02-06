class AddParentToGroups < ActiveRecord::Migration[8.1]
  def change
    add_reference :groups, :parent, foreign_key: { to_table: :groups, on_delete: :nullify }, index: true, null: true
  end
end
