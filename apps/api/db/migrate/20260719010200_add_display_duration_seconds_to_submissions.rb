class AddDisplayDurationSecondsToSubmissions < ActiveRecord::Migration[8.1]
  def change
    add_column :submissions, :display_duration_seconds, :integer
    add_check_constraint :submissions,
      "display_duration_seconds IS NULL OR display_duration_seconds BETWEEN 1 AND 3600",
      name: "submissions_display_duration_seconds_range"
  end
end
