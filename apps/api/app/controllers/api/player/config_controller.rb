class Api::Player::ConfigController < ActionController::API
  def bootstrap
    device = find_device
    if device&.screen
      device.update(last_seen_at: Time.current)
      device.screen.touch(:last_seen_at)
      render json: { status: "PAIRED", config: PlayerConfigBuilder.new(device.screen).build }
    else
      render json: { status: "UNPAIRED" }
    end
  end

  def show
    device = find_device
    unless device&.screen
      render json: { message: "Device not paired" }, status: :not_found
      return
    end

    device.update(last_seen_at: Time.current)
    device.screen.touch(:last_seen_at)
    render json: PlayerConfigBuilder.new(device.screen).build
  end

  private

  def find_device
    device_id = params[:deviceId].presence || params[:device_id].presence
    return nil if device_id.blank?

    PlayerDevice.find_by(device_id: device_id)
  end
end
