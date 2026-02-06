class Api::V1::MembershipsController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  after_action :verify_authorized

  def create
    membership = Membership.new
    membership.assign_attributes(membership_params(membership))
    membership.group_id ||= params[:group_id]
    authorize membership

    if membership.save
      render json: serialize_membership(membership), status: :created
    else
      render json: { message: membership.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def update
    membership = Membership.find(params[:id])
    membership.assign_attributes(membership_params(membership))
    authorize membership

    if membership.save
      render json: serialize_membership(membership)
    else
      render json: { message: membership.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    membership = Membership.find(params[:id])
    authorize membership

    membership.destroy
    head :no_content
  end

  private

  def membership_params(record)
    payload = params[:membership].presence || params
    payload.permit(policy(record).permitted_attributes)
  end
end
