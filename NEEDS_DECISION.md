# Needs Decision / Credentials

Last updated: 2026-07-04

## Resolved

### Supabase project access

Status: resolved.

- Project `kypzyekydodticqddwex` exists.
- Both migrations are applied.
- Auth Site URL is set to `https://adamaitiss.github.io/digest/`.
- Local `.env` contains real public and service-role Supabase credentials.
- Credentials authenticate successfully.
- Authenticated RPC/view checks pass.

### GitHub Pages production config

Status: resolved.

- Repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.
- GitHub Pages is enabled with workflow deployment.
- Deploy Pages workflow run `28710792194` passed on rerun attempt 2 for commit `4409a1a` with `VITE_USE_DEMO_DATA=false`.
- Live Pages Smoke workflow run `28710933294` passed from GitHub-hosted infrastructure at 402 x 874, including authenticated magic-link login, Train, card summary, Save, Digest, Useful feedback, Saved, and Unsave.

### Yandex scoped service-account role binding

Status: resolved.

- Service account `digest-pipeline` / `ajeafj047mmd4vpvhfqc` is used by the deployed functions and timers.
- Required roles are bound and verified:
  - `functions.functionInvoker`
  - `ai.models.user`
  - `ai.languageModels.user`
- `scripts/preflight_live_setup.sh` passes.

### Yandex Cloud deployment and live pipeline

Status: resolved.

- Functions and Timer triggers are deployed for `ingest`, `enrich`, `cluster-rank`, `generate-digest`, and `health-check`.
- Manual live run produced 871 articles, 583 clusters, a 15-item digest, and 202 AI cost rows.
- Latest digest ID: `05641840-e28a-4c9c-bcf2-0978faaaf420`.

## Still Open

### Out-of-band health alert destination

Status: optional but recommended.

- `ALERT_WEBHOOK_URL` is empty.
- Health failures are recorded in Supabase `job_run`, but no external alert is sent.

Next action:

- Provide a webhook URL if out-of-band health alerts should be enabled, then redeploy Yandex functions.
