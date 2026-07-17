class Api::V1::ContentsController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  after_action :verify_authorized, except: :index
  after_action :verify_policy_scoped, only: :index

  def index
    contents = policy_scope(Content).includes(:feeds)
    render json: contents.order(updated_at: :desc).map { |content| serialize_content(content) }
  end

  def show
    content = Content.find(params[:id])
    authorize content
    render json: serialize_content(content)
  end

  def create
    content = content_class.new
    content.assign_attributes(content_attributes)
    content.user = current_user
    authorize content

    attach_graphic_image(content)
    assign_feed_ids(content)

    if @image_attach_error
      render json: { message: "Invalid image upload" }, status: :unprocessable_entity
      return
    end

    if content.save
      Supabase::Sync::Content.call(content)
      render json: serialize_content(content), status: :created
    else
      render json: { message: content.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def update
    content = Content.find(params[:id])
    content.assign_attributes(content_attributes)
    authorize content

    attach_graphic_image(content)
    assign_feed_ids(content)

    if @image_attach_error
      render json: { message: "Invalid image upload" }, status: :unprocessable_entity
      return
    end

    if content.save
      Supabase::Sync::Content.call(content)
      render json: serialize_content(content)
    else
      render json: { message: content.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    content = Content.find(params[:id])
    authorize content

    content.destroy
    Supabase::Client.delete("media", params: { "legacy_id" => "eq.#{content.id}" }) if Supabase::Client.configured?
    head :no_content
  end

  private

  def content_class
    type = content_payload[:type]
    case type
    when "Graphic"
      Graphic
    when "Video"
      Video
    when "RichText"
      RichText
    when "Clock"
      Clock
    else
      Content
    end
  end

  def content_payload
    params[:content].presence || params
  end

  def content_attributes
    permitted = content_payload.permit(
      :type,
      :name,
      :duration,
      :start_time,
      :end_time,
      :text,
      :render_as,
      :url,
      :format,
      :image,
      feed_ids: []
    )

    attrs = permitted.to_h.except("image", "feed_ids")

    case content_class.name
    when "Graphic"
      attrs.except!("text", "render_as", "url", "format")
    when "Video"
      attrs.except!("text", "render_as", "format")
    when "RichText"
      attrs.except!("url", "format")
    when "Clock"
      attrs.except!("text", "render_as", "url")
    else
      attrs.slice!("type", "name", "duration", "start_time", "end_time")
    end

    attrs
  end

  def attach_graphic_image(content)
    return unless content.is_a?(Graphic)

    image = content_payload[:image]
    return unless image.present?

    content.image.attach(image)
  rescue ActiveSupport::MessageVerifier::InvalidSignature
    @image_attach_error = true
  end

  def assign_feed_ids(content)
    feed_ids = content_payload[:feed_ids]
    return if feed_ids.nil?

    content.feed_ids = Array(feed_ids).reject(&:blank?)
  end
end
