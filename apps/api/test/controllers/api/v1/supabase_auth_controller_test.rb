require "test_helper"

class Api::V1::SupabaseAuthControllerTest < ActionDispatch::IntegrationTest
  setup do
    @base_url = "https://supabase.example.test"
    @kid = "test-signing-key"
    @private_key = OpenSSL::PKey::EC.generate("prime256v1")
    ENV["SUPABASE_URL"] = @base_url
    Supabase::Auth.instance_variable_set(:@jwks, nil)
    Supabase::Auth.instance_variable_set(:@jwks_expires_at, nil)
    stub_request(:get, "#{@base_url}/auth/v1/.well-known/jwks.json")
      .to_return(
        status: 200,
        body: { keys: [ JWT::JWK.new(@private_key, @kid).export ] }.to_json,
        headers: { "Content-Type" => "application/json" }
      )
  end

  teardown do
    ENV.delete("SUPABASE_URL")
    Supabase::Auth.instance_variable_set(:@jwks, nil)
    Supabase::Auth.instance_variable_set(:@jwks_expires_at, nil)
  end

  test "links a Supabase identity to an existing user by email" do
    user = users(:admin)
    assert_nil user.supabase_uid

    get "/api/v1/auth/me", headers: { "Authorization" => "Bearer #{supabase_token}" }

    assert_response :success
    assert_equal user.id, response.parsed_body.fetch("id")
    assert_equal "supabase-user-id", user.reload.supabase_uid
  end

  private

  def supabase_token
    JWT.encode(
      {
        "iss" => "#{@base_url}/auth/v1",
        "aud" => "authenticated",
        "sub" => "supabase-user-id",
        "email" => users(:admin).email,
        "exp" => 5.minutes.from_now.to_i
      },
      @private_key,
      "ES256",
      { "kid" => @kid }
    )
  end
end
