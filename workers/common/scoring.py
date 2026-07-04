from __future__ import annotations

import math
from datetime import UTC, datetime
from typing import Any


def score_article(article: dict[str, Any], profile: dict[str, Any] | None = None) -> dict[str, float]:
    published_at = parse_datetime(article.get("published_at"))
    recency_hours = (datetime.now(UTC) - published_at).total_seconds() / 3600 if published_at else 72
    freshness = max(0.0, 1.0 - recency_hours / 72.0)
    source_quality = float(article.get("source_quality_score") or 0.5)
    business = float(article.get("business_significance_score") or 0.45)
    novelty = float(article.get("novelty_score") or 0.45)
    must_know = float(article.get("must_know_score") or infer_must_know(article))
    personal = personal_relevance(article, profile)
    exploration = float(article.get("exploration_score") or novelty * 0.5)
    total = clamp(personal * 0.45 + must_know * 0.22 + business * 0.14 + source_quality * 0.08 + freshness * 0.07 + exploration * 0.04)
    return {
        "total": total,
        "personal": personal,
        "must_know": must_know,
        "business": business,
        "freshness": freshness,
        "exploration": exploration,
    }


def personal_relevance(article: dict[str, Any], profile: dict[str, Any] | None) -> float:
    if not profile:
        return 0.35
    topics = profile.get("learned_topic_weights") or {}
    countries = profile.get("learned_country_weights") or {}
    entities = profile.get("learned_entity_weights") or {}
    topic = article.get("topic")
    topic_score = float(topics.get(topic, 0.3)) if topic else 0.3
    country_score = max((float(countries.get(country, 0.2)) for country in article.get("countries", []) or []), default=0.2)
    entity_score = max((float(entities.get(entity, 0.2)) for entity in article.get("entities", []) or []), default=0.2)
    return clamp(topic_score * 0.45 + country_score * 0.25 + entity_score * 0.25 + 0.05)


def infer_must_know(article: dict[str, Any]) -> float:
    topic = str(article.get("topic") or "")
    source_quality = float(article.get("source_quality_score") or 0.5)
    business = float(article.get("business_significance_score") or 0.45)
    official = bool(article.get("official_source"))
    topic_boost = 0.2 if topic in {"central_banks", "policy_regulation", "markets", "geopolitics"} else 0.0
    return clamp(source_quality * 0.35 + business * 0.35 + topic_boost + (0.1 if official else 0.0))


def parse_datetime(value: Any) -> datetime | None:
    if not value:
        return None
    try:
        text = str(value).replace("Z", "+00:00")
        parsed = datetime.fromisoformat(text)
        return parsed.astimezone(UTC)
    except ValueError:
        return None


def cosine_similarity(left: list[float] | None, right: list[float] | None) -> float:
    if not left or not right or len(left) != len(right):
        return 0.0
    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return dot / (left_norm * right_norm)


def clamp(value: float) -> float:
    return min(1.0, max(0.0, value))

