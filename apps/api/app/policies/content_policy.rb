class ContentPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all unless user
      return scope.all if user.system_admin?

      visible_group_ids = Group.visible_to(user).select(:id)
      shared_content_ids = scope
        .joins(submissions: :feed)
        .where(feeds: { group_id: visible_group_ids })
        .select(:id)

      scope.where(user_id: user.id).or(scope.where(id: shared_content_ids)).distinct
    end
  end

  def index?
    true
  end

  def show?
    true
  end

  def tenant_show?
    system_admin_only || can_view_content?
  end

  def new?
    super || can_create_content?
  end

  def create?
    super || can_create_content?
  end

  def edit?
    super || can_edit_content?
  end

  def update?
    super || can_edit_content?
  end

  def destroy?
    super || can_edit_content?
  end

  private

  def can_view_content?
    return false unless user
    return true if record.user_id == user.id

    Group.visible_to(user).where(id: record.feeds.select(:group_id)).exists?
  end

  # All signed-in users can create content
  def can_create_content?
    user.present?
  end

  # Content can only be updated/destroyed by the owner
  def can_edit_content?
    return false unless user
    record.user_id == user.id
  end

  public

  def permitted_attributes
    [ :name, :duration, :start_time, :end_time, { feed_ids: [] } ]
  end
end
