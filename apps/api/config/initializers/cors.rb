require "rack/cors"

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins do |origin, _env|
      allowed = [
        ENV["CONCERTO_ALLOWED_ORIGINS"],
        ENV["CONCERTO_DASHBOARD_URL"],
        ENV["DASHBOARD_BASE_URL"]
      ].compact.flat_map { |value| value.split(",") }.map(&:strip).reject(&:empty?)
      allowed.include?(origin)
    end

    resource "/api/*",
      headers: :any,
      methods: %i[get post patch put delete options],
      expose: [ "Authorization" ]
  end

  if Rails.env.development?
    allow do
      origins "*"
      resource "/api/*",
        headers: :any,
        methods: %i[get post patch put delete options],
        expose: [ "Authorization" ]
    end
  end
end
