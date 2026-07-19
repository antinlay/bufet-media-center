require "test_helper"

class VideoTranscodeJobTest < ActiveJob::TestCase
  test "creates a poster and playable mp4 for an uploaded video" do
    video = Video.create!(name: "Uploaded video", user: users(:admin))
    video.file.attach(
      io: StringIO.new("source video"),
      filename: "source.mp4",
      content_type: "video/mp4"
    )

    fake_ffmpeg = lambda do |*arguments|
      File.binwrite(arguments.last, "generated media")
      true
    end

    Supabase::Client.stub(:configured?, false) do
      VideoTranscodeJob.new.stub(:system, fake_ffmpeg) do |job|
        job.perform(video.id)
      end
    end

    video.reload
    assert video.poster.attached?
    assert video.mp4.attached?
  end
end
