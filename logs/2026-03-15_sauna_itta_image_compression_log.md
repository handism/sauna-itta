# [sauna-itta] GitHub Issue #8: 画像圧縮機能の実装

## 概要

- **リクエスト:** `sauna-itta` プロジェクトの GitHub Issue #8 の対応。
- **Issue内容:** 画像アップロード時にリサイズ・圧縮を行い、`localStorage` の容量制限による保存失敗を防ぐ。

## 実行プロセス

1.  `gh issue view 8` コマンドでIssue詳細を確認。
2.  画像圧縮ライブラリ `browser-image-compression` を `npm install` でプロジェクトに追加。
3.  `grep` で画像処理箇所を探索し、`src/components/SaunaMap.tsx` 内の `handleImageChange` 関数が対象であることを特定。
4.  `handleImageChange` 関数を改修し、以下の処理を実装。
    - `async` 関数に変更。
    - `imageCompression` を呼び出し、画像を最大1024px、1MB未満に圧縮。
    - 圧縮後のファイルを `FileReader` で読み込み、Base64に変換して保存する。
    - `try-catch` によるエラーハンドリングを追加。
5.  `import` 文をファイルの先頭に追加。

## 結果

画像アップロード時に自動でリサイズと圧縮が行われるようになり、より安定して画像付きの訪問記録を保存できるようになった。
