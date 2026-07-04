# Needs Decision / Credentials

Last updated: 2026-07-04 (release implementation pass; see `RELEASE_PLAN.md`
for the full prioritized checklist this feeds into).

## Resolved

### Supabase project access

Status: resolved.

- Project `kypzyekydodticqddwex` exists, reachable with the credentials in
  local `.env`.
- Migrations `001_initial_schema.sql` and `002_seed_source_registry.sql` are
  applied and confirmed live via direct REST queries.
- Auth Site URL is set to `https://adamaitiss.github.io/digest/`.
- Magic-link email delivery confirmed working end-to-end: a real
  `signInWithOtp` call (the same one the app's "Send magic link" button
  makes) produced a real email from `noreply@mail.app.supabase.io` in the
  primary inbox within seconds. Previously this had only been tested with
  admin-generated links, not the real send path.
- Migration `003_release_hardening.sql` is now applied live. The
  `authorized_auth_email` allowlist contains only
  `stanislav.adamaytis@gmail.com`, `is_authorized_user()` exists, and the
  Before User Created hook rejects unauthorized sign-ups with
  "This digest is private."

### GitHub Pages production config

Status: resolved.

- Repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  confirmed set via `gh secret list --repo adamaitiss/digest`.
- CI and Deploy Pages workflows both green on current HEAD (`281222d`): runs
  `28711144914` / `28711144913`.
- "Live Pages Smoke" workflow passed today against the real production URL
  (`28710933294`), covering authenticated login through Saved/Unsave with
  zero console errors/warnings.

### Yandex scoped service-account role binding

Status: resolved.

- Verified directly with `yc resource-manager folder list-access-bindings
  --id b1gj5q3o1k1v91qo20td`: service account `digest-pipeline`
  (`ajeafj047mmd4vpvhfqc`) holds `functions.functionInvoker`,
  `ai.models.user`, `ai.languageModels.user`.

### Yandex Cloud deployment and live pipeline

Status: resolved, and now confirmed running on its **own schedule**, not just
manually.

- All 5 functions ACTIVE, all 5 Timer triggers present with cron expressions
  matching `RUNBOOK.md` exactly.
- A full ingest → enrich → cluster_rank cycle fired automatically (via Timer,
  not a manual invoke) at 16:00–16:47 UTC on 2026-07-04, after the day's
  earlier manual/debugging runs — confirmed via `job_run` timestamps lining
  up with the cron expressions to the minute.

### Single-user privacy hardening

Status: resolved.

The stray test account
(`codex-live-smoke@users.noreply.github.com`,
`a0e49efa-11f4-475e-ab91-442c2a2883c0`) was deleted through the
Supabase Admin API, and its dependent `user_profile`, `training_session`,
`user_signal`, and `saved_item` rows are gone. `cluster_rank` and
`generate_digest` now resolve the profile through `authorized_auth_email`
instead of choosing the newest arbitrary profile. A live `generate_digest`
invoke completed successfully and updated digest
`05641840-e28a-4c9c-bcf2-0978faaaf420` for user
`8588629c-8f9c-44c5-aeef-c0119512cac5`.

## Still Open

### Out-of-band health alert destination

Status: intentionally skipped for this release.

- `ALERT_WEBHOOK_URL` is still empty. Health failures are recorded in
  Supabase `job_run` only, no external alert is sent.

Next action:

- Provide a webhook URL later (e.g. Telegram bot + chat ID, or an `ntfy.sh`
  topic) if out-of-band health alerts should be enabled, then redeploy Yandex
  functions.

### `test:db` still can't run in this environment

Status: open, environment limitation, not a code problem.

- Docker is installed but the daemon is not available here
  (`/var/run/docker.sock` unreachable), so the
  expanded `scripts/validate_supabase_migrations.sh` (which now also checks
  migration 003's allowlist function and new RPCs) has not been executed in
  this session. It should be run once on a machine with Docker before fully
  trusting the new migration's automated test coverage — the manual REST
  checks in this audit only confirm today's live *absence* of migration 003,
  not that its logic is bug-free once applied.

### Source ingestion failures

Status: partially fixed and deployed.

- Deutsche Welle, BBC News World, Meduza, The Bell: self-signed certificate
  verification failures (likely a CA bundle gap in the Yandex Python 3.12
  runtime). Per release decision, this pass does not disable TLS verification
  for those sources.
- Kommersant (all 3 feeds): fixed live after browser-compatible RSS headers
  and Yandex redeploy.
- POLITICO Europe: still returns `403 Forbidden` from the Yandex runtime
  despite the browser-compatible headers working locally.
- 41/49 sources are healthy; RU/EN balance is fine today (26 EN / 23 RU
  active, 488/482 articles) despite the PRD's stated risk (6.7) of thin
  Russian coverage.
