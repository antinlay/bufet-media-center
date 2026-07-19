module Api::V1::ConcertoSerializer
  include Rails.application.routes.url_helpers

  def serialize_group(group)
    return nil unless group

    {
      id: group.id,
      name: group.name,
      parentId: group.parent_id,
      description: group.description,
      systemGroup: group.system_group?,
      createdAt: group.created_at&.iso8601,
      updatedAt: group.updated_at&.iso8601
    }
  end

  def serialize_template(template)
    return nil unless template

    {
      id: template.id,
      name: template.name,
      author: template.author,
      imageUrl: template.image.attached? ? rails_blob_path(template.image, only_path: true) : nil,
      positions: template.positions.map { |position|
        {
          id: position.id,
          fieldId: position.field_id,
          top: position.top,
          left: position.left,
          bottom: position.bottom,
          right: position.right,
          style: position.style
        }
      },
      createdAt: template.created_at&.iso8601,
      updatedAt: template.updated_at&.iso8601
    }
  end

  def serialize_screen(screen, status: nil)
    {
      id: screen.id,
      name: screen.name,
      groupId: screen.group_id,
      templateId: screen.template_id,
      lastSeenAt: screen.last_seen_at&.iso8601,
      online: screen.online?,
      status: status.presence || (screen.online? ? "online" : "offline"),
      configVersion: screen.config_version,
      group: serialize_group(screen.group),
      template: serialize_template(screen.template),
      device: serialize_player_device(screen.player_device),
      createdAt: screen.created_at&.iso8601,
      updatedAt: screen.updated_at&.iso8601
    }
  end

  def serialize_player_device(device)
    return nil unless device

    {
      id: device.id,
      deviceId: device.device_id,
      name: device.name,
      pairedAt: device.paired_at&.iso8601,
      lastSeenAt: device.last_seen_at&.iso8601
    }
  end

  def serialize_feed(feed)
    {
      id: feed.id,
      name: feed.name,
      description: feed.description,
      type: feed.type,
      groupId: feed.group_id,
      config: feed.config,
      createdAt: feed.created_at&.iso8601,
      updatedAt: feed.updated_at&.iso8601
    }
  end

  def serialize_field(field)
    return nil unless field

    {
      id: field.id,
      name: field.name,
      altNames: field.alt_names,
      createdAt: field.created_at&.iso8601,
      updatedAt: field.updated_at&.iso8601
    }
  end

  def serialize_subscription(subscription)
    return nil unless subscription

    {
      id: subscription.id,
      screenId: subscription.screen_id,
      fieldId: subscription.field_id,
      feedId: subscription.feed_id,
      weight: subscription.weight,
      field: serialize_field(subscription.field),
      feed: serialize_feed(subscription.feed),
      createdAt: subscription.created_at&.iso8601,
      updatedAt: subscription.updated_at&.iso8601
    }
  end

  def serialize_content(content)
    base = {
      id: content.id,
      name: content.name,
      type: content.type,
      duration: content.duration,
      startTime: content.start_time&.iso8601,
      endTime: content.end_time&.iso8601,
      userId: content.user_id,
      feeds: content.feeds.map { |feed| serialize_feed(feed) },
      createdAt: content.created_at&.iso8601,
      updatedAt: content.updated_at&.iso8601
    }

    if content.is_a?(Graphic)
      graphic_urls = graphic_media_urls(content)
      base.merge(imageUrl: graphic_urls[:media_url], thumbnailUrl: graphic_urls[:thumbnail_url])
    elsif content.is_a?(Video)
      base.merge(
        url: content.playback_url,
        videoSource: content.video_source,
        videoId: content.video_id,
        thumbnailUrl: content.thumbnail_url
      )
    elsif content.is_a?(RichText)
      base.merge(text: content.text, renderAs: content.render_as)
    elsif content.is_a?(Clock)
      base.merge(format: content.format)
    else
      base
    end
  end

  def serialize_playlist_item(submission)
    content = submission.content
    return nil unless content

    if content.is_a?(Graphic)
      graphic_urls = graphic_media_urls(content)
      media_url = graphic_urls[:media_url]
      thumbnail_url = graphic_urls[:thumbnail_url]
    elsif content.is_a?(Video)
      media_url = content.playback_url
      thumbnail_url = content.thumbnail_url
    end

    {
      submissionId: submission.id,
      contentId: content.id,
      type: content.type,
      name: content.name,
      duration: content.duration,
      displayDurationSeconds: submission.display_duration_seconds,
      position: submission.position,
      mediaUrl: media_url,
      thumbnailUrl: thumbnail_url,
      createdAt: submission.created_at&.iso8601,
      updatedAt: submission.updated_at&.iso8601
    }
  end

  def graphic_media_urls(content)
    fallback = content.image.attached? ? rails_blob_path(content.image, only_path: true) : nil
    return { media_url: fallback, thumbnail_url: fallback } unless Supabase::Client.configured?

    media = supabase_media_for(content.id)
    return { media_url: fallback, thumbnail_url: fallback } unless media

    media_url = signed_media_url(media["storage_path"]) || fallback
    thumbnail_url = signed_media_url(media["thumbnail_path"]) || media_url

    { media_url: media_url, thumbnail_url: thumbnail_url }
  rescue Supabase::Client::Error => error
    Rails.logger.warn("Supabase dashboard preview unavailable: #{error.class}")
    { media_url: fallback, thumbnail_url: fallback }
  end

  def serialize_submission(submission)
    {
      id: submission.id,
      contentId: submission.content_id,
      feedId: submission.feed_id,
      content: serialize_content(submission.content),
      feed: serialize_feed(submission.feed),
      createdAt: submission.created_at&.iso8601,
      updatedAt: submission.updated_at&.iso8601
    }
  end

  def serialize_membership(membership)
    {
      id: membership.id,
      userId: membership.user_id,
      groupId: membership.group_id,
      role: membership.role,
      createdAt: membership.created_at&.iso8601,
      updatedAt: membership.updated_at&.iso8601,
      user: serialize_user(membership.user),
      group: serialize_group(membership.group)
    }
  end

  def serialize_user(user)
    return nil unless user

    memberships = user.memberships.includes(:group)
    viewer = current_user if respond_to?(:current_user, true)
    unless viewer&.system_admin?
      visible_group_ids = GroupPolicy::Scope.new(viewer, Group.all).resolve.select(:id)
      memberships = memberships.where(group_id: visible_group_ids)
    end

    {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      systemAdmin: user.system_admin?,
      groups: memberships.map { |membership|
        {
          membershipId: membership.id,
          id: membership.group_id,
          name: membership.group.name,
          role: membership.role
        }
      },
      createdAt: user.created_at&.iso8601,
      updatedAt: user.updated_at&.iso8601
    }
  end

  def supabase_media_for(content_id)
    @supabase_media_by_content_id ||= {}
    return @supabase_media_by_content_id[content_id] if @supabase_media_by_content_id.key?(content_id)

    @supabase_media_by_content_id[content_id] = Supabase::Client.get(
      "media",
      params: { "select" => "storage_path,thumbnail_path", "legacy_id" => "eq.#{content_id}", "limit" => "1" }
    ).first
  end

  def signed_media_url(path)
    return nil if path.blank?

    Supabase::MediaStore.signed_url(path)
  end
end
