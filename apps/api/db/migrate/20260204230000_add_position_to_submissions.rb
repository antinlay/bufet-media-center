class AddPositionToSubmissions < ActiveRecord::Migration[7.1]
  class MigrationSubmission < ActiveRecord::Base
    self.table_name = "submissions"
  end

  def up
    add_column :submissions, :position, :integer

    MigrationSubmission.reset_column_information

    feed_ids = MigrationSubmission.distinct.pluck(:feed_id).compact
    feed_ids.each do |feed_id|
      MigrationSubmission.where(feed_id: feed_id).order(:created_at, :id).each_with_index do |submission, index|
        submission.update_columns(position: index)
      end
    end

    change_column_null :submissions, :position, false, 0
    add_index :submissions, [ :feed_id, :position ]
  end

  def down
    remove_index :submissions, [ :feed_id, :position ]
    remove_column :submissions, :position
  end
end
