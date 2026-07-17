require "securerandom"

module Supabase
  class MediaStore
    class << self
      def configured?
        Client.configured?
      end

      def bucket
        ENV.fetch("SUPABASE_MEDIA_BUCKET", "media")
      end

      def signed_url(path)
        return nil if path.blank? || !configured?

        Client.create_signed_url(
          bucket,
          path,
          expires_in: ENV.fetch("SUPABASE_SIGNED_URL_TTL", "3600").to_i
        )
      end

      def upload_attachment(attachment, path:)
        return nil unless attachment&.attached? && configured?

        blob = attachment.blob
        Client.upload_object(
          bucket,
          path,
          attachment.download,
          content_type: blob.content_type.presence || "application/octet-stream"
        )
        path
      end

      def upload_bytes(body, path:, content_type: "application/octet-stream")
        return nil unless configured?

        Client.upload_object(bucket, path, body, content_type: content_type)
        path
      end

      def path_for(content, attachment, suffix: "original")
        extension = attachment.blob.filename.extension.presence || "bin"
        "media/#{content.class.name.underscore}/#{content.id}/#{suffix}-#{SecureRandom.hex(8)}.#{extension}"
      end
    end
  end
end
