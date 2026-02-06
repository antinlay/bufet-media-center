class Api::V1::SubmissionsController < Api::V1::BaseController
  include Api::V1::ConcertoSerializer

  after_action :verify_authorized, except: :index
  after_action :verify_policy_scoped, only: :index

  def index
    submissions = policy_scope(Submission).includes(:content, :feed)
    render json: submissions.order(created_at: :desc).map { |submission| serialize_submission(submission) }
  end

  def create
    submission = Submission.new(submission_params)
    authorize submission

    if submission.save
      render json: serialize_submission(submission), status: :created
    else
      render json: { message: submission.errors.full_messages.to_sentence }, status: :unprocessable_entity
    end
  end

  def destroy
    submission = Submission.find(params[:id])
    authorize submission

    submission.destroy
    head :no_content
  end

  private

  def submission_params
    payload = params[:submission].presence || params
    payload.permit(:content_id, :feed_id)
  end
end
