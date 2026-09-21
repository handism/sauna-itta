# フロントエンド配布形態規約（データソース ＆ Service Worker）

このファイルは `frontend/` 配下を編集するときに読み込まれます。CSS・アクセシビリティの規約は `frontend/src/AGENTS.md`、状態管理・コンポーネント構造は `frontend/src/components/sauna-map/AGENTS.md`、全体方針とインポート仕様はリポジトリルートの `AGENTS.md` を参照してください。

## データソース（local／api）

- `NEXT_PUBLIC_DATA_SOURCE=local|api` で配布形態を切り替えます。localはGitHub Pages用の`/sauna-itta`、同梱JSON、`localStorage`、PWAを維持し、apiはbasePathなし・Rails API・オンライン必須でService Workerを登録しません。
- `NEXT_PUBLIC_DATA_SOURCE`は未指定（local扱い）・`local`・`api`だけを許可し、それ以外はビルド時に失敗させます。各コンポーネントで独自にフォールバックせず、`frontend/dataSource.ts`の`DATA_SOURCE`を参照してください（判定がずれるとbasePathとRepositoryが異なる混在構成になります）。
- フロントの永続化は `repositories/` の `VisitRepository` 経由にします。Contextや画面から`fetch`または`localStorage`を直接呼ばないでください。CRUDは非同期で、Repository成功後だけ画面状態を更新します。
- JSONエクスポートは `Blob` + `URL.createObjectURL` で書き出します（`data:` URLへ戻さないこと。写真は最大1MBのBase64で含まれるため、数十件でURL長の上限に当たって無言で失敗します）。APIモードのエクスポートは写真を画像エンドポイントのURLとして書き出すため、localモードへ取り込んでも写真は復元されません。

## Service Worker（localモード）

- localモードのService Workerは静的資産と地図タイルのキャッシュを分離し、地図タイルはOpenStreetMapの明示的な許可ホストだけを最大200件保存します。activate時に削除してよいのは`sauna-itta-`接頭辞を持つ旧キャッシュだけです（GitHub Pagesの同一オリジンにある別アプリのキャッシュを削除しないこと）。キャッシュ方針を変えた場合は静的キャッシュのバージョンを更新してください。
- Service Workerの非同期キャッシュ書き込みはイベント寿命へ必ず結び付けます。キャッシュ済みレスポンスのバックグラウンド更新は`event.waitUntil()`へ渡し、初回取得時の`cache.put()`は`respondWith()`へ渡すPromise内で`await`してください（未接続のPromiseはブラウザがイベントを終了して書き込みが欠落します）。
- 統計画面は別ドキュメントのため`OPTIONAL_PRECACHE_ASSETS`で先読みしますが、必須資産の`cache.addAll`へ混ぜないでください（`addAll`は1つでも取得に失敗するとinstallごと失敗し、オフライン対応が丸ごと失われます）。任意の先読みは`Promise.allSettled`で取得できた分だけ保存します。
