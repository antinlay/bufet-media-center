class CreatePlayerDevicesAndPairings < ActiveRecord::Migration[8.1]
  def change
    create_table :player_devices do |t|
      t.string :device_id, null: false
      t.references :screen, foreign_key: true
      t.string :name
      t.datetime :paired_at
      t.datetime :last_seen_at
      t.timestamps
    end

    add_index :player_devices, :device_id, unique: true

    create_table :player_pairings do |t|
      t.references :player_device, null: false, foreign_key: true
      t.references :screen, foreign_key: true
      t.string :code, null: false
      t.datetime :expires_at, null: false
      t.datetime :paired_at
      t.timestamps
    end

    add_index :player_pairings, :code, unique: true
  end
end
