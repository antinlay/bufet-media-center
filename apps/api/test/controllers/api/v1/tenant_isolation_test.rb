require "test_helper"

class Api::V1::TenantIsolationTest < ActionDispatch::IntegrationTest
  test "new user starts without organizations or screens" do
    headers = auth_headers(users(:non_member))

    get "/api/v1/groups", headers: headers
    assert_response :success
    assert_equal [], response.parsed_body

    get "/api/v1/screens", headers: headers
    assert_response :success
    assert_equal [], response.parsed_body
  end

  test "user cannot open another organization's screen by id" do
    get "/api/v1/screens/#{screens(:one).id}", headers: auth_headers(users(:non_member))

    assert_response :forbidden
  end

  test "foreign playlist is rejected before helper records are created" do
    headers = auth_headers(users(:non_member))

    assert_no_difference([ "Feed.count", "Subscription.count" ]) do
      get "/api/v1/screens/#{screens(:one).id}/playlist", headers: headers
    end

    assert_response :forbidden
  end

  test "creating an organization makes the current user its administrator" do
    user = users(:non_member)
    headers = auth_headers(user)

    assert_difference([ "Group.count", "Membership.count" ], 1) do
      post "/api/v1/groups",
        params: { group: { name: "Private workspace" } },
        headers: headers,
        as: :json
    end

    assert_response :created
    group = Group.find(response.parsed_body.fetch("id"))
    assert group.admin?(user)

    post "/api/v1/screens",
      params: { screen: { name: "Private screen", group_id: group.id } },
      headers: headers,
      as: :json

    assert_response :created
    assert_equal group.id, response.parsed_body.fetch("groupId")
  end

  test "same organization name can be used in isolated spaces" do
    first = Group.create!(name: "Coffee shop")
    first.memberships.create!(user: users(:admin), role: :admin)

    post "/api/v1/groups",
      params: { group: { name: first.name } },
      headers: auth_headers(users(:non_member)),
      as: :json

    assert_response :created
    refute_equal first.id, response.parsed_body.fetch("id")
  end

  test "organization admin can add a registered user by exact email" do
    invited_user = users(:non_member)
    group = groups(:screen_one_owners)

    assert_difference("Membership.count", 1) do
      post "/api/v1/groups/#{group.id}/memberships",
        params: { membership: { email: invited_user.email, group_id: group.id, role: "member" } },
        headers: auth_headers(users(:admin)),
        as: :json
    end

    assert_response :created
    assert group.member?(invited_user)

    get "/api/v1/screens", headers: auth_headers(invited_user)
    assert_response :success
    assert_includes response.parsed_body.map { |screen| screen.fetch("id") }, screens(:one).id
  end

  private

  def auth_headers(user)
    post "/api/v1/auth/login", params: { email: user.email, password: "password123" }, as: :json
    assert_response :success
    { "Authorization" => "Bearer #{response.parsed_body.fetch("access_token")}" }
  end
end
