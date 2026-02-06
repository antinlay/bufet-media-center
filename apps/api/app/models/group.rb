class Group < ApplicationRecord
  REGISTERED_USERS_GROUP_NAME = "All Registered Users".freeze
  SYSTEM_ADMIN_GROUP_NAME = "System Administrators".freeze
  SYSTEM_GROUP_NAMES = [ REGISTERED_USERS_GROUP_NAME, SYSTEM_ADMIN_GROUP_NAME ].freeze

  belongs_to :parent, class_name: "Group", optional: true
  has_many :children, class_name: "Group", foreign_key: :parent_id, dependent: :nullify

  has_many :memberships, dependent: :destroy
  has_many :users, through: :memberships

  # Models that groups own or manage.
  has_many :screens, dependent: :destroy
  has_many :feeds, dependent: :destroy

  validates :name, presence: true, uniqueness: true
  validate :parent_cannot_be_self_or_descendant
  validate :system_group_cannot_be_child

  # Prevent deletion of system groups
  before_destroy :cannot_destroy_system_group

  # Prevent renaming of system groups
  before_validation :cannot_rename_system_group

  # Finds all users in this group who are admins.
  def admins
    users.merge(Membership.admin)
  end

  # Finds all users in this group who are regular members.
  def members
    users.merge(Membership.member)
  end

  # Check if a user is a member of the group.
  def member?(user)
    return false unless user
    Group.joins(:memberships)
      .where(id: self_and_ancestor_ids, memberships: { user_id: user.id })
      .exists?
  end

  # Check if a user is an admin of the group.
  def admin?(user)
    return false unless user
    Group.joins(:memberships)
      .merge(Membership.admin)
      .where(id: self_and_ancestor_ids, memberships: { user_id: user.id })
      .exists?
  end

  def ancestors
    nodes = []
    current = parent
    while current
      nodes << current
      current = current.parent
    end
    nodes
  end

  def descendants
    children.flat_map { |child| [ child ] + child.descendants }
  end

  def self_and_ancestor_ids
    [ id ] + ancestors.map(&:id)
  end

  # Class method to easily find the all users group.
  def self.all_users_group
    find_by(name: REGISTERED_USERS_GROUP_NAME)
  end

  # Class method to easily find the system administrators group.
  def self.system_admins_group
    find_by(name: SYSTEM_ADMIN_GROUP_NAME)
  end

  # Check if this is a system group
  def system_group?
    name.in?(SYSTEM_GROUP_NAMES)
  end

  # Check if this is the system administrators group
  def system_admin_group?
    name == SYSTEM_ADMIN_GROUP_NAME
  end

  private

  def cannot_destroy_system_group
    if system_group?
      errors.add(:base, "Cannot delete system groups")
      throw(:abort)
    end
  end

  def cannot_rename_system_group
    if name_changed? && name_was.in?(SYSTEM_GROUP_NAMES)
      errors.add(:name, "cannot be changed for system groups")
      # Restore the original name
      self.name = name_was
    end
  end

  def parent_cannot_be_self_or_descendant
    return if parent_id.blank?
    if parent_id == id
      errors.add(:parent_id, "cannot be same as group")
      return
    end
    if descendants.any? { |child| child.id == parent_id }
      errors.add(:parent_id, "cannot be a descendant")
    end
  end

  def system_group_cannot_be_child
    return unless system_group?
    return if parent_id.blank?

    errors.add(:parent_id, "cannot be set for system groups")
  end
end
