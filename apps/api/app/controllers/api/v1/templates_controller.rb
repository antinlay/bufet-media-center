class Api::V1::TemplatesController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  after_action :verify_authorized, except: :index
  after_action :verify_policy_scoped, only: :index

  def index
    templates = policy_scope(Template).includes(:positions, image_attachment: :blob).order(updated_at: :desc)
    render json: templates.map { |template| serialize_template(template) }
  end

  def show
    template = Template.includes(:positions, image_attachment: :blob).find(params[:id])
    authorize template
    render json: serialize_template(template)
  end

  def create
    template = Template.new(template_params)
    authorize template

    if template.save
      render json: serialize_template(template), status: :created
    else
      render json: { message: template.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def update
    template = Template.find(params[:id])
    authorize template

    if template.update(template_params)
      render json: serialize_template(template)
    else
      render json: { message: template.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    template = Template.find(params[:id])
    authorize template

    template.destroy
    head :no_content
  end

  private

  def template_params
    payload = params[:template].presence || params
    payload.permit(:name, :author, :image, positions_attributes: [ :id, :top, :left, :bottom, :right, :style, :field_id, :_destroy ])
  end
end
