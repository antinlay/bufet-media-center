class Submission < ApplicationRecord
  belongs_to :content
  belongs_to :feed

  validates :position, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  before_validation :assign_position, on: :create

  private

  def assign_position
    return if position.present?
    return unless feed

    max_position = feed.submissions.maximum(:position) || -1
    self.position = max_position + 1
  end
end
