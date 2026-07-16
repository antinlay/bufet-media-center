class Api::V1::GroupsController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  after_action :verify_authorized, except: :index
  after_action :verify_policy_scoped, only: :index

  def index
    groups = policy_scope(Group).includes(:users)
    render json: groups.order(:name).map { |group| serialize_group(group) }
  end

  def show
    group = Group.find(params[:id])
    authorize group
    render json: serialize_group(group)
  end

  def create
    group = Group.new(group_params)
    authorize group

    if group.save
      render json: serialize_group(group), status: :created
    else
      render json: { message: group.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def update
    group = Group.find(params[:id])
    authorize group

    if group.update(group_params)
      render json: serialize_group(group)
    else
      render json: { message: group.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    group = Group.find(params[:id])
    authorize group

    if group.destroy
      head :no_content
    else
      render json: { message: group.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  private

  def group_params
    payload = params[:group].presence || params
    payload.permit(:name, :description, :parent_id)
  end
end
