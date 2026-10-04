# フロントエンド配布形態規約（データソース ＆ Service Worker）

このファイルは `frontend/` 配下を編集するときに読み込まれます。CSS・アクセシビリティの規約は `frontend/src/AGENTS.md`、状態管理・コンポーネント構造は `frontend/src/components/sauna-map/AGENTS.md`、全体方針とインポート仕様はリポジトリルートの `AGENTS.md` を参照してください。

## データソース（local／api）

- `NEXT_PUBLIC_DATA_SOURCE=local|api` で配布形態を切り替えます。localはGitHub Pages用の`/sauna-itta`、同梱JSON、`localStorage`、PWAを維持し、apiはbasePathなし・Rails API・オンライン必須でService Workerを登録しません。
- `NEXT_PUBLIC_DATA_SOURCE`は未指定（local扱い）・`local`・`api`だけを許可し、それ以外はビルド時に失敗させます。各コンポーネントで独自にフォールバックせず、`frontend/dataSource.ts`の`DATA_SOURCE`を参照してください（判定がずれるとbasePathとRepositoryが異なる混在構成になります）。
- localモードのデモ記録（`src/data/sauna-visits.json`、約50KB）は、apiモードのビルドでは`next.config.ts`の`turbopack.resolveAlias`で空配列の`src/data/sauna-visits.api.json`へ差し替え、配信物に含めません。Repositoryの切り替えは実行時の分岐のため、静的importを分岐で囲んでもバンドラは外せません。`utils/savedVisits.ts`の`import initialVisits from "@/data/sauna-visits.json"`の書き方を変えるとエイリアスが無言で効かなくなるため、変える場合はエイリアスのキーも揃えてください（`next.config.test.ts`が両者の一致を検査しています）。
- 公開パスの接頭辞は`frontend/dataSource.ts`の`BASE_PATH`（localは`/sauna-itta`、apiは空文字）が唯一の出所です。`next.config.ts`の`basePath`／`assetPrefix`、`layout.tsx`のアイコン、`manifest.ts`、`ServiceWorkerRegister`の登録先はすべてこれを参照し、`"/sauna-itta"`を直書きしないでください。ビルドを通らない`public/sw.js`だけは、`self.registration.scope`（＝`ServiceWorkerRegister`が`BASE_PATH`から決めた登録スコープ）から同じ値を求めます。
- apiモードの応答は `apiVisitRepository.ts` で `SaunaVisitSchema` などの zod スキーマに通し、形式が合わなければ `RepositoryError`（`invalid_response`）にします。`response.json() as T` の型注釈だけで信用する形へ戻さないでください（localモードと検証の有無が食い違い、シリアライザ変更が描画中の実行時エラーとして表面化します）。Repositoryの失敗の解釈（`toUserMessage`／`isSessionLostError`）は`repositories/errorMessages.ts`に置きます。フックのファイルへ戻して純粋関数をフックから import させないでください。
- `VisitRepository.update` は ID ではなく画面に表示中の記録（`SaunaVisit`）を受け取り、apiモードはその `lockVersion` を送ります。Repository の内部に記録のキャッシュを持たせて版を引く実装へ戻さないでください（画面の状態と版が食い違い、ロックが効かない更新が生まれます）。
- フロントの永続化は `repositories/` の `VisitRepository` 経由にします。Contextや画面から`fetch`または`localStorage`を直接呼ばないでください。CRUDは非同期で、Repository成功後だけ画面状態を更新します。
- JSONエクスポートは `Blob` + `URL.createObjectURL` で書き出します（`data:` URLへ戻さないこと。写真は最大1MBのBase64で含まれるため、数十件でURL長の上限に当たって無言で失敗します）。書き出す前に必ず`VisitRepository.prepareExport`を通します。apiモードは写真を画像エンドポイント（`/api/v1/images/...`）から取得してdata URLへ置き換え、1枚でも取得できなければ欠けたバックアップを作らずにエクスポートごと失敗させます（URLのまま書き出すと、取り込み直しても写真が復元されません。サーバーはこのURLを「既存の写真を据え置く」指示として扱うため、新しい記録には添付されません）。以前の版で書き出した画像URL入りのJSONは、取り込み時に`dropApiImageUrls`で写真だけを外し、外した枚数を完了トーストで伝えます。

- `layout.tsx`のテーマ初期化スクリプトは素の`<script dangerouslySetInnerHTML>`で出力します。`next/script`の`beforeInteractive`へ戻さないでください（HTMLにはデータとして埋め込まれ実行時に動的にscript要素が作られるため、apiモードのCSPがHTMLから求めるハッシュに含まれず遮断されます）。同じ理由で、実行時に中身を組み立てるinline scriptも追加しないこと。

## Service Worker（localモード）

- **静的資産の取得方針は種類で分けます**。ファイル名にハッシュを含む`/_next/static/`だけはキャッシュ優先（保存済みならネットワークへ行かない）、ページ（HTML）・RSCの`.txt`・manifestなど同じURLのまま中身がデプロイで変わる同一オリジンの資産はネットワーク優先で、オフラインのときだけ保存済みの版を返します（ページ遷移は`?id=`／`?tag=`の違いでも同じHTMLのため、`cacheKeyFor`でクエリを除いたURLを保存・読み出しの両方のキーにする。`ignoreSearch`で探す形にすると、クエリ付きで保存された古い版が先に見つかって返ります）。外部のスクリプト・スタイルだけは従来どおりキャッシュを返して裏で更新します。HTMLをキャッシュ優先へ戻すと、デプロイ直後の1回目は必ず古い版が表示され、古いHTMLが参照するハッシュ付きチャンクが`trimCache`で削除済みだと配信元にも無いため画面が壊れたまま読み込まれます。
- localモードのService Workerは静的資産と地図タイルのキャッシュを分離し、地図タイルはOpenStreetMapの明示的な許可ホストだけを最大200件保存します。activate時に削除してよいのは`sauna-itta-`接頭辞を持つ旧キャッシュだけです（GitHub Pagesの同一オリジンにある別アプリのキャッシュを削除しないこと）。キャッシュ方針を変えた場合は静的キャッシュのバージョンを更新してください。
- 静的キャッシュも初回保存のたびに`trimCache`で上限（`MAX_STATIC_RUNTIME_ENTRIES`）まで古い順に削除します。`_next/static`のチャンクやRSCの`.txt`はデプロイごとに名前が変わる一方、`sw.js`自体はデプロイで変わらずキャッシュ名も更新されないため、上限を外すと古い版の資産が端末に溜まり続けます。先読み資産（`PRECACHE_ASSETS`／`OPTIONAL_PRECACHE_ASSETS`）は`isPrecachedRequest`で削除対象から外しているため、先読み資産を追加する場合も両配列のどちらかへ入れてください（実行時に溜まった資産に押し出されると、オフラインで最初の画面が開けなくなります）。
- 地図の`TileLayer`には`crossOrigin="anonymous"`を必ず指定します。未指定だとタイル画像はno-corsで読み込まれ、Service Workerが受け取る応答はstatus 0のopaqueになるため、`sw.js`のタイルキャッシュ（status 200のみ保存）に一度も入りません。opaque応答を保存する方向で直すことも避けてください（ブラウザは容量を1件ごとに大きく見積もるため、すぐにキャッシュ容量を圧迫します）。
- Service Workerの非同期キャッシュ書き込みはイベント寿命へ必ず結び付けます。キャッシュ済みレスポンスのバックグラウンド更新は`event.waitUntil()`へ渡し、初回取得時の`cache.put()`は`respondWith()`へ渡すPromise内で`await`してください（未接続のPromiseはブラウザがイベントを終了して書き込みが欠落します）。
- 統計画面は別ドキュメントのため`OPTIONAL_PRECACHE_ASSETS`で先読みしますが、必須資産の`cache.addAll`へ混ぜないでください（`addAll`は1つでも取得に失敗するとinstallごと失敗し、オフライン対応が丸ごと失われます）。任意の先読みは`Promise.allSettled`で取得できた分だけ保存します。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
