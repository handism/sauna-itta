# セッションログ: 2026-03-16

## 作業内容

User スコープの Claude Code スキルを2つ新規作成した。

### 作成したスキル

#### 1. `gh-pr-resolve`
- **ファイル**: `/Users/mba/.claude/skills/gh-pr-resolve/SKILL.md`
- **概要**: GitHub PR のレビューコメントに対応するスキル
- **機能**:
  - `gh api` でインライン・レビュー本文コメントを収集
  - 要修正 / 要対応 / 議論 の3カテゴリに分類
  - 修正実装後、コミット・プッシュ
  - 対応済みコメントに返信、議論系は未対応の旨を返信

#### 2. `gh-issue-create`
- **ファイル**: `/Users/mba/.claude/skills/gh-issue-create/SKILL.md`
- **概要**: GitHub に新規 Issue を作成するスキル
- **機能**:
  - 重複 Issue の検索
  - 種別（バグ報告 / 機能要望 / タスク）に応じたテンプレートで Issue 作成
  - ラベル・マイルストーンの自動確認

## 未解決の課題

特になし
