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
    authorize content, :tenant_show?
    render json: serialize_content(content)
  end

  def create
    content = content_class.new
    content.assign_attributes(content_attributes)
    content.user = current_user
    authorize content

    attach_graphic_image(content)
    attach_video_file(content)
    assign_feed_ids(content)

    if @feed_assignment_error
      render json: { message: "One or more feeds are not accessible" }, status: :forbidden
      return
    end

    if @image_attach_error
      render json: { message: "Invalid image upload" }, status: :unprocessable_entity
      return
    end

    if @video_attach_error
      render json: { message: "Invalid video upload" }, status: :unprocessable_entity
      return
    end

    if @video_attach_oversize
      render json: { message: "Video is too large (max 100MB)" }, status: :payload_too_large
      return
    end

    if content.save
      sync_supabase!(content)
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

    if @feed_assignment_error
      render json: { message: "One or more feeds are not accessible" }, status: :forbidden
      return
    end

    if @image_attach_error
      render json: { message: "Invalid image upload" }, status: :unprocessable_entity
      return
    end

    if content.save
      sync_supabase!(content)
      render json: serialize_content(content)
    else
      render json: { message: content.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    content = Content.find(params[:id])
    authorize content

    begin
      delete_synced_media!(content)
    rescue Supabase::Client::Error => error
      reason = error.response_body.inspect.truncate(500)
      Rails.logger.error("Supabase media deletion failed status=#{error.status || 'unknown'} reason=#{reason}")
      render json: { message: "Media synchronization failed" }, status: :bad_gateway
      return
    end

    content.destroy!
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
      :video,
      feed_ids: []
    )

    attrs = permitted.to_h.except("image", "video", "feed_ids")

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

  def attach_video_file(content)
    return unless content.is_a?(Video)

    video = content_payload[:video]
    return unless video.present?

    if video.respond_to?(:content_type) && video.content_type.present? && !video.content_type.start_with?("video/")
      @video_attach_error = true
      return
    end

    if video.respond_to?(:size) && video.size.to_i > Video::MAX_FILE_SIZE
      @video_attach_oversize = true
      return
    end

    content.file.attach(video)
  rescue ActiveSupport::MessageVerifier::InvalidSignature
    @video_attach_error = true
  end

  def assign_feed_ids(content)
    feed_ids = content_payload[:feed_ids]
    return if feed_ids.nil?

    requested_ids = Array(feed_ids).reject(&:blank?).map(&:to_i).uniq
    accessible_ids = policy_scope(Feed).where(id: requested_ids).pluck(:id)
    if accessible_ids.size != requested_ids.size
      @feed_assignment_error = true
      return
    end

    content.feed_ids = accessible_ids
  end

  def sync_supabase!(content)
    Supabase::Sync::Content.call(content)
  rescue Supabase::Client::Error => error
    Rails.logger.warn("Supabase media sync failed: #{error.class}")
  end

  def delete_synced_media!(content)
    return unless Supabase::Client.configured?

    media = Supabase::Client.get(
      "media",
      params: { "select" => "id", "legacy_id" => "eq.#{content.id}", "limit" => "1" }
    ).first
    return unless media

    media_id = media.fetch("id")
    Supabase::Client.delete("playlist_items", params: { "media_id" => "eq.#{media_id}" })
    Supabase::Client.delete("media", params: { "id" => "eq.#{media_id}" })
  end
end
