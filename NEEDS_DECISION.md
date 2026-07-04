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
- Deploy Pages workflow runs `28708434747`, `28709775117`, `28709839529`, and `28709974463` passed with `VITE_USE_DEMO_DATA=false`.
- Live Pages Smoke workflow run `28710032056` passed from GitHub-hosted infrastructure at 402 x 874.

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

### Authenticated GitHub Pages smoke test from this Codex environment

Status: open verification blocker, not a product decision.

What happened:

- GitHub Pages deployment passed and GitHub API reports the site active at `https://adamaitiss.github.io/digest/`.
- Live Pages Smoke run `28710032056` reached the deployed Pages URL from GitHub-hosted infrastructure, rendered the auth screen at iPhone width, verified the PWA manifest, and found no relevant console errors.
- This Codex environment cannot connect to `github.io` / GitHub Pages IPs. `curl -4`, `curl -6`, WebKit, Chromium, and the in-app browser timed out.
- `github.com` and GitHub API are reachable from the same environment, so this appears specific to the GitHub Pages network path.

Impact:

- The authenticated live-site browser smoke test on `https://adamaitiss.github.io/digest/` could not be completed from this machine.
- The same app was smoke-tested locally against the real Supabase project with a magic-link-verified session.

Next action:

- Open `https://adamaitiss.github.io/digest/` from the user's iPhone or another network that can reach GitHub Pages and run the smoke test in `RUNBOOK.md`.

### Out-of-band health alert destination

Status: optional but recommended.

- `ALERT_WEBHOOK_URL` is empty.
- Health failures are recorded in Supabase `job_run`, but no external alert is sent.

Next action:

- Provide a webhook URL if out-of-band health alerts should be enabled, then redeploy Yandex functions.
