from __future__ import annotations

from collections import defaultdict
from datetime import UTC, date, datetime, timedelta
from typing import Any

from common.grounding import confidence_note, literal_summary, verify_grounded
from common.job import run_job
from common.supabase import SupabaseClient


GROUP_NAMES = {
    "central_banks": "Markets and Policy",
    "markets": "Markets and Companies",
    "economy": "Business and Economy",
    "business": "Business and Economy",
    "technology": "Technology and AI",
    "ai": "Technology and AI",
    "policy_regulation": "Policy and Regulation",
    "energy": "Energy and Macro",
    "geopolitics": "Global Context",
    "global_news": "Global Context",
}


def run(_config: Any, supabase: SupabaseClient) -> dict[str, Any]:
    profiles = supabase.select("user_profile", "select=*&order=updated_at.desc&limit=1")
    if not profiles:
        return {"digest_created": False, "reason": "no_user_profile"}
    profile = profiles[0]
    user_id = profile["user_id"]
    today = date.today().isoformat()
    horizon = (datetime.now(UTC) - timedelta(days=3)).isoformat().replace("+00:00", "Z")
    clusters = supabase.select(
        "event_cluster",
        f"select=*&latest_update_at=gte.{horizon}&order=ranking_score.desc&limit=80",
    )
    enriched_clusters = [cluster for cluster in clusters if str(cluster.get("representative_summary") or "").strip()]
    selected = select_digest_clusters(enriched_clusters if len(enriched_clusters) >= 10 else clusters)
    cost_estimate = ai_cost_today(supabase, today)
    digest = supabase.upsert(
        "digest",
        [
            {
                "user_id": user_id,
                "digest_date": today,
                "generated_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
                "item_count": len(selected),
                "topic_groups": sorted({group_name(cluster) for cluster in selected}),
                "status": "ready",
                "cost_estimate_usd": cost_estimate,
            }
        ],
        on_conflict="user_id,digest_date",
    )[0]
    digest_id = digest["digest_id"]
    supabase.delete("digest_item", {"digest_id": f"eq.{digest_id}"})

    item_rows = []
    for rank, cluster in enumerate(selected, start=1):
        source_text = "\n".join(
            [
                str(cluster.get("representative_headline") or ""),
                str(cluster.get("representative_summary") or ""),
            ]
        )
        summary = str(cluster.get("representative_summary") or "")
        if not summary.strip():
            summary = literal_summary(str(cluster.get("representative_headline") or ""), None)
        if not verify_grounded(summary, source_text)["passed"]:
            summary = literal_summary(str(cluster.get("representative_headline") or ""), summary)
        topic = str(cluster.get("topic") or "global_news")
        source_count = int(cluster.get("source_count") or 1)
        item_rows.append(
            {
                "digest_id": digest_id,
                "cluster_id": cluster["cluster_id"],
                "group_name": group_name(cluster),
                "title": cluster.get("representative_headline"),
                "summary": summary,
                "why_it_matters": why_it_matters(topic),
                "why_selected": why_selected(cluster),
                "source_links": cluster.get("supporting_sources") or [],
                "confidence_note": confidence_note(source_count, False, False),
                "rank": rank,
            }
        )
    if item_rows:
        supabase.upsert("digest_item", item_rows, on_conflict="digest_id,cluster_id")
    return {"digest_created": True, "digest_id": digest_id, "items": len(item_rows)}


def ai_cost_today(supabase: SupabaseClient, today: str) -> float:
    rows = supabase.select(
        "ai_cost_log",
        f"select=estimated_cost_usd&created_at=gte.{today}T00:00:00Z",
    )
    return round(sum(float(row.get("estimated_cost_usd") or 0) for row in rows), 6)


def select_digest_clusters(clusters: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if len(clusters) <= 15:
        return clusters
    by_group: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for cluster in clusters:
        by_group[group_name(cluster)].append(cluster)

    selected: list[dict[str, Any]] = []
    # Recall-first: reserve room for must-know clusters before pure personalization.
    must_know = sorted(clusters, key=lambda item: float(item.get("must_know_score") or 0), reverse=True)[:4]
    for cluster in must_know:
        if cluster not in selected:
            selected.append(cluster)
    for group_clusters in by_group.values():
        for cluster in group_clusters[:2]:
            if cluster not in selected:
                selected.append(cluster)
            if len(selected) >= 15:
                return selected
    for cluster in clusters:
        if cluster not in selected:
            selected.append(cluster)
        if len(selected) >= 15:
            break
    return selected[:15]


def group_name(cluster: dict[str, Any]) -> str:
    return GROUP_NAMES.get(str(cluster.get("topic") or "global_news"), "Exploration / Worth Knowing")


def why_it_matters(topic: str) -> str:
    if topic in {"central_banks", "markets", "economy"}:
        return "This can affect market pricing, business conditions, or macro expectations."
    if topic in {"technology", "ai"}:
        return "This may affect technology strategy, regulation, or competitive positioning."
    if topic == "policy_regulation":
        return "Policy changes can alter operating constraints and market behavior."
    return "This is included as part of the recall-first must-know layer."


def why_selected(cluster: dict[str, Any]) -> str:
    if float(cluster.get("must_know_score") or 0) >= 0.7:
        return "Selected by the must-know layer despite personal ranking not being the only factor."
    if float(cluster.get("personal_relevance_score") or 0) >= 0.6:
        return "Selected because it matches your learned topic, country, entity, or source preferences."
    return "Selected as an exploration item to prevent a narrow filter bubble."


def handler(event: dict[str, Any] | None = None, context: Any = None) -> dict[str, Any]:
    return run_job("generate_digest", run, context)


if __name__ == "__main__":
    print(handler())
