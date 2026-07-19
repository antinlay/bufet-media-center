require "test_helper"

class ConcertoSerializerTest < ActiveSupport::TestCase
  class Serializer
    include Api::V1::ConcertoSerializer

    def default_url_options
      { host: "example.test" }
    end
  end

  test "playlist graphics prefer the synced Supabase thumbnail" do
    serializer = Serializer.new
    submission = submissions(:one)

    Supabase::Client.stub(:configured?, true) do
      Supabase::Client.stub(:get, [ { "storage_path" => "media/graphic/1/original.jpg", "thumbnail_path" => "media/graphic/1/thumbnail.jpg" } ]) do
        Supabase::MediaStore.stub(:signed_url, ->(path) { "https://storage.example/#{path}" }) do
          item = serializer.serialize_playlist_item(submission)

          assert_equal "https://storage.example/media/graphic/1/original.jpg", item[:mediaUrl]
          assert_equal "https://storage.example/media/graphic/1/thumbnail.jpg", item[:thumbnailUrl]
        end
      end
    end
  end

  test "graphic library entries prefer the synced Supabase URLs" do
    serializer = Serializer.new
    graphic = submissions(:one).content

    Supabase::Client.stub(:configured?, true) do
      Supabase::Client.stub(:get, [ { "storage_path" => "media/graphic/1/original.jpg", "thumbnail_path" => "media/graphic/1/thumbnail.jpg" } ]) do
        Supabase::MediaStore.stub(:signed_url, ->(path) { "https://storage.example/#{path}" }) do
          content = serializer.serialize_content(graphic)

          assert_equal "https://storage.example/media/graphic/1/original.jpg", content[:imageUrl]
          assert_equal "https://storage.example/media/graphic/1/thumbnail.jpg", content[:thumbnailUrl]
        end
      end
    end
  end

  test "playlist graphics fall back to the Rails blob URL without Supabase" do
    serializer = Serializer.new

    Supabase::Client.stub(:configured?, false) do
      item = serializer.serialize_playlist_item(submissions(:one))

      assert_match %r{\A/rails/active_storage/blobs/redirect/}, item[:mediaUrl]
      assert_equal item[:mediaUrl], item[:thumbnailUrl]
    end
  end

  test "video library entries use persistent Supabase media and poster URLs" do
    serializer = Serializer.new
    video = videos(:video_youtube)

    Supabase::Client.stub(:configured?, true) do
      Supabase::Client.stub(:get, [ { "storage_path" => "media/video/1/original.mp4", "thumbnail_path" => "media/video/1/poster.jpg" } ]) do
        Supabase::MediaStore.stub(:signed_url, ->(path) { "https://storage.example/#{path}" }) do
          content = serializer.serialize_content(video)

          assert_equal "https://storage.example/media/video/1/original.mp4", content[:url]
          assert_equal "https://storage.example/media/video/1/poster.jpg", content[:thumbnailUrl]
        end
      end
    end
  end
end
