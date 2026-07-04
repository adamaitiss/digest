## Imported Claude Cowork project instructions

## Build/Test Commands

- Install frontend dependencies: `npm install`
- Start local PWA: `npm run dev`
- Typecheck: `npm run lint`
- Unit tests: `npm run test:unit`
- Worker unit tests: `npm run test:workers`
- Supabase migration/RPC validation: `npm run test:db`
- Production build: `npm run build`
- Browser e2e: `npm run test:e2e`
- Python worker syntax check: `PYTHONPATH=workers python3 -m compileall -q workers`
- Live setup preflight: `./scripts/preflight_live_setup.sh`
- Ensure scoped Yandex service account: `YANDEX_FOLDER_ID=... ./scripts/ensure_yandex_service_account.sh`
- Regenerate source seed migration after editing `data/source_registry_v1.json`: `python3 scripts/generate_source_seed.py`

## Live Setup Notes

- Public client config uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Service-role Supabase key and Yandex credentials must only live in Yandex Cloud Function environment variables.
- GitHub Actions workflows must not use `schedule:` triggers; scheduled pipeline work belongs in Yandex Cloud Functions Timer triggers.
