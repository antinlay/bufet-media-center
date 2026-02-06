class Api::Player::PairingsController < ActionController::API
  PAIRING_TTL = 15.minutes

  def create
    device_id = params[:deviceId].presence || params[:device_id].presence
    if device_id.blank?
      render json: { message: "deviceId is required" }, status: :unprocessable_entity
      return
    end

    device = PlayerDevice.find_or_create_by!(device_id: device_id)
    code = generate_unique_code
    pairing = device.pairings.create!(code: code, expires_at: PAIRING_TTL.from_now)

    render json: {
      code: pairing.code,
      pairUrl: pairing_url(pairing.code),
      expiresAt: pairing.expires_at.iso8601
    }
  end

  def status
    device_id = params[:deviceId].presence || params[:device_id].presence
    device = device_id.present? ? PlayerDevice.find_by(device_id: device_id) : nil

    status = device&.paired? ? "PAIRED" : "PENDING"
    render json: { status: status }
  end

  private

  def pairing_url(code)
    base = ENV.fetch("CONCERTO_DASHBOARD_URL", request.base_url)
    "#{base}/pair?code=#{code}"
  end

  def generate_unique_code
    loop do
      code = SecureRandom.alphanumeric(6).upcase
      return code unless PlayerPairing.exists?(code: code)
    end
  end
end
