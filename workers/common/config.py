from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any


@dataclass(frozen=True)
class WorkerConfig:
    supabase_url: str
    supabase_service_role_key: str
    yandex_folder_id: str | None
    yandex_api_key: str | None
    yandex_iam_token: str | None
    yandex_use_metadata_token: bool
    alert_webhook_url: str | None
    use_ai: bool


def load_config(context: Any = None) -> WorkerConfig:
    yandex_api_key = os.getenv("YANDEX_API_KEY")
    yandex_iam_token = os.getenv("YANDEX_IAM_TOKEN") or context_access_token(context)
    use_metadata_token = os.getenv("YANDEX_USE_METADATA_TOKEN", "false").lower() == "true"
    yandex_folder_id = os.getenv("YANDEX_FOLDER_ID")
    return WorkerConfig(
        supabase_url=os.environ["SUPABASE_URL"].rstrip("/"),
        supabase_service_role_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        yandex_folder_id=yandex_folder_id,
        yandex_api_key=yandex_api_key,
        yandex_iam_token=yandex_iam_token,
        yandex_use_metadata_token=use_metadata_token,
        alert_webhook_url=os.getenv("ALERT_WEBHOOK_URL"),
        use_ai=bool(yandex_folder_id and (yandex_api_key or yandex_iam_token or use_metadata_token)),
    )


def context_access_token(context: Any = None) -> str | None:
    if context is None:
        return None
    if isinstance(context, dict):
        value = context.get("access_token")
        return str(value) if value else None
    value = getattr(context, "access_token", None)
    return str(value) if value else None
