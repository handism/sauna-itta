# 写真のblobを破棄する。記録の削除（SaunaVisit）と、写真の差し替え・履歴の削除
# （VisitWritable）で共通の手順のため、ここへ集約する。
#
# DBのコミット後にだけ呼ぶこと。コミット前に破棄すると、ロールバックしたときに写真だけが失われる。
# 外部ストレージ側の失敗は、すでに確定した保存・削除の結果を失敗にしないよう、ログに残して握る。
#
# purge_later へ戻さないこと。ジョブは :async アダプタ（プロセス内のスレッド）で動くため、
# Cloud Run がレスポンス後に CPU を絞ったりインスタンスを止めたりすると破棄が完了せず、
# GCS にオブジェクトだけが残り続ける。写真は1件最大1MBで、同期で消しても応答は大きく遅れない。
class ImageBlobPurger
  # @param context [String] ログの主語（「〜に失敗しました」の前に付く）
  def self.purge(blobs, context:)
    # ActiveRecord は同じIDのレコードを eql? とみなすため、差し替えと削除で同じblobが重なっても1回だけ破棄する
    blobs.uniq.each do |blob|
      blob.purge
    rescue StandardError => error
      Rails.logger.error("#{context}に失敗しました: #{error.class}: #{error.message}")
    end
  end
end
