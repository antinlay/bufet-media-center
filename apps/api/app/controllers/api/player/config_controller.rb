class Api::Player::ConfigController < ActionController::API
  def bootstrap
    device = find_device
    if device&.screen
      device.update(last_seen_at: Time.current)
      device.screen.touch(:last_seen_at)
      render json: { status: "PAIRED", config: config_for(device) }
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
    render json: config_for(device)
  end

  def manifest
    device = find_device
    unless device&.screen
      render json: { message: "Device not paired" }, status: :not_found
      return
    end

    device.update(last_seen_at: Time.current)
    device.screen.touch(:last_seen_at)
    @manifest = config_for(device)
    render :manifest
  end

  private

  def find_device
    device_id = params[:deviceId].presence || params[:device_id].presence
    return nil if device_id.blank?

    PlayerDevice.find_by(device_id: device_id)
  end

  def config_for(device)
    Supabase::Manifest.for_device(device.device_id, screen_id: device.screen_id) || PlayerConfigBuilder.new(device.screen).build
  end
end
