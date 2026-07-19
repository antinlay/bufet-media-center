class Api::V1::ScreenPlaylistsController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  before_action :set_screen
  before_action :authorize_screen
  before_action :set_playlist_feed
  after_action :verify_authorized

  def show
    render json: {
      screenId: @screen.id,
      feedId: @playlist_feed.id,
      items: playlist_items
    }
  end

  def create
    content_id = content_payload[:content_id].presence || content_payload[:contentId].presence
    if content_id.present?
      content = policy_scope(Content).find_by(id: content_id)
      unless content
        render json: { message: "Content not found" }, status: :not_found
        return
      end

      unless content.is_a?(Graphic) || content.is_a?(Video)
        render json: { message: "Only Graphic or Video content can be added" }, status: :unprocessable_entity
        return
      end

      if content_payload[:duration].present?
        content.duration = content_payload[:duration]
        unless content.save
          render json: { message: content.errors.full_messages.to_sentence }, status: :unprocessable_entity
          return
        end
      end

      submission = @playlist_feed.submissions.create!(content: content)
      sync_supabase!
      render json: serialize_playlist_item(submission), status: :created
      return
    end

    if content_payload[:type].to_s == "Graphic" && content_payload[:image].blank?
      render json: { message: "Image is required" }, status: :unprocessable_entity
      return
    end

    if content_payload[:type].to_s == "Video"
      has_url = content_payload[:url].present?
      has_file = content_payload[:video].present?
      if !has_url && !has_file
        render json: { message: "Video URL or file is required" }, status: :unprocessable_entity
        return
      end
      if has_url && has_file
        render json: { message: "Provide either video URL or file, not both" }, status: :unprocessable_entity
        return
      end
    end

    content = build_content_from_payload
    content.user = current_user

    if content.is_a?(Video) && content_payload[:video].present?
      content.url = nil
    end

    attach_graphic_image(content)
    attach_video_file(content)
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
    if content.is_a?(Graphic) && !content.image.attached?
      render json: { message: "Image is required" }, status: :unprocessable_entity
      return
    end

    if content.save
      submission = @playlist_feed.submissions.create!(content: content)
      sync_supabase!
      render json: serialize_playlist_item(submission), status: :created
    else
      render json: { message: content.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def update
    submission = find_submission
    content = submission.content
    content.assign_attributes(update_payload(content))

    attach_graphic_image(content)
    attach_video_file(content)
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
      sync_supabase!
      render json: serialize_playlist_item(submission)
    else
      render json: { message: content.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def reorder
    ids = params[:submission_ids].presence || params[:submissionIds].presence
    unless ids.is_a?(Array)
      render json: { message: "submission_ids is required" }, status: :unprocessable_entity
      return
    end

    submissions = @playlist_feed.submissions.where(id: ids)
    if submissions.size != ids.size
      render json: { message: "One or more submissions not found" }, status: :not_found
      return
    end

    submissions_by_id = submissions.index_by(&:id)
    Submission.transaction do
      ids.each_with_index do |submission_id, index|
        submissions_by_id[submission_id.to_i].update!(position: index)
      end
    end

    sync_supabase!

    render json: { ok: true }
  end

  def destroy
    submission = find_submission
    content = submission.content
    submission.destroy!

    if content&.submissions&.count == 0
      content.destroy!
    end

    sync_supabase!

    head :no_content
  end

  private

  def set_screen
    @screen = Screen.find(params[:screen_id] || params[:id])
  end

  def authorize_screen
    query = action_name == "show" ? :tenant_show? : :update?
    authorize @screen, query
  end

  def set_playlist_feed
    service = PlaylistFeedService.new(@screen)
    @playlist_feed = service.feed
    service.ensure_subscription!
  end

  def playlist_items
    @playlist_feed.submissions.includes(:content).order(:position, :created_at).map do |submission|
      serialize_playlist_item(submission)
    end.compact
  end

  def build_content_from_payload
    type = content_payload[:type].to_s
    klass = case type
    when "Graphic"
      Graphic
    when "Video"
      Video
    else
      Content
    end

    content = klass.new
    content.assign_attributes(create_payload)
    content.duration ||= 15 if content.is_a?(Graphic)
    content
  end

  def content_payload
    params[:content].presence || params
  end

  def create_payload
    permitted = content_payload.permit(:type, :name, :duration, :url, :video)
    attrs = permitted.to_h

    if content_payload[:type].to_s == "Graphic"
      attrs.except!("url", "video")
    elsif content_payload[:type].to_s == "Video"
      attrs.except!("type", "video")
    else
      attrs = attrs.slice("name", "duration")
    end

    attrs
  end

  def update_payload(content)
    permitted = content_payload.permit(:name, :duration, :url, :video)
    attrs = permitted.to_h

    if content.is_a?(Graphic)
      attrs.except!("url")
    elsif content.is_a?(Video)
      attrs.except!("video")
    else
      attrs = attrs.slice("name", "duration")
    end

    attrs
  end

  def attach_graphic_image(content)
    return unless content.is_a?(Graphic)

    image = content_payload[:image]
    return unless image.present?

    if image.respond_to?(:content_type) && image.content_type.present? && !image.content_type.start_with?("image/")
      @image_attach_error = true
      return
    end

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

  def find_submission
    @playlist_feed.submissions.find(params[:submission_id])
  end

  def sync_supabase!
    Supabase::Sync::Screen.call(@screen)
  rescue Supabase::Client::Error => error
    Rails.logger.warn("Supabase playlist sync failed: #{error.class}")
  end
end
