# MVP Build Report

Date: 2026-07-04 (original build), updated 2026-07-04 with a same-day
independent live-audit pass — see `RELEASE_PLAN.md` for the actionable
checklist this feeds into. The update section below takes precedence over
anything it contradicts further down in this file.

## 2026-07-04 audit update — read this first

An independent audit re-verified everything below directly against GitHub,
Yandex Cloud, and Supabase (not by re-reading these docs). Two things in the
original report below are now known to be **wrong or incomplete**:

1. **RLS is not actually single-user-hardened.** A migration
   (`supabase/migrations/003_release_hardening.sql`) adding an email
   allowlist and tightening RLS was written after this report but was never
   applied to the live database, and never committed. Confirmed directly:
   querying `authorized_auth_email` / `is_authorized_user()` against the live
   Supabase REST API returns "not found." Right now, Supabase sign-up is open
   to anyone with the Pages URL, and any authenticated user can read
   `source`, `article`, `event_cluster`, `job_run`, and `ai_cost_log` in
   full. This already produced a live consequence: a stray smoke-test account
   is currently first in line for the next automated digest generation
   instead of the founder. Full detail and fix steps in `RELEASE_PLAN.md`
   items 1–3 and `NEEDS_DECISION.md`.
2. **Row counts and cost below were a point-in-time snapshot, already
   stale within hours.** The pipeline has continued running automatically on
   its Timer schedule since this report was written. As of the audit
   (2026-07-04T18:40 UTC): `source`=49, `article`=970 (up from 871),
   `event_cluster`=685 (up from 583), `digest`=1, `digest_item`=15,
   `job_run`=17, `ai_cost_log`=399 (up from 202), cumulative AI spend today
   **$0.2198** (up from the $0.110093 single-cycle figure below — still well
   under the ~$1/day target). This is good news: it confirms the Timer
   triggers genuinely fire on schedule unattended, not just via manual
   invocation.

Additional things confirmed live in the audit that this report didn't cover:

- Magic-link email delivery was actually tested via the real send path (not
  just admin-generated links): a real email landed in the founder's inbox
  within seconds of the request.
- 8 of 49 sources (BBC News World, Deutsche Welle, Meduza, The Bell,
  Kommersant ×3, POLITICO Europe) are currently failing to fetch — SSL
  cert-verification errors and 406/403 responses. Not blocking; RU/EN
  balance is healthy regardless (26 EN / 23 RU active sources).
- The deployed site currently serves an `.svg` `apple-touch-icon`, which iOS
  Safari doesn't support for home-screen icons — likely a broken/blank PWA
  icon on a real iPhone today. A fix exists locally (uncommitted).
- A batch of real, uncommitted local changes exists in the working tree
  (optimistic training-reaction UI, Profile "Reset"/"Export" actions, the
  above icon fix, alert-payload redaction, and the migration in point 1) —
  all pass `npm run lint`, `npm run test:unit` (17/17), and `npm run build`
  in this session, but are not yet shipped. See `RELEASE_PLAN.md` item 4 for
  why they must ship *after* the migration in point 1, not before.

Everything else below (what was built, deviations, AI model choices) still
holds and wasn't contradicted by the audit.

## 2026-07-04 release implementation update

- Deleted the stray smoke-test Supabase auth user
  `codex-live-smoke@users.noreply.github.com` and verified its dependent
  profile/session/signal/saved rows are gone. Only
  `stanislav.adamaytis@gmail.com` remains in Auth.
- Applied migration 003 live and enabled the Before User Created Auth hook.
  A controlled unauthorized signup attempt now returns 403 with
  "This digest is private" and does not create an auth user.
- Added local worker hardening so `cluster_rank` and `generate_digest` resolve
  the profile through the authorized-email allowlist rather than newest
  `user_profile`. Added worker unit tests and wired them into CI.
- Added `supabase/config.toml` for the Before User Created hook and kept
  migration 003 as the required live prerequisite.
- Fixed RSS headers for header-blocked feeds and redeployed Yandex Functions.
  Kommersant Business, Finance, and News now return 200 live. POLITICO Europe
  still returns 403 from the Yandex runtime; Meduza still has an SSL EOF.
- Verification in this pass: `npm run lint`, `npm run test:unit`,
  `npm run test:workers`, `npm run build`, worker syntax check,
  `npm run test:e2e`, and `git diff --check` passed. `npm run test:db` still
  cannot run because Docker's daemon is unavailable.
- Live worker validation: `ingest` processed 49 sources / 935 article upserts,
  `cluster_rank` ranked 600 articles, and `generate_digest` updated the
  15-item digest for the authorized user. GitHub push/Pages deploy/live smoke
  still happen after commit.

## Built

- Mobile-first React/Vite/TypeScript PWA matching the PRD screens: Train, Digest, Saved, Profile, and source health.
- Supabase migration set for schema, pgvector, RLS, RPCs, and app views.
- Real RU/EN RSS source registry with 49 active feeds verified from this machine.
- Python Yandex Cloud Function workers for ingestion, enrichment, clustering/ranking, digest generation, and health checks.
- Grounding fallback/verification helpers for generated article summaries and digest summaries.
- Unit tests for scoring, clustering, and grounding.
- Playwright e2e tests for the core UI flow and PWA manifest.
- GitHub Actions CI and Pages deployment workflows without `schedule:` triggers.
- Public GitHub repository: https://github.com/adamaitiss/digest

## Live Validation Completed

- Supabase project `kypzyekydodticqddwex` verified with real credentials.
- Auth magic-link token verification succeeded for the configured user.
- Authenticated RPCs/views verified: `get_or_create_profile`, `get_training_session_state`, `source_health_status`, `training_cards_today`, `digest_today`, and `saved_items_view`.
- GitHub repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.
- GitHub Pages was enabled for workflow deployment.
- Deploy Pages workflow run `28710792194` passed on rerun attempt 2 for commit `4409a1a` and built with `VITE_USE_DEMO_DATA=false`.
- Live Pages Smoke workflow run `28710933294` passed from GitHub-hosted Chromium against `https://adamaitiss.github.io/digest/` at 402 x 874, including authenticated magic-link login, Train, card summary, Save, Digest, Useful feedback, Saved, and Unsave.
- Yandex service account `digest-pipeline` has `functions.functionInvoker`, `ai.models.user`, and `ai.languageModels.user`.
- Yandex functions and timers are deployed under `digest-pipeline`:
  - `digest-ingest`
  - `digest-enrich`
  - `digest-cluster-rank`
  - `digest-generate-digest`
  - `digest-health-check`
- Manual live pipeline run produced (see audit update above for current, higher counts):
  - `source`: 49
  - `article`: 871
  - `event_cluster`: 583
  - `digest`: 1
  - `digest_item`: 15
  - `ai_cost_log`: 202
- Latest digest: `05641840-e28a-4c9c-bcf2-0978faaaf420`, date `2026-07-04`, status `ready`, 15 items, cost estimate `$0.110093`.
- `health_check` now reports `failed_jobs=0` and `stale_sources=0` after successful reruns.

## Manual Smoke Test

This Codex environment still cannot connect directly to `github.io` / GitHub Pages IPs: `curl -4`, `curl -6`, WebKit, Chromium, and the in-app browser timed out against `https://adamaitiss.github.io/digest/`, while `github.com` and GitHub API remained reachable. To validate the deployed URL anyway, the live smoke was driven from GitHub-hosted Chromium.

Live Pages Smoke run `28710933294` passed against `https://adamaitiss.github.io/digest/` at 402 x 874:

- GitHub Pages rendered the production auth screen and PWA manifest with `display=standalone` and `start_url=/digest/`.
- A one-time Supabase magic-link token was generated for the existing live digest user, stored only as temporary repository secret `LIVE_SMOKE_MAGIC_LINK`, and deleted after the run.
- Authenticated session loaded the Train screen at iPhone width.
- Real training card opened its prepared summary.
- Save action wrote a `save` training signal.
- Digest screen opened the real 15-item digest.
- Useful feedback wrote a digest signal and updated digest item feedback.
- Saved screen opened and the Unsave action completed without app errors.
- No relevant console errors were observed.

Evidence rows:

- Recent `user_signal` rows include `save` in `training_queue` at `2026-07-04T15:32:19.719619+00:00` and `useful` in `digest` at `2026-07-04T15:32:21.329671+00:00`.
- `digest_item` rank 1 has `feedback_status=useful`.
- Latest training session rows include `cards_reacted_to=3`, `positive_count=3`, `saves_count=3` for the digest user and `cards_reacted_to=1`, `positive_count=1`, `saves_count=1` for the temporary smoke user.
- Current live counts (at the time of the original report): `source=49`, `article=871`, `event_cluster=583`, `digest=1`, `digest_item=15`, `ai_cost_log=202`, `user_signal=7`, `saved_item=1`. See audit update above for current counts.

Screenshots from the local real-backend smoke test:

- `/tmp/digest-local-train.png`
- `/tmp/digest-local-card-summary.png`
- `/tmp/digest-local-digest.png`
- `/tmp/digest-local-saved.png`

## Verification Completed Locally This Run

- `npm run lint` passed.
- `npm run test:unit` passed: 13 tests.
- `npm run build` passed.
- `PYTHONPATH=workers python3 -m compileall -q workers` passed.
- `npm run test:e2e` passed: 4 browser tests across iPhone-sized and desktop projects.
- `npm run test:db` could not run in this environment because Docker is not available at `/var/run/docker.sock`.
- GitHub Actions CI run `28709775094` passed on `main`, including Supabase migration validation and e2e.
- GitHub Pages deploy run `28709775117` passed on `main`.
- GitHub Actions CI run `28709839518` passed on `main` for commit `722326b`.
- GitHub Pages deploy run `28709839529` passed on `main` for commit `722326b`.
- GitHub Actions CI run `28710792185` passed on `main` for commit `4409a1a`.
- GitHub Pages deploy run `28710792194` passed on rerun attempt 2 for commit `4409a1a`.
- Live Pages Smoke run `28710032056` passed from GitHub-hosted infrastructure: Chromium loaded `https://adamaitiss.github.io/digest/` at 402 x 874, rendered the `Personal News Swipe Digest` auth screen, found the `Send magic link` control, fetched the manifest, verified `display=standalone` and `start_url=/digest/`, and found no relevant console errors/warnings.
- Live Pages Smoke run `28710933294` passed from GitHub-hosted infrastructure: Chromium loaded `https://adamaitiss.github.io/digest/` at 402 x 874, verified the manifest, authenticated with a one-time magic link, opened Train and a card summary, saved an item, opened the 15-item digest, marked an item Useful, opened Saved, and clicked Unsave.
- No `schedule:` triggers are present in `.github/workflows`.

(The 2026-07-04 release implementation pass re-ran lint/unit/worker
unit/build/e2e and worker syntax checks against the current working tree.
All passed except `test:db`, which is blocked by the unavailable Docker
daemon.)

## Optimization / Cleanup Pass

- Fixed Yandex deployment output so function environment variables are not printed to the terminal.
- Switched cloud function names from underscore to hyphenated names accepted by Yandex.
- Removed `__pycache__` from deployed function packages.
- Capped RSS ingestion to recent/latest 25 items per source and batched Supabase upserts.
- Deduplicated article rows before `ON CONFLICT` upsert.
- Added classifier throttling/retry for the 1 request/second Yandex quota.
- Made AI cost logging durable per enriched article.
- Added fallback handling for Yandex metadata refusals so a single refused article does not fail the pipeline.
- Regenerated digest items cleanly on same-day digest regeneration.
- Stored real measured AI cost on the digest row.
- Removed unused `DigestQuickActions`.
- Expanded `.env.example` with worker/Yandex variables.
- Added Supabase auth-state subscription and token-hash redirect handling so live magic-link redirects reliably enter the app.
- Hardened the live Pages smoke workflow with cache-busted Pages loads, a fresh auth browser context, redacted diagnostics, and an optional authenticated path.

Bundle and dependency review:

- Real production JS bundle after the auth fixes: `417.17 kB` raw / `118.83 kB` gzip.
- Full `dist`: about `256K`.
- `workers/requirements.txt` remains lightweight: `feedparser`, `httpx`, `python-dateutil`.
- Worker source tree is about `228K`.

Deferred cleanup:

- Frontend `src/lib/scoring.ts`, `src/lib/clustering.ts`, and `src/lib/grounding.ts` are test-only mirrors of behavior implemented in SQL/Python. They are retained because the current unit tests use them, but future tests should move closer to the production Python/SQL paths.
- `ALERT_WEBHOOK_URL` is still empty, so health alerts are recorded in Supabase but not sent out-of-band. Still true as of the 2026-07-04 audit.

## Deviations / Live Adjustments

- Yandex `text-embeddings-v2-doc` returned `invalid model_uri` in folder `b1gj5q3o1k1v91qo20td`; the worker uses the working 256-dimensional `emb://<folder_id>/text-search-doc/latest` embedding model. This preserves the 256-dimensional pgvector contract but differs from the stack document's v2 default.
- Yandex Classifier is synchronous-only by API design. The rest of free-form metadata generation uses Yandex asynchronous completion.
- The local Codex environment could not perform the final UI flow directly on GitHub Pages because `github.io` was unreachable from this network path; GitHub-hosted Chromium completed the deployed live smoke instead. (The 2026-07-04 audit environment *could* reach `github.io` directly via `curl`, but had no Chrome browser extension connected, so still relied on the GitHub-hosted Playwright run for interactive verification.)

## AI Cost

Measured live cost for the first 80-article enrichment cycle (original report):

- Total: `$0.110093`
- `topic_classifier`: about `$0.100000`
- `metadata_summary`: about `$0.009807`
- `embedding`: about `$0.000286`

This is below the PRD target of about `$1/day`. The first live run enriched 80 articles, not the stack document's 300-article daily estimate, because the MVP worker processes a bounded batch per run.

2026-07-04 audit: cumulative same-day spend across two enrich cycles is
**$0.2198** (`topic_classifier` ~$0.20, `metadata_summary` ~$0.0192,
`embedding` ~$0.0006) — still well under target, but see `RELEASE_PLAN.md`
item 8: the classifier's 1 req/sec ceiling means only ~160 of 970 ingested
articles have been enriched today, so cost headroom exists but enrichment
throughput, not budget, is the real constraint on digest variety.

## Still Rough / Remaining Risk

- This local Codex network still cannot reach `github.io`, so future deployed UI checks from this machine should use the GitHub-hosted smoke workflow or a different network.
- The first digest is real but ranking quality is still cold-start and contains some low-signal items; training signals now exist and should improve later runs. (Confirmed still true in the 2026-07-04 audit — e.g. a Moscow ring-road traffic accident was flagged "must-know" in today's digest.)
- Out-of-band health alerting is not active until `ALERT_WEBHOOK_URL` is supplied.
- `test:db` should be rerun on a machine with Docker available before treating local migration validation as freshly re-confirmed after these patches. Still true, and now also covers the new migration 003 allowlist/RPC checks, which have not run in this environment.
- The single-user privacy hardening migration and Auth hook are live. Remaining release risk is product/manual: run the app once on the target iPhone after Pages deploy.
