# Personal News Swipe Digest PRD v1

## 1. Product Overview

### 1.1. One-line description

Personal News Swipe Digest is a private mobile web/PWA product for iPhone 16 Pro that replaces daily reading across many media and newsletter sources with a swipe-trained personal news recommender and one daily grouped digest.

### 1.2. Product concept

The product shows the user a daily queue of news headline cards. The user quickly reacts to each headline with swipe-like actions. These reactions train a personal recommendation model that learns what is important and interesting to the user across topics, countries, business relevance, and novelty.

After the training session, the product generates one daily digest with 10-15 grouped items from the latest 3-day news pool. The digest removes duplicate coverage of the same event, keeps original source languages, includes source links, and explains why each item matters and why it was selected.

The product is designed for one person, not as a social or public news network.

### 1.3. Core problem

The user currently wants to stay informed across many sources: media, RSS feeds, newsletters, and eventually other information channels such as Telegram. This creates three problems:

- Too many sources to scan manually every day.
- Too many duplicate or low-signal headlines.
- Existing news apps are not personal enough and do not learn precisely from headline-level taste.

### 1.4. Core solution

Create a personal news system that:

- Collects news automatically from a curated and expanding source pool.
- Presents a fast daily training queue of 50-100 headline cards.
- Learns from explicit reactions and implicit engagement.
- Uses recall-first ranking so important news is less likely to be missed.
- Protects against filter bubbles with a deliberate exploration layer.
- Generates one concise daily digest after the training session.

### 1.5. Platform

- v1 platform: cloud-hosted mobile web/PWA.
- Primary device: iPhone 16 Pro.
- Primary browser: Safari on iOS.
- Authentication: email magic link.
- Notifications: no push notifications in v1.
- Digest access: in-app only.

## 2. Goals and Non-Goals

### 2.1. Goals

- Build a useful personal news digest within one week of daily use.
- Make daily training lightweight enough that 50-100 swipes take approximately 3-5 minutes.
- Optimize recommendations for the user's actual interests rather than broad topic subscriptions.
- Avoid duplicates in the digest by clustering repeated coverage of the same event.
- Preserve source links and verification context for each digest item.
- Include both Russian and English sources without translating source content.
- Reduce the need to read many media sites and newsletters manually.
- Keep daily AI and processing cost under approximately `$1/day`.

### 2.2. Non-Goals for v1

- No native iOS app.
- No Telegram ingestion.
- No Gmail integration.
- No private mailbox or newsletter forwarding inbox.
- No push notifications.
- No social features.
- No multi-user personalization.
- No manual source setup by the user.
- No full editorial CMS.
- No requirement to summarize every article from every source.
- No automatic translation between Russian and English.
- No engagement-optimizing design: no streaks, no "come back" push nudges, no infinite scroll, no gamified habit loops. See 20.
- No fundraising or multi-user build-out work until the personal MVP has been validated through sustained real use. See 2.3, 20.

### 2.3. Founder decisions log (2026-07-04)

The following v1 scoping decisions were made explicitly by the founder after a critical review of this PRD, and supersede any conflicting language elsewhere in this document:

- **Digest is never gated on training completion.** The digest generates on schedule regardless of whether the daily training session was started or finished. Training only influences the ranking used in future digests, it never blocks access to today's digest. See updated 8.1.
- **Training volume tapers over time, not fixed forever.** 50-100 swipes/day is the cold-start volume only. As the model's confidence in the user's profile increases, the required daily volume should shrink, and card selection should shift toward active learning (prioritize cards the model is least certain about) rather than blind full-queue review. See new 5.8.
- **v1 architecture stays single-user-optimized.** No effort will be spent generalizing the data model, auth, or profile structure for a future multi-user product. This is an intentional speed tradeoff; multi-user architecture will be revisited only after the personal MVP is validated. This reinforces the existing non-goal in 2.2.
- **Telegram stays out of v1**, accepting the risk that the Russian-language source pool may be thinner than desired without it. This should be actively monitored (see 6.7) rather than silently assumed to be fine.

### 2.4. v1 success definition

The MVP is successful if, after one week of use:

- The daily digest is usually worth reading.
- The user sees few or no duplicate event items in the digest.
- Most digest items feel either personally interesting, business-relevant, or important to know.
- The user feels less need to scan many sources manually.
- The system still surfaces some unexpected but valuable items outside the user's obvious past preferences.

## 3. Target User and Core Job

### 3.1. Target user

The v1 user is a single private user who wants to stay aware of important and personally relevant news across multiple domains, countries, and business contexts without manually reading many sources every day.

### 3.2. Core job-to-be-done

When the user wants to stay informed, they want to quickly train the system on what currently matters to them and receive a concise, reliable digest, so they can remain aware of important developments without spending time scanning many sites, feeds, and newsletters.

### 3.3. User priorities

The user's stated priorities are:

- Recommendation accuracy based on swipes.
- Avoid missing important news.
- Use the system as an alternative to reading many media outlets, Telegram channels, and other sources.
- Maintain awareness of what is both important and personally interesting.
- Include both Russian and English information spaces.
- Keep source links and verification visible.
- Avoid repeated coverage of the same story.
- Protect against filter bubbles.

### 3.4. Tolerance and constraints

- The user is willing to swipe 50-100 headlines per day.
- This is a strong signal volume for a one-user recommender.
- 50 swipes/day provides approximately 350 explicit signals per week.
- 100 swipes/day provides approximately 700 explicit signals per week.
- This should be enough to show meaningful improvement within one week if the ranking loop is implemented well.
- 200+ daily swipes should be avoided in v1 because the product should not become another attention-heavy feed.

## 4. User Experience

### 4.1. Daily routine

The primary daily flow is:

1. User opens the PWA.
2. User sees today's training queue.
3. User swipes through 50-100 headline cards.
4. User can tap a card before swiping to reveal prepared context.
5. User completes the training session.
6. User triggers or receives the generated daily digest.
7. User reads the grouped digest.
8. User can rate digest items to improve future recommendations.

### 4.2. Training queue

The training queue is a headline-first interface inspired by Tinder-like matching:

- One card visible at a time.
- Front of card shows only the headline.
- Optional metadata on the front should be minimal:
  - source name may be shown if it does not bias the training too much;
  - time may be shown only if needed for recency context.
- Tap opens the card detail state.
- Swipe right or positive action marks the item as interesting.
- Swipe left or negative action marks the item as not interesting.
- Secondary actions are available through a compact "more" menu.

### 4.3. Card detail state

When the user taps a headline card, the card expands or opens a bottom sheet showing:

- Prepared short summary.
- Source.
- Publication time.
- Link to original item.
- Detected topic.
- Detected country or region.
- Key entities if available.
- Why the system showed this item.
- Verification context if available.
- Secondary feedback actions.

The summary must already be prepared before the user taps the card. The app should not make the user wait for summary generation during interaction.

### 4.4. Primary reactions

| Reaction | User meaning | Product consequence |
| --- | --- | --- |
| `interesting` | "I want more like this." | Strong positive signal for similar topics, countries, entities, business significance, novelty patterns, and source types. The item becomes eligible for digest inclusion. |
| `not_interesting` | "This is not worth my attention." | Weak to medium negative signal. Similar items are demoted, but globally important items are not blocked. |
| `save` | "This is important enough to keep." | Very strong positive signal. Adds item to Saved/Read Later and increases weight for similar future items. |
| `open_summary` | "This might be worth context." | Weak implicit positive signal. Should not be treated as a full like. |
| `more` | "I need a more specific feedback action." | Opens secondary actions without changing score by itself. |

### 4.5. Secondary reactions

| Reaction | User meaning | Product consequence |
| --- | --- | --- |
| `hide_topic` | "Do not show this topic/cluster." | Hard negative for that topic or event cluster. Use sparingly and never infer too broadly from one action. |
| `hide_source` | "This source is not useful to me." | Demotes or excludes the source without penalizing the underlying topic. |
| `too_obvious` | "I already know this or it is commodity news." | Reduces weight for repeated, obvious, or widely saturated items. Improves novelty scoring. |
| `too_noisy` | "This is clickbait, speculation, or low signal." | Penalizes source quality, headline framing, or weak factuality without necessarily penalizing the topic. |
| `important_not_interesting` | "I do not personally like this, but I should know it." | Adds to must-know logic and potential digest inclusion without strongly training personal taste toward similar items. |
| `show_more_like_this` | "This is exactly the pattern I want." | Very strong positive signal for article, event cluster, source type, topic, country, entities, and novelty profile. |

### 4.6. Digest reading experience

The daily digest should be structured by topic groups, not as a flat feed.

Each digest item must include:

- Headline.
- Short summary.
- Why it matters.
- Why selected for the user.
- Source link.
- Additional source links if the same event appears in multiple sources.
- Verification or confidence note.
- Language preserved from source context.
- Per-item feedback controls.

### 4.7. Digest feedback

Each digest item should support feedback:

- Useful.
- Not useful.
- Important.
- Duplicate.
- Too shallow.
- Too much like something I already knew.

This feedback must feed back into the ranking and digest generation logic.

## 5. Recommendation Model

### 5.1. Recommendation objective

The recommender should maximize a blend of:

- Personal interest.
- Topic relevance.
- Country or region relevance.
- Business significance.
- Novelty.
- Recency.
- Source quality.
- Event importance.
- Exploration value.

The system must use a recall-first strategy: missing important news is worse than showing some extra noise.

**Note (2026-07-04):** personalized ranking technology by itself is not this product's moat. Zite and Prismatic both built genuinely good personalization and still failed or got acquihired for parts rather than surviving as standalone products — personalization alone wasn't enough of a reason to exist. The actual differentiator here is the specific combination of recall-first ranking, a non-suppressible must-know layer, bilingual RU/EN sourcing, and a hard cap on digest size (non-infinite feed). Ranking sophistication should serve that combination, not become a goal in itself — see 19.1 and 20.

### 5.2. Feed composition targets

The training queue should approximately include:

- 60% predicted relevant items.
- 25% borderline or exploration items.
- 15% broadly important "must know" items.

These percentages are guidance, not rigid rules. The system should adapt if the available source pool is small or the day is unusually news-heavy.

### 5.3. Signal hierarchy

Signals should be weighted approximately as follows:

1. Explicit strong positive:
   - save;
   - show more like this;
   - repeated interesting swipes on similar clusters.
2. Explicit normal positive:
   - interesting swipe;
   - useful digest feedback.
3. Explicit nuanced positive:
   - important but not interesting;
   - important digest feedback.
4. Implicit weak positive:
   - opening summary;
   - clicking source link;
   - spending time on details.
5. Explicit negative:
   - not interesting;
   - not useful digest feedback.
6. Explicit hard negative:
   - hide topic;
   - hide source.
7. Quality negative:
   - too noisy;
   - duplicate;
   - too obvious.

### 5.4. Preference dimensions

The system should learn user preferences across:

- Topic.
- Subtopic.
- Country or region.
- Entity:
  - company;
  - person;
  - institution;
  - technology;
  - sector.
- Source type.
- Source quality.
- Business significance.
- Novelty.
- Event type:
  - regulation;
  - funding;
  - product launch;
  - macroeconomic change;
  - M&A;
  - sanctions;
  - earnings;
  - geopolitical event;
  - scientific or technical milestone;
  - market movement.
- Language.

### 5.5. Cold start

The onboarding process should combine:

- A short natural-language interest description.
- A seed training session of 50-100 cards.
- Semi-automatic source registry expansion based on early positive signals.

The system should not require the user to manually configure sources before using the product.

### 5.6. Filter-bubble protection

The recommender must deliberately include exploration items.

Exploration items should include:

- Important events outside the user's current preference profile.
- Adjacent topics related to known interests.
- Sources with high quality but limited prior interaction.
- Countries or sectors that may affect known topics indirectly.

If the user reacts positively to unexpected items, those signals should update future recommendations.

### 5.7. Must-know layer

The product should maintain a separate must-know scoring layer for items that may be important even if they are not predicted to be personally interesting.

Must-know scoring should consider:

- Broad source coverage.
- High-authority sources.
- Major economic, political, or business significance.
- Strong recency.
- Impact on countries, sectors, or entities the user often cares about.
- Unusual or breaking nature of the event.

Negative personal interest signals should demote but not fully suppress must-know items.

### 5.8. Adaptive training volume

**Resolved 2026-07-04:** the 50-100 cards/day cold-start volume is not a permanent fixed requirement (see 2.3). The system should taper the daily training load as the model's confidence in the user's profile grows.

- Track a per-dimension confidence score (topic, entity, country, source) based on signal volume and consistency.
- Once confidence is high across the profile, reduce the daily queue size, targeting fewer but higher-value cards rather than full-volume review.
- Prioritize card selection using active learning: cards where the model is most uncertain (near the decision boundary) should be shown before cards the model already predicts confidently, so each swipe carries more information.
- A stable, mature profile might warrant a queue as small as 15-30 cards/day, while a new or drifting profile (e.g., after a topic shift or long absence) should temporarily widen back toward the 50-100 range.
- This tapering must not reduce exploration or must-know coverage; it applies to the predicted-relevant portion of the queue (5.2).
- This directly supports the product goal of not becoming an attention-heavy feed (3.4) while keeping the recommender's information gain high.

## 6. Source and Ingestion Strategy

### 6.1. v1 source scope

v1 sources:

- Public media websites.
- RSS feeds.
- Public newsletter archives.
- Newsletter RSS feeds where available.

v1 excluded sources:

- Telegram channels.
- Gmail.
- Private email newsletters.
- User-forwarded newsletters.
- X/Twitter.
- Reddit.
- YouTube.
- Podcasts.
- Paywalled full text unless snippet or accessible metadata is available.

### 6.2. Source setup

The user should not manually configure sources in v1.

The product should use:

- A seeded source registry.
- Semi-automatic source discovery.
- Source quality scoring.
- Topic and language coverage monitoring.

The seeded registry should include enough Russian and English sources to generate a useful queue across broad business, economic, technology, and global news categories. The exact source list can evolve without changing the product requirement.

### 6.3. Source registry fields

Each source should store:

- Source ID.
- Name.
- URL.
- RSS URL if available.
- Language.
- Country or region.
- Source type:
  - media;
  - RSS;
  - public newsletter archive.
- Topics usually covered.
- Authority score.
- Noise score.
- Paywall status.
- Crawl frequency.
- Last successful fetch.
- Error status.
- Whether source is active.

### 6.4. Article ingestion fields

Each ingested article or item should store:

- Article ID.
- Canonical URL.
- Original URL.
- Source ID.
- Title.
- Snippet or description.
- Full text if available, stored only when needed for summarization/clustering quality, not retained by default — see note below.
- Language.
- Published timestamp.
- Fetched timestamp.
- Author if available.
- Raw tags if available.
- Extracted entities.
- Extracted countries or regions.
- Extracted topics.
- Business significance score.
- Novelty score.
- Source quality score.
- Paywall or limited-access flag.
- Embedding vector.
- Cluster ID if assigned.

**Note (2026-07-04):** prefer snippet + derived summary over verbatim full-text storage where the summary/clustering task doesn't strictly need it. NewsBreak's copyright settlements with publishers (Patch Media, Emmerich Newspapers) came from reuse of full article content at scale. This is low personal-use risk today, but the data model should not casually accumulate a mirror of copyrighted full text as a default habit that becomes a liability if this ever serves more than one person (see 19.5).

### 6.5. Ingestion frequency

The ingestion job should run multiple times per day so that the training queue and digest are fresh.

Minimum acceptable v1 schedule:

- Fetch sources every 2-4 hours.
- Re-rank available items before each training session.
- Generate digest on a fixed daily schedule (see 8.1), independent of training completion.

### 6.6. 3-day horizon

The product should consider items from the last 3 days.

Reason:

- Some newsletters and slower sources publish less frequently.
- Important developments may still matter after 24 hours.
- The system should not miss important events simply because the user opened the app late.

Older items can appear only if they are part of an active event cluster with new coverage.

### 6.7. Russian-language source coverage risk

**Flagged 2026-07-04:** Telegram stays out of v1 scope by founder decision (see 2.3), but much Russian-language commentary and breaking news lives on Telegram rather than RSS/media sites, and Russian outlets have inconsistent RSS availability and possible access issues from cloud IPs.

- Treat the initial Russian-language source registry as a spike, not an assumption: verify actual RSS reachability and update frequency for the seeded list before building the rest of the pipeline around it (see 18.2 build order step 1).
- Monitor Russian-language topic/language coverage explicitly (source registry already tracks this per 6.3) and surface it on the sources/admin screen (10.6).
- If RU coverage proves too thin without Telegram, this should force a re-opened decision on pulling Telegram ingestion earlier than v2, rather than being silently accepted.

## 7. Deduplication and Event Clustering

### 7.1. Requirement

The digest must not repeat the same news event as separate items.

Training cards may include multiple angles on the same event only if they are meaningfully different. However, the default should be to avoid repeated headline cards from the same event cluster.

### 7.2. Cluster creation

Items should be clustered using:

- Canonical URL matching.
- Normalized title similarity.
- Embedding similarity.
- Shared named entities.
- Shared dates.
- Shared event type.
- Publication time proximity.
- Source cross-coverage.

### 7.3. Cluster-level fields

Each event cluster should store:

- Cluster ID.
- Representative headline.
- Representative summary.
- Topic.
- Subtopic.
- Countries or regions.
- Key entities.
- Event type.
- First seen timestamp.
- Latest update timestamp.
- Source count.
- Primary source.
- Supporting sources.
- Business significance score.
- Must-know score.
- Novelty score.
- Personal relevance score.
- Deduplication confidence.

### 7.4. Duplicate handling

If an item is a duplicate:

- It should enrich the existing cluster.
- It should not create a new digest item.
- It can provide additional source links.
- It can increase verification confidence if the source is independent and credible.

## 8. Digest Generation

### 8.1. Digest timing

**Resolved 2026-07-04:** the digest is never gated on training completion (see 2.3). It is generated on a fixed daily schedule regardless of whether the user opened the training queue that day.

- Digest generation runs on schedule using the latest available profile at that time.
- If training was completed earlier that day, the digest reflects the freshly updated profile.
- If training was skipped or partial, the digest still generates using the prior profile state, and should indicate that today's training was incomplete or skipped so the user understands why ranking may feel stale.
- Training's only effect is on the ranking used for future digests. It must never block same-day digest access.

### 8.2. Digest size

Target digest size:

- 10-15 total items.

The app should avoid creating a 30+ item digest in v1 because the product goal is to reduce attention load.

### 8.3. Digest structure

The digest should be grouped by topic.

Example grouping:

- Business and Economy.
- Technology and AI.
- Markets and Companies.
- Policy and Regulation.
- Global Context.
- Exploration / Worth Knowing.

The exact group names should be generated from the day's selected items rather than fixed if dynamic grouping improves readability.

### 8.4. Digest item structure

Each digest item must include:

- Title.
- 2-4 sentence summary.
- Why it matters.
- Why selected for the user.
- Source link.
- Additional sources if available.
- Confidence note.
- Published date or cluster time range.
- Feedback controls.

### 8.5. Verification/confidence note

The confidence note should be short and practical.

Examples:

- "Single source; treat as preliminary."
- "Covered by multiple independent sources."
- "Primary source is official; limited secondary coverage."
- "Paywalled source; summary based on headline/snippet."
- "Developing story; details may change."

### 8.6. Digest item selection

The final digest should balance:

- Highest personal relevance.
- Must-know importance.
- Business significance.
- Novelty.
- Recency.
- Source quality.
- Topic diversity.
- Exploration.

The digest should not simply include the top 15 personal relevance scores. It must include some important items outside the learned profile.

### 8.7. Grounding requirement for generated text

**Added 2026-07-04, hard requirement, not a quality nice-to-have.** In 2024, NewsBreak (a top-downloaded US news app) was caught publishing AI-generated stories describing events that never happened, including a fabricated local tragedy and incorrect food-bank distribution times that caused real-world harm, plus copyright lawsuits over content reuse. This product generates summaries, "why it matters," "why selected," and confidence notes with AI for every digest item, so the same failure mode is directly reachable here even at personal scale.

- Every generated summary, "why it matters," and "why selected" text must be grounded only in retrieved source text (title, snippet, or fetched article body). The model must not introduce facts, numbers, quotes, names, or claims that are not present in the source material.
- Prefer extractive or tightly source-constrained generation over free generation for factual claims.
- Where feasible, run a lightweight verification pass (e.g. checking that named entities and key claims in the generated summary actually appear in the source text) before the item is shown, and fall back to a more literal, less fluent summary rather than showing an ungrounded one.
- If no reliable source text is available (e.g. paywalled with only a headline), the confidence note must say so explicitly rather than the summary quietly inventing plausible-sounding detail.
- This requirement applies even though this is a single-user product with no publishing/liability exposure today — it exists so the ranking and generation pipeline doesn't develop a habit that becomes dangerous if the product ever serves more than one person.

## 9. Data Model

### 9.1. Core entities

The implementation should include the following conceptual entities:

- User.
- UserProfile.
- Source.
- Article.
- EventCluster.
- UserSignal.
- TrainingSession.
- Digest.
- DigestItem.
- SavedItem.
- SourceHealthLog.

### 9.2. UserProfile

The user profile should store:

- User ID.
- Natural-language interest description.
- Learned topic weights.
- Learned country or region weights.
- Learned entity weights.
- Learned source preferences.
- Learned source blocks or demotions.
- Learned topic blocks or demotions.
- Novelty preference.
- Business significance preference.
- Language preferences.
- Last updated timestamp.

### 9.3. UserSignal

Each user action should be stored as a durable signal.

Fields:

- Signal ID.
- User ID.
- Article ID if applicable.
- Cluster ID if applicable.
- Digest item ID if applicable.
- Signal type.
- Signal strength.
- Timestamp.
- Context:
  - training queue;
  - card detail;
  - digest;
  - saved list.
- Optional reason metadata.

### 9.4. TrainingSession

Fields:

- Session ID.
- User ID.
- Date.
- Started at.
- Completed at.
- Cards shown.
- Cards reacted to.
- Positive count.
- Negative count.
- Saves count.
- Exploration cards shown.
- Must-know cards shown.
- Completion status.

### 9.5. Digest

Fields:

- Digest ID.
- User ID.
- Date.
- Generated at.
- Training session ID if available.
- Item count.
- Topic groups.
- Summary text if needed.
- Status:
  - generating;
  - ready;
  - failed.
- Cost estimate.

### 9.6. DigestItem

Fields:

- Digest item ID.
- Digest ID.
- Cluster ID.
- Group name.
- Title.
- Summary.
- Why it matters.
- Why selected.
- Source links.
- Confidence note.
- Rank.
- Feedback status.

## 10. Screens and UX Requirements

### 10.1. App shell

The PWA should have a compact mobile-first shell with bottom navigation:

- Train.
- Digest.
- Saved.
- Profile.

Optional developer/admin-only view:

- Sources.

### 10.2. Train screen

Requirements:

- Optimized for one-handed use on iPhone 16 Pro.
- Large headline card.
- Swipe left/right support.
- Tap to reveal summary.
- Buttons for users who do not want gestures.
- Visible progress:
  - e.g. "34 / 75".
- Fast loading of next card.
- No visible layout shift between cards.
- Ability to undo the last reaction.
- Clear completion state.

### 10.3. Digest screen

Requirements:

- Shows today's digest by default.
- Topic groups are visually distinct.
- Each item is compact but expandable.
- Source links are easy to open.
- Feedback controls are present but not visually noisy.
- Empty state explains whether digest is waiting for training, generation, or source ingestion.

### 10.4. Saved screen

Requirements:

- Shows saved items.
- Supports search/filter by topic, source, and date.
- Keeps original source links.
- Allows unsave.

### 10.5. Profile screen

Requirements:

- Shows editable natural-language interest description.
- Shows learned preference summary.
- Shows blocked or demoted topics and sources.
- Allows reset of learned preferences.
- Allows export of user data in a simple format.

### 10.6. Sources screen

This can be hidden from the main user flow or treated as an admin/debug screen.

Requirements:

- Show active source count.
- Show recent fetch errors.
- Show language/source coverage.
- Show stale sources.
- Show top sources contributing digest items.

## 11. API Requirements

### 11.1. Authentication

Use email magic link authentication.

Requirements:

- Only the authorized user can access the app.
- Sessions should persist on iPhone Safari.
- Auth state should survive PWA launch from home screen.

### 11.2. Minimum API endpoints

The application should expose or internally implement equivalent APIs:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/profile` | `GET` | Get user profile and learned preference summary. |
| `/api/profile` | `PUT` | Update natural-language interest description or preference controls. |
| `/api/cards` | `GET` | Get ranked training cards for current session. |
| `/api/cards/:id/reaction` | `POST` | Store reaction for a card. |
| `/api/cards/:id/summary` | `GET` | Return prepared summary and explanation for card detail. |
| `/api/training-session` | `POST` | Start or complete a training session. |
| `/api/digest/generate` | `POST` | Generate daily digest after training. |
| `/api/digest/today` | `GET` | Get today's digest. |
| `/api/digest/:id/feedback` | `POST` | Store digest item feedback. |
| `/api/saved` | `GET` | Get saved items. |
| `/api/saved` | `POST` | Save an item. |
| `/api/saved/:id` | `DELETE` | Remove saved item. |
| `/api/sources/health` | `GET` | Admin/debug source health status. |

### 11.3. Card response shape

Each card should include:

- Card ID.
- Article ID or cluster ID.
- Headline.
- Source name.
- Published timestamp.
- Language.
- Whether summary is ready.
- Queue reason:
  - predicted relevant;
  - exploration;
  - must know.

The front-end should not need to compute ranking.

### 11.4. Card summary response shape

The summary endpoint should include:

- Summary.
- Why shown.
- Topic.
- Countries or regions.
- Key entities.
- Source link.
- Supporting links if available.
- Confidence note.

### 11.5. Reaction write behavior

Reaction writes must be durable and fast.

On reaction:

- Store `UserSignal`.
- Update session counters.
- Optimistically advance UI.
- Schedule or trigger preference updates.
- Do not block card progression on expensive model updates.

## 12. AI/LLM Usage and Cost Constraints

### 12.1. Budget

Target total AI and processing budget:

- Up to approximately `$1/day`.

This budget should include:

- Embeddings.
- Metadata extraction.
- Summaries.
- Digest generation.
- Re-ranking where LLMs are used.

It does not necessarily include paid third-party news APIs, if later added.

### 12.2. AI tasks

AI should be used for:

- Embedding headlines, snippets, and available article text.
- Extracting topics, countries, entities, event types, and business significance.
- Generating short summaries.
- Explaining why an item was selected.
- Producing digest item text.
- Creating confidence/verification notes.

AI should not be the only ranking mechanism. Ranking must combine AI-derived features with explicit user signals and deterministic scoring.

All text-generation AI tasks in this list (summaries, why-selected, digest item text, confidence notes) are subject to the grounding requirement in 8.7: no fabricated facts, entities, quotes, or numbers beyond what the source material supports.

### 12.3. Cost controls

Cost controls:

- Embed titles/snippets for all items.
- Fetch or summarize full text only for likely useful items or high-importance clusters.
- Reuse summaries across article cards and digest items where possible.
- Cache extracted metadata.
- Avoid reprocessing unchanged articles.
- Limit digest generation to once per day unless manually regenerated.
- Prefer cheaper models for extraction/classification and stronger models only for final digest writing if needed.

### 12.4. Failure behavior

If AI processing fails:

- Card queue should still show headline-only items if ranking data exists.
- Digest generation should retry.
- Failed digest state should be visible.
- Source links should remain available even if summaries are missing.

## 13. Privacy and Security

### 13.1. Privacy stance

The user has no special storage restrictions for v1, but the product should still treat preference data as private.

### 13.2. Security requirements

- Email magic link auth.
- No public unauthenticated access.
- Store secrets only in environment variables or managed secret storage.
- Do not expose API keys to the browser.
- Use HTTPS in production.
- Restrict admin/source health screens to the authenticated user.

### 13.3. Data retention

Default retention:

- Keep user signals indefinitely unless user resets profile.
- Keep saved items indefinitely.
- Keep article metadata long enough to support deduplication and learning.
- Allow user to reset learned preferences while retaining account.

## 14. Success Metrics

### 14.1. Primary quality metrics

- Percentage of digest items rated useful or important.
- Number of duplicate digest items per day.
- Number of important missed items noticed by user.
- Daily training completion rate.
- Average time to complete 50-card session.
- Ratio of saved items to shown items.

### 14.2. Recommendation learning metrics

- Positive swipe rate over time.
- Negative swipe rate over time.
- Exploration positive rate.
- Must-know accepted rate.
- Topic/source demotion accuracy.
- Repeat exposure rate for same event clusters.

### 14.3. Operational metrics

- Source fetch success rate.
- Source freshness.
- Number of active sources.
- Number of new articles ingested per day.
- Deduplication confidence distribution.
- Digest generation time.
- Estimated daily AI cost.

### 14.4. MVP target metrics

After one week:

- At least 70% of digest items should be rated useful, important, or saved.
- Duplicate digest items should average below 1 per day.
- 50-card session should usually take under 5 minutes.
- At least one exploration item per week should be positively rated.
- Daily AI cost should stay under `$1/day`.

## 15. MVP Acceptance Criteria

### 15.1. Functional acceptance criteria

- User can authenticate with email magic link.
- User can complete onboarding with a natural-language interest description.
- System ingests public media/RSS/newsletter archive sources.
- System creates a daily training queue.
- User can swipe or button-react to 50-100 headline cards.
- User can tap a card to see prepared summary and explanation.
- User can save items.
- User can access saved items.
- One daily digest is generated on schedule, whether or not training was completed that day (see 8.1).
- Digest contains 10-15 grouped items.
- Digest items include source links.
- Digest avoids duplicate event coverage.
- User can provide feedback on digest items.
- Profile screen shows learned preferences and allows editing the interest description.

### 15.2. UX acceptance criteria

- UI is comfortable on iPhone 16 Pro.
- Card interactions feel immediate.
- Text does not overflow on mobile.
- The app works when launched from the iOS home screen as a PWA.
- Training progress is clear.
- Digest is readable without feeling like another infinite feed.

### 15.3. Recommendation acceptance criteria

- Explicit positive and negative swipes affect future ranking.
- Saving an item has stronger positive impact than a normal positive swipe.
- `hide_source` demotes or excludes a source.
- `hide_topic` demotes a topic or event cluster.
- Negative swipes do not completely suppress must-know news.
- Exploration items are shown daily.
- Positive reactions to exploration items update future recommendations.

### 15.4. Source and digest acceptance criteria

- Items are limited to the last 3 days unless part of an updated active cluster.
- Russian and English items can appear without translation.
- Paywalled items can be included using headline/snippet if full text is not available.
- Confidence notes distinguish single-source, multi-source, official-source, paywalled, and developing-story cases.

### 15.5. Trust and safety acceptance criteria

- No generated summary, "why it matters," "why selected," or confidence note contains a fact, quote, number, or named entity absent from the retrieved source material (see 8.7).
- If source material is too thin to summarize reliably (headline-only, paywalled with no snippet), the item says so rather than generating plausible-sounding invented detail.
- No design element optimizes for engagement over completion: no streaks, no infinite scroll, no push nudges, no gamified return mechanics (see 2.2, 20).

## 16. V2 Ideas

Potential v2 additions:

- Telegram channel ingestion.
- Private newsletter ingestion through a dedicated app inbox.
- Gmail integration for newsletters.
- Push notifications.
- Native iOS app.
- Audio digest.
- Topic-specific digest views.
- Manual source controls for advanced use.
- Source recommendation and source discovery UI.
- "Ask about my news" chat interface.
- Weekly review and long-term trend tracking.
- Entity watchlists for companies, people, countries, technologies, or sectors.
- Comparative source framing across countries or political/economic viewpoints.
- Export to Notion, Readwise, Obsidian, or Markdown.

## 17. Open Questions

These questions are intentionally deferred and should not block v1:

- Which exact initial source registry should be used?
- Should the front of the card show source name, or should the source be hidden until tap to reduce bias?
- ~~Should digest generation be fully manual after training or automatically triggered when the training session is complete?~~ Resolved 2026-07-04: digest always generates on schedule, never gated on training (see 2.3, 8.1).
- What is the best default time of day for the training session?
- Should the product store full article text or only extracted summaries and metadata?
- Which model/provider mix should be used in production for best quality/cost tradeoff?
- How aggressively should `hide_topic` generalize from one cluster to adjacent topics?

The weekly calibration screen (showing what the model has learned) is promoted from open question to a committed v1.1 feature — see 19.3. It is the only practical way to measure the "important missed items" success metric (14.1) and to build user trust in the model.

## 18. Implementation Notes

### 18.1. Recommended technical stack

Recommended v1 stack:

- Next.js or similar React framework.
- Mobile-first PWA.
- Supabase Auth for magic links.
- Postgres for relational data.
- pgvector for embeddings.
- Scheduled jobs for ingestion and digest generation.
- Server-side AI calls only.

### 18.2. Recommended build order

0. Spike: verify real RSS reachability, update frequency, and Russian-language coverage for the intended seed source list before committing to it (see 6.7). Fetch failures or blocked hosts found here should reshape the registry, not be discovered later.
1. Build source ingestion for a small seeded source registry.
2. Store articles, metadata, embeddings, and basic clusters.
3. Build authentication and mobile app shell.
4. Build training queue UI and reaction capture.
5. Implement first-pass ranking using profile text, embeddings, and swipe signals.
6. Build card detail summaries and "why shown".
7. Build digest generation with clustering and source links.
8. Add digest feedback loop.
9. Add source health/admin view.
10. Tune ranking over one week of real use.

### 18.3. Recommended v1 quality principle

The product should prefer a smaller, reliable, and learnable system over a broad but noisy feed. The goal is not to ingest the entire internet. The goal is to create a personal information system that becomes more useful every day.

## 19. Product Review Notes (2026-07-04)

This section captures a critical review of this PRD, decisions already resolved with the founder (2.3), and remaining recommendations not yet decided. It should be revisited and pruned as items are addressed.

### 19.1. Scope the ranking system explicitly as MVP vs. mature state

Section 5 describes a fairly mature multi-signal ranking system (weighted signal hierarchy, explore/exploit ratios, a dozen preference dimensions). Building all of it before validating that swipe-based training actually beats a simpler baseline is a real over-engineering risk for a single-developer MVP. Recommendation: ship a v0 ranking model using embeddings + similarity to liked items + a simple learned weighting, and treat the full signal hierarchy in 5.3-5.4 as the target state to grow into over weeks, not a day-one requirement. The build order in 18.2 already implies this phasing; make it explicit so scope doesn't creep during implementation.

### 19.2. Close the deduplication feedback loop

The `duplicate` feedback action exists on digest items (8.4) but nothing in the current spec describes it changing clustering behavior. Without a feedback loop, repeated dedup mistakes on the same source pair or event type will keep recurring. Recommendation: when a user marks an item as a duplicate of something already seen, use that signal to adjust clustering thresholds for the specific source pair or entity/event-type combination involved, not just log it as a metric.

### 19.3. Weekly calibration screen (promoted from open question, see 17)

A recurring view showing learned topic/entity/country weights, recent blocks/demotions, and a simple prompt ("did anything important happen this week that the digest missed?") turns the "important missed items" success metric (14.1) from unmeasurable into a real weekly ritual, and builds trust in the model by making it inspectable.

### 19.4. Self-alerting on pipeline failure

With a single user relying on a fully automated daily pipeline, a silent ingestion or digest-generation failure could go unnoticed for days. Recommendation: add a lightweight self-alert (email or a simple ping) when a scheduled job fails, separate from the in-app source health screen (10.6), which the user can only see if they open the app.

### 19.5. Source ToS / copyright posture

Not a v1 blocker for personal use, but worth a short explicit stance once this becomes multi-user: storing full text (9.4) and summarizing paywalled content changes legal exposure significantly between "one person's personal reading tool" and "redistributing content to many users." Revisit before any multi-user step (see 2.3 on staying single-user for now).

### 19.6. Comparable products in the market

Personalized cross-source news aggregation is a crowded space with a mixed track record — useful context given this MVP is intended to seed a startup:

- **Artifact** (Kevin Systrom / Mike Krieger, Instagram co-founders) — AI-personalized news feed learned from reading behavior. Shut down in early 2024 ("the market opportunity isn't big enough"), tech sold to Yahoo. A caution that personalization alone, without a sharper wedge, is a hard business.
- **Particle News** (founded 2023, $4.4M seed + $10.9M Series A from Lightspeed) — synthesizes one story from multiple sources with opposing viewpoints, quotes, and an AI chat interface; launched a web version in May 2025. Closest existing analog to this product's dedup + "why it matters" approach.
- **Ground News** (since 2018) — compares the same story across ~40,000+ sources with bias/factuality ratings, subscription-first, processes ~60,000 stories/day. Closest analog to the filter-bubble-protection and clustering angle, without personal swipe-based learning.
- **Inshorts** (India, since 2013, $119M raised, ~$550M valuation, 100M+ users) — swipe-card news in 60 words. The strongest existing proof that swipe mechanics work for news, though its win came from short-form format and market fit in India rather than personalized training.
- **SmartNews** ($2B valuation, $104.5M ARR in 2025) — "Interest Graph" personalization from implicit behavior; launched NewsArc in 2025 specifically to serve highly engaged readers without echo chambers.
- **Feedly Leo** — AI layer over RSS that prioritizes, deduplicates, and mutes based on user-trained examples. Validates the RSS + dedup + personalization combination as a working prosumer/B2B niche.
- **usedigest.com** (literally named "Digest") — combines newsletters, RSS, Reddit, and YouTube into one daily email; not personalized via swipe training, but a direct naming and positioning collision worth checking.
- **Mozilla Pocket** — shut down in July 2025 ("the way people use the web has evolved"). A reminder that even with a large user base, read-later/aggregation economics can fail to sustain a company.

No competitor currently combines swipe-level personal training, a recall-first must-know layer, bilingual RU/EN sourcing without translation, and a digest-only (non-infinite-feed) surface. That combination is a plausible wedge, but it should be named explicitly as the product's differentiation thesis at some point before this becomes a multi-user pitch, rather than left implicit.

## 20. Startup Pattern Analysis (2026-07-04)

A deeper pass across failed and successful personalized-news/content-curation companies, done specifically to decide what to include or exclude in this PRD. Each case below is paired with the one lesson drawn from it and where that lesson was applied.

### 20.1. Failure cases and lessons

| Case | What happened | Lesson applied here |
| --- | --- | --- |
| **Zite** (personalized magazine app, CNN paid ~$20-25M, shut down within 3 years) | Never got standalone traction against Flipboard/Apple News; acquired for its algorithm, not its user base, then shuttered. | Personalization tech alone is not a moat — see new note in 5.1. |
| **Prismatic** ($15M raised, closed consumer apps 2015) | "Content distribution is a tough business"; reviewers felt it solved a problem that didn't clearly exist; people prefer stickier social distribution over a dedicated reading app even when the product is better. | Reinforces staying single-user and not chasing distribution/growth mechanics — see 2.2, 2.3. |
| **Circa** (atomized/structured news app, shut down 2015) | Well-regarded product, but no monetization plan was built early enough; ran out of runway before securing a follow-on round or buyer. | Any future monetization thesis must be chosen deliberately, not "figured out later" — see 20.3. Not urgent for a personal MVP with no revenue goal, but flagged so it isn't a surprise later. |
| **Yahoo News Digest** (built by a 17-year-old, sold to Yahoo for ~$30M, 9.5M loyal users, killed in 2017) | A loved product with a real, loyal following was still killed because it didn't fit the acquirer's strategy after the Verizon deal. | Being acquired, or being loved, doesn't guarantee survival — strategic fit matters more than product quality alone. Informational; no direct v1 change. |
| **Google Reader** (shut down 2013, "loyal but declining" following) | Killed partly because RSS is an open standard that's inherently hard to monetize, and it didn't serve Google's strategic (Google+) priorities. | The value here must live in the judgment/ranking layer, not the source-aggregation layer itself, since aggregation alone has no lock-in — reinforced in 5.1. |
| **NewsBreak** (50M+ monthly users, 2024 scandal) | AI-generated stories described events that never happened (a fabricated local tragedy, wrong food-bank hours), plus publisher copyright lawsuits over content reuse ($1.75M settlement with Patch Media). | Directly actionable: added hard grounding/anti-hallucination requirement (8.7, 12.2, 15.5) and softened full-text storage default (6.4 note) even though current risk is low at personal scale. |
| **theSkimm** (three layoff rounds in 2023, stalled at 7M signups, sought a buyer) | Took on large VC rounds, then expanded beyond its core product to try to justify the valuation, losing focus. | Reinforces the existing non-goal against fundraising/scope-expansion before the core loop is validated (2.2, 2.3). |

### 20.2. Success cases and lessons

| Case | What worked | Lesson applied here |
| --- | --- | --- |
| **Techmeme** (no outside investment, 20+ years, lean/mostly-single-editor team) | Extreme format consistency, no clickbait, no autoplay, no page takeovers, narrow high-value audience. | Reinforced the existing non-infinite-digest, no-dark-patterns discipline as an explicit non-goal (2.2) and acceptance criterion (15.5), not just an implicit habit. |
| **1440** (bootstrapped to $101M valuation, no VC, ~$27M revenue, 27 employees) | Obsessive focus on unit economics and a simple, consistent "impartial daily digest" format; grew via paid acquisition funding ad-supported economics, not virality or deep personalization. | Confirms this product doesn't need personalization sophistication to be *useful*; the swipe-training layer is a bet on making relevance better than a static digest, not a requirement copied from successful precedent — supports keeping 19.1's phased MVP-vs-mature ranking approach. |
| **Morning Brew** (sold for $75M, then fully acquired by Axel Springer) | Loyal niche audience + consistent voice/format; ad-based revenue at scale; founders sold specifically because ad revenue is volatile and they wanted stability. | Informational for later: if this ever monetizes, ad-based models here demonstrably need large scale; a single-user or small-beta product has no path through ads, only through a subscription wedge (see Ground News) or no monetization at all. |
| **Ground News** | Subscription-first, freemium, sharp wedge (bias/factuality comparison) that people are willing to pay for specifically, not "personalization" in general. | Reinforces 19.6: if this becomes paid, the wedge must be as sharp as Ground News's, not generic personalization. |
| **Feedly** (pivoted from consumer RSS reader to B2B threat/market intelligence) | Consumer RSS + personalization alone wasn't sustaining the business; enterprise intelligence pricing ($1,600-2,400/month) is what actually sustains the company today, at the cost of consumer product quality. | Another confirmation that consumer-only personalized-reading products struggle economically standalone — supports treating "startup" ambitions as genuinely open and not assuming a consumer subscription path will work by default (2.3, 19.6). |

### 20.3. Net decisions made in this PRD as a result

Included (added this pass):
- Hard grounding/anti-hallucination requirement for all AI-generated text (8.7, 12.2, 15.5).
- Preference for snippet/derived-summary storage over verbatim full-text mirroring (6.4 note).
- Explicit non-goals against engagement-optimizing design and against fundraising/multi-user work before validation (2.2).
- Explicit statement that personalization/ranking tech is not the moat by itself (5.1).

Excluded / deliberately not added:
- No monetization design work (ads, subscription, pricing) — premature for a personal MVP; noted only as a future decision point (19.6, 20.2), not a v1 requirement.
- No growth/distribution mechanics (sharing, virality, social features) — Prismatic's experience suggests these don't rescue a weak core loop, and they're already a non-goal (2.2).
- No attempt to make the source-aggregation layer itself a differentiator — Google Reader's fate confirms open-standard aggregation has no lock-in; effort stays on the judgment/ranking/dedup layer instead.
