require "test_helper"

class Api::Player::ConfigControllerTest < ActionDispatch::IntegrationTest
  setup do
    @device = PlayerDevice.create!(
      device_id: "android-tv-player",
      screen: screens(:one)
    )
    @manifest = {
      playlist: {
        items: [
          {
            id: "00000000-0000-0000-0000-000000000001",
            playlistId: "00000000-0000-0000-0000-000000000002",
            type: "IMAGE",
            url: "https://example.test/image.jpg",
            order: 0
          }
        ]
      },
      settings: {
        screen_id: @device.screen_id,
        config_version: "test-version"
      }
    }
  end

  test "manifest defaults to json when native client omits accept header" do
    Supabase::Manifest.stub(:for_device, @manifest) do
      get "/api/player/manifest", params: { deviceId: @device.device_id }
    end

    assert_response :success
    assert_equal "application/json", response.media_type
    assert_equal @manifest.deep_stringify_keys, response.parsed_body
  end
end
