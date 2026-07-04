from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass(frozen=True)
class WorkerConfig:
    supabase_url: str
    supabase_service_role_key: str
    yandex_folder_id: str | None
    yandex_api_key: str | None
    yandex_iam_token: str | None
    alert_webhook_url: str | None
    use_ai: bool


def load_config() -> WorkerConfig:
    yandex_api_key = os.getenv("YANDEX_API_KEY")
    yandex_iam_token = os.getenv("YANDEX_IAM_TOKEN")
    return WorkerConfig(
        supabase_url=os.environ["SUPABASE_URL"].rstrip("/"),
        supabase_service_role_key=os.environ["SUPABASE_SERVICE_ROLE_KEY"],
        yandex_folder_id=os.getenv("YANDEX_FOLDER_ID"),
        yandex_api_key=yandex_api_key,
        yandex_iam_token=yandex_iam_token,
        alert_webhook_url=os.getenv("ALERT_WEBHOOK_URL"),
        use_ai=bool(os.getenv("YANDEX_FOLDER_ID") and (yandex_api_key or yandex_iam_token)),
    )

