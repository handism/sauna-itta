output "cloud_run_url" { value = google_cloud_run_v2_service.app.uri }
output "artifact_registry" { value = google_artifact_registry_repository.app.name }
output "workload_identity_provider" { value = google_iam_workload_identity_pool_provider.github.name }
output "deployer_service_account" { value = google_service_account.deployer.email }
output "photo_bucket" { value = google_storage_bucket.photos.name }
output "cloud_sql_connection_name" { value = google_sql_database_instance.postgres.connection_name }
