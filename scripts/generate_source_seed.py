#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE_JSON = ROOT / "data" / "source_registry_v1.json"
OUT = ROOT / "supabase" / "migrations" / "002_seed_source_registry.sql"


def sql_literal(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list) or isinstance(value, dict):
        return "'" + json.dumps(value, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(value).replace("'", "''") + "'"


def main() -> None:
    sources = json.loads(SOURCE_JSON.read_text())
    rows = []
    for source in sources:
        rows.append(
            "("
            + ", ".join(
                [
                    sql_literal(source["source_id"]),
                    sql_literal(source["name"]),
                    sql_literal(source["url"]),
                    sql_literal(source.get("rss_url")),
                    sql_literal(source.get("final_rss_url") or source.get("rss_url")),
                    sql_literal(source["language"]),
                    sql_literal(source.get("country_region")),
                    sql_literal(source.get("source_type")),
                    sql_literal(source.get("topics_usually_covered", [])),
                    sql_literal(source.get("authority_score")),
                    sql_literal(source.get("noise_score")),
                    sql_literal(source.get("paywall_status")),
                    sql_literal(source.get("crawl_frequency_minutes")),
                    sql_literal(source.get("http_status")),
                    sql_literal(source.get("item_count")),
                    sql_literal(source.get("latest_published_at")),
                    sql_literal(source.get("last_successful_fetch")),
                    sql_literal(source.get("error_status")),
                    sql_literal(source.get("active")),
                ]
            )
            + ")"
        )

    sql = """-- Seeded from data/source_registry_v1.json after live RSS reachability checks.
insert into public.source (
  source_id,
  name,
  url,
  rss_url,
  final_rss_url,
  language,
  country_region,
  source_type,
  topics_usually_covered,
  authority_score,
  noise_score,
  paywall_status,
  crawl_frequency_minutes,
  http_status,
  item_count,
  latest_published_at,
  last_successful_fetch,
  error_status,
  active
) values
"""
    sql += ",\n".join(rows)
    sql += """
on conflict (source_id) do update set
  name = excluded.name,
  url = excluded.url,
  rss_url = excluded.rss_url,
  final_rss_url = excluded.final_rss_url,
  language = excluded.language,
  country_region = excluded.country_region,
  source_type = excluded.source_type,
  topics_usually_covered = excluded.topics_usually_covered,
  authority_score = excluded.authority_score,
  noise_score = excluded.noise_score,
  paywall_status = excluded.paywall_status,
  crawl_frequency_minutes = excluded.crawl_frequency_minutes,
  http_status = excluded.http_status,
  item_count = excluded.item_count,
  latest_published_at = excluded.latest_published_at,
  last_successful_fetch = excluded.last_successful_fetch,
  error_status = excluded.error_status,
  active = excluded.active,
  updated_at = now();
"""
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(sql)


if __name__ == "__main__":
    main()

