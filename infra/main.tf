locals {
  required_services = toset([
    "artifactregistry.googleapis.com",
    "billingbudgets.googleapis.com",
    "cloudresourcemanager.googleapis.com",
    "iamcredentials.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "sqladmin.googleapis.com",
    "storage.googleapis.com"
  ])
  secret_ids = toset(["database-password", "google-client-id", "google-client-secret", "rails-secret-key-base"])
}

resource "google_project_service" "required" {
  for_each           = local.required_services
  service            = each.value
  disable_on_destroy = false
}

resource "google_artifact_registry_repository" "app" {
  location      = var.region
  repository_id = var.service_name
  format        = "DOCKER"
  depends_on    = [google_project_service.required]
}

resource "google_storage_bucket" "photos" {
  name                        = "${var.project_id}-${var.service_name}-photos"
  location                    = var.region
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"
  force_destroy               = false
  versioning { enabled = true }
}

resource "google_sql_database_instance" "postgres" {
  name                = "${var.service_name}-postgres"
  region              = var.region
  database_version    = "POSTGRES_17"
  deletion_protection = true

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"
    disk_type         = "PD_SSD"
    disk_size         = 10
    disk_autoresize   = true
    backup_configuration {
      enabled                        = true
      start_time                     = "18:00"
      point_in_time_recovery_enabled = false
    }
    ip_configuration { ipv4_enabled = true }
  }
  depends_on = [google_project_service.required]
}

resource "google_sql_database" "app" {
  name     = "sauna_itta_production"
  instance = google_sql_database_instance.postgres.name
}

resource "google_secret_manager_secret" "app" {
  for_each  = local.secret_ids
  secret_id = "${var.service_name}-${each.value}"
  replication {
    auto {}
  }
  depends_on = [google_project_service.required]
}

resource "google_service_account" "runtime" {
  account_id   = "${var.service_name}-runtime"
  display_name = "サウナイッタ Cloud Run実行用"
}

resource "google_service_account" "deployer" {
  account_id   = "${var.service_name}-deployer"
  display_name = "サウナイッタ GitHub Actionsデプロイ用"
}

resource "google_project_iam_member" "runtime_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.runtime.email}"
}

resource "google_storage_bucket_iam_member" "runtime_storage" {
  bucket = google_storage_bucket.photos.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.runtime.email}"
}

resource "google_secret_manager_secret_iam_member" "runtime_secrets" {
  for_each  = google_secret_manager_secret.app
  secret_id = each.value.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.runtime.email}"
}

resource "google_cloud_run_v2_service" "app" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account                  = google_service_account.runtime.email
    max_instance_request_concurrency = 10
    scaling {
      min_instance_count = 0
      max_instance_count = 2
    }
    containers {
      image = var.container_image
      resources { limits = { cpu = "1", memory = "512Mi" } }
      ports { container_port = 8080 }
      env {
        name  = "GCP_PROJECT_ID"
        value = var.project_id
      }
      env {
        name  = "ACTIVE_STORAGE_BUCKET"
        value = google_storage_bucket.photos.name
      }
      env {
        name  = "ALLOWED_GOOGLE_EMAIL"
        value = var.allowed_google_email
      }
      env {
        name  = "POSTGRES_DB"
        value = google_sql_database.app.name
      }
      env {
        name  = "POSTGRES_USER"
        value = "postgres"
      }
      env {
        name  = "DB_HOST"
        value = "/cloudsql/${google_sql_database_instance.postgres.connection_name}"
      }
      dynamic "env" {
        for_each = {
          POSTGRES_PASSWORD    = google_secret_manager_secret.app["database-password"].secret_id
          GOOGLE_CLIENT_ID     = google_secret_manager_secret.app["google-client-id"].secret_id
          GOOGLE_CLIENT_SECRET = google_secret_manager_secret.app["google-client-secret"].secret_id
          SECRET_KEY_BASE      = google_secret_manager_secret.app["rails-secret-key-base"].secret_id
        }
        content {
          name = env.key
          value_source {
            secret_key_ref {
              secret  = env.value
              version = "latest"
            }
          }
        }
      }
      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }
      startup_probe {
        http_get {
          path = "/up"
        }
        initial_delay_seconds = 10
        timeout_seconds       = 5
        period_seconds        = 10
        failure_threshold     = 12
      }
    }
    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.postgres.connection_name]
      }
    }
  }
  lifecycle { ignore_changes = [template[0].containers[0].image] }
  depends_on = [google_project_service.required, google_secret_manager_secret_iam_member.runtime_secrets]
}

resource "google_cloud_run_v2_job" "migrate" {
  name     = "${var.service_name}-migrate"
  location = var.region
  template {
    template {
      service_account = google_service_account.runtime.email
      max_retries     = 0
      timeout         = "600s"
      containers {
        image   = var.container_image
        command = ["bundle", "exec", "rails", "db:migrate"]
        resources { limits = { cpu = "1", memory = "512Mi" } }
        env {
          name  = "RAILS_ENV"
          value = "production"
        }
        env {
          name  = "POSTGRES_DB"
          value = google_sql_database.app.name
        }
        env {
          name  = "POSTGRES_USER"
          value = "postgres"
        }
        env {
          name  = "DB_HOST"
          value = "/cloudsql/${google_sql_database_instance.postgres.connection_name}"
        }
        env {
          name = "POSTGRES_PASSWORD"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app["database-password"].secret_id
              version = "latest"
            }
          }
        }
        env {
          name = "SECRET_KEY_BASE"
          value_source {
            secret_key_ref {
              secret  = google_secret_manager_secret.app["rails-secret-key-base"].secret_id
              version = "latest"
            }
          }
        }
        volume_mounts {
          name       = "cloudsql"
          mount_path = "/cloudsql"
        }
      }
      volumes {
        name = "cloudsql"
        cloud_sql_instance {
          instances = [google_sql_database_instance.postgres.connection_name]
        }
      }
    }
  }
  lifecycle { ignore_changes = [template[0].template[0].containers[0].image] }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  location = google_cloud_run_v2_service.app.location
  name     = google_cloud_run_v2_service.app.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
