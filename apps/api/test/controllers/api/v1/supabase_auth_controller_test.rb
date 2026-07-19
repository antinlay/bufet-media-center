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

  test "creates a local user for a new Supabase identity" do
    email = "new-supabase-user@example.test"

    get "/api/v1/auth/me", headers: { "Authorization" => "Bearer #{supabase_token(email:, uid: "new-supabase-user-id", metadata: { "first_name" => "New", "last_name" => "User" })}" }

    assert_response :success
    user = User.find_by!(email:)
    assert_equal user.id, response.parsed_body.fetch("id")
    assert_equal "new-supabase-user-id", user.supabase_uid
    assert_equal "New", user.first_name
    assert_equal "User", user.last_name
    assert user.encrypted_password.present?
  end

  private

  def supabase_token(email: users(:admin).email, uid: "supabase-user-id", metadata: {})
    JWT.encode(
      {
        "iss" => "#{@base_url}/auth/v1",
        "aud" => "authenticated",
        "sub" => uid,
        "email" => email,
        "user_metadata" => metadata,
        "exp" => 5.minutes.from_now.to_i
      },
      @private_key,
      "ES256",
      { "kid" => @kid }
    )
  end
end
