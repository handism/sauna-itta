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
