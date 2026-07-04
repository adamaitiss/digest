from __future__ import annotations

from typing import Any

from common.grounding import confidence_note, literal_summary, verify_grounded
from common.job import run_job
from common.supabase import SupabaseClient
from common.yandex_ai import AiUsage, YandexAI


def run(config: Any, supabase: SupabaseClient) -> dict[str, Any]:
    articles = supabase.select(
        "article",
        "select=*&embedding=is.null&order=published_at.desc.nullslast&limit=80",
    )
    ai = YandexAI(config) if config.use_ai else None
    enriched = 0
    usage_rows: list[dict[str, Any]] = []
    for article in articles:
        source_text = "\n".join([str(article.get("title") or ""), str(article.get("snippet") or "")]).strip()
        updates: dict[str, Any] = {}
        if ai:
            embedding, usage = ai.embed_doc(source_text)
            usage_rows.append(usage_to_row(usage, article.get("article_id")))
            topic, usage = ai.classify_topic(source_text)
            usage_rows.append(usage_to_row(usage, article.get("article_id")))
            metadata, usage = ai.extract_metadata(source_text)
            usage_rows.append(usage_to_row(usage, article.get("article_id")))
            summary = str(metadata.get("summary") or literal_summary(str(article.get("title")), article.get("snippet")))
            grounding = verify_grounded(summary, source_text)
            if not grounding["passed"]:
                summary = literal_summary(str(article.get("title")), article.get("snippet"))
            updates = {
                "embedding": vector_literal(embedding),
                "topic": topic,
                "countries": metadata.get("countries") or [],
                "entities": metadata.get("entities") or [],
                "event_type": metadata.get("event_type"),
                "business_significance_score": metadata.get("business_significance_score") or 0.45,
                "novelty_score": metadata.get("novelty_score") or 0.45,
                "summary": summary,
                "why_it_matters": metadata.get("why_it_matters") or "",
                "confidence_note": metadata.get("confidence_note") or confidence_note(1, bool(article.get("paywall_limited")), False),
                "grounding_passed": bool(grounding["passed"]),
                "grounding_report": grounding,
            }
        else:
            updates = deterministic_enrichment(article)
        supabase.update("article", updates, {"article_id": f"eq.{article['article_id']}"})
        enriched += 1

    if usage_rows:
        supabase.insert("ai_cost_log", usage_rows)
    return {"articles_enriched": enriched, "ai_enabled": bool(ai), "ai_calls_logged": len(usage_rows)}


def deterministic_enrichment(article: dict[str, Any]) -> dict[str, Any]:
    source_text = "\n".join([str(article.get("title") or ""), str(article.get("snippet") or "")])
    topic = infer_topic(source_text)
    summary = literal_summary(str(article.get("title") or ""), article.get("snippet"))
    return {
        "topic": topic,
        "countries": [],
        "entities": [],
        "event_type": topic,
        "business_significance_score": 0.55 if topic in {"markets", "economy", "policy_regulation"} else 0.42,
        "novelty_score": 0.45,
        "summary": summary,
        "why_it_matters": "This item may affect one of the tracked business, technology, policy, or market themes.",
        "confidence_note": confidence_note(1, bool(article.get("paywall_limited")), False),
        "grounding_passed": True,
        "grounding_report": {"passed": True, "fallback": "deterministic_no_ai"},
    }


def infer_topic(text: str) -> str:
    lowered = text.lower()
    if any(word in lowered for word in ["rate", "inflation", "central bank", "банк", "инфляц"]):
        return "central_banks"
    if any(word in lowered for word in ["ai", "искусствен", "technology", "tech"]):
        return "technology"
    if any(word in lowered for word in ["market", "stock", "shares", "акци", "рын"]):
        return "markets"
    if any(word in lowered for word in ["regulation", "rule", "закон", "регули"]):
        return "policy_regulation"
    return "global_news"


def vector_literal(values: list[float]) -> str:
    return "[" + ",".join(f"{value:.8f}" for value in values) + "]"


def usage_to_row(usage: AiUsage, article_id: Any) -> dict[str, Any]:
    return {
        "task": usage.task,
        "model_uri": usage.model_uri,
        "article_id": article_id,
        "input_tokens": usage.input_tokens,
        "output_tokens": usage.output_tokens,
        "estimated_cost_usd": usage.estimated_cost_usd,
    }


def handler(event: dict[str, Any] | None = None, context: Any = None) -> dict[str, Any]:
    return run_job("enrich", run, context)


if __name__ == "__main__":
    print(handler())
