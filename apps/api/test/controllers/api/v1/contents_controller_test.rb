require "test_helper"

class Api::V1::ContentsControllerTest < ActionDispatch::IntegrationTest
  test "deletes synced playlist items and media before Rails content" do
    content = graphics(:two)
    media_id = "00000000-0000-0000-0000-000000000001"
    calls = []

    Supabase::Client.stub(:configured?, true) do
      Supabase::Client.stub(:get, ->(table, params:) {
        calls << [ :get, table, params ]
        [ { "id" => media_id } ]
      }) do
        Supabase::Client.stub(:delete, ->(table, params:) {
          calls << [ :delete, table, params ]
          []
        }) do
          assert_difference("Content.count", -1) do
            delete "/api/v1/contents/#{content.id}", headers: auth_headers(users(:admin))
          end
        end
      end
    end

    assert_response :no_content
    assert_equal [
      [ :get, "media", { "select" => "id", "legacy_id" => "eq.#{content.id}", "limit" => "1" } ],
      [ :delete, "playlist_items", { "media_id" => "eq.#{media_id}" } ],
      [ :delete, "media", { "id" => "eq.#{media_id}" } ]
    ], calls
  end

  test "deletes Rails content when no synced Supabase media exists" do
    content = graphics(:two)
    calls = []

    Supabase::Client.stub(:configured?, true) do
      Supabase::Client.stub(:get, ->(table, params:) {
        calls << [ :get, table, params ]
        []
      }) do
        Supabase::Client.stub(:delete, ->(*) { calls << :delete }) do
          assert_difference("Content.count", -1) do
            delete "/api/v1/contents/#{content.id}", headers: auth_headers(users(:admin))
          end
        end
      end
    end

    assert_response :no_content
    assert_equal [ [ :get, "media", { "select" => "id", "legacy_id" => "eq.#{content.id}", "limit" => "1" } ] ], calls
  end

  test "keeps Rails content when Supabase deletion fails" do
    content = graphics(:two)
    supabase_error = Supabase::Client::Error.new(
      "Supabase request failed",
      status: 409,
      response_body: { "code" => "23503" }
    )

    Supabase::Client.stub(:configured?, true) do
      Supabase::Client.stub(:get, [ { "id" => "00000000-0000-0000-0000-000000000001" } ]) do
        Supabase::Client.stub(:delete, ->(*) { raise supabase_error }) do
          assert_no_difference("Content.count") do
            delete "/api/v1/contents/#{content.id}", headers: auth_headers(users(:admin))
          end
        end
      end
    end

    assert_response :bad_gateway
    assert_equal "Media synchronization failed", response.parsed_body.fetch("message")
    assert Content.exists?(content.id)
  end

  test "does not allow another user to delete content" do
    content = graphics(:one)

    assert_no_difference("Content.count") do
      delete "/api/v1/contents/#{content.id}", headers: auth_headers(users(:non_member))
    end

    assert_response :forbidden
  end

  private

  def auth_headers(user)
    post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
    assert_response :success
    { "Authorization" => "Bearer #{response.parsed_body.fetch("access_token")}" }
  end
end
