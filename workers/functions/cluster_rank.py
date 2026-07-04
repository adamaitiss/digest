from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from common.clustering import cluster_articles
from common.job import run_job
from common.profile import authorized_user_profile
from common.scoring import score_article
from common.supabase import SupabaseClient


def run(_config: Any, supabase: SupabaseClient) -> dict[str, Any]:
    horizon = (datetime.now(UTC) - timedelta(days=3)).isoformat().replace("+00:00", "Z")
    articles = supabase.select(
        "article",
        f"select=*&published_at=gte.{horizon}&order=published_at.desc&limit=600",
    )
    profile = authorized_user_profile(supabase)
    groups = cluster_articles(articles)
    cluster_rows: list[dict[str, Any]] = []
    article_updates = 0

    for group in groups:
        ranked_articles = sorted(group, key=lambda article: score_article(article, profile)["total"], reverse=True)
        representative = ranked_articles[0]
        score = score_article(representative, profile)
        source_links = [
            {
                "sourceName": article.get("source_name") or article.get("source_id"),
                "url": article.get("canonical_url"),
            }
            for article in ranked_articles
            if article.get("canonical_url")
        ][:5]
        cluster_key = representative.get("cluster_key") or representative.get("article_key")
        cluster_rows.append(
            {
                "cluster_key": cluster_key,
                "representative_headline": representative.get("title"),
                "representative_summary": representative.get("summary"),
                "topic": representative.get("topic"),
                "countries": representative.get("countries") or [],
                "entities": representative.get("entities") or [],
                "event_type": representative.get("event_type"),
                "first_seen_at": min(article.get("published_at") or article.get("fetched_at") for article in ranked_articles),
                "latest_update_at": max(article.get("published_at") or article.get("fetched_at") for article in ranked_articles),
                "source_count": len({article.get("source_id") for article in ranked_articles}),
                "primary_source_id": representative.get("source_id"),
                "supporting_sources": source_links,
                "business_significance_score": representative.get("business_significance_score") or 0.45,
                "must_know_score": score["must_know"],
                "novelty_score": representative.get("novelty_score") or 0.45,
                "personal_relevance_score": score["personal"],
                "ranking_score": score["total"],
                "deduplication_confidence": 0.95 if len(ranked_articles) > 1 else 0.65,
            }
        )

    upserted = supabase.upsert("event_cluster", cluster_rows, on_conflict="cluster_key")
    cluster_by_key = {row["cluster_key"]: row["cluster_id"] for row in upserted}
    for group in groups:
        representative = sorted(group, key=lambda article: score_article(article, profile)["total"], reverse=True)[0]
        cluster_key = representative.get("cluster_key") or representative.get("article_key")
        cluster_id = cluster_by_key.get(cluster_key)
        if not cluster_id:
            continue
        for article in group:
            supabase.update(
                "article",
                {"cluster_id": cluster_id, "ranking_score": score_article(article, profile)["total"]},
                {"article_id": f"eq.{article['article_id']}"},
            )
            article_updates += 1

    return {"articles_ranked": len(articles), "clusters_upserted": len(upserted), "article_updates": article_updates}


def handler(event: dict[str, Any] | None = None, context: Any = None) -> dict[str, Any]:
    return run_job("cluster_rank", run, context)


if __name__ == "__main__":
    print(handler())
