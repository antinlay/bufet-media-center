class Api::V1::AuthController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  skip_before_action :authenticate_api_user!, only: %i[login register]

  def login
    credentials = params[:user].presence || params
    user = User.find_by(email: credentials[:email].to_s.downcase)
    if user&.valid_password?(credentials[:password].to_s)
      render json: auth_payload(user)
    else
      render json: { message: "Invalid credentials" }, status: :unauthorized
    end
  end

  def register
    user = User.new(register_params)
    if user.save
      render json: auth_payload(user), status: :created
    else
      render json: { message: user.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def me
    render json: serialize_user(current_user)
  end

  private

  def register_params
    payload = params[:user].presence || params
    payload.permit(:email, :password, :first_name, :last_name)
  end

  def auth_payload(user)
    {
      access_token: jwt_for(user),
      user: serialize_user(user)
    }
  end
end
