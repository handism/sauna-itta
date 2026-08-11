require "test_helper"

class UserTest < ActiveSupport::TestCase
  def setup
    @user = User.new(google_subject: "12345", email: "TEST@example.com")
  end

  test "should be valid" do
    assert @user.valid?
  end

  test "google_subject should be present" do
    @user.google_subject = "     "
    assert_not @user.valid?
  end

  test "email should be present" do
    @user.email = "     "
    assert_not @user.valid?
  end

  test "google_subject should be unique" do
    duplicate_user = @user.dup
    @user.save
    assert_not duplicate_user.valid?
  end

  test "email should be unique ignoring case" do
    duplicate_user = @user.dup
    duplicate_user.email = @user.email.upcase
    @user.save
    assert_not duplicate_user.valid?
  end

  test "email format should be valid" do
    valid_emails = %w[user@example.com USER@foo.COM A_US-ER@foo.bar.org
                      first.last@foo.jp alice+bob@baz.cn]
    valid_emails.each do |valid_email|
      @user.email = valid_email
      assert @user.valid?, "#{valid_email.inspect} should be valid"
    end
  end

  test "email format should be invalid" do
    invalid_emails = %w[user@example,com user_at_foo.org user.name@example.
                        foo@bar_baz.com foo@bar+baz.com]
    invalid_emails.each do |invalid_email|
      @user.email = invalid_email
      assert_not @user.valid?, "#{invalid_email.inspect} should be invalid"
    end
  end

  test "email should be saved as lowercase" do
    mixed_case_email = "Foo@ExAMPle.CoM"
    @user.email = mixed_case_email
    @user.save
    assert_equal mixed_case_email.downcase, @user.reload.email
  end

  test "associated sauna_visits should be destroyed" do
    @user.save
    @user.sauna_visits.create!(
      external_id: "ext123",
      name: "Super Sauna",
      latitude: 60.1,
      longitude: 24.9,
      status: "visited",
      tags: []
    )
    assert_difference("SaunaVisit.count", -1) do
      @user.destroy
    end
  end
end
