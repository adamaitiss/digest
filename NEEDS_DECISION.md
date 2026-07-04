# Needs Decision / Credentials

Last updated: 2026-07-04

## Blocking Live MVP Completion

### Supabase project access

Status: blocked.

What is missing:
- No Supabase CLI is installed locally.
- No `SUPABASE_ACCESS_TOKEN`, project ref, database URL, anon key, or service-role key is available in the local environment.
- A Playwright browser check of `https://supabase.com/dashboard/projects` redirected to the Supabase sign-in page, so the browser automation context does not have the already-authenticated dashboard session described in the goal.

Why it blocks:
- I cannot provision the Supabase project, apply `supabase/migrations/*.sql`, configure magic-link Site URL/redirects, obtain the public anon key for the PWA build, or set the service-role key for Yandex Cloud Functions without authenticated Supabase project access.
- Completion criteria 2, 6, 7, and 8 require live Supabase verification, not local/demo data.
- The GitHub Pages workflow now intentionally fails unless `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` repository secrets are set, so a demo-backed production PWA is not accidentally published.

Next action needed:
- Provide a Supabase access token/project ref/service-role key through a secure local mechanism, or open an authenticated Supabase dashboard session in the browser context Codex can control.

### Yandex Cloud deployment depends on Supabase outputs

Status: partially available, blocked downstream.

What is available:
- The local Yandex CLI has an active cloud/folder configuration.

What is still missing or downstream:
- Yandex function deployment requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which come from the blocked Supabase setup.
- The deployment script also expects an AI Studio API key or equivalent function environment credential for model calls.

Why it blocks:
- Completion criteria 3 and 6 require deployed Yandex Cloud Functions and at least one real live pipeline cycle writing to Supabase.
