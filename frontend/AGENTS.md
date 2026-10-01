# フロントエンド配布形態規約（データソース ＆ Service Worker）

このファイルは `frontend/` 配下を編集するときに読み込まれます。CSS・アクセシビリティの規約は `frontend/src/AGENTS.md`、状態管理・コンポーネント構造は `frontend/src/components/sauna-map/AGENTS.md`、全体方針とインポート仕様はリポジトリルートの `AGENTS.md` を参照してください。

## データソース（local／api）

- `NEXT_PUBLIC_DATA_SOURCE=local|api` で配布形態を切り替えます。localはGitHub Pages用の`/sauna-itta`、同梱JSON、`localStorage`、PWAを維持し、apiはbasePathなし・Rails API・オンライン必須でService Workerを登録しません。
- `NEXT_PUBLIC_DATA_SOURCE`は未指定（local扱い）・`local`・`api`だけを許可し、それ以外はビルド時に失敗させます。各コンポーネントで独自にフォールバックせず、`frontend/dataSource.ts`の`DATA_SOURCE`を参照してください（判定がずれるとbasePathとRepositoryが異なる混在構成になります）。
- 公開パスの接頭辞は`frontend/dataSource.ts`の`BASE_PATH`（localは`/sauna-itta`、apiは空文字）が唯一の出所です。`next.config.ts`の`basePath`／`assetPrefix`、`layout.tsx`のアイコン、`manifest.ts`、`ServiceWorkerRegister`の登録先はすべてこれを参照し、`"/sauna-itta"`を直書きしないでください。ビルドを通らない`public/sw.js`だけは、`self.registration.scope`（＝`ServiceWorkerRegister`が`BASE_PATH`から決めた登録スコープ）から同じ値を求めます。
- apiモードの応答は `apiVisitRepository.ts` で `SaunaVisitSchema` などの zod スキーマに通し、形式が合わなければ `RepositoryError`（`invalid_response`）にします。`response.json() as T` の型注釈だけで信用する形へ戻さないでください（localモードと検証の有無が食い違い、シリアライザ変更が描画中の実行時エラーとして表面化します）。
- `VisitRepository.update` は ID ではなく画面に表示中の記録（`SaunaVisit`）を受け取り、apiモードはその `lockVersion` を送ります。Repository の内部に記録のキャッシュを持たせて版を引く実装へ戻さないでください（画面の状態と版が食い違い、ロックが効かない更新が生まれます）。
- フロントの永続化は `repositories/` の `VisitRepository` 経由にします。Contextや画面から`fetch`または`localStorage`を直接呼ばないでください。CRUDは非同期で、Repository成功後だけ画面状態を更新します。
- JSONエクスポートは `Blob` + `URL.createObjectURL` で書き出します（`data:` URLへ戻さないこと。写真は最大1MBのBase64で含まれるため、数十件でURL長の上限に当たって無言で失敗します）。APIモードのエクスポートは写真を画像エンドポイントのURLとして書き出すため、localモードへ取り込んでも写真は復元されません。

## Service Worker（localモード）

- localモードのService Workerは静的資産と地図タイルのキャッシュを分離し、地図タイルはOpenStreetMapの明示的な許可ホストだけを最大200件保存します。activate時に削除してよいのは`sauna-itta-`接頭辞を持つ旧キャッシュだけです（GitHub Pagesの同一オリジンにある別アプリのキャッシュを削除しないこと）。キャッシュ方針を変えた場合は静的キャッシュのバージョンを更新してください。
- 静的キャッシュも初回保存のたびに`trimCache`で上限（`MAX_STATIC_RUNTIME_ENTRIES`）まで古い順に削除します。`_next/static`のチャンクやRSCの`.txt`はデプロイごとに名前が変わる一方、`sw.js`自体はデプロイで変わらずキャッシュ名も更新されないため、上限を外すと古い版の資産が端末に溜まり続けます。先読み資産（`PRECACHE_ASSETS`／`OPTIONAL_PRECACHE_ASSETS`）は`isPrecachedRequest`で削除対象から外しているため、先読み資産を追加する場合も両配列のどちらかへ入れてください（実行時に溜まった資産に押し出されると、オフラインで最初の画面が開けなくなります）。
- 地図の`TileLayer`には`crossOrigin="anonymous"`を必ず指定します。未指定だとタイル画像はno-corsで読み込まれ、Service Workerが受け取る応答はstatus 0のopaqueになるため、`sw.js`のタイルキャッシュ（status 200のみ保存）に一度も入りません。opaque応答を保存する方向で直すことも避けてください（ブラウザは容量を1件ごとに大きく見積もるため、すぐにキャッシュ容量を圧迫します）。
- Service Workerの非同期キャッシュ書き込みはイベント寿命へ必ず結び付けます。キャッシュ済みレスポンスのバックグラウンド更新は`event.waitUntil()`へ渡し、初回取得時の`cache.put()`は`respondWith()`へ渡すPromise内で`await`してください（未接続のPromiseはブラウザがイベントを終了して書き込みが欠落します）。
- 統計画面は別ドキュメントのため`OPTIONAL_PRECACHE_ASSETS`で先読みしますが、必須資産の`cache.addAll`へ混ぜないでください（`addAll`は1つでも取得に失敗するとinstallごと失敗し、オフライン対応が丸ごと失われます）。任意の先読みは`Promise.allSettled`で取得できた分だけ保存します。
