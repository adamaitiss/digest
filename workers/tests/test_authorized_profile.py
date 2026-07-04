from __future__ import annotations

import unittest
from datetime import UTC, datetime, timedelta
from typing import Any
from unittest.mock import patch

from common.profile import authorized_user_profile
from functions import cluster_rank, generate_digest


REAL_USER_ID = "8588629c-8f9c-44c5-aeef-c0119512cac5"
SMOKE_USER_ID = "a0e49efa-11f4-475e-ab91-442c2a2883c0"


class FakeSupabase:
    def __init__(
        self,
        *,
        allowlist: list[dict[str, Any]] | None = None,
        auth_users: list[dict[str, Any]] | None = None,
        profiles: list[dict[str, Any]] | None = None,
        clusters: list[dict[str, Any]] | None = None,
        articles: list[dict[str, Any]] | None = None,
        digest_items: list[dict[str, Any]] | None = None,
    ) -> None:
        self.allowlist = allowlist or []
        self.auth_users = auth_users or []
        self.profiles = profiles or []
        self.clusters = clusters or []
        self.articles = articles or []
        self.digest_items = digest_items or []
        self.upserts: dict[str, list[dict[str, Any]]] = {}
        self.updates: list[tuple[str, dict[str, Any], dict[str, str]]] = []
        self.deletes: list[tuple[str, dict[str, str]]] = []

    def list_auth_users(self) -> list[dict[str, Any]]:
        return self.auth_users

    def select(self, table: str, query: str = "select=*") -> list[dict[str, Any]]:
        if table == "authorized_auth_email":
            return self.allowlist
        if table == "user_profile":
            if "user_id=eq." in query:
                user_id = query.split("user_id=eq.", 1)[1].split("&", 1)[0]
                return [profile for profile in self.profiles if profile["user_id"] == user_id]
            return self.profiles
        if table == "event_cluster":
            return self.clusters
        if table == "ai_cost_log":
            return [{"estimated_cost_usd": 0.0123}]
        if table == "article":
            return self.articles
        if table == "digest_item":
            return self.digest_items
        return []

    def upsert(self, table: str, rows: list[dict[str, Any]], on_conflict: str | None = None) -> list[dict[str, Any]]:
        self.upserts.setdefault(table, []).extend(rows)
        if table == "digest":
            return [{**rows[0], "digest_id": "digest-1"}]
        if table == "event_cluster":
            return [{**row, "cluster_id": f"cluster-{index}"} for index, row in enumerate(rows, start=1)]
        return rows

    def update(self, table: str, payload: dict[str, Any], filters: dict[str, str]) -> list[dict[str, Any]]:
        self.updates.append((table, payload, filters))
        return []

    def delete(self, table: str, filters: dict[str, str]) -> list[dict[str, Any]]:
        self.deletes.append((table, filters))
        return []


def profile(user_id: str, updated_at: str, topic_score: float = 0.3) -> dict[str, Any]:
    return {
        "user_id": user_id,
        "updated_at": updated_at,
        "learned_topic_weights": {"central_banks": topic_score},
        "learned_country_weights": {},
        "learned_entity_weights": {},
    }


def digest_cluster() -> dict[str, Any]:
    now = datetime.now(UTC).isoformat().replace("+00:00", "Z")
    return {
        "cluster_id": "cluster-1",
        "representative_headline": "Fed signals caution on rate cuts",
        "representative_summary": "Fed signals caution on rate cuts.",
        "topic": "central_banks",
        "source_count": 1,
        "supporting_sources": [],
        "latest_update_at": now,
        "must_know_score": 0.8,
        "personal_relevance_score": 0.7,
        "ranking_score": 0.9,
    }


class AuthorizedProfileTests(unittest.TestCase):
    def test_ignores_newer_unauthorized_profile(self) -> None:
        supabase = FakeSupabase(
            allowlist=[{"email": "stanislav.adamaytis@gmail.com"}],
            auth_users=[
                {"id": SMOKE_USER_ID, "email": "codex-live-smoke@users.noreply.github.com"},
                {"id": REAL_USER_ID, "email": "stanislav.adamaytis@gmail.com"},
            ],
            profiles=[
                profile(SMOKE_USER_ID, "2026-07-04T15:29:58Z", topic_score=1.0),
                profile(REAL_USER_ID, "2026-07-04T13:50:52Z", topic_score=0.4),
            ],
        )

        self.assertEqual(authorized_user_profile(supabase)["user_id"], REAL_USER_ID)  # type: ignore[index]

    def test_allowlist_email_matching_is_case_insensitive(self) -> None:
        supabase = FakeSupabase(
            allowlist=[{"email": "Stanislav.Adamaytis@Gmail.Com"}],
            auth_users=[{"id": REAL_USER_ID, "email": "stanislav.adamaytis@gmail.com"}],
            profiles=[profile(REAL_USER_ID, "2026-07-04T13:50:52Z")],
        )

        self.assertEqual(authorized_user_profile(supabase)["user_id"], REAL_USER_ID)  # type: ignore[index]

    def test_no_authorized_profile_returns_none(self) -> None:
        supabase = FakeSupabase(
            allowlist=[{"email": "stanislav.adamaytis@gmail.com"}],
            auth_users=[{"id": REAL_USER_ID, "email": "stanislav.adamaytis@gmail.com"}],
            profiles=[],
        )

        self.assertIsNone(authorized_user_profile(supabase))

    def test_generate_digest_targets_authorized_user(self) -> None:
        supabase = FakeSupabase(
            allowlist=[{"email": "stanislav.adamaytis@gmail.com"}],
            auth_users=[
                {"id": SMOKE_USER_ID, "email": "codex-live-smoke@users.noreply.github.com"},
                {"id": REAL_USER_ID, "email": "stanislav.adamaytis@gmail.com"},
            ],
            profiles=[
                profile(SMOKE_USER_ID, "2026-07-04T15:29:58Z", topic_score=1.0),
                profile(REAL_USER_ID, "2026-07-04T13:50:52Z", topic_score=0.4),
            ],
            clusters=[digest_cluster()],
        )

        result = generate_digest.run(None, supabase)

        self.assertTrue(result["digest_created"])
        self.assertEqual(supabase.upserts["digest"][0]["user_id"], REAL_USER_ID)

    def test_generate_digest_has_clear_no_authorized_profile_reason(self) -> None:
        supabase = FakeSupabase(
            allowlist=[{"email": "stanislav.adamaytis@gmail.com"}],
            auth_users=[{"id": REAL_USER_ID, "email": "stanislav.adamaytis@gmail.com"}],
            profiles=[],
            clusters=[digest_cluster()],
        )

        self.assertEqual(
            generate_digest.run(None, supabase),
            {"digest_created": False, "reason": "no_authorized_user_profile"},
        )

    def test_generate_digest_detaches_feedback_signals_before_replacing_items(self) -> None:
        supabase = FakeSupabase(
            allowlist=[{"email": "stanislav.adamaytis@gmail.com"}],
            auth_users=[{"id": REAL_USER_ID, "email": "stanislav.adamaytis@gmail.com"}],
            profiles=[profile(REAL_USER_ID, "2026-07-04T13:50:52Z")],
            clusters=[digest_cluster()],
            digest_items=[{"digest_item_id": "old-item-1"}],
        )

        generate_digest.run(None, supabase)

        self.assertIn(("digest_item", {"digest_id": "eq.digest-1"}), supabase.deletes)
        self.assertIn(
            ("user_signal", {"digest_item_id": None}, {"digest_item_id": "eq.old-item-1"}),
            supabase.updates,
        )

    def test_cluster_rank_continues_without_personal_profile(self) -> None:
        article = {
            "article_id": "article-1",
            "article_key": "article-key",
            "title": "Central bank update",
            "published_at": (datetime.now(UTC) - timedelta(hours=1)).isoformat().replace("+00:00", "Z"),
            "fetched_at": datetime.now(UTC).isoformat().replace("+00:00", "Z"),
            "source_id": "source-1",
            "canonical_url": "https://example.com/article",
            "topic": "central_banks",
        }
        supabase = FakeSupabase(articles=[article])
        seen_profiles: list[dict[str, Any] | None] = []

        def score_with_capture(candidate: dict[str, Any], candidate_profile: dict[str, Any] | None = None) -> dict[str, float]:
            seen_profiles.append(candidate_profile)
            return {"total": 0.5, "personal": 0.35, "must_know": 0.4}

        with patch.object(cluster_rank, "score_article", side_effect=score_with_capture):
            result = cluster_rank.run(None, supabase)

        self.assertEqual(result["articles_ranked"], 1)
        self.assertTrue(seen_profiles)
        self.assertTrue(all(candidate is None for candidate in seen_profiles))


if __name__ == "__main__":
    unittest.main()
