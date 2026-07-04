# Tech Stack Decision v1

Date: 2026-07-04
Revised: 2026-07-04 — critical cost/reliability review, see "Critical Review And Revisions" below.

## Decision

Use a lowest-cost hybrid stack:

- **Frontend:** React + Vite + TypeScript static PWA, hosted on **GitHub Pages**, repository **public** (revised twice — see "Critical Review" and "Follow-Up Revision" below; the founder prioritized avoiding a new Cloudflare signup over repo privacy).
- **Auth and data:** **Supabase Free** for magic-link auth, Postgres, Row Level Security, RPC functions, and `pgvector`.
- **Scheduled backend work:** **Yandex Cloud Functions + Timer triggers** running Python workers for ingestion, enrichment, clustering, ranking refresh, and daily digest generation (revised — moved off GitHub Actions, see below). **GitHub Actions** is kept only for CI/CD: building/deploying the PWA on push, and any `workflow_dispatch`-only utility workflows.
- **LLM and embeddings:** **Yandex Cloud AI Studio** for all AI calls: embeddings, metadata extraction/classification, grounded summaries, digest text, and verification — defaulting to **Asynchronous mode** for non-interactive backend calls (revised — see below).
- **No always-on app server in v1.** The browser talks to Supabase directly through RLS-safe tables/views/RPCs; workers use one Yandex service-account credential for both compute and AI calls, plus the Supabase service-role key.

This minimizes fixed monthly cost while preserving the product quality requirements in `prd_v1.md`: fast iPhone PWA, magic-link auth, durable signals, prepared summaries, deduped daily digest, RU/EN support, grounded LLM output, and AI cost discipline.

**Estimated real-world cost after this revision: $0/month fixed hosting/compute (all inside free tiers) + roughly $0.6-0.75/day in Yandex AI Studio usage** (worked calculation in the AI Layer section) — comfortably under the PRD's ~$1/day target (PRD 2.1, 12.1), with margin to spare.

## Critical Review And Revisions (2026-07-04)

This file was re-reviewed against `prd_v1.md` and current vendor documentation with one goal: cut cost further without touching product quality, given that (a) all infrastructure setup is performed by AI agents rather than a human clicking through consoles, so setup convenience is no longer a real tiebreaker, and (b) Yandex is the fixed AI vendor. Three changes came out of that review:

1. **Default to a private repository + Cloudflare Pages, not "GitHub Pages if the repo can be public."** Cost is identical ($0 either way), but `prd_v1.md` itself (19.6, 20) treats this as a possible startup seed with a specific, nameable differentiation thesis (recall-first ranking + non-suppressible must-know layer + bilingual RU/EN + hard digest cap). Publishing the source — ranking logic, prompts, scoring heuristics, source registry — for a hosting convenience that isn't actually cheaper is a bad trade. See **Frontend**. **Superseded the same day — see "Follow-Up Revision" below:** the founder opted out of creating a new Cloudflare account, so hosting reverted to public repo + GitHub Pages.
2. **Move the scheduled data pipeline off GitHub Actions onto Yandex Cloud Functions + Timer triggers; keep GitHub Actions only for CI/CD.** The original rationale for GitHub Actions was avoiding Yandex serverless cost during validation — but Yandex Cloud Functions' free tier (1,000,000 invocations + 5 vCPU-hour + 10 GB-hour RAM/month) covers this workload for $0 too, so that rationale doesn't hold up under checking. What's left once cost is a wash is reliability, and GitHub Actions scheduled workflows are the weaker choice for something that has to run unattended for months on a low-commit-activity repo: GitHub's docs confirm scheduled workflows auto-disable after 60 days of inactivity on public repos, and developer reports describe the same happening on private repos, so it's not a risk that repo privacy alone removes. See **Backend And Jobs**.
3. **Default all backend AI Studio calls to Asynchronous mode, and use the Classifier API for fixed-label extraction.** Yandex's pricing page shows Asynchronous mode at roughly half the Synchronous token price for YandexGPT Lite and Pro 5.1, with no quality difference — only added latency, which this pipeline can always absorb since every AI call here already happens ahead of user interaction (PRD 4.3, 8.1). See **AI Layer**.

Everything else in the original decision — Supabase Free + RLS + RPC + pgvector, static PWA over Next.js, no always-on server, 3-day horizon, no full-text retention by default — held up under review and is unchanged.

## Follow-Up Revision (2026-07-04 — after founder feedback)

The founder already has a GitHub account and does not want to create a new Cloudflare account unless it buys something meaningful. That changes the hosting calculus from the first-pass review above: Cloudflare Pages' only real advantage over GitHub Pages was letting the repository stay private for $0. Once "no new vendor signup" is a hard constraint, the remaining private-hosting options are GitHub Pro ($4/user/month, upgrades the existing account) or Cloudflare Pages (free, new account) — and the founder was offered both plus the original public-repo option, and chose **public repository + GitHub Pages**, the pre-review default.

**Decision:** hosting reverts to GitHub Pages on a public repository. No new hosting account, no added monthly cost. See the updated **Frontend** section, and the corresponding rollbacks in Backend And Jobs, Cost-Minimization Policy, When To Upgrade, and Rejected Options below.

This re-opens the repo-visibility tradeoff flagged in point 1 above — source, prompts, ranking logic, and the source registry become publicly readable — but that tradeoff is the founder's to make, and "avoid new vendor signups" was an explicit, stated constraint that outweighs a strategic-optionality benefit with no concrete near-term cost. Two things still hold regardless of this reversal: (1) secrets must never be committed to the repo either way — they live in GitHub Actions secrets / Yandex Cloud Function environment variables, never in code, so nothing changes there; (2) if competitive secrecy becomes more pressing later (e.g. once the product is further validated per `prd_v1.md` 19.6/20), moving to a private repo is a same-day change — pay for GitHub Pro, or set up Cloudflare Pages at that point (see When To Upgrade).

## Why This Beats The Previous Hybrid Stack

The earlier stack used Next.js on Vercel plus Supabase and Yandex AI. That is still technically good, but it is not the cheapest good v1.

For this product, the frontend does not need server-side rendering:

- The app is private and single-user, so SEO is irrelevant.
- Training cards and digest items are prepared in the database before the user opens the app.
- LLM calls must never run from the browser.
- The PRD API surface can be implemented as Supabase views/RPCs instead of Next.js route handlers.

So the better v1 architecture is a **static PWA + database-backed prepared data + scheduled workers**.

## Selected Stack

### Frontend

- **React + Vite + TypeScript**
- **Tailwind CSS**
- **PWA support** with manifest, service worker, installable home-screen experience, and app-shell caching.
- **Swipe UI:** `@use-gesture/react`.
- **Icons:** `lucide-react`.
- **Hosting default:** **GitHub Pages**, repository public.

Use Vite instead of Next.js because the chosen deployment target is static hosting. Next.js is useful if server routes, SSR, ISR, or middleware are needed; this v1 should avoid those to keep hosting free and simple.

**Revised twice on 2026-07-04.** First pass: flipped the original GitHub-Pages-if-public default to Cloudflare Pages + private repo, reasoning that a $0 private option beats a $0 public option when `prd_v1.md`'s own competitive-landscape review (19.6, 20) treats this as a plausible startup wedge. Second pass, after founder feedback: the founder already has a GitHub account and doesn't want to create a new Cloudflare account for a benefit that's more strategic optionality than a concrete near-term need. GitHub Pages on the Free plan only works with a public repository (private-repo Pages needs GitHub Pro, $4/user/month); Cloudflare Pages was the only $0 way to keep the repo private. With a new Cloudflare account ruled out and paying for privacy not judged worth it right now, the default reverts to **public repository + GitHub Pages** — the original starting point before this file's first review pass. Secrets are never committed either way (GitHub Actions secrets / Yandex Cloud Function environment variables only), so this trade only gives up source/prompt/ranking-logic visibility, not credential safety. If competitive secrecy becomes more important later, switching to a private repo is a same-day change: pay for GitHub Pro, or set up Cloudflare Pages at that point (see When To Upgrade).

### Auth And Database

- **Supabase Auth** for email magic links.
- **Supabase Postgres** as the system of record.
- **Row Level Security** for browser-safe direct access.
- **Supabase RPC** for mutations that must be atomic:
  - record card reaction;
  - update training session counters;
  - save/unsave item;
  - record digest feedback;
  - update profile controls.
- **`pgvector`** for article/profile embeddings and cluster similarity search.
- **SQL migrations first.** Drizzle can be added for type-safe app queries, but schema truth should stay in SQL migrations because Supabase RPC/RLS/view definitions are central to the architecture.

Supabase Free is enough for the personal MVP if article retention is controlled. The pricing page currently lists a free tier with 500 MB database size, 50,000 monthly active users, unlimited API requests, and included egress/storage limits. This is suitable for one private user, but the database size cap is the main constraint to monitor.

### Backend And Jobs

**Revised 2026-07-04 — moved off GitHub Actions for the pipeline itself.** Use **Yandex Cloud Functions + Timer triggers** as the v1 scheduler and worker host:

- `ingest`: every 3-4 hours.
- `enrich`: after ingestion or in the same scheduled run.
- `cluster_rank`: after enrichment.
- `generate_digest`: once daily.
- `health_check`: daily, records source/job failures.

Workers are Python 3.12 Cloud Functions, each fired by its own **Timer trigger** (cron expression, UTC). One Yandex service account (with `serverless.functions.invoker` plus AI Studio access) is used for both compute and AI calls, and holds the Supabase service-role key as a function environment variable. This is a genuine single-vendor credential path — one IAM identity instead of splitting trust between GitHub Actions secrets and a separate Yandex key.

Reserve **GitHub Actions** for what it's naturally good at — push-triggered CI/CD:

- Build and deploy the PWA to GitHub Pages on push to `main`.
- Optional `workflow_dispatch`-only utility workflows (e.g. one-off backfills), kept in workflow files with **no** `schedule:` trigger so they can't be caught by GitHub's inactivity auto-disable (below).

**Why this changed:** the original rationale for choosing GitHub Actions was cost avoidance — "this avoids paying for Yandex Serverless Containers... during validation." That doesn't hold up: Yandex Cloud Functions' free tier includes 1,000,000 invocations, 5 vCPU-hour, and 10 GB-hour of RAM per month. This pipeline runs roughly 150-250 invocations/month (5-8 scheduled jobs/day, seconds to low minutes each), which sits well inside that free tier — so "avoid Yandex serverless cost" was never actually a real tradeoff. Once cost is a wash, what's left is reliability, and GitHub Actions is the weaker choice for something that must run unattended for months on a private, low-commit-activity repo:

- GitHub's own docs describe this specifically for public repositories: "scheduled workflows are automatically disabled when no repository activity has occurred in 60 days." They don't explicitly confirm or rule out the same behavior on private repos — but numerous developer reports describe it happening on private repos too, so treating it as a real risk regardless of visibility is the safer assumption for a repo that may go weeks without a commit.
- Separately, community reports describe cases where a workflow file combining a `schedule:` trigger with another trigger (like `workflow_dispatch`) got disabled entirely by the inactivity rule, not just the scheduled part — worth avoiding by keeping manual-dispatch workflows in their own files regardless of where the pipeline itself runs.
- GitHub-hosted scheduled runs are documented as best-effort on timing, especially under platform load — already flagged in the original version of this doc.
- Yandex Cloud Functions Timer triggers have no analogous "disabled after N days of git inactivity" behavior; they're tied to the cloud resource, not to repository activity.

Since AI agents perform the setup either way, "GitHub Actions is faster to wire up" (secrets UI + YAML) is no longer a real advantage over "IAM role + agent-provisioned function + trigger" — both are equally scriptable. Python dependencies for these workers (`httpx`, `feedparser`, `trafilatura`/`readability-lxml`, a thin Supabase/Postgres client) are lightweight and fit comfortably within Yandex Cloud Functions' dependency-install budget (1 GB RAM, 700 MB tmpfs, 5-minute install window) and its 128 MB-4096 MB memory / up to 900-second execution window. If a future worker needs heavier dependencies that don't fit a Cloud Function package (e.g. local ML models), fall back to **Yandex Serverless Containers** with a custom Docker image and the same Timer trigger mechanism — already the documented upgrade path and still valid.

Important caveat, carried over and still true: serverless timers are good enough for a personal daily digest, but not hard real-time infrastructure. If a run fails or is delayed, the app should show the last successful job time and failed status from `job_run`. Wire the `health_check` job's failure detection to an actual out-of-band alert (email or simple ping), not just an in-app admin screen the user has to remember to check — already recommended in `prd_v1.md` 19.4, and easy to add now since agents are doing the wiring anyway.

### AI Layer

Use Yandex Cloud AI Studio as required. Model URIs and pricing below were checked directly against Yandex's current documentation on 2026-07-04 (see Sources Checked).

- **Embeddings**
  - `emb://<folder_id>/text-embeddings-v2-doc/` for articles/snippets/source text.
  - `emb://<folder_id>/text-embeddings-v2-query/` for profile text and query-like preference vectors.
  - Start with **256 dimensions** (v2 supports 128/256/512/768) unless tests show materially worse clustering/ranking.
  - Priced at $0.0000827869 per 1,000 tokens — negligible at this volume (see worked estimate below).
- **Fixed-label extraction (topic)**
  - **Added 2026-07-04.** Use the dedicated **Classifier API** (`cls://<folder_id>/yandexgpt-lite/latest`, few-shot classification) for topic, since it's a fixed/enumerable taxonomy (PRD 5.4). It returns a label directly instead of free text the worker has to parse and validate, and it's billed as flat per-request units ($0.00125 per request of up to 1,000 tokens) rather than input+output tokens.
- **Cheap daily model (structured extraction + free-form text)**
  - `gpt://<folder_id>/yandexgpt-5-lite`, called once per item with structured/JSON output, for country/region, entities, event type, business-significance and novelty scores, the short grounded summary, and the confidence note — everything that isn't a single fixed label. One combined call per item is cheaper and simpler than one call per field.
- **Higher-quality model**
  - `gpt://<folder_id>/yandexgpt-5.1` only for final daily digest assembly and optional verification pass.
- **Operating mode — revised 2026-07-04:** call all of the above in **Asynchronous mode**, not Synchronous, for every backend/pipeline call. Yandex's pricing page puts Asynchronous mode at close to half the Synchronous price for the same model (YandexGPT Lite: $0.000819672 vs $0.001639344 per 1,000 tokens; YandexGPT Pro 5.1: $0.0033606552 vs $0.006557376 per 1,000 tokens), with identical model quality — the only cost is added latency, which this pipeline can always absorb because every AI call here already happens ahead of user interaction (prepared summaries per PRD 4.3, scheduled digest per PRD 8.1). Reserve Synchronous mode for local development/debugging, where a human is watching the call complete.
- **Not default in v1**
  - DeepSeek/Qwen/gpt-oss/Alice AI LLM for the core pipeline. Worth a cheap side-by-side test: **Alice AI LLM Flash** prices input/cached/tool tokens at roughly half of YandexGPT Lite while matching it on output-token price, which could make it cheaper specifically for the extraction step (long input snippet, short structured output). Not adopted by default because there's no documented quality comparison yet for structured RU/EN classification-style extraction — a one-afternoon experiment for whoever builds the enrichment worker, not a blocking decision.

Cost control rules:

- Embed headline + snippet for all items.
- Do not run LLM over every full article.
- Fetch/extract full text only for likely digest candidates or unclear clusters.
- Cache embeddings, extraction results, summaries, and digest item text.
- Reprocess only changed/new articles.
- Generate the digest once per day unless manually regenerated.
- Default to Asynchronous mode for all non-interactive calls (see above).
- Log every AI call in `ai_cost_log`.

**Worked daily-cost estimate (2026-07-04, replaces the previous unverified "~$1/day" placeholder):**

Assume ~300 new items/day (a generous estimate for a curated RU/EN source pool on a 3-4 hour ingestion cadence), all of which need metadata per PRD 6.4/5.4 (not just digest candidates, since the recommender ranks the whole pool):

- Embeddings, all ~300 items, ~150 tokens (headline+snippet) each: 45,000 tokens/day -> **~$0.004/day**.
- Classifier (topic), all ~300 items, 1 request each: 300 x $0.00125 -> **~$0.38/day**.
- Combined structured extraction (country/entities/event-type/scores/summary/confidence note), YandexGPT Lite async, all ~300 items, ~350 in + 200 out tokens each: 105,000 in + 60,000 out tokens -> **~$0.14/day**.
- Digest assembly, YandexGPT Pro 5.1 async, ~15 selected items, ~1,500 in + 500 out tokens each: 22,500 in + 7,500 out tokens -> **~$0.10/day**.
- Full-text verification pass on the ~20-30 likely digest candidates, YandexGPT Lite async: **~$0.03/day**.

Total: roughly **$0.6-0.75/day**, comfortably inside the PRD's ~$1/day target (PRD 2.1, 12.1) with 25-40% margin to spare. Treat this as an order-of-magnitude sanity check, not a committed number — real token counts depend on actual snippet/article lengths and source volume, and this should be reconciled against `ai_cost_log` once the pipeline is running.

## Logical API Surface

Because the frontend is static, v1 should not implement physical `/api/...` server routes. Preserve the PRD API surface as logical interfaces:

| PRD API | v1 Implementation |
| --- | --- |
| `GET /api/profile` | Supabase `user_profile` table/view |
| `PUT /api/profile` | Supabase RPC `update_profile` |
| `GET /api/cards` | Supabase view `training_cards_today` |
| `POST /api/cards/:id/reaction` | Supabase RPC `record_card_reaction` |
| `GET /api/cards/:id/summary` | Prepared fields on article/cluster views |
| `POST /api/training-session` | Supabase RPC `start_training_session` / `complete_training_session` |
| `POST /api/digest/generate` | Manual invocation of the `generate_digest` Yandex Cloud Function via its authenticated HTTP endpoint, not browser default (revised — was GitHub Actions manual workflow dispatch) |
| `GET /api/digest/today` | Supabase view `digest_today` + `digest_items` |
| `POST /api/digest/:id/feedback` | Supabase RPC `record_digest_feedback` |
| `GET /api/saved` | Supabase `saved_items` view |
| `POST /api/saved` | Supabase RPC `save_item` |
| `DELETE /api/saved/:id` | Supabase RPC `unsave_item` |
| `GET /api/sources/health` | Supabase admin view `source_health_status` |

If exact REST endpoints become necessary later, add Supabase Edge Functions as a thin API layer. Do not add them in v1 unless direct Supabase access creates a concrete product or security problem.

## Data And Retention Decisions

Store:

- source registry and health;
- article metadata, canonical URL, title, snippet, language, timestamps;
- derived topics, countries, entities, event type, scores;
- embeddings;
- event clusters and supporting source links;
- user signals and training sessions;
- digests and digest items;
- saved items;
- job runs and AI cost logs.

Avoid by default:

- retaining full article text;
- storing screenshots/raw fetch dumps;
- storing large debug artifacts in Supabase.

If full text is needed for summarization or clustering, use it transiently inside the worker and store only derived summaries/metadata unless a concrete quality issue requires short-term retention.

## Cost-Minimization Policy

Default monthly fixed cost should be approximately zero before Yandex AI usage:

- GitHub Pages: free, for the public repository this project uses on GitHub Free (no new vendor account — the founder's chosen tradeoff). Private-repo Pages would need GitHub Pro at $4/user/month.
- Yandex Cloud Functions: free up to 1,000,000 invocations + 5 vCPU-hour + 10 GB-hour RAM/month — this pipeline's ~150-250 monthly invocations sit well inside that.
- GitHub Actions (CI/CD only, revised): private repos get 2,000 free Linux minutes/month on the Free plan; a push-triggered build/deploy for a small Vite app should use a small fraction of that. Overage, if it ever happens, is $0.006/minute (Linux 2-core, after the January 2026 rate cut).
- Supabase: use Free until DB size, backups, uptime, or project inactivity constraints become unacceptable. Note the Free plan pauses a project after 7 days with no activity — the scheduled workers hitting Supabase multiple times a day are themselves what keeps the project active, so this only becomes a real risk if the pipeline has already silently stopped running for about a week (see Risks).
- Yandex Cloud AI Studio: the only line item expected to cost anything, and it's small — see the worked estimate in AI Layer (roughly $0.6-0.75/day, under the PRD's ~$1/day target).

Expected paid cost driver is AI usage, not hosting or compute. Keep daily AI spend under the PRD target of about `$1/day` through caching, Asynchronous mode by default, the Classifier API for fixed-label fields, and shortlist-only full-text/verification processing.

## When To Upgrade

**Revised 2026-07-04:** Yandex Cloud Functions + Timer triggers is now the v1 default (see Backend And Jobs), not a later upgrade step — its free tier already covers this workload and it fixes a reliability gap GitHub Actions had. The upgrade path below starts from that baseline.

Move off Yandex Cloud Functions (to Serverless Containers) when any of these happen:

- a worker's dependencies no longer fit a Cloud Functions deployment package (e.g. heavier local ML libraries);
- a job needs to run longer than the ~900-second Cloud Functions execution ceiling;
- jobs regularly approach the 1,000,000-invocation / 5-vCPU-hour / 10-GB-hour monthly free-tier limits;
- source volume grows enough that queueing and retry isolation matter.

Upgrade path:

1. **Yandex Serverless Containers + Timer triggers** — same trigger model, but a custom Docker image instead of a Cloud Functions package, for more runtime control or heavier dependencies.
2. **Supabase Edge Functions + Supabase Cron** for lightweight server endpoints if some logic needs to live next to the database instead of next to the AI provider.
3. **Yandex Message Queue** only if worker fan-out, retries, or DLQ become necessary.

Move off GitHub Pages when:

- repository privacy becomes more important than avoiding a new vendor account or a small monthly fee (see Follow-Up Revision above) — e.g. the competitive-secrecy concern in `prd_v1.md` 19.6/20 gets more concrete;
- app needs server-side routes at the hosting layer.

Fallback hosting order (if repo privacy is revisited):

1. **GitHub Pro** ($4/user/month) to keep the repo private while staying on GitHub Pages — no new vendor account, just a small fixed cost.
2. **Cloudflare Pages** for a $0 private-repo option, if creating a new account becomes acceptable.
3. Vercel Hobby if Next.js server features become useful.
4. Paid Vercel/Yandex/Cloudflare deployment only after the personal MVP proves value.

Move off Supabase Free when:

- database approaches the free storage cap;
- backups become important;
- the project inactivity/pause policy becomes risky;
- usage or reliability requires the Pro tier.

## Rejected Options

### Full Yandex Cloud Stack

Still rejected for v1 as a *complete* replacement — Yandex-native auth, email, and static hosting/deployment would add setup without improving on Supabase Auth + GitHub Pages. **Revised 2026-07-04:** this is now a partial adoption, not a full rejection. Yandex Cloud Functions + Timer triggers are used for the scheduled worker/compute layer (see Backend And Jobs) because that specific piece has a genuine free-tier fit and fixes a reliability gap GitHub Actions had. Auth and database stay on Supabase; static hosting stays on GitHub Pages (see Frontend and Follow-Up Revision).

### Next.js On Vercel

Rejected as default v1 because a static PWA can satisfy the product requirements with lower fixed cost. Keep this as a fallback if physical API routes or SSR become valuable.

### Separate Vector Database

Rejected because Supabase Postgres + `pgvector` is enough for one-user article clustering and ranking.

### Airflow, Kafka, Dedicated Queue

Rejected because v1 source volume and single-user scheduling do not justify persistent orchestration infrastructure.

### Native iOS

Rejected because the PRD explicitly targets mobile web/PWA for v1.

## Risks

- **Yandex Cloud Functions cold starts / execution ceiling:** acceptable for a scheduled batch pipeline (a few extra seconds of cold start doesn't matter for an unattended job), but the ~900-second execution ceiling caps how much work one invocation can do. Mitigation: keep each job (ingest/enrich/cluster_rank/generate_digest/health_check) as its own function/invocation rather than one monolithic run, and chunk `ingest`/`enrich` by source batch if the source pool grows.
- **Supabase Free database size:** article metadata and embeddings can grow. Mitigation: 3-day active horizon, retention cleanup, no full-text storage by default.
- **Supabase Free project pause after 7 days of inactivity, compounding with a stalled pipeline (added 2026-07-04):** if the scheduled workers stop running for about a week (e.g. an undetected Yandex-side failure), Supabase would also pause the project on top of that, turning a recoverable missed-job problem into a "the whole backend is asleep" problem. Mitigation: wire the `health_check` job's failure detection to an actual out-of-band alert (email/ping), not just an in-app status the user has to remember to check — this closes the gap before a week passes, and directly implements the self-alerting recommendation already flagged in `prd_v1.md` 19.4.
- **Direct Supabase browser access:** requires careful RLS/RPC design. Mitigation: all write paths through narrow RPCs; service-role key only in the Yandex Cloud Functions environment, never shipped to the browser.
- **Yandex LLM hallucination:** hard product risk. Mitigation: source-constrained prompts, prepared summaries, entity/claim verification, confidence notes for thin/paywalled sources.
- **Public repository exposes source, prompts, ranking logic, and the source registry (reinstated 2026-07-04, see Follow-Up Revision):** a deliberate tradeoff to avoid a new Cloudflare account and any hosting fee, not an oversight — but worth tracking since `prd_v1.md` 19.6/20 treats this product as a possible startup seed with a nameable thesis. Mitigation: never commit secrets or credentials regardless of repo visibility (this was already required); revisit if competitive secrecy becomes concrete (GitHub Pro or Cloudflare Pages are both same-day moves to private, see When To Upgrade).
- **Single Yandex service-account credential now guards both compute and AI calls (added 2026-07-04):** consolidating GitHub Actions secrets + a separate Yandex API key into one Yandex IAM identity is a net simplification, but that credential is now more sensitive — compromise affects compute and AI spend together, not just AI spend. Mitigation: scope the service account to only the roles it needs (`serverless.functions.invoker`, the AI Studio usage role, nothing broader), and rotate the key if it's ever exposed.

## Sources Checked

- [GitHub Pages overview](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [GitHub Actions billing](https://docs.github.com/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
- [GitHub Actions scheduled workflows](https://docs.github.com/actions/using-workflows/events-that-trigger-workflows)
- [GitHub Actions secrets](https://docs.github.com/actions/security-guides/using-secrets-in-github-actions)
- [Supabase pricing](https://supabase.com/pricing)
- [Supabase pgvector docs](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase scheduled Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)
- [Yandex AI Studio models](https://aistudio.yandex.ru/docs/en/ai-studio/concepts/generation/models.html)
- [Yandex AI Studio embeddings](https://aistudio.yandex.ru/docs/en/ai-studio/concepts/embeddings.html)
- [Yandex AI Studio pricing](https://aistudio.yandex.ru/docs/en/ai-studio/pricing.html)
- [Cloudflare Pages pricing/functions docs](https://developers.cloudflare.com/pages/functions/pricing/)
- [Cloudflare Pages Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/)

### Additional sources checked in the 2026-07-04 critical review

- [Yandex AI Studio common instance models (URIs, context, pricing tiers)](https://yandex.cloud/en/docs/ai-studio/concepts/generation/models)
- [Yandex AI Studio text vectorization models (v1 vs v2, dimensions)](https://aistudio.yandex.ru/docs/en/ai-studio/concepts/embeddings.html)
- [Yandex AI Studio classifier models (Classifier API)](https://aistudio.yandex.ru/docs/en/ai-studio/concepts/classifier/models)
- [Yandex Cloud AI Studio pricing policy (sync/async/batch rates)](https://yandex.cloud/en/docs/ai-studio/pricing)
- [Yandex Cloud Functions quotas and limits (memory, timeout, dependency install budget)](https://yandex.cloud/en/docs/functions/concepts/limits)
- [Yandex Cloud Functions timer trigger](https://yandex.cloud/en/docs/functions/concepts/trigger/timer)
- [Yandex Cloud Functions pricing](https://yandex.cloud/en/docs/functions/pricing)
- [Yandex Cloud serverless free tier](https://yandex.cloud/en/docs/billing/concepts/serverless-free-tier)
- [GitHub Actions 2026 pricing update](https://github.blog/changelog/2025-12-16-coming-soon-simpler-pricing-and-a-better-experience-for-github-actions/)
- [GitHub disabling/enabling a workflow (60-day inactivity auto-disable)](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows)
- [Supabase free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing)
- [Cloudflare Pages platform limits](https://developers.cloudflare.com/pages/platform/limits/)
