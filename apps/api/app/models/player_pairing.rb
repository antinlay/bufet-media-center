class PlayerPairing < ApplicationRecord
  belongs_to :player_device
  belongs_to :screen, optional: true

  validates :code, presence: true, uniqueness: true
  validates :expires_at, presence: true

  scope :active, -> { where(paired_at: nil).where("expires_at > ?", Time.current) }

  def expired?
    expires_at <= Time.current
  end
end
