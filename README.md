# Personal News Swipe Digest

A private mobile PWA for swipe-training a personal RU/EN news recommender and reading a grounded daily digest.

## Current State

Live systems are provisioned:

- GitHub repository: https://github.com/adamaitiss/digest
- GitHub Pages URL: https://adamaitiss.github.io/digest/
- Supabase project: `kypzyekydodticqddwex`
- Yandex folder: `b1gj5q3o1k1v91qo20td`
- Yandex service account: `digest-pipeline` / `ajeafj047mmd4vpvhfqc`

Implemented and verified:

- React + Vite + TypeScript PWA app shell for Train, Digest, Saved, Profile, and source health.
- Supabase SQL migrations for schema, pgvector, RLS, RPCs, and app views.
- Real RSS source registry: 49 active feeds, 26 EN and 23 RU.
- Yandex Cloud Functions and Timer triggers for `ingest`, `enrich`, `cluster-rank`, `generate-digest`, and `health-check`.
- Live pipeline run on 2026-07-04 created 871 article rows, 583 clusters, and a 15-item digest.
- GitHub Actions CI and Pages deployment workflows have no `schedule:` triggers.
- Pages deploy workflow passes with real Supabase public config.
- Authenticated live Pages smoke passed from GitHub-hosted Chromium at iPhone width, including magic-link login, Train, card summary, Save, Digest, Useful feedback, Saved, and Unsave.

Note: this Codex environment still cannot connect directly to `github.io` / GitHub Pages IPs, so deployed UI checks from this machine should use the GitHub-hosted smoke workflow or another network.

## Local Run

```bash
npm install
npm run dev
```

Without Supabase environment variables, the app uses demo data so the UI and PWA shell can be tested locally. With `.env` populated, local dev uses the real Supabase project.

## Test

```bash
npm run lint
npm run test:unit
npm run test:db
npm run build
npm run test:e2e
PYTHONPATH=workers python3 -m compileall -q workers
```

`npm run test:db` requires Docker for the disposable pgvector database.

## Environment

Public browser variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_BASE_PATH=/digest/
VITE_USE_DEMO_DATA=false
```

Worker-only secrets:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
YANDEX_FOLDER_ID=
YANDEX_SERVICE_ACCOUNT_ID=
YANDEX_API_KEY= # optional fallback; functions use attached service-account IAM token by default
ALERT_WEBHOOK_URL=
```

Never commit `.env` files or service-role/Yandex credentials.

## Source Registry

The live-checked registry is in `data/source_registry_v1.json`. The reachability report is in `docs/source_registry_reachability_v1.md`.

Regenerate the Supabase seed migration after registry edits:

```bash
python3 scripts/generate_source_seed.py
```
