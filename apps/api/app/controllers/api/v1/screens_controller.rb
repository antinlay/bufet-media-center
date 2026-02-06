class Api::V1::ScreensController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  after_action :verify_authorized, except: :index
  after_action :verify_policy_scoped, only: :index

  def index
    screens = policy_scope(Screen)
      .includes(:group, :template, :player_device)
      .order(updated_at: :desc)
    render json: screens.map { |screen| serialize_screen(screen) }
  end

  def show
    screen = Screen.includes(:group, :template, :player_device).find(params[:id])
    authorize screen
    render json: serialize_screen(screen)
  end

  def create
    screen = Screen.new
    screen.assign_attributes(screen_params(screen))
    screen.template ||= Template.default
    authorize screen

    if screen.save
      render json: serialize_screen(screen), status: :created
    else
      render json: { message: screen.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def update
    screen = Screen.find(params[:id])
    screen.assign_attributes(screen_params(screen))
    authorize screen

    if screen.save
      render json: serialize_screen(screen)
    else
      render json: { message: screen.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    screen = Screen.find(params[:id])
    authorize screen

    screen.destroy
    head :no_content
  end

  private

  def screen_params(record)
    payload = params[:screen].presence || params
    payload.permit(policy(record).permitted_attributes)
  end
end
