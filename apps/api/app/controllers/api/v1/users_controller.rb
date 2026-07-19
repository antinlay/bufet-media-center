class Api::V1::UsersController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  after_action :verify_authorized, except: :index
  after_action :verify_policy_scoped, only: :index

  def index
    users = policy_scope(User).includes(:memberships, :groups)
    render json: users.order(:email).map { |user| serialize_user(user) }
  end

  def show
    user = User.includes(:memberships, :groups).find(params[:id])
    authorize user, :tenant_show?
    render json: serialize_user(user)
  end

  def destroy
    user = User.find(params[:id])
    authorize user
    user.destroy
    head :no_content
  end
end
