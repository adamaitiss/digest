# MVP Build Report

Date: 2026-07-04

## Built

- Mobile-first React/Vite/TypeScript PWA matching the PRD screens: Train, Digest, Saved, Profile, and source health.
- Supabase migration set for schema, pgvector, RLS, RPCs, and app views.
- Real RU/EN RSS source registry with 49 active feeds verified from this machine.
- Python Yandex Cloud Function workers for ingestion, enrichment, clustering/ranking, digest generation, and health checks.
- Grounding verification helpers for generated summaries and confidence text.
- Unit tests for scoring, clustering, and grounding.
- Playwright e2e tests for the core UI flow and PWA manifest.
- GitHub Actions CI and Pages deployment workflows without `schedule:` triggers.
- Public GitHub repository: https://github.com/adamaitiss/digest

## Verification Completed Locally

- `npm run lint` passed.
- `npm run test:unit` passed: 11 tests.
- `npm run build` passed.
- `npm run test:e2e` passed: 4 browser tests across iPhone-sized and desktop projects.
- `PYTHONPATH=workers python3 -m compileall -q workers` passed.
- A real RSS fetch from the validated seed registry succeeded.
- GitHub CI passed on `main` after push.
- GitHub Pages deploy workflow reached the intentional Supabase-secret preflight and stopped, preventing a demo-backed production deployment.

## Not Completed Live

The full MVP is not live-validated yet because Supabase project access is missing in the controllable environment. Details are in `NEEDS_DECISION.md`.

Not yet completed:
- Live Supabase project provisioning and migration application.
- Magic-link auth redirect configuration.
- GitHub Pages deployment connected to real Supabase anon config.
- The deploy workflow is intentionally guarded so Pages will not publish a demo-backed production app while Supabase secrets are missing.
- Yandex Cloud Function deployment with Supabase service-role environment variables.
- Real live pipeline cycle producing a 10-15 item digest in Supabase.
- iPhone live login/training/digest smoke test.

## Deviations

No deliberate stack deviation was made. The implemented architecture follows the stack decision: static React/Vite PWA, Supabase tables/RLS/RPC/views, Yandex Cloud Functions workers, Yandex AI Studio client code, and GitHub Actions only for CI/CD.

Because live credentials are blocked, the deployed/live acceptance criteria remain pending rather than being replaced by a different technology.

## AI Cost

Estimated design target remains the stack decision estimate of about `$0.6-0.75/day`. Real measured cost is not available yet because the live Yandex/Supabase pipeline has not run. The worker writes intended usage rows to `ai_cost_log`.
