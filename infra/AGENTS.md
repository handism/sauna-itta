# インフラ規約（GCP / Terraform）

このファイルは `infra/` 配下を編集するときに読み込まれます。ローカル開発環境（Docker Compose）と本番イメージの構成はリポジトリルートの `AGENTS.md` を参照してください。

- GCPは`infra/`のTerraformで管理します。Secret ManagerにはコンテナだけをTerraformで作り、秘密値やDBパスワードをtfvars、state、GitHub Secretsへ入れません。
- 写真GCSバケットはオブジェクトバージョニングを有効にし、非現行世代は`photo_version_retention_days`（既定30日）後にライフサイクル削除します。復旧猶予を維持しつつ、削除済み写真と費用を無期限に残さないでください。
- GCPデプロイは基盤・Secret・GitHub Environment Variablesの設定が完了するまで`workflow_dispatch`による手動実行専用にします。WIF/OIDCを使い、単一buildの同じdigestをmigration jobとCloud Runサービスへ順に反映します。migration成功前にサービスを更新しないでください。

## 検証
- インフラ変更時は`terraform fmt -check`、`terraform validate`、production Docker buildとhealth checkを実行します。
