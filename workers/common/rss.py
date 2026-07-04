from __future__ import annotations

import hashlib
import html
import re
from datetime import UTC, datetime, timedelta
from email.utils import parsedate_to_datetime
from typing import Any
from urllib.parse import urldefrag

import feedparser
import httpx
from dateutil import parser as date_parser


USER_AGENT = "PersonalNewsSwipeDigest/0.1 (+https://github.com/adamaitiss/digest)"
MAX_ITEMS_PER_SOURCE = 25
ACTIVE_HORIZON = timedelta(days=3)


def fetch_feed(source: dict[str, Any]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    rss_url = source.get("final_rss_url") or source.get("rss_url")
    if not rss_url:
        return [], {"error_status": "missing_rss_url", "http_status": None}

    try:
        response = httpx.get(
            str(rss_url),
            headers={"User-Agent": USER_AGENT, "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"},
            timeout=20,
            follow_redirects=True,
        )
        response.raise_for_status()
    except Exception as exc:  # noqa: BLE001 - stored as source health
        return [], {"error_status": str(exc), "http_status": getattr(getattr(exc, "response", None), "status_code", None)}

    parsed = feedparser.parse(response.content)
    items = [entry_to_article(source, entry) for entry in parsed.entries]
    items = [item for item in items if item["title"] and item["canonical_url"]]
    latest = max((item["published_at"] for item in items if item.get("published_at")), default=None)
    returned_items = select_recent_items(items)
    return returned_items, {
        "error_status": None if returned_items else "no_parseable_items",
        "http_status": response.status_code,
        "item_count": len(items),
        "latest_published_at": latest,
        "last_successful_fetch": datetime.now(UTC).isoformat().replace("+00:00", "Z") if returned_items else None,
    }


def entry_to_article(source: dict[str, Any], entry: Any) -> dict[str, Any]:
    url = canonicalize_url(entry.get("link") or entry.get("id") or "")
    title = clean_text(entry.get("title") or "")
    snippet = clean_text(
        entry.get("summary")
        or entry.get("description")
        or entry.get("subtitle")
        or ""
    )
    published_at = parse_date(entry)
    canonical_key = hashlib.sha256(f"{source['source_id']}:{url or title}".encode("utf-8")).hexdigest()
    return {
        "article_key": canonical_key,
        "canonical_url": url,
        "original_url": entry.get("link") or url,
        "source_id": source["source_id"],
        "title": title,
        "snippet": snippet,
        "language": source.get("language", "en"),
        "published_at": published_at,
        "fetched_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
        "raw_tags": [tag.get("term") for tag in entry.get("tags", []) if tag.get("term")],
        "source_quality_score": source.get("authority_score", 0.5),
        "paywall_limited": "paywall" in str(source.get("paywall_status", "")) or "metered" in str(source.get("paywall_status", "")),
    }


def canonicalize_url(value: str) -> str:
    url, _fragment = urldefrag(value.strip())
    return url


def clean_text(value: str) -> str:
    if not value:
        return ""
    without_tags = re.sub(r"<[^>]+>", " ", value)
    return " ".join(html.unescape(without_tags).replace("\n", " ").split())


def parse_date(entry: Any) -> str | None:
    for key in ("published", "updated", "created"):
        value = entry.get(key)
        if not value:
            continue
        try:
            return parsedate_to_datetime(value).astimezone(UTC).isoformat().replace("+00:00", "Z")
        except Exception:
            try:
                return date_parser.parse(value).astimezone(UTC).isoformat().replace("+00:00", "Z")
            except Exception:
                continue
    return None


def select_recent_items(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cutoff = datetime.now(UTC) - ACTIVE_HORIZON

    def published_datetime(item: dict[str, Any]) -> datetime | None:
        value = item.get("published_at")
        if not value:
            return None
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError:
            return None

    recent = [item for item in items if (published_datetime(item) or datetime.now(UTC)) >= cutoff]
    candidates = recent or items
    return sorted(
        candidates,
        key=lambda item: published_datetime(item) or datetime.min.replace(tzinfo=UTC),
        reverse=True,
    )[:MAX_ITEMS_PER_SOURCE]
