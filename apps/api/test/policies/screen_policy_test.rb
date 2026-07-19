require "test_helper"

class ScreenPolicyTest < ActiveSupport::TestCase
  setup do
    @system_admin_user = users(:system_admin)
    @group_admin_user = users(:admin)
    @group_regular_user = users(:regular)
    @non_group_user = users(:non_member)
    @screen = screens(:one)
  end

  test "index? remains public for the legacy interface" do
    assert ScreenPolicy.new(nil, @screen).index?
    assert ScreenPolicy.new(@non_group_user, @screen).index?
  end

  test "legacy show remains public while tenant show is isolated" do
    assert ScreenPolicy.new(nil, @screen).show?
    assert ScreenPolicy.new(@non_group_user, @screen).show?
    refute ScreenPolicy.new(@non_group_user, @screen).tenant_show?
    assert ScreenPolicy.new(@group_regular_user, @screen).tenant_show?
  end

  test "new? is permitted for system admin" do
    assert ScreenPolicy.new(@system_admin_user, Screen.new).new?
  end

  test "new? is permitted for user who is an admin of any group" do
    assert ScreenPolicy.new(@group_admin_user, Screen.new).new?
  end

  test "new? is denied for user who is not an admin of any group" do
    refute ScreenPolicy.new(@group_regular_user, Screen.new).new?
  end

  test "scope resolves only screens in the user's organizations" do
    assert_equal Screen.all.to_a, ScreenPolicy::Scope.new(nil, Screen.all).resolve.to_a
    assert_empty ScreenPolicy::Scope.new(@non_group_user, Screen.all).resolve

    resolved_scope = ScreenPolicy::Scope.new(@group_regular_user, Screen.all).resolve
    assert_includes resolved_scope, screens(:one)
    refute_includes resolved_scope, screens(:e2e)
  end

  # --- Create, Edit, Destroy Tests --- #

  test "create? is permitted for system admin" do
    assert ScreenPolicy.new(@system_admin_user, @screen).create?
  end

  test "create? is permitted for a group admin" do
    assert ScreenPolicy.new(@group_admin_user, @screen).create?
  end

  test "create? is denied for a regular group member" do
    refute ScreenPolicy.new(@group_regular_user, @screen).create?
  end

  test "create? is denied for a non-group member" do
    refute ScreenPolicy.new(@non_group_user, @screen).create?
  end

  test "edit? is permitted for a group admin" do
    assert ScreenPolicy.new(@group_admin_user, @screen).edit?
  end

  test "edit? is permitted for a regular group member" do
    assert ScreenPolicy.new(@group_regular_user, @screen).edit?
  end

  test "edit? is denied for a non-group member" do
    refute ScreenPolicy.new(@non_group_user, @screen).edit?
  end

  test "destroy? is permitted for system admin" do
    assert ScreenPolicy.new(@system_admin_user, @screen).destroy?
  end

  test "destroy? is permitted for a group admin" do
    assert ScreenPolicy.new(@group_admin_user, @screen).destroy?
  end

  test "destroy? is denied for a regular group member" do
    refute ScreenPolicy.new(@group_regular_user, @screen).destroy?
  end

  test "destroy? is denied for a non-group member" do
    refute ScreenPolicy.new(@non_group_user, @screen).destroy?
  end

  test "update allows group_id change when user is admin of both old and new groups" do
    # Admin user trying to change screen to a group they also admin
    @screen.group_id = groups(:content_creators).id
    policy = ScreenPolicy.new(@group_admin_user, @screen)
    assert policy.update?
  end

  test "update denies group_id change when user is not admin of new group" do
    # Regular user trying to change screen to a group they don't admin
    @screen.group_id = groups(:moderators).id
    policy = ScreenPolicy.new(@group_regular_user, @screen)
    refute policy.update?
  end

  test "update denies group_id change when user is not admin of old group" do
    # Regular user (member but not admin of old group) trying to change screen
    @screen.group_id = groups(:content_creators).id
    policy = ScreenPolicy.new(@group_regular_user, @screen)
    refute policy.update?
  end

  test "update denies group_id change when user is not admin of both groups" do
    # Admin user trying to change screen to screen_two_owners (where they're not admin)
    @screen.group_id = groups(:screen_two_owners).id
    policy = ScreenPolicy.new(@group_admin_user, @screen)
    refute policy.update?
  end

  test "update allows when group_id is not changed" do
    # Regular user updating screen without changing group
    @screen.name = "Updated Screen Name"
    policy = ScreenPolicy.new(@group_regular_user, @screen)
    assert policy.update?
  end

  test "permitted attributes for new screen always group_id" do
    policy = ScreenPolicy.new(@group_admin_user, Screen.new())
    assert_includes policy.permitted_attributes, :group_id
  end

  test "permitted attributes for existing screen includes group_id when user is admin of current group" do
    policy = ScreenPolicy.new(@group_admin_user, @screen)
    assert_includes policy.permitted_attributes, :group_id
  end

  test "permitted attributes for existing screen excludes group_id when user is not admin of current group" do
    policy = ScreenPolicy.new(@group_regular_user, @screen)
    refute_includes policy.permitted_attributes, :group_id
  end
end
