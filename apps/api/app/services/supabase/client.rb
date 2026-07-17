require "json"
require "net/http"
require "uri"

module Supabase
  class Client
    class Error < StandardError
      attr_reader :status, :response_body

      def initialize(message, status: nil, response_body: nil)
        @status = status
        @response_body = response_body
        super(message)
      end
    end

    class << self
      def configured?
        base_url.present? && service_key.present?
      end

      def get(table, params: {})
        request(:get, "/rest/v1/#{table}", params: params)
      end

      def post(table, body, params: {}, headers: {})
        request(:post, "/rest/v1/#{table}", params: params, body: body, headers: headers)
      end

      def patch(table, body, params: {}, headers: {})
        request(:patch, "/rest/v1/#{table}", params: params, body: body, headers: headers)
      end

      def delete(table, params: {})
        request(:delete, "/rest/v1/#{table}", params: params)
      end

      def upsert(table, records, conflict:)
        post(
          table,
          records,
          params: { on_conflict: conflict },
          headers: { "Prefer" => "resolution=merge-duplicates,return=representation" }
        )
      end

      def upload_object(bucket, path, body, content_type: "application/octet-stream")
        request(
          :post,
          "/storage/v1/object/#{escape_path(bucket)}/#{escape_path(path)}",
          body: body,
          raw_body: true,
          headers: {
            "Content-Type" => content_type,
            "x-upsert" => "true"
          }
        )
      end

      def create_signed_url(bucket, path, expires_in:)
        response = request(
          :post,
          "/storage/v1/object/sign/#{escape_path(bucket)}/#{escape_path(path)}",
          body: { expiresIn: expires_in }
        )
        signed_path = response.is_a?(Hash) ? response["signedURL"] : nil
        return nil if signed_path.blank?

        signed_path.start_with?("http") ? signed_path : "#{base_url}#{signed_path}"
      end

      private

      def base_url
        ENV["SUPABASE_URL"].presence || ENV["SUPABASE_PROJECT_URL"].presence
      end

      def service_key
        ENV["SUPABASE_SERVICE_ROLE_KEY"].presence || ENV["SUPABASE_SECRET_KEY"].presence
      end

      def escape_path(value)
        value.to_s.split("/").map { |part| ERB::Util.url_encode(part) }.join("/")
      end

      def request(method, path, params: {}, body: nil, raw_body: false, headers: {})
        raise Error, "Supabase is not configured" unless configured?

        uri = URI("#{base_url}#{path}")
        query = params.to_h.map { |key, value| [ key, value ] }
        uri.query = URI.encode_www_form(query) if query.any?
        http = Net::HTTP.new(uri.host, uri.port)
        http.use_ssl = uri.scheme == "https"
        request_class = { get: Net::HTTP::Get, post: Net::HTTP::Post, patch: Net::HTTP::Patch, delete: Net::HTTP::Delete }.fetch(method)
        request = request_class.new(uri)
        request["apikey"] = service_key
        request["Authorization"] = "Bearer #{service_key}"
        request["Accept"] = "application/json"
        headers.each { |key, value| request[key] = value }

        if body
          if raw_body
            request.body = body
          else
            request["Content-Type"] ||= "application/json"
            request.body = JSON.generate(body)
          end
        end

        response = http.request(request)
        parsed = parse_body(response.body)
        return parsed if response.is_a?(Net::HTTPSuccess)

        Rails.logger.warn("Supabase request failed: #{method.to_s.upcase} #{path} (#{response.code})")
        raise Error.new(
          "Supabase request failed",
          status: response.code.to_i,
          response_body: parsed
        )
      rescue SocketError, Timeout::Error, Errno::ECONNREFUSED, Net::OpenTimeout, Net::ReadTimeout => error
        Rails.logger.warn("Supabase network request failed: #{error.class}")
        raise Error, "Supabase network request failed"
      end

      def parse_body(body)
        return nil if body.blank?

        JSON.parse(body)
      rescue JSON::ParserError
        body
      end
    end
  end
end
