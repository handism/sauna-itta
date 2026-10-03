require "test_helper"

class ApiV1SaunaVisitsPaginationTest < ActionDispatch::IntegrationTest
  include ApiAuthHelper

  setup do
    @csrf = sign_in
    @ids = Array.new(5) { |index| create_visit("サウナ#{index}") }
  end

  test "limitを指定するとカーソルで全件を重複なく辿れる" do
    collected = []
    cursor = nil

    3.times do
      get "/api/v1/sauna_visits", params: { limit: 2, cursor: cursor }.compact
      assert_response :success
      collected.concat(response.parsed_body["saunaVisits"].map { |visit| visit["id"] })
      cursor = response.parsed_body["nextCursor"]
    end

    assert_nil cursor
    # 主キーの降順＝作成の新しい順
    assert_equal @ids.reverse, collected
  end

  test "ページ取得の合間に更新された記録も取りこぼさない" do
    get "/api/v1/sauna_visits", params: { limit: 2 }
    first_page = response.parsed_body["saunaVisits"].map { |visit| visit["id"] }
    cursor = response.parsed_body["nextCursor"]

    # 次のページに入るはずの古い記録を更新する（updated_at 順ならカーソルより前へ移ってしまう）
    oldest = owner.sauna_visits.find_by!(external_id: @ids.first)
    oldest.touch

    rest = []
    while cursor
      get "/api/v1/sauna_visits", params: { limit: 2, cursor: cursor }
      rest.concat(response.parsed_body["saunaVisits"].map { |visit| visit["id"] })
      cursor = response.parsed_body["nextCursor"]
    end

    assert_equal @ids.sort, (first_page + rest).sort
  end

  test "limitを指定しない呼び出しは従来どおり全件を更新日時順で返す" do
    get "/api/v1/sauna_visits"

    assert_response :success
    assert_equal 5, response.parsed_body["saunaVisits"].size
    assert_not response.parsed_body.key?("nextCursor")
  end

  test "limitは上限で切り詰める" do
    get "/api/v1/sauna_visits", params: { limit: 10_000 }

    assert_response :success
    assert_equal 5, response.parsed_body["saunaVisits"].size
    assert_nil response.parsed_body["nextCursor"]
  end

  test "不正なlimitとcursorは422で返す" do
    [ { limit: 0 }, { limit: "abc" }, { limit: 2, cursor: "!!!" }, { limit: 2, cursor: Base64.urlsafe_encode64("x") } ].each do |params|
      get "/api/v1/sauna_visits", params: params

      assert_response :unprocessable_content, "params: #{params}"
      assert_equal "validation_error", response.parsed_body.dig("error", "code")
    end
  end

  private

  def create_visit(name)
    post "/api/v1/sauna_visits", params: { saunaVisit: valid_attributes.merge(name: name) },
      headers: csrf_header(@csrf), as: :json
    assert_response :created
    response.parsed_body.dig("saunaVisit", "id")
  end

  def owner
    User.find_by!(email: ApiAuthHelper::ALLOWED_EMAIL)
  end
end
