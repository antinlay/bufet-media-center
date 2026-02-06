class PlayerDevice < ApplicationRecord
  belongs_to :screen, optional: true
  has_many :pairings, class_name: "PlayerPairing", dependent: :destroy

  validates :device_id, presence: true, uniqueness: true

  def paired?
    screen_id.present?
  end
end
