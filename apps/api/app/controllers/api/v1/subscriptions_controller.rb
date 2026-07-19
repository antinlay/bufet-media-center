class Api::V1::SubscriptionsController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  after_action :verify_authorized, except: :index
  after_action :verify_policy_scoped, only: :index

  def index
    subscriptions = policy_scope(Subscription).includes(:feed, :field)
    subscriptions = subscriptions.where(screen_id: params[:screen_id]) if params[:screen_id].present?
    render json: subscriptions.map { |subscription| serialize_subscription(subscription) }
  end

  def create
    screen = Screen.find(params[:screen_id])
    subscription = screen.subscriptions.new(subscription_params)
    authorize subscription

    unless policy_scope(Feed).where(id: subscription.feed_id).exists?
      render json: { message: "Feed is not accessible" }, status: :forbidden
      return
    end

    if subscription.save
      render json: serialize_subscription(subscription), status: :created
    else
      render json: { message: subscription.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    subscription = Subscription.find(params[:id])
    authorize subscription

    subscription.destroy
    head :no_content
  end

  private

  def subscription_params
    payload = params[:subscription].presence || params
    payload.permit(:feed_id, :field_id, :weight)
  end
end
