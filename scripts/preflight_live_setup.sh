#!/usr/bin/env bash
set -euo pipefail

missing=0

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "missing command: $1" >&2
    missing=1
  fi
}

require_env() {
  if [[ -z "${!1:-}" ]]; then
    echo "missing env: $1" >&2
    missing=1
  fi
}

require_command gh
require_command yc
require_command npm
require_command python3

if command -v gh >/dev/null 2>&1; then
  gh auth status >/dev/null
  gh repo view adamaitiss/digest --json name,url,visibility >/dev/null
fi

if command -v yc >/dev/null 2>&1; then
  yc config get folder-id >/dev/null
  yc serverless function runtime list --format json >/dev/null
fi

require_env VITE_SUPABASE_URL
require_env VITE_SUPABASE_ANON_KEY
require_env SUPABASE_URL
require_env SUPABASE_SERVICE_ROLE_KEY
require_env YANDEX_FOLDER_ID
require_env YANDEX_SERVICE_ACCOUNT_ID

if [[ "$missing" -ne 0 ]]; then
  echo "Live setup preflight failed. See NEEDS_DECISION.md for currently known blockers." >&2
  exit 1
fi

bindings_json="$(yc resource-manager folder list-access-bindings "$YANDEX_FOLDER_ID" --format json)"
ROLE_BINDINGS_JSON="$bindings_json" python3 - "$YANDEX_SERVICE_ACCOUNT_ID" <<'PY'
import json
import os
import sys

service_account_id = sys.argv[1]
bindings = json.loads(os.environ["ROLE_BINDINGS_JSON"])
roles = {
    binding.get("role_id")
    for binding in bindings
    if binding.get("subject", {}).get("type") == "serviceAccount"
    and binding.get("subject", {}).get("id") == service_account_id
}
required = {"functions.functionInvoker", "ai.models.user"}
missing = sorted(required - roles)
if missing:
    raise SystemExit(
        "Yandex service account is missing scoped roles: "
        + ", ".join(missing)
        + ". Grant them or run scripts/ensure_yandex_service_account.sh with sufficient IAM permission."
    )
PY

echo "Live setup preflight passed."
