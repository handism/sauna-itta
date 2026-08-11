require "test_helper"
require "fileutils"
require "tmpdir"

class StaticControllerTest < ActionDispatch::IntegrationTest
  setup do
    @temp_dir = Dir.mktmpdir
    @temp_root = Pathname.new(@temp_dir)
  end

  teardown do
    FileUtils.remove_entry @temp_dir
  end

  def with_temp_root(&block)
    original_root = Rails.root
    Rails.define_singleton_method(:root) do
      # Pathname.new provides join
      Pathname.new(Thread.current[:temp_root_dir])
    end
    Thread.current[:temp_root_dir] = @temp_dir
    block.call
  ensure
    Thread.current[:temp_root_dir] = nil
    Rails.define_singleton_method(:root) { original_root }
  end

  test "index returns 404 when index.html is missing" do
    with_temp_root do
      get root_url
      assert_response :not_found
    end
  end

  test "index returns file when index.html is present" do
    public_dir = @temp_root.join("public")
    FileUtils.mkdir_p(public_dir)
    File.write(public_dir.join("index.html"), "<html>index</html>")

    with_temp_root do
      get root_url
      assert_response :success
      assert_equal "text/html", response.media_type
    end
  end

  test "stats returns 404 when stats.html is missing" do
    with_temp_root do
      get stats_url
      assert_response :not_found
    end
  end

  test "stats returns file when stats.html is present" do
    public_dir = @temp_root.join("public")
    FileUtils.mkdir_p(public_dir)
    File.write(public_dir.join("stats.html"), "<html>stats</html>")

    with_temp_root do
      get stats_url
      assert_response :success
      assert_equal "text/html", response.media_type
    end
  end
end
