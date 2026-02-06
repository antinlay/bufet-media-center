class Api::V1::PairingsController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  after_action :verify_authorized

  def create
    code = params[:code].to_s.upcase
    pairing = PlayerPairing.active.includes(:player_device).find_by(code: code)

    unless pairing
      render json: { message: "Pairing code not found or expired" }, status: :not_found
      return
    end

    screen = resolve_screen
    device = pairing.player_device
    device.update!(screen: screen, paired_at: Time.current)
    pairing.update!(screen: screen, paired_at: Time.current)

    render json: {
      screen: serialize_screen(screen),
      device: serialize_player_device(device)
    }, status: :created
  end

  private

  def resolve_screen
    if params[:screen_id].present?
      screen = Screen.find(params[:screen_id])
      authorize screen, :update?
      return screen
    end

    screen = Screen.new(screen_params)
    screen.template ||= Template.default
    authorize screen, :create?
    screen.save!
    screen
  end

  def screen_params
    payload = params[:screen].presence || params
    payload.permit(:name, :group_id, :template_id)
  end
end
