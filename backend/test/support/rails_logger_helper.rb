# Rails.logger を一時的に差し替えて、error に渡されたメッセージを集めるヘルパー。
#
# `Rails.define_singleton_method(:logger)` での差し替えは絶対に行わないこと。
# `Rails.logger` は Rails 本体の attr_accessor で、singleton メソッドを定義すると
# reader ごと置き換わる。ensure で「元のロガーを返すメソッド」を定義し直しても
# reader は attr_accessor に戻らないため、以降そのプロセスでは `Rails.logger=` が
# 無視され続ける。その結果、後から実行される他のテストのロガー差し替えが効かず、
# 実行順（minitest のシード）によってテストが落ちるようになる。
module RailsLoggerHelper
  # error のメッセージだけを配列へ集めるロガー。
  # ActiveSupport::TaggedLogging を噛ませていないので `respond_to?(:tagged)` は
  # false になり、`logger.tagged { ... }` を使う呼び出し側（ActiveJob など）は
  # ブロックをそのまま実行するフォールバックへ倒れる。
  class ErrorCapturingLogger < Logger
    def initialize(messages)
      # logdev に nil を渡すと、どこにも書き出さないロガーになる
      super(nil)
      @messages = messages
    end

    def error(progname = nil, &block)
      @messages << (block ? block.call : progname)
    end
  end

  # ブロックの実行中に Rails.logger.error へ渡されたメッセージの配列を返す。
  def capture_rails_logger_errors
    messages = []
    original_logger = Rails.logger
    Rails.logger = ErrorCapturingLogger.new(messages)

    begin
      yield
    ensure
      Rails.logger = original_logger
    end

    messages
  end
end
