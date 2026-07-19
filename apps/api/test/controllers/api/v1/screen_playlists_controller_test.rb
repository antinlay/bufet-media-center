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

  test "keeps uploaded media out of the playlist until replace" do
    image = fixture_file_upload(file_fixture("one.jpg"), "image/jpeg")
    Supabase::Client.stub(:configured?, false) do
      post "/api/v1/contents", params: {
        type: "Graphic",
        name: "Draft image",
        duration: 15,
        image: image
      }, headers: @headers
    end
    assert_response :created
    content_id = response.parsed_body.fetch("id")

    get "/api/v1/screens/#{@screen.id}/playlist", headers: @headers
    assert_response :success
    assert_empty response.parsed_body.fetch("items")

    patch "/api/v1/screens/#{@screen.id}/playlist", params: {
      items: [ { content_id: content_id, display_duration_seconds: 25 } ]
    }, headers: @headers, as: :json
    assert_response :success
    assert_equal [ content_id ], response.parsed_body.fetch("items").map { |item| item.fetch("contentId") }
    assert_equal 25, response.parsed_body.dig("items", 0, "displayDurationSeconds")
    assert_equal 15, Content.find(content_id).duration
  end

  test "replaces the whole playlist and supports saving an empty playlist" do
    image = fixture_file_upload(file_fixture("one.jpg"), "image/jpeg")
    upload(type: "Graphic", name: "Uploaded image", field: :image, file: image)
    content_id = response.parsed_body.fetch("contentId")

    patch "/api/v1/screens/#{@screen.id}/playlist", params: { items: [] }, headers: @headers, as: :json
    assert_response :success
    assert_empty response.parsed_body.fetch("items")
    assert_not Content.exists?(content_id)
  end

  test "stores image display duration on the playlist item without changing media" do
    image = fixture_file_upload(file_fixture("one.jpg"), "image/jpeg")
    upload(type: "Graphic", name: "Timed image", field: :image, file: image)
    item = response.parsed_body
    content = Content.find(item.fetch("contentId"))

    patch "/api/v1/screens/#{@screen.id}/playlist/#{item.fetch("submissionId")}", params: {
      display_duration_seconds: 30
    }, headers: @headers, as: :json

    assert_response :success
    assert_equal 30, response.parsed_body.fetch("displayDurationSeconds")
    assert_equal 15, content.reload.duration
    assert_equal 30, Submission.find(item.fetch("submissionId")).display_duration_seconds
  end

  test "rejects display duration updates for video items" do
    upload(type: "Video", name: "Timed video", field: :video, file: video_upload)
    item = response.parsed_body

    patch "/api/v1/screens/#{@screen.id}/playlist/#{item.fetch("submissionId")}", params: {
      display_duration_seconds: 30
    }, headers: @headers, as: :json

    assert_response :unprocessable_entity
    assert_nil Submission.find(item.fetch("submissionId")).display_duration_seconds
  end

  test "validates image display duration range" do
    image = fixture_file_upload(file_fixture("one.jpg"), "image/jpeg")
    upload(type: "Graphic", name: "Timed image", field: :image, file: image)
    item = response.parsed_body

    patch "/api/v1/screens/#{@screen.id}/playlist/#{item.fetch("submissionId")}", params: {
      display_duration_seconds: 0
    }, headers: @headers, as: :json

    assert_response :unprocessable_entity
  end

  test "uploads a video to the media library without assigning it" do
    Supabase::Client.stub(:configured?, false) do
      post "/api/v1/contents", params: {
        type: "Video",
        name: "Draft video",
        video: video_upload
      }, headers: @headers
    end
    assert_response :created
    assert_equal "Video", response.parsed_body.fetch("type")
    assert response.parsed_body.fetch("url").present?

    get "/api/v1/screens/#{@screen.id}/playlist", headers: @headers
    assert_response :success
    assert_empty response.parsed_body.fetch("items")
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
