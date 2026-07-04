# MVP Build Report

Date: 2026-07-04

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
- Manual live pipeline run produced:
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
- Current live counts: `source=49`, `article=871`, `event_cluster=583`, `digest=1`, `digest_item=15`, `ai_cost_log=202`, `user_signal=7`, `saved_item=1`.

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
- `ALERT_WEBHOOK_URL` is still empty, so health alerts are recorded in Supabase but not sent out-of-band.

## Deviations / Live Adjustments

- Yandex `text-embeddings-v2-doc` returned `invalid model_uri` in folder `b1gj5q3o1k1v91qo20td`; the worker uses the working 256-dimensional `emb://<folder_id>/text-search-doc/latest` embedding model. This preserves the 256-dimensional pgvector contract but differs from the stack document's v2 default.
- Yandex Classifier is synchronous-only by API design. The rest of free-form metadata generation uses Yandex asynchronous completion.
- The local Codex environment could not perform the final UI flow directly on GitHub Pages because `github.io` was unreachable from this network path; GitHub-hosted Chromium completed the deployed live smoke instead.

## AI Cost

Measured live cost for the first 80-article enrichment cycle:

- Total: `$0.110093`
- `topic_classifier`: about `$0.100000`
- `metadata_summary`: about `$0.009807`
- `embedding`: about `$0.000286`

This is below the PRD target of about `$1/day`. The first live run enriched 80 articles, not the stack document's 300-article daily estimate, because the MVP worker processes a bounded batch per run.

## Still Rough / Remaining Risk

- This local Codex network still cannot reach `github.io`, so future deployed UI checks from this machine should use the GitHub-hosted smoke workflow or a different network.
- The first digest is real but ranking quality is still cold-start and contains some low-signal items; training signals now exist and should improve later runs.
- Out-of-band health alerting is not active until `ALERT_WEBHOOK_URL` is supplied.
- `test:db` should be rerun on a machine with Docker available before treating local migration validation as freshly re-confirmed after these patches.
