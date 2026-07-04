from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from common.job import run_job, send_alert
from common.supabase import SupabaseClient


def run(config: Any, supabase: SupabaseClient) -> dict[str, Any]:
    stale_threshold = (datetime.now(UTC) - timedelta(hours=12)).isoformat().replace("+00:00", "Z")
    failed_jobs = supabase.select(
        "job_run",
        "select=*&status=eq.failed&order=started_at.desc&limit=5",
    )
    stale_sources = supabase.select(
        "source",
        f"select=source_id,name,language,last_successful_fetch,error_status&active=eq.true&or=(last_successful_fetch.is.null,last_successful_fetch.lt.{stale_threshold})",
    )
    issue_count = len(failed_jobs) + len(stale_sources)
    details = {
        "failed_jobs": len(failed_jobs),
        "stale_sources": len(stale_sources),
        "stale_source_ids": [source["source_id"] for source in stale_sources[:20]],
    }
    if issue_count and config.alert_webhook_url:
        send_alert(config.alert_webhook_url, "health_check", details)
    return details


def handler(event: dict[str, Any] | None = None, context: Any = None) -> dict[str, Any]:
    return run_job("health_check", run)


if __name__ == "__main__":
    print(handler())

