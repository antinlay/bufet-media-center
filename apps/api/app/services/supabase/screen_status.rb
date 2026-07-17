module Supabase
  class ScreenStatus
    class << self
      def for_legacy_ids(ids)
        return {} unless Supabase::Client.configured? && ids.any?

        Supabase::Client.get(
          "screens",
          params: { "select" => "legacy_id,status,last_seen_at", "legacy_id" => "in.(#{ids.join(",")})" }
        ).index_by { |screen| screen["legacy_id"].to_i }.transform_values { |screen| screen["status"] }
      rescue Supabase::Client::Error => error
        Rails.logger.warn("Supabase screen status unavailable: #{error.class}")
        {}
      end

      def mark_stale!
        return 0 unless Supabase::Client.configured?

        rows = Supabase::Client.get(
          "screens",
          params: { "select" => "id", "last_seen_at" => "lt.#{10.minutes.ago.iso8601}", "status" => "neq.offline" }
        )
        rows.each { |row| Supabase::Client.patch("screens", { status: "offline" }, params: { "id" => "eq.#{row["id"]}" }) }
        rows.size
      end
    end
  end
end
