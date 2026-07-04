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
- Deploy Pages workflow runs `28708434747`, `28709775117`, and `28709839529` passed and built with `VITE_USE_DEMO_DATA=false`.
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

GitHub Pages deployment passed, but this Codex environment cannot connect to `github.io` / GitHub Pages IPs: `curl -4`, `curl -6`, WebKit, Chromium, and the in-app browser all timed out against `https://adamaitiss.github.io/digest/`, while `github.com` and GitHub API remained reachable. GitHub API reports Pages active at the expected URL.

Because of that network block, the browser interaction flow was smoke-tested at `http://127.0.0.1:5173/digest/` against the real Supabase project:

- Supabase magic-link token was generated and verified.
- Authenticated session loaded the Train screen at 402 x 874.
- Real training card opened its prepared summary.
- Save action wrote a `save` training signal.
- Digest screen opened the real 15-item digest.
- Useful feedback wrote a digest signal and updated digest item feedback.
- Saved screen showed the saved item; unsave removed the live `saved_item` row.
- No relevant console errors were observed.

Evidence rows:

- Recent `user_signal` rows include `save` in `training_queue` and `useful` in `digest`.
- Latest training session has `cards_reacted_to=2`, `positive_count=2`, `saves_count=2`.
- Digest item rank 1 has `feedback_status=useful`.
- `saved_item` is empty after unsave.

Screenshots from the local real-backend smoke test:

- `/tmp/digest-local-train.png`
- `/tmp/digest-local-card-summary.png`
- `/tmp/digest-local-digest.png`
- `/tmp/digest-local-saved.png`

## Verification Completed Locally This Run

- `npm run lint` passed.
- `npm run test:unit` passed: 11 tests.
- `npm run build` passed.
- `PYTHONPATH=workers python3 -m compileall -q workers` passed.
- `npm run test:e2e` passed: 4 browser tests across iPhone-sized and desktop projects.
- `npm run test:db` could not run in this environment because Docker is not available at `/var/run/docker.sock`.
- GitHub Actions CI run `28709775094` passed on `main`, including Supabase migration validation and e2e.
- GitHub Pages deploy run `28709775117` passed on `main`.
- GitHub Actions CI run `28709839518` passed on `main` for commit `722326b`.
- GitHub Pages deploy run `28709839529` passed on `main` for commit `722326b`.

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

Bundle and dependency review:

- Real production JS bundle: `416.45 kB` raw / `118.58 kB` gzip.
- Full `dist`: about `256K`.
- `workers/requirements.txt` remains lightweight: `feedparser`, `httpx`, `python-dateutil`.
- Worker source tree is about `228K`.

Deferred cleanup:

- Frontend `src/lib/scoring.ts`, `src/lib/clustering.ts`, and `src/lib/grounding.ts` are test-only mirrors of behavior implemented in SQL/Python. They are retained because the current unit tests use them, but future tests should move closer to the production Python/SQL paths.
- `ALERT_WEBHOOK_URL` is still empty, so health alerts are recorded in Supabase but not sent out-of-band.

## Deviations / Live Adjustments

- Yandex `text-embeddings-v2-doc` returned `invalid model_uri` in folder `b1gj5q3o1k1v91qo20td`; the worker uses the working 256-dimensional `emb://<folder_id>/text-search-doc/latest` embedding model. This preserves the 256-dimensional pgvector contract but differs from the stack document's v2 default.
- Yandex Classifier is synchronous-only by API design. The rest of free-form metadata generation uses Yandex asynchronous completion.
- The Codex environment could not perform the final UI flow directly on GitHub Pages because `github.io` was unreachable from this network path.

## AI Cost

Measured live cost for the first 80-article enrichment cycle:

- Total: `$0.110093`
- `topic_classifier`: about `$0.100000`
- `metadata_summary`: about `$0.009807`
- `embedding`: about `$0.000286`

This is below the PRD target of about `$1/day`. The first live run enriched 80 articles, not the stack document's 300-article daily estimate, because the MVP worker processes a bounded batch per run.

## Still Rough / Remaining Risk

- GitHub Pages must still be opened from the user's iPhone or another network that can reach `github.io` to complete the literal live-site manual login/installability check.
- The first digest is real but ranking quality is still cold-start and contains some low-signal items; training signals now exist and should improve later runs.
- Out-of-band health alerting is not active until `ALERT_WEBHOOK_URL` is supplied.
- `test:db` should be rerun on a machine with Docker available before treating local migration validation as freshly re-confirmed after these patches.
