require "base64"
require "openssl"

class Api::V1::BaseController < ActionController::API
  class JwtError < StandardError; end

  include Pundit::Authorization

  before_action :authenticate_api_user!

  rescue_from ActiveRecord::RecordNotFound, with: :not_found
  rescue_from Pundit::NotAuthorizedError, with: :forbidden
  rescue_from JwtError, with: :unauthorized

  private

  def authenticate_api_user!
    return if current_user

    render json: { error: "Unauthorized" }, status: :unauthorized
  end

  def current_user
    return @current_user if defined?(@current_user)

    token = bearer_token
    @current_user = token ? user_from_token(token) : nil
  end

  def bearer_token
    header = request.headers["Authorization"].to_s
    return nil unless header.start_with?("Bearer ")

    header.delete_prefix("Bearer ").strip
  end

  def user_from_token(token)
    if supabase_token?(token)
      user_from_supabase_token(token)
    else
      payload = decode_jwt(token)
      User.find_by(id: payload["sub"])
    end
  rescue Supabase::Auth::InvalidToken, ActiveRecord::RecordInvalid => error
    raise JwtError, error.message
  end

  def supabase_token?(token)
    header_segment = token.to_s.split(".").first
    return false if header_segment.blank?

    header = JSON.parse(Base64.urlsafe_decode64(header_segment))
    header["alg"] == "ES256"
  rescue ArgumentError, JSON::ParserError
    false
  end

  def user_from_supabase_token(token)
    payload = Supabase::Auth.verify!(token)
    supabase_uid = payload.fetch("sub")
    email = payload["email"].to_s.downcase.presence
    raise JwtError, "Supabase token has no email" unless email

    user = User.find_by(supabase_uid: supabase_uid) || User.where("LOWER(email) = ?", email).first
    if user
      if user.supabase_uid.present? && user.supabase_uid != supabase_uid
        raise JwtError, "Supabase identity is already linked to another user"
      end

      user.update!(supabase_uid: supabase_uid) if user.supabase_uid.blank?
      return user
    end

    metadata = payload["user_metadata"].is_a?(Hash) ? payload["user_metadata"] : {}
    User.create!(
      email: email,
      supabase_uid: supabase_uid,
      first_name: metadata["first_name"].presence || email.split("@").first,
      last_name: metadata["last_name"].presence || "User"
    )
  end

  def jwt_secret
    Rails.application.secret_key_base
  end

  def jwt_for(user)
    encode_jwt({ sub: user.id, exp: 24.hours.from_now.to_i })
  end

  def encode_jwt(payload)
    header = { alg: "HS256", typ: "JWT" }
    segments = [ header, payload ].map { |part| base64_url_encode(part.to_json) }
    signing_input = segments.join(".")
    signature = base64_url_encode(OpenSSL::HMAC.digest("sha256", jwt_secret, signing_input))
    [ signing_input, signature ].join(".")
  end

  def decode_jwt(token)
    header_segment, payload_segment, signature_segment = token.to_s.split(".")
    raise JwtError, "Invalid token" if [ header_segment, payload_segment, signature_segment ].any?(&:blank?)

    signing_input = [ header_segment, payload_segment ].join(".")
    expected_signature = base64_url_encode(OpenSSL::HMAC.digest("sha256", jwt_secret, signing_input))
    unless ActiveSupport::SecurityUtils.secure_compare(expected_signature, signature_segment)
      raise JwtError, "Invalid signature"
    end

    payload = JSON.parse(base64_url_decode(payload_segment))
    if payload["exp"].present? && Time.at(payload["exp"]).past?
      raise JwtError, "Token expired"
    end
    payload
  end

  def base64_url_encode(input)
    Base64.urlsafe_encode64(input, padding: false)
  end

  def base64_url_decode(input)
    Base64.urlsafe_decode64(input.to_s)
  end

  def not_found
    render json: { error: "Not found" }, status: :not_found
  end

  def forbidden
    render json: { error: "Forbidden" }, status: :forbidden
  end

  def unauthorized
    render json: { error: "Unauthorized" }, status: :unauthorized
  end
end
