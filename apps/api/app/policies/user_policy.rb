class UserPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.none unless user
      return scope.all if user.system_admin?

      shared_group_ids = Group.visible_to(user).select(:id)
      shared_user_ids = Membership.where(group_id: shared_group_ids).select(:user_id)

      scope.where(id: shared_user_ids).or(scope.where(id: user.id)).distinct
    end
  end

  def index?
    # Everyone who's signed in can view the list of users
    user.present?
  end

  def show?
    user.present?
  end

  def tenant_show?
    system_admin_only || can_view_user?
  end

  def new?
    # Defer to Devise for user creation
    true
  end

  def create?
    # Defer to Devise for user creation
    true
  end

  def edit?
    super || can_edit_user?
  end

  def update?
    super || can_edit_user?
  end

  def destroy?
    super || can_edit_user?
  end

  # System admins can create users through the admin interface
  def admin_create?
    system_admin_only
  end

  # System admins can manage other users (not themselves or system users)
  def admin_manage?
    user&.system_admin? && user != record && !record.is_system_user
  end

  private

  def can_view_user?
    return false unless user
    return true if user.id == record.id

    Group.visible_to(user).any? { |group| group.member?(record) }
  end

  # A user may only update themselves (system admins can manage anyone via super)
  def can_edit_user?
    return false unless user
    user.id == record.id
  end
end
