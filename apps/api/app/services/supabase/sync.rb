require "digest/uuid"

module Supabase
  module Sync
    class Content
      include Rails.application.routes.url_helpers

      def self.call(content, organization_id: nil)
        new(content, organization_id: organization_id).call
      end

      def initialize(content, organization_id:)
        @content = content
        @organization_id = organization_id
      end

      def call
        return unless Supabase::Client.configured?
        return unless @content.is_a?(Graphic) || @content.is_a?(Video)

        existing = Supabase::Client.get("media", params: { "select" => "*", "legacy_id" => "eq.#{@content.id}", "limit" => "1" }).first
        storage_path = existing && existing["storage_path"]
        thumbnail_path = existing && existing["thumbnail_path"]

        if @content.is_a?(Graphic) && @content.image.attached? && storage_path.blank?
          storage_path = Supabase::MediaStore.upload_attachment(
            @content.image,
            path: Supabase::MediaStore.path_for(@content, @content.image)
          )
          thumbnail_path = storage_path
        elsif @content.is_a?(Video) && @content.file.attached? && storage_path.blank?
          storage_path = Supabase::MediaStore.upload_attachment(
            @content.file,
            path: Supabase::MediaStore.path_for(@content, @content.file)
          )
        end

        if @content.is_a?(Video) && @content.poster.attached? && thumbnail_path.blank?
          thumbnail_path = Supabase::MediaStore.upload_attachment(
            @content.poster,
            path: Supabase::MediaStore.path_for(@content, @content.poster, suffix: "thumbnail")
          )
        end

        record = {
          legacy_id: @content.id,
          organization_id: @organization_id,
          kind: @content.is_a?(Graphic) ? "image" : "video",
          title: @content.name,
          source_url: source_url,
          thumbnail_url: @content.is_a?(Video) ? @content.thumbnail_url : nil,
          storage_path: storage_path,
          thumbnail_path: thumbnail_path,
          duration_seconds: @content.duration,
          metadata: {
            source_type: @content.class.name,
            start_time: @content.start_time&.iso8601,
            end_time: @content.end_time&.iso8601,
            updated_at: @content.updated_at&.iso8601
          }
        }
        Supabase::Client.upsert("media", [ record ], conflict: "legacy_id").first
      end

      private

      def source_url
        if @content.is_a?(Video)
          @content.file.attached? ? nil : @content.url.presence
        elsif @content.image.attached?
          rails_blob_path(@content.image, only_path: true)
        end
      end
    end

    class Screen
      def self.call(screen)
        new(screen).call
      end

      def initialize(screen)
        @screen = screen
      end

      def call
        return unless Supabase::Client.configured?

        organization = upsert_organization(@screen.group)
        screen = Supabase::Client.upsert("screens", [ screen_record(organization["id"]) ], conflict: "legacy_id").first
        playlist = Supabase::Client.upsert(
          "playlists",
          [ { screen_id: screen["id"], version: @screen.config_version.to_i, updated_at: Time.current.iso8601 } ],
          conflict: "screen_id"
        ).first

        items = playlist_items(organization["id"])
        Supabase::Client.delete("playlist_items", params: { "playlist_id" => "eq.#{playlist["id"]}" })
        Supabase::Client.upsert("playlist_items", items.map { |item| item.merge(playlist_id: playlist["id"]) }, conflict: "legacy_submission_id") if items.any?
        playlist
      end

      private

      def upsert_organization(group)
        Supabase::Client.upsert(
          "organizations",
          [
            {
              legacy_id: group.id,
              name: group.name,
              parent_legacy_id: group.parent_id,
              metadata: { description: group.description, system_group: group.system_group? }
            }
          ],
          conflict: "legacy_id"
        ).first
      end

      def screen_record(organization_id)
        {
          legacy_id: @screen.id,
          organization_id: organization_id,
          player_device_id: @screen.player_device&.device_id,
          name: @screen.name,
          status: @screen.online? ? "online" : "offline",
          config_version: @screen.config_version.to_i,
          last_seen_at: @screen.last_seen_at&.iso8601,
          metadata: { template_id: @screen.template_id }
        }
      end

      def playlist_items(organization_id)
        feed = PlaylistFeedService.find_for_screen(@screen)
        return [] unless feed

        feed.submissions.includes(:content).order(:position, :created_at).filter_map do |submission|
          content = submission.content
          next unless content.is_a?(Graphic) || content.is_a?(Video)
          next unless content.active?

          media = Supabase::Sync::Content.call(content, organization_id: organization_id)
          next unless media

          {
            media_id: media["id"],
            legacy_submission_id: submission.id,
            position: submission.position,
            duration_seconds: content.duration
          }
        end
      end
    end

    class All
      def self.call!
        raise Supabase::Client::Error, "Supabase is not configured" unless Supabase::Client.configured?

        groups = Group.find_each.to_a
        contents = Content.where(type: %w[Graphic Video]).find_each.to_a
        screens = Screen.includes(:group, :player_device).find_each.to_a
        contents.each { |content| Supabase::Sync::Content.call(content) }
        screens.each { |screen| Supabase::Sync::Screen.call(screen) }
        { organizations: groups.size, media: contents.size, screens: screens.size }
      end
    end
  end
end
