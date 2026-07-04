from __future__ import annotations

import json
from typing import Any

import httpx


class SupabaseClient:
    def __init__(self, url: str, service_role_key: str) -> None:
        self.url = url.rstrip("/")
        self.headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation",
        }

    def select(self, table: str, query: str = "select=*") -> list[dict[str, Any]]:
        response = httpx.get(
            f"{self.url}/rest/v1/{table}",
            params=query,
            headers=self.headers,
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    def upsert(self, table: str, rows: list[dict[str, Any]], on_conflict: str | None = None) -> list[dict[str, Any]]:
        if not rows:
            return []
        params = {"on_conflict": on_conflict} if on_conflict else None
        headers = {**self.headers, "Prefer": "resolution=merge-duplicates,return=representation"}
        response = httpx.post(
            f"{self.url}/rest/v1/{table}",
            params=params,
            headers=headers,
            content=json.dumps(rows, ensure_ascii=False),
            timeout=60,
        )
        response.raise_for_status()
        return response.json()

    def insert(self, table: str, rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
        if not rows:
            return []
        response = httpx.post(
            f"{self.url}/rest/v1/{table}",
            headers=self.headers,
            content=json.dumps(rows, ensure_ascii=False),
            timeout=60,
        )
        response.raise_for_status()
        return response.json()

    def update(self, table: str, payload: dict[str, Any], filters: dict[str, str]) -> list[dict[str, Any]]:
        response = httpx.patch(
            f"{self.url}/rest/v1/{table}",
            params=filters,
            headers=self.headers,
            content=json.dumps(payload, ensure_ascii=False),
            timeout=60,
        )
        response.raise_for_status()
        return response.json()

    def rpc(self, function_name: str, payload: dict[str, Any] | None = None) -> Any:
        response = httpx.post(
            f"{self.url}/rest/v1/rpc/{function_name}",
            headers=self.headers,
            content=json.dumps(payload or {}, ensure_ascii=False),
            timeout=120,
        )
        response.raise_for_status()
        if response.text:
            return response.json()
        return None


def source_query(active_only: bool = True) -> str:
    if active_only:
        return "select=*&active=eq.true&order=source_id.asc"
    return "select=*&order=source_id.asc"
