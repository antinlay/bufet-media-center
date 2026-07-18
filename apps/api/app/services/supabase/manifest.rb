module Supabase
  class Manifest
    class << self
      def for_device(device_id, screen_id: nil)
        return nil unless Supabase::Client.configured?

        screen_params = {
          "select" => "*",
          "player_device_id" => "eq.#{device_id}",
          "limit" => "1"
        }
        screen_params["legacy_id"] = "eq.#{screen_id}" if screen_id.present?
        screen = Supabase::Client.get(
          "screens",
          params: screen_params
        ).first
        return nil unless screen

        Supabase::Client.patch(
          "screens",
          { status: "live", last_seen_at: Time.current.iso8601, updated_at: Time.current.iso8601 },
          params: { "id" => "eq.#{screen["id"]}" }
        )
        playlist = Supabase::Client.get("playlists", params: { "select" => "*", "screen_id" => "eq.#{screen["id"]}", "limit" => "1" }).first
        return nil unless playlist

        rows = Supabase::Client.get(
          "playlist_items",
          params: { "select" => "*", "playlist_id" => "eq.#{playlist["id"]}", "order" => "position.asc" }
        )
        media_ids = rows.filter_map { |row| row["media_id"] }
        media_by_id = if media_ids.empty?
          {}
        else
          Supabase::Client.get("media", params: { "select" => "*", "id" => "in.(#{media_ids.join(",")})" }).index_by { |media| media["id"] }
        end

        {
          playlist: {
            items: rows.filter_map { |row| item_for(row, media_by_id[row["media_id"]]) }
          },
          settings: {
            screen_id: screen["legacy_id"] || screen["id"],
            screen_uuid: screen["id"],
            config_version: screen["config_version"].to_s,
            manifest_version: "#{playlist["version"]}:#{playlist["updated_at"]}",
            source: "supabase"
          }
        }
      rescue Supabase::Client::Error => error
        Rails.logger.warn("Supabase manifest unavailable: #{error.class}")
        nil
      end

      private

      def item_for(row, media)
        return nil unless media

        {
          id: row["id"],
          playlistId: row["playlist_id"],
          type: media["kind"] == "video" ? "VIDEO" : "IMAGE",
          url: media_url(media),
          durationSeconds: row["duration_seconds"] || media["duration_seconds"],
          thumbnailUrl: thumbnail_url(media),
          order: row["position"].to_i,
          createdAt: row["created_at"],
          updatedAt: row["updated_at"]
        }
      end

      def media_url(media)
        if media["storage_path"].present?
          Supabase::MediaStore.signed_url(media["storage_path"])
        else
          absolute_url(media["source_url"])
        end
      end

      def thumbnail_url(media)
        if media["thumbnail_path"].present?
          Supabase::MediaStore.signed_url(media["thumbnail_path"])
        else
          absolute_url(media["thumbnail_url"])
        end
      end

      def absolute_url(value)
        return nil if value.blank?
        return value if value.match?(/\Ahttps?:\/\//i)

        base = ENV["PUBLIC_API_URL"].presence || ENV["DASHBOARD_BASE_URL"].presence
        base ? "#{base.chomp("/")}#{value.start_with?("/") ? value : "/#{value}"}" : value
      end
    end
  end
end
