# 機能追加案: サウナ詳細スペック項目の追加

## 概要
サウナの満足度だけでなく、温度や水風呂の有無などのスペック情報を記録できるようにします。

## 課題
- 「あそこのサウナ、何度だったっけ？」という情報を後から振り返ることができない。
- サウナ愛好家にとって重要な指標（温度、湿度、水風呂温度、外気浴の有無）が欠けている。

## 解決策
- `SaunaVisit` 型に以下のフィールドを追加:
  - `saunaTemperature`: number
  - `waterTemperature`: number
  - `hasOutdoorAirBath`: boolean
  - `hasLöyly`: boolean
- `VisitForm` に入力項目を追加。

## 実装イメージ
- `src/components/sauna-map/types.ts` の `SaunaVisit` インターフェースを拡張。
- `VisitForm.tsx` に数値入力フィールドとチェックボックスを追加。
