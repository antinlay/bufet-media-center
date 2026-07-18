require "test_helper"

class Api::V1::ScreenPlaylistsControllerTest < ActionDispatch::IntegrationTest
  setup do
    post "/api/v1/auth/login", params: {
      email: users(:admin).email,
      password: "password123"
    }, as: :json
    @headers = { "Authorization" => "Bearer #{response.parsed_body.fetch("access_token")}" }
    @screen = screens(:one)
  end

  test "uploads image and video into the current screen playlist in server order" do
    image = fixture_file_upload(file_fixture("one.jpg"), "image/jpeg")
    upload(type: "Graphic", name: "Uploaded image", field: :image, file: image)
    image_item = response.parsed_body

    video = video_upload
    upload(type: "Video", name: "Uploaded video", field: :video, file: video)
    video_item = response.parsed_body

    assert_not_equal image_item.fetch("submissionId"), video_item.fetch("submissionId")
    assert_equal "Graphic", image_item.fetch("type")
    assert_equal "Video", video_item.fetch("type")

    patch "/api/v1/screens/#{@screen.id}/playlist/reorder", params: {
      submission_ids: [ video_item.fetch("submissionId"), image_item.fetch("submissionId") ]
    }, headers: @headers, as: :json
    assert_response :success

    get "/api/v1/screens/#{@screen.id}/playlist", headers: @headers
    assert_response :success
    assert_equal(
      [ video_item.fetch("contentId"), image_item.fetch("contentId") ],
      response.parsed_body.fetch("items").map { |item| item.fetch("contentId") }
    )
  end

  private

  def video_upload
    Rack::Test::UploadedFile.new(
      StringIO.new([ "00000018667479706d703432000000006d70343269736f6d" ].pack("H*")),
      "video/mp4",
      true,
      original_filename: "uploaded-video.mp4"
    )
  end

  def upload(type:, name:, field:, file:)
    Supabase::Client.stub(:configured?, false) do
      post "/api/v1/screens/#{@screen.id}/playlist", params: {
        type: type,
        name: name,
        field => file
      }, headers: @headers
    end
    assert_response :created
  end
end
