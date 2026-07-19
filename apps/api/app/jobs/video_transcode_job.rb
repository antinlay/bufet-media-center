class VideoTranscodeJob < ApplicationJob
  queue_as :default

  def perform(video_id)
    video = Video.find_by(id: video_id)
    return unless video&.file&.attached?

    tmp_mp4 = Tempfile.new([ "concerto-video-", ".mp4" ], binmode: true)
    tmp_poster = Tempfile.new([ "concerto-video-poster-", ".jpg" ], binmode: true)

    begin
      ffmpeg = ENV.fetch("FFMPEG_PATH", "ffmpeg")

      video.file.blob.open do |file|
        input = file.path

        poster_created = system(
          ffmpeg,
          "-y",
          "-ss", "00:00:01.000",
          "-i", input,
          "-frames:v", "1",
          "-q:v", "3",
          tmp_poster.path
        )
        raise "ffmpeg poster extraction failed" unless poster_created && File.size?(tmp_poster.path)

        video.poster.attach(
          io: File.open(tmp_poster.path),
          filename: "#{video.id}.jpg",
          content_type: "image/jpeg"
        )
        Supabase::Sync::Content.call(video) if Supabase::Client.configured?

        transcoded = system(
          ffmpeg,
          "-y",
          "-i", input,
          "-c:v", "libx264",
          "-preset", "veryfast",
          "-crf", "20",
          "-c:a", "aac",
          "-b:a", "128k",
          "-movflags", "+faststart",
          tmp_mp4.path
        )
        raise "ffmpeg video transcode failed" unless transcoded && File.size?(tmp_mp4.path)
      end

      video.mp4.attach(
        io: File.open(tmp_mp4.path),
        filename: "#{video.id}.mp4",
        content_type: "video/mp4"
      )

      Supabase::Sync::Content.call(video) if Supabase::Client.configured?
    rescue StandardError => e
      Rails.logger.error("Video transcode failed for Video #{video_id}: #{e.message}")
    ensure
      tmp_mp4.close!
      tmp_poster.close!
    end
  end
end
