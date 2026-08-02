variable "project_id" { type = string }
variable "billing_account" { type = string }
variable "github_repository" {
  type        = string
  description = "owner/repository形式"
}
variable "region" {
  type    = string
  default = "asia-northeast1"
}
variable "service_name" {
  type    = string
  default = "sauna-itta"
}
variable "container_image" {
  type        = string
  description = "初回作成に使うArtifact RegistryのイメージURI"
}
variable "allowed_google_email" { type = string }
variable "budget_jpy" {
  type    = number
  default = 3000
}
variable "photo_version_retention_days" {
  type        = number
  default     = 30
  description = "GCS写真バケットの非現行オブジェクト世代を保持する日数"

  validation {
    condition     = var.photo_version_retention_days >= 7
    error_message = "photo_version_retention_daysは7日以上にしてください。"
  }
}
