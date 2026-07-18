require "test_helper"

class SupabaseSyncTest < ActiveSupport::TestCase
  test "screen sync detaches a reassigned player device from another screen" do
    screen = screens(:one)
    screen.create_player_device!(device_id: "reassigned-device")
    request = nil

    Supabase::Client.stub(:patch, ->(table, body, params:) {
      request = { table: table, body: body, params: params }
    }) do
      Supabase::Sync::Screen.new(screen).send(:detach_reassigned_device!)
    end

    assert_equal "screens", request[:table]
    assert_nil request.dig(:body, :player_device_id)
    assert_equal "eq.reassigned-device", request.dig(:params, "player_device_id")
    assert_equal [ "player_device_id" ], request[:params].keys
  end

  test "manifest scopes the device lookup to the current Rails screen" do
    lookup = nil

    Supabase::Client.stub(:configured?, true) do
      Supabase::Client.stub(:get, ->(table, params:) {
        lookup = { table: table, params: params }
        []
      }) do
        assert_nil Supabase::Manifest.for_device("player-device", screen_id: 42)
      end
    end

    assert_equal "screens", lookup[:table]
    assert_equal "eq.player-device", lookup.dig(:params, "player_device_id")
    assert_equal "eq.42", lookup.dig(:params, "legacy_id")
  end
end
