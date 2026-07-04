#!/usr/bin/env bash
set -euo pipefail

FOLDER_ID="${YANDEX_FOLDER_ID:?YANDEX_FOLDER_ID is required}"
SERVICE_ACCOUNT_ID="${YANDEX_SERVICE_ACCOUNT_ID:?YANDEX_SERVICE_ACCOUNT_ID is required}"
SUPABASE_URL="${SUPABASE_URL:?SUPABASE_URL is required}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required}"
RUNTIME="${YANDEX_FUNCTION_RUNTIME:-python312}"
MEMORY="${YANDEX_FUNCTION_MEMORY:-512m}"
TIMEOUT="${YANDEX_FUNCTION_TIMEOUT:-600s}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/workers/package"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cp -R "$ROOT_DIR/workers/common" "$BUILD_DIR/common"
cp "$ROOT_DIR/workers/requirements.txt" "$BUILD_DIR/requirements.txt"

yc iam service-account get --id "$SERVICE_ACCOUNT_ID" --format json >/dev/null
runtime_json="$(yc serverless function runtime list --format json)"
RUNTIME_JSON="$runtime_json" python3 - "$RUNTIME" <<'PY'
import json
import os
import sys

runtime = sys.argv[1]
data = json.loads(os.environ["RUNTIME_JSON"])
if isinstance(data, dict):
    runtimes = data.get("runtimes", [])
else:
    runtimes = data
if not any((item == runtime) or (isinstance(item, dict) and (item.get("id") == runtime or item.get("name") == runtime)) for item in runtimes):
    raise SystemExit(f"Yandex Cloud Functions runtime is not available: {runtime}")
PY

build_environment() {
  local env_string
  env_string="SUPABASE_URL=$SUPABASE_URL"
  env_string+=",SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
  env_string+=",YANDEX_FOLDER_ID=$FOLDER_ID"
  env_string+=",YANDEX_USE_METADATA_TOKEN=true"
  if [[ -n "${YANDEX_API_KEY:-}" ]]; then
    env_string+=",YANDEX_API_KEY=$YANDEX_API_KEY"
  fi
  if [[ -n "${ALERT_WEBHOOK_URL:-}" ]]; then
    env_string+=",ALERT_WEBHOOK_URL=$ALERT_WEBHOOK_URL"
  fi
  printf '%s' "$env_string"
}

deploy_function() {
  local name="$1"
  local cron="$2"
  local trigger_name="digest-$name-timer"
  cp "$ROOT_DIR/workers/functions/$name.py" "$BUILD_DIR/index.py"
  yc serverless function create --name "digest-$name" --folder-id "$FOLDER_ID" >/dev/null 2>&1 || true
  yc serverless function version create \
    --function-name "digest-$name" \
    --folder-id "$FOLDER_ID" \
    --runtime "$RUNTIME" \
    --entrypoint "index.handler" \
    --memory "$MEMORY" \
    --execution-timeout "$TIMEOUT" \
    --service-account-id "$SERVICE_ACCOUNT_ID" \
    --metadata-options gce-http-endpoint=enabled,aws-v1-http-endpoint=disabled \
    --environment "$(build_environment)" \
    --source-path "$BUILD_DIR"

  local function_id
  function_id="$(yc serverless function get --name "digest-$name" --folder-id "$FOLDER_ID" --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
  yc serverless trigger delete "$trigger_name" --folder-id "$FOLDER_ID" >/dev/null 2>&1 || true
  yc serverless trigger create timer \
    --name "$trigger_name" \
    --cron-expression "$cron" \
    --invoke-function-id "$function_id" \
    --invoke-function-service-account-id "$SERVICE_ACCOUNT_ID" \
    --folder-id "$FOLDER_ID"
}

deploy_function ingest "0 */4 * * ? *"
deploy_function enrich "20 */4 * * ? *"
deploy_function cluster_rank "45 */4 * * ? *"
deploy_function generate_digest "0 5 * * ? *"
deploy_function health_check "30 6 * * ? *"
