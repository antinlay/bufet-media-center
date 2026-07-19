class GroupPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless user
      return scope.all if user.system_admin?

      scope.where(id: Group.visible_to(user).select(:id))
    end
  end

  def index?
    # Only signed-in users can see the list
    user.present?
  end

  def show?
    super || can_view_group?
  end

  def new?
    super || can_create_group?
  end

  def create?
    super || can_create_group?
  end

  def edit?
    super || can_update_group?
  end

  def update?
    super || can_update_group?
  end

  def destroy?
    super || can_manage_group?
  end

  private

  def can_view_group?
    return false unless user
    return false if record.system_group?

    record.member?(user)
  end

  def can_create_group?
    return false unless user
    return true if record.is_a?(Class)
    return false if record.system_group?

    record.parent.nil? || record.parent.admin?(user)
  end

  def can_update_group?
    return false unless can_manage_group?
    return true unless record.parent_id_changed?

    record.parent.nil? || record.parent.admin?(user)
  end

  def can_manage_group?
    return false unless user
    return false if record.system_group?

    record.admin?(user)
  end
end
