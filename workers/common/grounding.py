from __future__ import annotations

import re


ENTITY_PATTERN = re.compile(r"(?:[A-ZА-ЯЁ][\w&.'-]*(?:\s+[A-ZА-ЯЁ][\w&.'-]*)*)", re.UNICODE)
NUMBER_PATTERN = re.compile(r"\b\d+(?:[.,]\d+)?%?\b")


def verify_grounded(generated_text: str, source_text: str) -> dict[str, object]:
    lower_source = source_text.lower()
    missing_entities = sorted({
        normalize_entity(m.group(0).strip())
        for m in ENTITY_PATTERN.finditer(generated_text)
        if normalize_entity(m.group(0).strip()).lower() not in lower_source
    })
    missing_numbers = sorted({m.group(0).strip() for m in NUMBER_PATTERN.finditer(generated_text) if m.group(0).strip().lower() not in lower_source})
    tokens = tokenize(generated_text)
    source_tokens = set(tokenize(source_text))
    coverage = 1.0 if not tokens else sum(1 for token in tokens if token in source_tokens) / len(tokens)
    return {
        "passed": not missing_entities and not missing_numbers and coverage >= 0.45,
        "missing_entities": missing_entities,
        "missing_numbers": missing_numbers,
        "source_token_coverage": coverage,
    }


def literal_summary(title: str, snippet: str | None) -> str:
    if snippet and snippet.strip():
        summary = " ".join(snippet.split())
        return summary[:417].rstrip() + "..." if len(summary) > 420 else summary
    return f'Source text is limited to the headline: "{title}".'


def confidence_note(source_count: int, paywall_limited: bool, official: bool) -> str:
    if paywall_limited:
        return "Paywalled or limited source; summary based on headline/snippet."
    if official and source_count <= 1:
        return "Primary source is official; limited secondary coverage."
    if source_count > 1:
        return "Covered by multiple source links in this cluster."
    return "Single source; treat as preliminary."


def tokenize(value: str) -> list[str]:
    return [token for token in re.sub(r"[^\w\s]+", " ", value.lower(), flags=re.UNICODE).split() if len(token) > 2]


def normalize_entity(value: str) -> str:
    return re.sub(r"^(The|A|An|Chair|CEO|President|Minister|Mr|Ms|Mrs|Dr)\s+", "", value).strip()
