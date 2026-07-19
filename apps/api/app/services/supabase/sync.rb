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
        media_attachment = attachment_for
        existing_attachment = existing&.dig("metadata", "attachment")

        if media_attachment&.attached? && (storage_path.blank? || existing_attachment != media_attachment.name)
          storage_path = Supabase::MediaStore.upload_attachment(
            media_attachment,
            path: Supabase::MediaStore.path_for(@content, media_attachment)
          )
          thumbnail_path = nil
        elsif @content.is_a?(Video) && @content.file.attached? && storage_path.blank?
          storage_path = Supabase::MediaStore.upload_attachment(
            @content.file,
            path: Supabase::MediaStore.path_for(@content, @content.file)
          )
        end

        if @content.is_a?(Graphic) && @content.image.attached? && thumbnail_path.blank?
          begin
            variant = @content.image.variant(resize_to_limit: [ 640, 360 ]).processed
            thumbnail_path = Supabase::MediaStore.upload_bytes(
              variant.download,
              path: Supabase::MediaStore.path_for(@content, @content.image, suffix: "thumbnail"),
              content_type: variant.blob.content_type.presence || "image/jpeg"
            )
          rescue StandardError => error
            Rails.logger.warn("Supabase image thumbnail failed: #{error.class}")
            thumbnail_path = storage_path
          end
        elsif @content.is_a?(Video) && @content.poster.attached? && thumbnail_path.blank?
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
            updated_at: @content.updated_at&.iso8601,
            attachment: media_attachment&.name
          }
        }
        Supabase::Client.upsert("media", [ record ], conflict: "legacy_id").first
      rescue ActiveStorage::FileNotFoundError => error
        Rails.logger.warn("Supabase media sync skipped missing attachment content_id=#{@content.id}: #{error.class}")
        nil
      end

      private

      def source_url
        if @content.is_a?(Video)
          @content.file.attached? ? nil : @content.url.presence
        elsif @content.image.attached?
          rails_blob_path(@content.image, only_path: true)
        end
      end

      def attachment_for
        return @content.image if @content.is_a?(Graphic) && @content.image.attached?
        return @content.mp4 if @content.is_a?(Video) && @content.mp4.attached?
        return @content.file if @content.is_a?(Video) && @content.file.attached?

        nil
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
        detach_reassigned_device!
        screen = Supabase::Client.upsert("screens", [ screen_record(organization["id"]) ], conflict: "legacy_id").first
        playlist = Supabase::Client.upsert(
          "playlists",
          [ { screen_id: screen["id"], version: @screen.updated_at.to_i, updated_at: Time.current.iso8601 } ],
          conflict: "screen_id"
        ).first

        items = playlist_items(organization["id"])
        Supabase::Client.delete("playlist_items", params: { "playlist_id" => "eq.#{playlist["id"]}" })
        Supabase::Client.upsert("playlist_items", items.map { |item| item.merge(playlist_id: playlist["id"]) }, conflict: "legacy_submission_id") if items.any?
        playlist
      end

      private

      def detach_reassigned_device!
        device_id = @screen.player_device&.device_id
        return if device_id.blank?

        Supabase::Client.patch(
          "screens",
          { player_device_id: nil, updated_at: Time.current.iso8601 },
          params: {
            "player_device_id" => "eq.#{device_id}"
          }
        )
      end

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
          config_version: @screen.config_version.to_s,
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
          next unless ::Content.active.where(id: content.id).exists?

          media = Supabase::Sync::Content.call(content, organization_id: organization_id)
          next unless media

          {
            media_id: media["id"],
            legacy_submission_id: submission.id,
            position: submission.position,
            duration_seconds: content.is_a?(Graphic) ? (submission.display_duration_seconds || 15) : content.duration
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
