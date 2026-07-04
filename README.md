# Personal News Swipe Digest

A private mobile PWA for swipe-training a personal RU/EN news recommender and reading a grounded daily digest.

## Current State

Implemented locally:
- React + Vite + TypeScript PWA app shell for Train, Digest, Saved, Profile, and Sources/health.
- Supabase SQL migrations for schema, pgvector, RLS, RPCs, and app views.
- Real RSS source registry: 49 active feeds, 26 EN and 23 RU, validated on 2026-07-04.
- Yandex Cloud Function worker code for `ingest`, `enrich`, `cluster_rank`, `generate_digest`, and `health_check`.
- GitHub Actions CI and Pages deployment workflows with no scheduled triggers.
- Unit tests and Playwright e2e tests.

Live deployment is blocked on Supabase credentials/project access. See `NEEDS_DECISION.md`.

Repository: https://github.com/adamaitiss/digest

CI is passing on `main`. Pages deployment is intentionally blocked until real Supabase public config is available, so the production app is not published with demo data.

## Local Run

```bash
npm install
npm run dev
```

Without Supabase environment variables, the app uses demo data so the UI and PWA shell can be tested locally.

## Test

```bash
npm run lint
npm run test:unit
npm run test:db
npm run build
npm run test:e2e
PYTHONPATH=workers python3 -m compileall -q workers
```

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
