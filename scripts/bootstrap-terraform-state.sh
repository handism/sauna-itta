#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "使い方: $0 <GCP_PROJECT_ID> <STATE_BUCKET_NAME>" >&2
  exit 1
fi

project_id="$1"
bucket_name="$2"
gcloud storage buckets create "gs://${bucket_name}" \
  --project="${project_id}" \
  --location="asia-northeast1" \
  --uniform-bucket-level-access
gcloud storage buckets update "gs://${bucket_name}" --versioning
