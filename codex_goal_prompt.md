# Codex Goal-Mode Prompt — Personal News Swipe Digest MVP

How to use: open this repo in Codex, start **Goal mode** (`/goal` in the app/CLI/IDE — enable `features.goals` in `config.toml` first if the command isn't listed), and paste the block under "GOAL PROMPT" as the goal text. In Goal mode the text you give it is used both as the starting instructions and as the standard Codex checks its own progress against, so the whole checklist below has to live inside it.

Written in English on purpose — `prd_v1.md`, `tech_stack_decision_v1.md`, and `AGENTS.md` are all in English, and Codex follows precise technical instructions more reliably in the same language as the source docs it has to reconcile against. Say the word if you'd rather have a Russian version.

Run it with elevated auto-approval / network access enabled for this thread — the goal involves installing packages, running `supabase`/`yc` CLI commands, pushing to GitHub, and calling live Yandex AI Studio and Supabase APIs. A run this size will likely take hours of wall-clock time and should be left to work unattended; check back periodically rather than babysitting it.

---

## Access checklist — confirm/prepare before starting

**Already in place, per you:**
- Supabase: reachable via your logged-in local Safari session.
- Yandex Cloud: access "already provided to Codex" earlier.

**Worth confirming or adding:**

1. **GitHub — write access to a target repo.** Codex needs to be able to create (or be granted) a repository under your GitHub account, push commits, open Actions runs, and enable Pages. If you're using Codex's cloud/web product, connect the GitHub integration and authorize the repo. If you're using the CLI locally, make sure `gh auth login` (or your existing git credentials) already has push rights — this is likely already true since it's your own account, but confirm before the run starts so it isn't blocked mid-goal.
2. **Supabase — add a Personal Access Token** (Supabase dashboard → your account → Access Tokens), even though the browser session covers manual console clicks. A token lets Codex drive the `supabase` CLI / Management API to create the project and run schema migrations reliably and repeatably, instead of depending entirely on browser automation of the dashboard UI for every step. Pass the token to Codex the same way you passed the Yandex credentials.
3. **Yandex Cloud — confirm the scope of the access already granted.** An AI Studio API key (for embeddings/YandexGPT calls) is a *different* credential from what's needed to provision compute — Cloud Functions, Timer triggers, service accounts, IAM roles. If what Codex already has is inference-only, it will also need either a `yc` CLI OAuth login for your account with Editor rights on the target cloud/folder, or a dedicated service-account authorized key with roles covering `serverless.functions.admin` (or editor), the serverless triggers admin/editor role, and `iam.serviceAccounts.admin`, scoped to the folder this project should live in. Worth checking this explicitly rather than assuming — it's the one gap most likely to stall the goal partway through.
4. **Magic-link email deliverability — your call, not a hard requirement.** Supabase's built-in email sender on the Free plan is rate-limited and meant for testing, not guaranteed production delivery. For a single low-volume personal login this is probably fine to start with. If you want it solid from day one, sign up for a transactional email provider with a workable free tier (Resend, Postmark, Brevo are common choices) and hand Codex the API key/SMTP credentials to wire into Supabase Auth settings. If you don't provide one, tell Codex in advance to default to Supabase's built-in sender and note the limitation in its final report rather than silently assuming it's fine.
5. **Pipeline-failure alerting — your call.** `tech_stack_decision_v1.md`'s Risks section calls for the `health_check` job to trigger a real out-of-band alert, not just an in-app status. Cheapest options: reuse the email provider from point 4, or a Telegram bot (a token from @BotFather plus your chat ID), or a zero-signup option like ntfy.sh. If you don't pick one up front, tell Codex which fallback to use (email to stanislav.adamaytis@gmail.com is a reasonable default) so it doesn't skip alerting entirely.

**Not needed for this MVP:** a custom domain (the default `github.io` and `supabase.co` subdomains are fine), an Apple Developer account (it's a PWA, not a native app), or any paid news API (v1 sources are public RSS/media per the PRD).

---

## GOAL PROMPT (paste as the Codex goal)

```
GOAL
Build, deploy, and fully validate a working MVP of the Personal News Swipe
Digest product described in this repository, end to end, without further
prompts from me. Done means: a real person (me) can open the deployed app on
an iPhone, log in, complete a training session, and read a real generated
daily digest with real articles from real sources — today, not as a
simulation — and the code backing it is tested, documented, and not held
together by manual steps I'd have to repeat.

CONTEXT
- `prd_v1.md` in this repo is the binding product spec. Read it fully,
  including the founder decisions log (2.3), the recommendation model (5),
  the grounding/anti-hallucination hard requirement (8.7), the acceptance
  criteria (15), and the recommended build order (18.2). Where anything
  conflicts, `prd_v1.md` section 2.3 and its "Resolved"/"Added" annotations
  win over earlier language in the same document.
- `tech_stack_decision_v1.md` in this repo is the binding infrastructure
  and AI-stack decision, including its "Critical Review And Revisions" and
  "Follow-Up Revision" sections — those revisions are final, not drafts.
  Follow it exactly: React + Vite + TypeScript static PWA on GitHub Pages
  (public repo), Supabase Free for auth/Postgres/RLS/RPC/pgvector, Yandex
  Cloud Functions + Timer triggers for the scheduled pipeline, GitHub
  Actions only for push-triggered CI/CD (build+deploy, no `schedule:`
  triggers), Yandex Cloud AI Studio for all AI calls using the specific
  model URIs, Asynchronous mode by default, and the Classifier API for
  topic, as specified there. Do not silently swap any of these for a
  different technology — if you believe a deviation is genuinely warranted,
  implement the documented default first, then note the alternative and
  your reasoning in the final report instead of substituting it.
- `AGENTS.md` in this repo holds working agreements — read it, and keep it
  updated with real build/test/run commands as you establish them, so a
  future session (yours or mine) doesn't have to rediscover them.
- Credentials: Supabase is reachable through an already-authenticated local
  browser session; a Supabase personal access token may also be available.
  Yandex Cloud access has been granted separately. GitHub push access is
  available under my account. If any credential you need turns out to be
  missing or insufficient to complete a step, do not skip the step
  silently — write it into `NEEDS_DECISION.md` at the repo root with
  exactly what's missing and why it's blocking, then continue with
  everything else that isn't blocked by it.

CONSTRAINTS
- Follow the PRD build order in 18.2 as the default sequence, adapting as
  needed: verify real RSS reachability for a seeded RU/EN source registry
  first (per 6.7 — this product has a real risk of thin Russian-language
  coverage without Telegram, which is explicitly out of scope for v1), then
  ingestion/storage/embeddings/clustering, auth and app shell, training
  queue and reaction capture, first-pass ranking, card detail summaries,
  digest generation, digest feedback, source health admin view.
- Ship the phased ranking approach from PRD 19.1 (embeddings + similarity +
  simple learned weighting) rather than building the full mature signal
  hierarchy from section 5 on day one — grow into that later.
- Every generated summary, "why it matters," "why selected," and confidence
  note must satisfy the grounding requirement in PRD 8.7: no invented facts,
  numbers, quotes, or names beyond what the retrieved source text supports.
  Build and run the lightweight verification pass described there.
- No engagement-optimizing design: no streaks, infinite scroll, push
  nudges, or gamified return mechanics (PRD 2.2, 20, 15.5).
- Never commit secrets, API keys, or the Supabase service-role key to the
  repository at any point in its history. Public keys (Supabase URL/anon
  key) are fine to check in or bake into the client build. Service-role
  key and Yandex IAM credentials live only in Yandex Cloud Function
  environment variables.
- Keep real AI spend under the PRD's ~$1/day target (2.1, 12.1) — use
  Asynchronous mode, the Classifier API, and the caching/shortlist rules
  from `tech_stack_decision_v1.md`, and log every call to `ai_cost_log`.
- Write real automated tests as you go (unit tests for scoring/dedup/
  ranking logic, integration tests for Supabase RPCs and RLS policies,
  Playwright e2e tests for the core user flows), not just at the end.
- For any genuine product ambiguity that isn't resolved by `prd_v1.md`
  (check section 17's open questions first), make a reasonable, documented
  choice and move on rather than stalling the whole goal on it — record
  the choice and its reasoning in the final report so I can revisit it.

COMPLETION CRITERIA — the goal is done only when ALL of these are true and
you have personally verified each one against the live systems, not just
against local mocks:
1. A public GitHub repository exists under my account with the full
   source, connected to GitHub Pages, and the PWA is reachable at its
   github.io URL, loads correctly at an iPhone-width viewport, and is
   installable as a home-screen PWA.
2. A Supabase project is provisioned with the full schema (as versioned
   SQL migrations, not just clicked into existence), RLS policies, the RPC
   functions listed in `tech_stack_decision_v1.md`'s Logical API Surface
   table, `pgvector` enabled, and magic-link auth configured with the
   correct Site URL/redirect for the deployed app.
3. Yandex Cloud Functions + Timer triggers are deployed for `ingest`,
   `enrich`, `cluster_rank`, `generate_digest`, and `health_check` on the
   schedules from `tech_stack_decision_v1.md`, running under a scoped
   service account, calling Yandex AI Studio in Asynchronous mode with the
   Classifier API used for topic.
4. GitHub Actions runs lint, automated tests, and Playwright e2e on every
   push, and a separate workflow builds/deploys to Pages — with no
   `schedule:` trigger in any workflow file, per the reliability reasoning
   already recorded in `tech_stack_decision_v1.md`.
5. A real, verified seed source registry of RU/EN RSS feeds is actually
   ingesting articles — not a placeholder list.
6. At least one full pipeline cycle has actually run against the live
   Supabase project and produced a real 10-15 item grouped daily digest
   with grounded summaries, "why it matters"/"why selected" text, source
   links, and confidence notes, with matching `ai_cost_log` entries you can
   point to as evidence the loop works end to end on live infrastructure.
7. I can personally open the deployed app, log in via magic link, complete
   a training session (swipe or button reactions), open a card's prepared
   summary, and read that day's real digest, with saved items working.
8. Automated unit, integration, and Playwright e2e suites all pass, and
   you have additionally performed and recorded a manual smoke-test pass
   against the live deployed URL (not just CI).
9. `README.md`/`RUNBOOK.md` documents the deployed URLs, how to log in,
   how to manually trigger a digest regeneration, how to rotate each
   credential, and any manual step I still need to take myself (e.g.
   choosing an email provider) if something couldn't be fully automated.
10. A final report (`MVP_BUILD_REPORT.md`) summarizes what was built, any
    deviations from `tech_stack_decision_v1.md` and why, any product
    ambiguity you resolved yourself and how, real measured AI cost per
    pipeline cycle versus the ~$1/day target, and an honest list of
    anything still rough or deferred.

Work autonomously through routine implementation and setup decisions.
Only stop and log a question (in `NEEDS_DECISION.md`) instead of proceeding
when you hit a missing/insufficient credential, a product decision with no
reasonable default in the PRD, or an action whose real-world cost or risk
goes beyond what's described above.
```
