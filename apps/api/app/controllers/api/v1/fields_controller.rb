class Api::V1::FieldsController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  after_action :verify_policy_scoped, only: :index

  def index
    fields = policy_scope(Field).order(:id)
    render json: fields.map { |field| serialize_field(field) }
  end
end
