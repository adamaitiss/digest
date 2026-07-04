from __future__ import annotations

import json
import time
from dataclasses import dataclass
from typing import Any

import httpx

from .config import WorkerConfig


EMBED_ENDPOINT = "https://llm.api.cloud.yandex.net/foundationModels/v1/textEmbedding"
ASYNC_COMPLETION_ENDPOINT = "https://ai.api.cloud.yandex.net/foundationModels/v1/completionAsync"
OPERATION_ENDPOINT = "https://operation.api.cloud.yandex.net/operations/{operation_id}"
CLASSIFIER_ENDPOINT = "https://ai.api.cloud.yandex.net/foundationModels/v1/fewShotTextClassification"

TOPIC_LABELS = [
    "business",
    "economy",
    "markets",
    "technology",
    "ai",
    "policy_regulation",
    "central_banks",
    "energy",
    "geopolitics",
    "companies",
    "science",
    "global_news",
]


@dataclass(frozen=True)
class AiUsage:
    model_uri: str
    task: str
    input_tokens: int
    output_tokens: int
    estimated_cost_usd: float


class YandexAI:
    def __init__(self, config: WorkerConfig) -> None:
        if not config.yandex_folder_id:
            raise ValueError("YANDEX_FOLDER_ID is required")
        self.folder_id = config.yandex_folder_id
        self.headers = {"Content-Type": "application/json"}
        if config.yandex_iam_token:
            self.headers["Authorization"] = f"Bearer {config.yandex_iam_token}"
            self.headers["x-folder-id"] = self.folder_id
        elif config.yandex_api_key:
            self.headers["Authorization"] = f"Api-Key {config.yandex_api_key}"
        else:
            raise ValueError("YANDEX_API_KEY or YANDEX_IAM_TOKEN is required")

    def embed_doc(self, text: str) -> tuple[list[float], AiUsage]:
        model_uri = f"emb://{self.folder_id}/text-embeddings-v2-doc/"
        response = httpx.post(
            EMBED_ENDPOINT,
            headers=self.headers,
            json={"modelUri": model_uri, "text": text[:6000], "dim": "256"},
            timeout=60,
        )
        response.raise_for_status()
        data = response.json()
        tokens = int(data.get("numTokens") or 0)
        return [float(value) for value in data["embedding"]], AiUsage(
            model_uri=model_uri,
            task="embedding",
            input_tokens=tokens,
            output_tokens=0,
            estimated_cost_usd=tokens / 1000 * 0.0000827869,
        )

    def classify_topic(self, text: str) -> tuple[str, AiUsage]:
        model_uri = f"cls://{self.folder_id}/yandexgpt-lite/latest"
        response = httpx.post(
            CLASSIFIER_ENDPOINT,
            headers=self.headers,
            json={
                "modelUri": model_uri,
                "text": text[:3500],
                "taskDescription": "Categorize a news article by its title and snippet.",
                "labels": TOPIC_LABELS,
            },
            timeout=60,
        )
        response.raise_for_status()
        predictions = response.json().get("predictions", [])
        label = max(predictions, key=lambda item: item.get("confidence", 0)).get("label", "global_news")
        return str(label), AiUsage(
            model_uri=model_uri,
            task="topic_classifier",
            input_tokens=0,
            output_tokens=0,
            estimated_cost_usd=0.00125,
        )

    def extract_metadata(self, source_text: str) -> tuple[dict[str, Any], AiUsage]:
        model_uri = f"gpt://{self.folder_id}/yandexgpt-5-lite"
        prompt = {
            "modelUri": model_uri,
            "completionOptions": {
                "stream": False,
                "temperature": 0.1,
                "maxTokens": "900",
                "reasoningOptions": {"mode": "DISABLED"},
            },
            "messages": [
                {
                    "role": "system",
                    "text": (
                        "Return strict JSON for a news item. Use only facts present in SOURCE. "
                        "No invented names, numbers, quotes, or claims. Keys: countries array, "
                        "entities array, event_type string, business_significance_score number 0-1, "
                        "novelty_score number 0-1, summary string, why_it_matters string, confidence_note string."
                    ),
                },
                {"role": "user", "text": f"SOURCE:\n{source_text[:7000]}"},
            ],
        }
        operation = httpx.post(ASYNC_COMPLETION_ENDPOINT, headers=self.headers, json=prompt, timeout=60)
        operation.raise_for_status()
        result = self._wait_operation(operation.json()["id"])
        response = result["response"]
        text = response["alternatives"][0]["message"]["text"]
        usage = response.get("usage", {})
        parsed = parse_json_object(text)
        input_tokens = int(usage.get("inputTextTokens") or 0)
        output_tokens = int(usage.get("completionTokens") or 0)
        return parsed, AiUsage(
            model_uri=model_uri,
            task="metadata_summary",
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            estimated_cost_usd=(input_tokens + output_tokens) / 1000 * 0.000819672,
        )

    def _wait_operation(self, operation_id: str) -> dict[str, Any]:
        for _ in range(60):
            response = httpx.get(OPERATION_ENDPOINT.format(operation_id=operation_id), headers=self.headers, timeout=30)
            response.raise_for_status()
            data = response.json()
            if data.get("done"):
                return data
            time.sleep(5)
        raise TimeoutError(f"Yandex operation did not finish: {operation_id}")


def parse_json_object(value: str) -> dict[str, Any]:
    text = value.strip()
    if text.startswith("```"):
        text = text.strip("`")
        text = text.removeprefix("json").strip()
    start = text.find("{")
    end = text.rfind("}")
    if start >= 0 and end > start:
        text = text[start : end + 1]
    return json.loads(text)

