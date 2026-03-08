# 機能追加案: 訪問履歴（複数回訪問）の管理

## 概要
1つのサウナ施設に対して、1回の記録（visitCount）だけでなく、日ごとの訪問記録を残せるようにします。

## 課題
- 現在は `visitCount` という数値しかないため、「いつ行ったか」の履歴が最新の1件しか残らない。
- 同じ施設に何度も通う「ホームサウナ」の記録を詳細に残したい。

## 解決策
- `SaunaVisit` 内に `history` 配列を持たせるか、施設（Location）と訪問（Visit）のデータを分離する。
- 施設を選択した際に、過去の訪問記録一覧を表示できるようにする。

## 実装イメージ
- `SaunaVisit` を `SaunaLocation` に改名。
- `history: { date: string, comment: string, rating: number }[]` を保持するように変更。
