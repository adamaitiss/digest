from __future__ import annotations

from typing import Any

import httpx

from .supabase import SupabaseClient


def authorized_user_profile(supabase: SupabaseClient) -> dict[str, Any] | None:
    """Return the profile for the allowlisted auth user, never an arbitrary latest profile."""
    try:
        allowlist_rows = supabase.select("authorized_auth_email", "select=email&order=email.asc")
    except httpx.HTTPStatusError:
        return None

    authorized_emails = [normalize_email(row.get("email")) for row in allowlist_rows]
    authorized_emails = [email for email in authorized_emails if email]
    if not authorized_emails:
        return None

    users_by_email: dict[str, dict[str, Any]] = {}
    for user in supabase.list_auth_users():
        email = normalize_email(user.get("email"))
        if email and email in authorized_emails and email not in users_by_email:
            users_by_email[email] = user

    for email in authorized_emails:
        user = users_by_email.get(email)
        if not user or not user.get("id"):
            continue
        profiles = supabase.select("user_profile", f"select=*&user_id=eq.{user['id']}&limit=1")
        if profiles:
            return profiles[0]
    return None


def normalize_email(value: Any) -> str:
    return str(value or "").strip().lower()
