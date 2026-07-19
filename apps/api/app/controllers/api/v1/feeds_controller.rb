class Api::V1::FeedsController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  after_action :verify_authorized, except: :index
  after_action :verify_policy_scoped, only: :index

  def index
    feeds = policy_scope(Feed).includes(:group).order(updated_at: :desc)
    render json: feeds.map { |feed| serialize_feed(feed) }
  end

  def show
    feed = Feed.find(params[:id])
    authorize feed, :tenant_show?
    render json: serialize_feed(feed)
  end

  def create
    feed = feed_class.new(feed_params)
    authorize feed

    if feed.save
      render json: serialize_feed(feed), status: :created
    else
      render json: { message: feed.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def update
    feed = Feed.find(params[:id])
    feed.assign_attributes(feed_params)
    authorize feed

    if feed.save
      render json: serialize_feed(feed)
    else
      render json: { message: feed.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    feed = Feed.find(params[:id])
    authorize feed

    feed.destroy
    head :no_content
  end

  private

  def feed_class
    type = feed_params[:type]
    return RssFeed if type == "RssFeed"
    return RemoteFeed if type == "RemoteFeed"

    Feed
  end

  def feed_params
    payload = params[:feed].presence || params
    base = payload.permit(:name, :description, :type, :group_id, :config, :url, :formatter)
    base
  end
end
