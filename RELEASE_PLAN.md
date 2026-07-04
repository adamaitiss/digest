# Release Plan — Personal News Swipe Digest

Audit date: 2026-07-04 (repo HEAD `281222d`). Everything below was checked live
against GitHub, Yandex Cloud, and Supabase — not read off old docs. Sources of
truth used: `gh` CLI (authenticated as `adamaitiss`), `yc` CLI (authenticated,
folder `b1gj5q3o1k1v91qo20td`), direct Supabase REST calls with the
service-role key from `.env`, and a real Supabase Auth OTP call to verify email
delivery. No Chrome browser extension was available in this environment, so
the live UI was **not** personally clicked through by me — see item 5 below.

Implementation update later on 2026-07-04: the stray smoke-test auth user was
deleted, migration 003 was applied live, the Before User Created hook was
enabled, Yandex Functions were redeployed, and live `ingest`, `cluster_rank`,
and `generate_digest` invokes succeeded. Local checks pass except
Docker-backed `test:db`, which cannot run because Docker's daemon is
unavailable.

## Summary

This is close, not done. Infrastructure is real and working: the pipeline has
completed a full automatic (timer-triggered, not manual) ingest → enrich →
cluster_rank cycle today, real bilingual articles are flowing (970 articles,
488 EN / 482 RU, from 49 sources), a real 15-item digest exists with grounded
summaries, AI cost is $0.22 today against the ~$1/day budget, and magic-link
email delivery is proven to actually work (I triggered one and watched it
land in the inbox in seconds). But it is **not yet the single-user private
product the PRD describes**: a privacy-hardening migration that restricts
sign-in to one email was written but never applied to the live database, so
right now *anyone* who finds the Pages URL can self-register — and a stray
test account from earlier smoke-testing has already, as of this moment, taken
over the profile slot that tomorrow's automated digest generation will target
instead of you. That one is time-sensitive (next automatic digest run is
05:00 UTC tomorrow, 2026-07-05). Fix the items in "Do first" below and this
is usable by you today; the rest is refinement.

## Do first (in order)

1. **[needs you — urgent, ~2 min]** Tomorrow's digest will silently go to the
   wrong account unless this is fixed before **05:00 UTC on 2026-07-05**
   (~10 hours from this audit). Root cause: `workers/functions/generate_digest.py`
   generates the daily digest for whichever `user_profile` row was updated
   most recently — there's no concept of "the one real user" yet. A leftover
   test account from earlier smoke testing (`codex-live-smoke@users.noreply.github.com`,
   created 2026-07-04T15:10:12Z during live-smoke testing) now has a more
   recent `updated_at` (15:29:58Z) than your own profile (13:50:52Z), so it is
   currently first in line. Fastest fix: open Supabase Dashboard → Authentication
   → Users → delete `codex-live-smoke@users.noreply.github.com`
   (`a0e49efa-11f4-475e-ab91-442c2a2883c0`). I did not delete this myself —
   deleting an account is the kind of action I flag rather than take
   unilaterally, but it's a throwaway test user with one saved item and a
   handful of test signals, not real data.
2. **[agent-doable, do right after #1 or instead of it]** Fix the underlying
   bug so this can't recur: change `generate_digest.py` to select the user by
   joining against the authorized-email allowlist (see #3) instead of "most
   recently updated profile." This is a small, contained code change.
3. **[needs you, then agent-doable]** Apply the privacy-hardening migration
   that's sitting locally, uncommitted, and never run:
   `supabase/migrations/003_release_hardening.sql`. I confirmed directly
   against the live database that none of it is applied — `authorized_auth_email`
   table and `is_authorized_user()` function both come back "not found" via
   the REST API. Until this runs, the live RLS policies are still the
   original migration 001 ones: `source`, `article`, `event_cluster`,
   `job_run`, and `ai_cost_log` are readable by **any** authenticated user
   (`using (true)`), and Supabase sign-up is open to anyone — which is exactly
   how the stray account in #1 got created in the first place. There's no
   `supabase` CLI and no Postgres connection string or Management API token
   available in this environment, so I can't run it myself. Two ways to
   unblock:
   - You paste `supabase/migrations/003_release_hardening.sql` into Supabase
     Dashboard → SQL Editor → Run. It's idempotent (uses `create or replace`
     / `drop policy if exists`), so this is safe to run once.
   - Or give the agent a Postgres connection string (Project Settings →
     Database) or a Supabase personal access token, and it can be applied via
     CLI/API in a future session.
   Either way, one extra manual step is required after: the migration defines
   `public.before_user_created_allowlist(jsonb)` but Supabase Auth Hooks are
   configured in the dashboard, not via SQL alone. Go to Authentication →
   Hooks → "Before User Created" and point it at that function. This is the
   step that actually blocks future unauthorized sign-ups; the SQL alone only
   prepares the function.
4. **[agent-doable, only after #3 is live]** Commit and ship the uncommitted
   local changes currently sitting in the working tree (17 modified files +
   `supabase/migrations/003_release_hardening.sql` + 2 new test files +
   `public/apple-touch-icon.png`). I verified these build and test clean in
   this session (`npm run lint`, `npm run test:unit` → 17/17 passing across 8
   files, `npm run build` → all pass). They must ship **after** #3, not
   before: the new Profile screen "Reset" and "Export" buttons call
   `reset_learned_preferences()` and `export_user_data()`, which only exist in
   migration 003 — shipping the frontend first means those two buttons throw
   errors live. What's in this batch:
   - Optimistic UI for training-card swipes (reactions apply instantly
     instead of waiting on the network round-trip).
   - New "why shown" open tracked as its own `open_summary` signal.
   - Profile screen: "Reset learned preferences" and "Export data" buttons.
   - Fix for a real, currently-live bug: the deployed site's
     `apple-touch-icon` is an `.svg`
     (`https://adamaitiss.github.io/digest/apple-touch-icon.svg` → 200 OK
     today), but iOS Safari does not support SVG for home-screen icons, so
     "Add to Home Screen" likely shows a blank/generic icon on your actual
     iPhone right now. The fix (new `apple-touch-icon.png` + updated
     `index.html`/`vite.config.ts`) is already written, just not shipped.
   - Alert-payload redaction in `workers/common/job.py` (don't send full
     Python tracebacks to the external alert webhook once one is configured).
   - An expanded `scripts/validate_supabase_migrations.sh` that exercises the
     new allowlist function and RPCs against a local Postgres — I could not
     run this myself (`test:db` needs Docker, which isn't available in this
     environment), so it should be run once on a machine with Docker before
     you fully trust it.
5. **[needs you]** Personally open `https://adamaitiss.github.io/digest/` on
   your iPhone, tap "Send magic link," open the email, and go through Train →
   a card detail → Digest → a digest item → Saved at least once yourself. I
   could not do this step myself — there's no Chrome browser extension
   connected in this environment, so I couldn't drive a real browser session.
   What I did instead, as the closest available substitute:
   - Confirmed via `curl` that the production URL, JS/CSS bundle, and PWA
     manifest all load correctly (200 OK, `display: standalone`,
     `start_url: /digest/`).
   - Read the full script and logs of GitHub Actions run
     [`28710933294`](https://github.com/adamaitiss/digest/actions/runs/28710933294)
     ("Live Pages Smoke," today, passed), which drove real Playwright/Chromium
     against the production URL at 402×874 and clicked through magic-link
     login → Train card → Summary → Save → Digest → "15 items across…" →
     item detail → "Why it matters" → Useful feedback → Saved → Unsave, with
     the run configured to fail on any console error or warning (it didn't).
     The app code at that run's commit (`4409a1a`) is identical to current
     HEAD except for doc-only changes, so this evidence still describes what's
     live today.
   - Directly tested magic-link **email delivery** (this was previously
     unverified — only admin-generated links had been used, never the real
     "send email" path): I called the same `signInWithOtp` endpoint the app's
     "Send magic link" button calls, for your real address. A real email
     ("Your sign-in link," from `noreply@mail.app.supabase.io`) landed in
     your primary inbox within seconds (2026-07-04T18:39:49Z). Supabase's
     free-tier sender does work and isn't going to spam. I did not click the
     link myself, to avoid consuming a token or logging in on your behalf
     without you driving it.
   None of this substitutes for you actually tapping through it once on your
   phone — that's the one completion criterion nobody has verified with an
   actual human yet.

## Then (real, but not urgent)

6. **[needs you, optional]** Decide on out-of-band pipeline alerting.
   `ALERT_WEBHOOK_URL` is still empty — `health_check` results are only
   visible if you go look in Supabase. Cheapest options: a Telegram bot token
   + chat ID, or a free `ntfy.sh` topic. Once you pick one, **[agent-doable]**
   wire it in and redeploy the Yandex functions.
7. **[agent-doable]** Fix the 8 of 49 sources currently failing to fetch
   (confirmed live via `source.error_status`, not recovered across the last
   several ingest cycles):
   - Self-signed-certificate SSL errors on **Deutsche Welle**, **BBC News
     World**, **Meduza**, **The Bell** — likely a CA bundle issue in the
     Yandex Python 3.12 runtime, not the sites themselves.
   - `406 Not Acceptable` on all three **Kommersant** feeds — the site is
     likely blocking the fetch client's default User-Agent.
   - `403 Forbidden` on **POLITICO Europe** — similar bot-blocking.
   Not blocking release: 41/49 sources are healthy and the RU/EN split is
   actually fine today (26 EN / 23 RU active sources, 488/482 articles) — the
   PRD's worry about thin Russian coverage (6.7) hasn't materialized.
8. **[monitor, no action needed yet]** AI enrichment is currently a
   bottleneck, not a cost problem. Real spend today is **$0.2198** total
   (topic classifier ~$0.20, metadata/summary ~$0.019, embeddings ~$0.0006) —
   well inside the ~$1/day target. But the Yandex Classifier's 1 request/sec
   ceiling caps enrichment at ~80 articles per 4-hour cycle, while ingest is
   pulling in ~800/cycle, so only about 160 of the 970 articles ingested
   today have actually been enriched/clustered. Digest quality depends on the
   enriched subset, not the full pool. Worth watching over the first week of
   real use — if digests feel thin or repetitive, this backlog is why.
9. **[monitor]** The digest you'd see right now reflects the pipeline state
   as of 14:33 UTC today (when `generate_digest` last ran), not the two
   additional ingest/enrich/cluster_rank cycles that have run automatically
   since (16:00–16:47 UTC). This is expected — digest generation is a
   scheduled daily batch (05:00 UTC), not real-time — but don't be surprised
   that "today's digest" doesn't include articles from mid-afternoon onward
   until tomorrow's run.

## Polish / nice-to-have (not blocking)

- Early ranking is cold-start noisy by design (per the PRD's own founder
  decisions log): a Moscow ring-road traffic accident was flagged "must-know"
  in today's digest, and a Steam-vulnerability item landed under "Technology
  and AI" rather than security/general. Expected to self-correct as real
  training signals accumulate; no code change needed now.
- The magic-link email uses Supabase's default template/branding ("powered by
  Supabase Auth"). Fine to leave for a single-user product; customize later
  if it bothers you.
- GitHub Actions logs show Node 20 deprecation warnings on
  `actions/checkout@v4` / `actions/setup-node@v4` (harmless today, runners
  are forcing Node 24 already; will eventually need a version bump in the
  workflow files).
- Two status docs (`MVP_BUILD_REPORT.md`, `NEEDS_DECISION.md`) were deleted
  from the working tree, uncommitted, before this audit — I've restored both
  with corrected, current content (see below) since the task asked me not to
  leave contradictory docs behind. A third file, `codex_goal_prompt.md`, was
  also deleted uncommitted; I left that one alone since it's a one-time input
  prompt rather than a living status doc, and nothing asked me to restore it.

## What I verified and how (for anyone who wants to double-check)

- **GitHub**: `gh auth status` → authenticated as `adamaitiss`. `gh secret
  list --repo adamaitiss/digest` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  both set. `gh run list` → CI and Deploy Pages both green on HEAD (`28711144914`,
  `28711144913`). No `schedule:` trigger in any workflow file (grepped
  directly).
- **Yandex**: `yc resource-manager folder list-access-bindings --id
  b1gj5q3o1k1v91qo20td` → service account `digest-pipeline` has
  `functions.functionInvoker`, `ai.models.user`, `ai.languageModels.user`.
  `yc serverless function list` / `trigger list` → all 5 functions ACTIVE,
  all 5 timers present with cron expressions matching RUNBOOK.md exactly
  (`0 */4`, `20 */4`, `45 */4`, `0 5`, `30 6`).
- **Supabase** (via REST + service-role key from local `.env`): row counts as
  of 2026-07-04T18:40 UTC — `source`=49, `article`=970, `event_cluster`=685,
  `digest`=1, `digest_item`=15, `job_run`=17, `ai_cost_log`=399,
  `user_signal`=9, `saved_item`=2. `job_run` history shows a full
  timer-triggered cycle (not manual) completed successfully at 16:00–16:47
  UTC today. Confirmed migration 003 is not applied (queried
  `authorized_auth_email` and `is_authorized_user()` directly — both "not
  found"). Confirmed 2 auth users exist: you, and the stray smoke-test
  account.
- **Security**: no secrets in git history (`git log --all -p` grepped clean),
  `.env` correctly gitignored, service-role key confirmed absent from the
  built JS bundle (`grep -c` on `dist/assets/*.js` → 0).
- **Not verifiable from here**: Supabase SMTP/dashboard-level settings (no
  Management API token available — email deliverability was instead verified
  behaviorally, see item 5). Docker-dependent `test:db` (Docker not available
  in this environment).
