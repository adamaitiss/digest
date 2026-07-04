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
- The worker now uses the attached Yandex Cloud Function service account IAM token for AI Studio calls by default. A separate `YANDEX_API_KEY` is optional, not required, as long as the service account has the needed AI Studio access.

Why it blocks:
- Completion criteria 3 and 6 require deployed Yandex Cloud Functions and at least one real live pipeline cycle writing to Supabase.

### Yandex scoped service-account role binding

Status: blocked.

What happened:
- I created a scoped service account named `digest-pipeline` with ID `ajeafj047mmd4vpvhfqc`.
- Binding the required roles failed with `PermissionDenied`:
  - `functions.functionInvoker`
  - `ai.models.user`

Why it blocks:
- The completion criteria require the Yandex functions to run under a scoped service account.
- The existing `codex` service account has broad `editor` access, which is not the scoped runtime identity required for the live MVP.

Next action needed:
- Grant the current deploy identity permission to bind roles, or manually grant `functions.functionInvoker` and `ai.models.user` on folder `b1gj5q3o1k1v91qo20td` to service account `ajeafj047mmd4vpvhfqc`.
