from __future__ import annotations

import re
from collections import defaultdict
from typing import Any


def normalize_title(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^\w\s]+", " ", value.lower(), flags=re.UNICODE)).strip()


def title_tokens(value: str) -> set[str]:
    return {token for token in normalize_title(value).split() if len(token) > 2}


def jaccard(left: str, right: str) -> float:
    left_tokens = title_tokens(left)
    right_tokens = title_tokens(right)
    if not left_tokens and not right_tokens:
        return 1.0
    union = left_tokens | right_tokens
    return len(left_tokens & right_tokens) / len(union) if union else 0.0


def cluster_articles(articles: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    url_groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    remaining: list[dict[str, Any]] = []
    for article in articles:
        url = article.get("canonical_url")
        if url:
            url_groups[str(url)].append(article)
        else:
            remaining.append(article)

    groups = [items for items in url_groups.values() if items]
    for article in remaining:
        add_to_best_group(groups, article)

    # URL groups may still represent the same event across different sources.
    merged: list[list[dict[str, Any]]] = []
    for group in groups:
        representative = group[0]
        target = next((candidate for candidate in merged if likely_same_event(candidate[0], representative)), None)
        if target is None:
            merged.append(group)
        else:
            target.extend(group)
    return merged


def add_to_best_group(groups: list[list[dict[str, Any]]], article: dict[str, Any]) -> None:
    for group in groups:
        if likely_same_event(group[0], article):
            group.append(article)
            return
    groups.append([article])


def likely_same_event(left: dict[str, Any], right: dict[str, Any]) -> bool:
    if left.get("canonical_url") and left.get("canonical_url") == right.get("canonical_url"):
        return True
    shared_entities = set(left.get("entities") or []) & set(right.get("entities") or [])
    return jaccard(str(left.get("title") or ""), str(right.get("title") or "")) >= 0.5 and bool(shared_entities)

