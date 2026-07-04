# Runbook

## Deploy URLs

- GitHub repository: https://github.com/adamaitiss/digest
- GitHub Pages URL: https://adamaitiss.github.io/digest/
- Supabase project: `kypzyekydodticqddwex`
- Yandex folder: `b1gj5q3o1k1v91qo20td`
- Yandex service account: `digest-pipeline` / `ajeafj047mmd4vpvhfqc`

Current workflow status:

- GitHub Pages is enabled with `build_type=workflow`.
- Repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured.
- CI workflow run `28710792185` passed on `main` for commit `4409a1a`.
- Deploy Pages workflow run `28710792194` passed on rerun attempt 2 for commit `4409a1a`.
- Live Pages Smoke workflow run `28710933294` passed against `https://adamaitiss.github.io/digest/` at 402 x 874, including authenticated Train, Digest, feedback, save, and unsave actions.
- Yandex Timer triggers are active for all five pipeline jobs.
- Scheduled pipeline work belongs in Yandex Timer triggers; GitHub Actions workflows must not use `schedule:`.

## Supabase Setup

Already complete:

1. Project `kypzyekydodticqddwex` exists.
2. `supabase/migrations/001_initial_schema.sql` and `002_seed_source_registry.sql` are applied.
3. Auth Site URL is set to `https://adamaitiss.github.io/digest/`.
4. Local `.env` contains real public and service-role Supabase values.
5. Auth/RPC/view behavior was verified with an authenticated magic-link token.

Live counts after the 2026-07-04 pipeline run:

- `source`: 49
- `article`: 871
- `event_cluster`: 583
- `digest`: 1
- `digest_item`: 15
- `ai_cost_log`: 202

## Yandex Functions

Deploy from a local machine with Yandex CLI access:

```bash
set -a
source .env
set +a
./scripts/ensure_yandex_service_account.sh
./scripts/preflight_live_setup.sh
./scripts/deploy_yandex_functions.sh
```

The scoped service account should have:

- `functions.functionInvoker`
- `ai.models.user`
- `ai.languageModels.user`

Deployed function names:

- `digest-ingest`
- `digest-enrich`
- `digest-cluster-rank`
- `digest-generate-digest`
- `digest-health-check`

Schedules:

- `ingest`: every 4 hours.
- `enrich`: every 4 hours after ingestion.
- `cluster_rank`: every 4 hours after enrichment.
- `generate_digest`: daily at 05:00 UTC.
- `health_check`: daily at 06:30 UTC.

## Manual Pipeline Run

Invoke by function ID:

```bash
for name in digest-ingest digest-enrich digest-cluster-rank digest-generate-digest digest-health-check; do
  id="$(yc serverless function get --name "$name" --folder-id "$YANDEX_FOLDER_ID" --format json \
    | python3 -c 'import json,sys; print(json.load(sys.stdin)["id"])')"
  yc serverless function invoke "$id" -d '{}'
done
```

`enrich` is intentionally slower than the other jobs because Yandex Classifier is limited to 1 request/second and metadata generation uses asynchronous YandexGPT operations.

## Credential Rotation

Supabase:

- Rotate anon key only after updating GitHub Actions secrets and rebuilding Pages.
- Rotate service-role key only after updating Yandex Function environment variables through a redeploy.

Yandex:

- The default credential path is the attached Cloud Function service account IAM token.
- `YANDEX_API_KEY` is optional for debugging/fallback only.
- If the service account roles change, rerun `scripts/ensure_yandex_service_account.sh` and `scripts/preflight_live_setup.sh`.

GitHub:

- Rotate repository secrets in Settings -> Secrets and variables -> Actions, or with `gh secret set`.

## Live Smoke Test

Repeat the deployed unauthenticated smoke test from GitHub-hosted infrastructure:

```bash
gh workflow run live-pages-smoke.yml --repo adamaitiss/digest --ref main
```

This checks that GitHub Pages renders the auth screen at iPhone width, the primary magic-link control is visible, the PWA manifest is reachable, and there are no relevant console errors.

To repeat the authenticated smoke, create a one-time Supabase magic link for a user that already has today's ready digest, store only that short-lived link as repository secret `LIVE_SMOKE_MAGIC_LINK`, run the same workflow, then delete the secret immediately. Do not store the Supabase service-role key in GitHub.

Expected end-to-end flow:

1. Open `https://adamaitiss.github.io/digest/` on an iPhone-width viewport.
2. Send/open a magic link and log in.
3. Confirm Train shows real cards from the last 3 days.
4. Open a card detail and verify prepared summary/source/confidence text.
5. Save a card, then confirm it appears in Saved.
6. Open Digest and verify 10-15 grouped real items.
7. Mark a digest item Useful.
8. Unsave the saved item.
9. Confirm `job_run`, `user_signal`, `saved_item`, and `ai_cost_log` rows reflect the actions.

2026-07-04 note: the Codex environment could not connect directly to `github.io` / GitHub Pages IPs, but GitHub-hosted Chromium completed the authenticated live smoke against the deployed Pages URL in run `28710933294`.
