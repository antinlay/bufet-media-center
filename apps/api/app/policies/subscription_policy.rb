class SubscriptionPolicy < ApplicationPolicy
  class Scope < ApplicationPolicy::Scope
    def resolve
      return scope.all unless user

      visible_screen_ids = ScreenPolicy::Scope.new(user, Screen.all).resolve.select(:id)
      scope.where(screen_id: visible_screen_ids)
    end
  end

  def index?
    true
  end

  def show?
    true
  end

  def new?
    super || member_of_screen_group?
  end

  def create?
    super || member_of_screen_group?
  end

  def update?
    super || member_of_screen_group?
  end

  def destroy?
    super || member_of_screen_group?
  end

  private

  def member_of_screen_group?
    return false unless user

    record.screen.group.member?(user) && !record.screen.group.system_group?
  end
end
