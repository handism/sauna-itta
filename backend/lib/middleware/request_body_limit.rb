# API へのリクエストボディの大きさに上限を設ける。
# インポートは記録10件までに制限しているが、1件ごとの履歴に最大1MBの写真（Base64）を
# 何枚でも載せられるため、件数の上限だけではボディの大きさが抑えられず、Puma のメモリを
# 圧迫できてしまう。パラメータの解析より前に Content-Length で弾く。
#
# 上限は Cloud Run のリクエスト上限（32MiB）より小さくしておく。超えると Cloud Run が
# JSON ではない応答で拒否し、フロントが理由を表示できない。フロントのインポートは
# この値より十分小さい大きさでチャンクを分ける（useVisitImportExport.ts の MAX_CHUNK_BYTES）。
#
# chunked 転送のリクエストも Puma が本文を読み終えてから Content-Length を設定するため、
# ヘッダの値だけを見れば足りる。
class RequestBodyLimit
  MAX_BYTES = 24 * 1024 * 1024
  PATH_PREFIX = "/api/"

  def initialize(app)
    @app = app
  end

  def call(env)
    if env["PATH_INFO"].to_s.start_with?(PATH_PREFIX) && env["CONTENT_LENGTH"].to_i > MAX_BYTES
      return payload_too_large
    end

    @app.call(env)
  end

  private

  def payload_too_large
    body = {
      error: {
        code: "payload_too_large",
        message: "送信するデータが大きすぎます（上限#{MAX_BYTES / 1024 / 1024}MB）。写真の多い記録を分けて取り込んでください。"
      }
    }.to_json
    [ 413, { "content-type" => "application/json; charset=utf-8", "content-length" => body.bytesize.to_s }, [ body ] ]
  end
end
