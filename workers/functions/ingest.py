from __future__ import annotations

from typing import Any

from common.job import run_job
from common.rss import fetch_feed
from common.supabase import SupabaseClient, source_query


def run(_config: Any, supabase: SupabaseClient) -> dict[str, Any]:
    sources = supabase.select("source", source_query(active_only=True))
    article_rows: list[dict[str, Any]] = []
    health_rows: list[dict[str, Any]] = []
    for source in sources:
        items, health = fetch_feed(source)
        article_rows.extend(items)
        health_rows.append(
            {
                "source_id": source["source_id"],
                "http_status": health.get("http_status"),
                "item_count": health.get("item_count", 0),
                "latest_published_at": health.get("latest_published_at"),
                "error_status": health.get("error_status"),
                "success": not health.get("error_status"),
            }
        )
        update_payload = {
            "last_successful_fetch": health.get("last_successful_fetch") or source.get("last_successful_fetch"),
            "latest_published_at": health.get("latest_published_at") or source.get("latest_published_at"),
            "item_count": health.get("item_count", 0),
            "error_status": health.get("error_status"),
            "http_status": health.get("http_status"),
        }
        supabase.update("source", update_payload, {"source_id": f"eq.{source['source_id']}"})

    inserted = supabase.upsert("article", article_rows, on_conflict="article_key")
    supabase.insert("source_health_log", health_rows)
    return {"sources_checked": len(sources), "articles_seen": len(article_rows), "articles_upserted": len(inserted)}


def handler(event: dict[str, Any] | None = None, context: Any = None) -> dict[str, Any]:
    return run_job("ingest", run)


if __name__ == "__main__":
    print(handler())

