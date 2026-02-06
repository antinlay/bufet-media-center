class PlaylistFeedService
  PLAYLIST_KIND = "playlist"

  def initialize(screen)
    @screen = screen
  end

  def feed
    @feed ||= find_or_create_feed
  end

  def ensure_subscription!
    field = Field.find_by(name: "Main") || Field.first
    return unless field

    Subscription.find_or_create_by!(screen: @screen, field: field, feed: feed) do |subscription|
      subscription.weight = 5
    end
  end

  def self.find_for_screen(screen)
    adapter = ActiveRecord::Base.connection.adapter_name.to_s.downcase
    if adapter.include?("sqlite")
      Feed.where("json_extract(config, '$.kind') = ? AND json_extract(config, '$.screen_id') = ?", PLAYLIST_KIND, screen.id).first
    else
      Feed.where("config ->> 'kind' = ? AND config ->> 'screen_id' = ?", PLAYLIST_KIND, screen.id.to_s).first
    end
  end

  private

  def find_or_create_feed
    existing = find_feed
    return existing if existing

    Feed.create!(
      name: "Плейлист экрана #{@screen.name}",
      group: @screen.group,
      config: { "kind" => PLAYLIST_KIND, "screen_id" => @screen.id }
    )
  end

  def find_feed
    self.class.find_for_screen(@screen)
  end
end
