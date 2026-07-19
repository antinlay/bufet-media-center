require "test_helper"

class Supabase::AuthTest < ActiveSupport::TestCase
  setup do
    @base_url = "https://supabase.example.test"
    @kid = "test-signing-key"
    @private_key = OpenSSL::PKey::EC.generate("prime256v1")
    @jwks = { keys: [ JWT::JWK.new(@private_key, @kid).export ] }
    ENV["SUPABASE_URL"] = @base_url
    Supabase::Auth.instance_variable_set(:@jwks, nil)
    Supabase::Auth.instance_variable_set(:@jwks_expires_at, nil)
  end

  teardown do
    ENV.delete("SUPABASE_URL")
    Supabase::Auth.instance_variable_set(:@jwks, nil)
    Supabase::Auth.instance_variable_set(:@jwks_expires_at, nil)
  end

  test "verifies an ES256 Supabase token against the project's JWKS" do
    stub_jwks
    token = supabase_token

    payload = Supabase::Auth.verify!(token)

    assert_equal "supabase-user-id", payload.fetch("sub")
    assert_equal "authenticated", payload.fetch("aud")
  end

  test "rejects a token signed with a different key" do
    stub_jwks
    invalid_key = OpenSSL::PKey::EC.generate("prime256v1")
    token = JWT.encode(supabase_claims, invalid_key, "ES256", { "kid" => @kid })

    assert_raises(Supabase::Auth::InvalidToken) { Supabase::Auth.verify!(token) }
  end

  private

  def stub_jwks
    stub_request(:get, "#{@base_url}/auth/v1/.well-known/jwks.json")
      .to_return(status: 200, body: @jwks.to_json, headers: { "Content-Type" => "application/json" })
  end

  def supabase_claims
    {
      "iss" => "#{@base_url}/auth/v1",
      "aud" => "authenticated",
      "sub" => "supabase-user-id",
      "email" => "admin@example.com",
      "exp" => 5.minutes.from_now.to_i,
      "user_metadata" => { "first_name" => "Admin", "last_name" => "User" }
    }
  end

  def supabase_token
    JWT.encode(supabase_claims, @private_key, "ES256", { "kid" => @kid })
  end
end
