require "json"
require "net/http"
require "uri"
require "jwt"

module Supabase
  class Auth
    class InvalidToken < StandardError; end

    CACHE_TTL = 10.minutes
    REQUEST_TIMEOUT = 5

    class << self
      def verify!(token)
        raise InvalidToken, "Supabase URL is not configured" if base_url.blank?

        payload, = JWT.decode(
          token,
          nil,
          true,
          algorithms: [ "ES256" ],
          jwks: ->(options) { jwks(options) },
          verify_iss: true,
          iss: issuer,
          verify_aud: true,
          aud: "authenticated",
          required_claims: [ "exp", "iss", "sub" ]
        )

        payload
      rescue JWT::DecodeError, JWT::VerificationError, JSON::ParserError, SocketError,
             Timeout::Error, Errno::ECONNREFUSED, Net::OpenTimeout, Net::ReadTimeout => error
        Rails.logger.warn("Supabase auth token verification failed: #{error.class}")
        raise InvalidToken, "Invalid Supabase access token"
      end

      private

      def base_url
        ENV["SUPABASE_URL"].presence || ENV["SUPABASE_PROJECT_URL"].presence
      end

      def issuer
        "#{base_url.to_s.chomp("/")}/auth/v1"
      end

      def jwks(options = {})
        force_refresh = options[:invalidate] == true
        return @jwks if !force_refresh && @jwks_expires_at.to_f > Time.current.to_f

        uri = URI("#{issuer}/.well-known/jwks.json")
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        http.open_timeout = REQUEST_TIMEOUT
        http.read_timeout = REQUEST_TIMEOUT

        request = Net::HTTP::Get.new(uri)
        request["Accept"] = "application/json"
        response = http.request(request)
        raise InvalidToken, "Supabase JWKS request failed" unless response.is_a?(Net::HTTPSuccess)

        parsed = JSON.parse(response.body)
        raise InvalidToken, "Supabase JWKS response is invalid" unless parsed.is_a?(Hash) && parsed["keys"].is_a?(Array)

        @jwks = parsed
        @jwks_expires_at = Time.current + CACHE_TTL
        @jwks
      end
    end
  end
end
