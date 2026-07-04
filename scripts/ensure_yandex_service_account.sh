#!/usr/bin/env bash
set -euo pipefail

FOLDER_ID="${YANDEX_FOLDER_ID:?YANDEX_FOLDER_ID is required}"
SERVICE_ACCOUNT_NAME="${YANDEX_SERVICE_ACCOUNT_NAME:-digest-pipeline}"

service_account_json="$(yc iam service-account create --name "$SERVICE_ACCOUNT_NAME" --folder-id "$FOLDER_ID" --format json 2>/dev/null || yc iam service-account get --name "$SERVICE_ACCOUNT_NAME" --folder-id "$FOLDER_ID" --format json)"
service_account_id="$(SERVICE_ACCOUNT_JSON="$service_account_json" python3 - <<'PY'
import json
import os

print(json.loads(os.environ["SERVICE_ACCOUNT_JSON"])["id"])
PY
)"

yc resource-manager folder add-access-binding "$FOLDER_ID" \
  --role functions.functionInvoker \
  --service-account-id "$service_account_id" >/dev/null

yc resource-manager folder add-access-binding "$FOLDER_ID" \
  --role ai.models.user \
  --service-account-id "$service_account_id" >/dev/null

echo "YANDEX_SERVICE_ACCOUNT_ID=$service_account_id"
