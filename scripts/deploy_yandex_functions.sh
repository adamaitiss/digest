#!/usr/bin/env bash
set -euo pipefail

FOLDER_ID="${YANDEX_FOLDER_ID:?YANDEX_FOLDER_ID is required}"
SERVICE_ACCOUNT_ID="${YANDEX_SERVICE_ACCOUNT_ID:?YANDEX_SERVICE_ACCOUNT_ID is required}"
SUPABASE_URL="${SUPABASE_URL:?SUPABASE_URL is required}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:?SUPABASE_SERVICE_ROLE_KEY is required}"
YANDEX_API_KEY="${YANDEX_API_KEY:?YANDEX_API_KEY is required}"
RUNTIME="${YANDEX_FUNCTION_RUNTIME:-python312}"
MEMORY="${YANDEX_FUNCTION_MEMORY:-512m}"
TIMEOUT="${YANDEX_FUNCTION_TIMEOUT:-600s}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/workers/package"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
cp -R "$ROOT_DIR/workers/common" "$BUILD_DIR/common"
cp "$ROOT_DIR/workers/requirements.txt" "$BUILD_DIR/requirements.txt"

deploy_function() {
  local name="$1"
  local cron="$2"
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
    --environment "SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,YANDEX_FOLDER_ID=$FOLDER_ID,YANDEX_API_KEY=$YANDEX_API_KEY,ALERT_WEBHOOK_URL=${ALERT_WEBHOOK_URL:-}" \
    --source-path "$BUILD_DIR"

  local function_id
  function_id="$(yc serverless function get --name "digest-$name" --folder-id "$FOLDER_ID" --format json | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
  yc serverless trigger create timer \
    --name "digest-$name-timer" \
    --cron-expression "$cron" \
    --invoke-function-id "$function_id" \
    --invoke-function-service-account-id "$SERVICE_ACCOUNT_ID" \
    --folder-id "$FOLDER_ID" >/dev/null 2>&1 || true
}

deploy_function ingest "0 */4 * * ? *"
deploy_function enrich "20 */4 * * ? *"
deploy_function cluster_rank "45 */4 * * ? *"
deploy_function generate_digest "0 5 * * ? *"
deploy_function health_check "30 6 * * ? *"

