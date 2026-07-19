class SubmissionPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all unless user
      return scope.all if user.system_admin?

      visible_feed_ids = FeedPolicy::Scope.new(user, Feed.all).resolve.select(:id)
      visible_content_ids = ContentPolicy::Scope.new(user, Content.all).resolve.select(:id)
      scope.where(feed_id: visible_feed_ids).or(scope.where(content_id: visible_content_ids)).distinct
    end
  end

  def index?
    true
  end

  def show?
    true
  end

  def new?
    super || can_create_submission?
  end

  def create?
    super || can_create_submission?
  end

  def edit?
    # Submissions cannot be updated yet (reserved for future moderation)
    super
  end

  def update?
    # Submissions cannot be updated yet (reserved for future moderation)
    super
  end

  def destroy?
    super || can_destroy_submission?
  end

  private

  def can_view_submission?
    return false unless user
    return true if record.content&.user_id == user.id

    record.feed&.group&.member?(user) && !record.feed.group.system_group?
  end

  # Only the owner of a piece of content can create a submission
  def can_create_submission?
    return false unless user
    # For class-level checks (e.g., policy(Submission).create?), allow signed-in users
    return true if record.is_a?(Class)
    # For new records without content selected yet, allow signed-in users to access the form
    return true if record.new_record? && record.content.nil?
    return false unless record.content&.user_id == user.id
    return true unless record.feed

    record.feed.group.member?(user) && !record.feed.group.system_group?
  end

  # Submissions may be deleted by the owner of the piece of content
  def can_destroy_submission?
    return false unless user
    return false unless record.content.user_id == user.id

    record.feed.group.member?(user) && !record.feed.group.system_group?
  end
end
