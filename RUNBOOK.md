# Runbook

## Deploy URLs

Pending live setup:
- GitHub repository: pending
- GitHub Pages URL: pending
- Supabase project URL: blocked on credentials
- Yandex Cloud Functions: blocked on Supabase outputs

## Supabase Setup

1. Create or select the Supabase project.
2. Apply migrations in order:

```bash
supabase db push
```

or paste/apply:
- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_seed_source_registry.sql`

3. Configure Auth:
- Site URL: the GitHub Pages URL.
- Redirect URLs: the GitHub Pages URL and local dev URL if needed.
- Magic-link email auth enabled.

4. Add GitHub Actions secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

5. Add Yandex Function environment variables:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Yandex Functions

Deploy from a local machine with Yandex CLI access:

```bash
YANDEX_FOLDER_ID=... \
YANDEX_SERVICE_ACCOUNT_ID=... \
SUPABASE_URL=... \
SUPABASE_SERVICE_ROLE_KEY=... \
YANDEX_API_KEY=... \
./scripts/deploy_yandex_functions.sh
```

Schedules:
- `ingest`: every 4 hours.
- `enrich`: every 4 hours after ingestion.
- `cluster_rank`: every 4 hours after enrichment.
- `generate_digest`: daily.
- `health_check`: daily.

## Manual Digest Regeneration

Until a protected HTTP invocation wrapper is added, manually invoke the deployed Yandex function from the Yandex CLI:

```bash
yc serverless function invoke digest-generate_digest
```

## Credential Rotation

Supabase:
- Rotate anon key only after updating GitHub Pages secrets and rebuilding.
- Rotate service-role key only after updating all Yandex Function environment variables.

Yandex:
- Rotate the AI Studio API key, then redeploy function versions with the new `YANDEX_API_KEY`.
- Rotate service-account keys from Yandex Cloud IAM and remove old keys after confirming timers still run.

GitHub:
- Rotate repository secrets in Settings -> Secrets and variables -> Actions.

## Live Smoke Test

After deployment:
1. Open the GitHub Pages URL on an iPhone-width viewport.
2. Send a magic link and log in.
3. Confirm the Train screen shows real cards from the last 3 days.
4. React to cards with Like, Reject, Save, and Undo.
5. Open card detail and verify prepared summary/source/confidence text.
6. Open Digest and verify 10-15 grouped real items.
7. Mark a digest item Useful and Duplicate.
8. Open Saved and unsave/resave an item.
9. Open Profile and Source health.
10. Confirm `job_run` and `ai_cost_log` rows exist for the live pipeline cycle.

