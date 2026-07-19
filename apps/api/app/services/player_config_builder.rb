class PlayerConfigBuilder
  include Rails.application.routes.url_helpers

  def initialize(screen)
    @screen = screen
  end

  def build
    items = []
    seen = {}
    order = 0

    playlist_feed = PlaylistFeedService.find_for_screen(@screen)
    if playlist_feed
      playlist_feed
        .submissions
        .joins(:content)
        .merge(Content.active)
        .includes(:content)
        .order(:position, :created_at)
        .each do |submission|
          content = submission.content
          next unless renderable_content?(content)

          items << playlist_item_for(content, order, display_duration_seconds: submission.display_duration_seconds)
          order += 1
        end
    else
      @screen.subscriptions.includes(feed: :content).each do |subscription|
        subscription.contents.active.each do |content|
          next unless renderable_content?(content)
          next if seen[content.id]

          items << playlist_item_for(content, order)
          seen[content.id] = true
          order += 1
        end
      end
    end

    {
      playlist: {
        items: items
      },
      settings: {
        screen_id: @screen.id,
        config_version: @screen.config_version
      }
    }
  end

  private

  def renderable_content?(content)
    if content.is_a?(Graphic)
      content.image.attached?
    elsif content.is_a?(Video)
      content.url.present? || content.file.attached?
    else
      false
    end
  end

  def playlist_item_for(content, order, display_duration_seconds: nil)
    base = {
      id: to_uuid(content.id),
      playlistId: to_uuid(@screen.id),
      order: order,
      createdAt: content.created_at&.iso8601,
      updatedAt: content.updated_at&.iso8601
    }

    if content.is_a?(Graphic)
      base.merge(
        type: "IMAGE",
        url: rails_blob_path(content.image, only_path: true),
        durationSeconds: display_duration_seconds || 15
      )
    elsif content.is_a?(Video)
      base.merge(
        type: "VIDEO",
        url: content.playback_url,
        durationSeconds: content.duration,
        thumbnailUrl: content.thumbnail_url
      )
    else
      base
    end
  end

  def to_uuid(value)
    hex = value.to_i.to_s(16).rjust(32, "0")
    [
      hex[0, 8],
      hex[8, 4],
      hex[12, 4],
      hex[16, 4],
      hex[20, 12]
    ].join("-")
  end
end
