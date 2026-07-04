from __future__ import annotations

import traceback
from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

import httpx

from .config import WorkerConfig, load_config
from .supabase import SupabaseClient


def now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def run_job(name: str, fn: Callable[[WorkerConfig, SupabaseClient], dict[str, Any]], context: Any = None) -> dict[str, Any]:
    config = load_config(context)
    supabase = SupabaseClient(config.supabase_url, config.supabase_service_role_key)
    started = now_iso()
    try:
      result = fn(config, supabase)
      finished = now_iso()
      supabase.insert(
          "job_run",
          [
              {
                  "job_name": name,
                  "status": "success",
                  "started_at": started,
                  "finished_at": finished,
                  "details": result,
              }
          ],
      )
      return {"ok": True, "job": name, **result}
    except Exception as exc:  # noqa: BLE001 - worker must persist failure details
      finished = now_iso()
      detail = {"error": str(exc), "traceback": traceback.format_exc(limit=8)}
      try:
          supabase.insert(
              "job_run",
              [
                  {
                      "job_name": name,
                      "status": "failed",
                      "started_at": started,
                      "finished_at": finished,
                      "details": detail,
                  }
              ],
          )
      finally:
          if config.alert_webhook_url:
              send_alert(config.alert_webhook_url, name, detail)
      raise


def send_alert(webhook_url: str, job_name: str, detail: dict[str, Any]) -> None:
    try:
        httpx.post(
            webhook_url,
            json={"text": f"Digest pipeline job failed: {job_name}", "detail": detail},
            timeout=10,
        )
    except Exception:
        return
