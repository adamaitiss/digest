# Source Registry Reachability v1

Checked from local machine at `2026-07-04T11:41:05Z`. Active feeds were fetched with a normal HTTP client, parsed with `feedparser`, and accepted only when they returned HTTP 200, had at least one parseable item, and exposed a latest item timestamp within `7` days. Weekly/newsletter and official feeds are included under the same window; they may not contribute every day but are reachable and recent enough for v1 monitoring.

## Result

- Active seed sources written to `data/source_registry_v1.json`: **49**
- English active sources: **26**
- Russian active sources: **23**
- Public newsletter/archive feeds: **4**
- Official/regulatory RSS feeds: **7**
- Paywalled, metered, or limited-full-text sources kept because RSS metadata/snippets are reachable: **20**
- Rejected/broken candidates documented below: **26**

## Active Seed Feeds

| Source ID | Lang | Status | Items | Latest published | Topics | Paywall / access |
| --- | --- | ---: | ---: | --- | --- | --- |
| `aljazeera_all` | en | 200 | 25 | 2026-07-04T11:27:18Z | global_news, policy_regulation, geopolitics | open |
| `ars_technica` | en | 200 | 20 | 2026-07-03T13:55:35Z | technology, science, ai, policy_regulation | limited_free_articles |
| `bbc_business` | en | 200 | 53 | 2026-07-03T20:51:58Z | business, economy, companies | open |
| `bbc_world` | en | 200 | 28 | 2026-07-04T11:25:57Z | global_news, policy_regulation, geopolitics | open |
| `big_technology` | en | 200 | 20 | 2026-07-02T18:53:12Z | technology, ai, platforms, companies | newsletter_public_archive_limited_full_text |
| `bloomberg_economics` | en | 200 | 30 | 2026-07-04T10:05:31Z | economy, central_banks, policy_regulation | metered_or_limited_full_text |
| `bloomberg_markets` | en | 200 | 30 | 2026-07-04T10:33:09Z | markets, finance, economy | metered_or_limited_full_text |
| `bloomberg_technology` | en | 200 | 30 | 2026-07-04T06:16:56Z | technology, ai, companies, markets | metered_or_limited_full_text |
| `cnbc_business` | en | 200 | 30 | 2026-07-03T18:03:34Z | business, companies, economy | open_ad_supported |
| `cnbc_technology` | en | 200 | 30 | 2026-07-04T09:33:19Z | technology, ai, companies, policy_regulation | open_ad_supported |
| `deutsche_welle_top` | en | 200 | 141 | 2026-07-04T11:08:00Z | global_news, policy_regulation, economy | open |
| `economist_latest` | en | 200 | 300 | 2026-07-04T09:21:41Z | global_news, economy, policy_regulation, business | paywalled_full_text_feed_metadata_available |
| `european_commission_press` | en | 200 | 10 | 2026-07-03T12:43:27Z | policy_regulation, europe, economy, technology | official_open |
| `federal_reserve_press` | en | 200 | 20 | 2026-07-02T15:00:00Z | central_banks, monetary_policy, regulation, markets | official_open |
| `financial_times_markets` | en | 200 | 25 | 2026-07-04T04:00:43Z | markets, finance, economy | paywalled_full_text_feed_metadata_available |
| `financial_times_world` | en | 200 | 25 | 2026-07-04T09:02:27Z | global_news, economy, policy_regulation | paywalled_full_text_feed_metadata_available |
| `guardian_business` | en | 200 | 39 | 2026-07-04T11:00:12Z | business, economy, markets, companies | open_registration_optional |
| `guardian_world` | en | 200 | 45 | 2026-07-04T11:28:18Z | global_news, policy_regulation, geopolitics | open_registration_optional |
| `mit_technology_review` | en | 200 | 10 | 2026-07-03T17:34:37Z | technology, ai, science, policy_regulation | metered_or_limited_full_text |
| `noahpinion` | en | 200 | 20 | 2026-07-04T09:31:52Z | economy, technology, policy_regulation, geopolitics | newsletter_public_archive_limited_full_text |
| `politico_europe` | en | 200 | 10 | 2026-07-04T11:09:58Z | policy_regulation, europe, economy, technology | open_ad_supported |
| `politico_us` | en | 200 | 30 | 2026-07-04T00:45:00Z | policy_regulation, politics, economy | open_ad_supported |
| `sec_press_releases` | en | 200 | 25 | 2026-07-01T12:47:58Z | regulation, markets, companies, enforcement | official_open |
| `stratechery` | en | 200 | 10 | 2026-06-29T10:00:00Z | technology, business_strategy, platforms, ai | newsletter_paywalled_full_text_feed_metadata_available |
| `techcrunch` | en | 200 | 20 | 2026-07-03T21:20:00Z | technology, startups, venture_capital, ai | open |
| `the_verge` | en | 200 | 10 | 2026-07-04T07:00:00Z | technology, ai, platforms, policy_regulation | open |
| `bank_of_russia_events` | ru | 200 | 100 | 2026-07-01T07:00:00Z | central_banks, monetary_policy, financial_regulation, economy | official_open |
| `bank_of_russia_news` | ru | 200 | 100 | 2026-07-03T14:13:31Z | central_banks, financial_regulation, monetary_policy, markets | official_open |
| `bank_of_russia_press` | ru | 200 | 12 | 2026-07-02T11:58:00Z | central_banks, monetary_policy, financial_regulation | official_open |
| `banki_ru_news` | ru | 200 | 25 | 2026-07-04T11:03:31Z | finance, banks, consumer_finance, regulation | open_ad_supported |
| `cnews` | ru | 200 | 200 | 2026-07-03T19:13:00Z | technology, business_it, telecom, cybersecurity | open_ad_supported |
| `finmarket_main` | ru | 200 | 20 | 2026-07-03T07:09:00Z | markets, economy, companies, finance | open |
| `forbes_russia` | ru | 200 | 20 | 2026-07-04T11:28:52Z | business, wealth, companies, markets | metered_or_limited_full_text |
| `government_ru_news` | ru | 200 | 20 | 2026-07-04T07:00:00Z | policy_regulation, economy, government | official_open |
| `habr_news` | ru | 200 | 40 | 2026-07-04T10:54:46Z | technology, software, ai, cybersecurity | open |
| `interfax` | ru | 200 | 25 | 2026-07-04T11:29:00Z | global_news, business, policy_regulation, economy | open_limited_archive |
| `kommersant_business` | ru | 200 | 125 | 2026-07-04T11:09:25Z | business, companies, economy | metered_or_limited_full_text |
| `kommersant_finance` | ru | 200 | 41 | 2026-07-03T18:09:47Z | finance, markets, economy | metered_or_limited_full_text |
| `kommersant_news` | ru | 200 | 407 | 2026-07-04T11:11:46Z | business, economy, policy_regulation, global_news | metered_or_limited_full_text |
| `lenta_economics` | ru | 200 | 200 | 2026-07-04T10:10:00Z | economy, business, markets | open_ad_supported |
| `meduza` | ru | 200 | 30 | 2026-07-04T11:13:23Z | global_news, policy_regulation, society | open_donations |
| `rbc_news` | ru | 200 | 30 | 2026-07-04T11:28:02Z | business, economy, markets, global_news | open_ad_supported |
| `ria_novosti_all` | ru | 200 | 20 | 2026-07-04T11:33:37Z | global_news, policy_regulation, economy | open |
| `tass_all` | ru | 200 | 100 | 2026-07-04T11:38:00Z | global_news, policy_regulation, economy, technology | open |
| `the_bell` | ru | 200 | 20 | 2026-07-03T22:30:18Z | business, economy, markets, policy_regulation | newsletter_public_archive_limited_full_text |
| `vc_ru` | ru | 200 | 12 | 2026-07-03T17:02:50Z | technology, startups, business, digital_markets | open_user_generated_mixed_quality |
| `vedomosti_business` | ru | 200 | 200 | 2026-07-04T08:16:01Z | business, companies, economy | metered_or_limited_full_text |
| `vedomosti_economics` | ru | 200 | 200 | 2026-07-03T14:04:54Z | economy, monetary_policy, policy_regulation | metered_or_limited_full_text |
| `vedomosti_news` | ru | 200 | 200 | 2026-07-04T11:05:31Z | business, economy, policy_regulation, companies | metered_or_limited_full_text |

## Rejected Or Broken Candidates

| Candidate | URL | HTTP/status | Items | Latest published | Reason |
| --- | --- | --- | ---: | --- | --- |
| `wsj_world` (WSJ World News) | https://feeds.a.dj.com/rss/RSSWorldNews.xml | 200 | 20 | 2025-01-27T19:23:00Z | stale_feed; stale_latest_item_522.68_days_old |
| `wsj_business` (WSJ U.S. Business) | https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml | 200 | 20 | 2025-01-24T20:37:00Z | stale_feed; stale_latest_item_525.63_days_old |
| `wsj_markets` (WSJ Markets) | https://feeds.a.dj.com/rss/RSSMarketsMain.xml | 200 | 20 | 2025-01-27T19:26:00Z | stale_feed; stale_latest_item_522.68_days_old |
| `marketwatch_marketpulse` (MarketWatch MarketPulse) | https://feeds.marketwatch.com/marketwatch/marketpulse/ | 200 | 30 | 2025-07-03T12:36:00Z | stale_feed; stale_latest_item_365.96_days_old |
| `platformer` (Platformer) | https://www.platformer.news/feed | timeout | 0 |  | Timeout from this machine. |
| `the_diff` (The Diff) | https://www.thediff.co/feed | timeout | 0 |  | Timeout from this machine. |
| `moscowtimes_ru` (The Moscow Times RU) | https://www.moscowtimes.ru/rss/news | DNS/connection failure | 0 |  | Host did not resolve or connect from this machine. |
| `ixbt_news` (iXBT News) | https://www.ixbt.com/export/news.rss | timeout | 0 |  | Timeout from this machine. |
| `rbc_business` (RBC Business section candidate) | https://rssexport.rbc.ru/rbcnews/business/30/full.rss | 404 | 0 |  | http_404 |
| `rbc_economics` (RBC Economics section candidate) | https://rssexport.rbc.ru/rbcnews/economics/30/full.rss | 404 | 0 |  | http_404 |
| `rbc_technology` (RBC Technology section candidate) | https://rssexport.rbc.ru/rbcnews/technology/30/full.rss | 404 | 0 |  | http_404 |
| `ria_economy` (RIA Economy section candidate) | https://ria.ru/export/rss2/economy/index.xml | 404 | 0 |  | http_404 |
| `ria_world` (RIA World section candidate) | https://ria.ru/export/rss2/world/index.xml | 404 | 0 |  | http_404 |
| `ria_tech` (RIA Science section candidate) | https://ria.ru/export/rss2/science/index.xml | 404 | 0 |  | http_404 |
| `gazeta_lenta` (Gazeta.ru Lenta) | https://www.gazeta.ru/export/rss/lenta.xml | 404 | 0 |  | http_404_or_invalid_xml; http_404 |
| `vc_new` (VC.ru New) | https://vc.ru/rss/new | 404 | 0 |  | http_404_or_invalid_xml; http_404 |
| `vc_popular` (VC.ru Popular) | https://vc.ru/rss/popular | 404 | 0 |  | http_404_or_invalid_xml; http_404 |
| `banki_old_lenta` (Banki.ru old lenta format) | https://www.banki.ru/news/lenta/?format=rss | 200 | 0 |  | html_not_feed; no_parseable_items |
| `moex_news` (Moscow Exchange News export) | https://www.moex.com/export/news.aspx?cat=1 | 200 | 0 |  | no_parseable_items |
| `moex_rss` (Moscow Exchange RSS candidate) | https://www.moex.com/ru/rss.aspx | 404 | 0 |  | http_404_or_invalid_xml; http_404 |
| `minfin_news` (Russia MinFin RSS candidate) | https://minfin.gov.ru/ru/press-center/rss/ | 404 | 0 |  | http_404_or_invalid_xml; http_404 |
| `kremlin_events` (Kremlin events RSS candidate) | http://kremlin.ru/events/rss | 404 | 0 |  | http_404_or_invalid_xml; http_404 |
| `acra_news` (ACRA RSS candidate) | https://www.acra-ratings.ru/about/news/rss/ | SSL error | 0 |  | Certificate verification failed from this machine. |
| `raexpert_news` (Expert RA RSS candidate) | https://raexpert.ru/rss/ | 404 | 0 |  | http_404_or_invalid_xml; http_404 |
| `prime_economy` (Prime Economy candidate) | https://1prime.ru/export/rss2/economy/index.xml | 200 | 0 |  | no_parseable_items |
| `three_d_news` (3DNews) | https://3dnews.ru/news/rss/ | 200 | 0 |  | selected candidate failed final active criteria: no_parseable_items |

## RU Coverage Notes

- Telegram remains out of scope, so the RU registry leans heavily on established media RSS plus official feeds. This is usable for broad economy, business, markets, and policy coverage, but it will miss a lot of Russian-language breaking commentary and niche expert discussion that lives primarily in Telegram.
- Russian RSS availability is inconsistent. Several section feeds that would have been cleaner for RBC/RIA/MOEX/Minfin returned 404, HTML, SSL errors, no parseable items, or timeouts from this machine. The registry therefore keeps broader feeds for some publishers and relies on downstream topic/entity filtering.
- `vc_ru`, `habr_news`, and `cnews` improve RU technology coverage, but they are noisier than wire/business feeds. Their higher `noise_score` is intentional and should affect ranking until user signals prove otherwise. `three_d_news` was not kept because the final verification returned an empty RSS body despite an earlier successful parse.
- Official Russian policy/markets coverage is represented by Bank of Russia and Government.ru RSS feeds. These are high-authority but lower-volume and may not add items every 2-4 hour crawl.

## Assumptions

- A source record represents one feed endpoint. Multiple feeds from the same publisher are separate records because freshness, item count, and failures differ by endpoint.
- `authority_score` and `noise_score` are v1 editorial priors on a 0-1 scale. They are not factual ratings; they are starting weights for ranking and should be adjusted with observed source performance and user feedback.
- `active=true` appears only in the JSON records that passed the final active criteria during this run. Rejected candidates are intentionally not included in the seed JSON.
- Paywalled or metered sources are allowed when the RSS metadata is reachable, because the PRD permits paywalled sources when snippet or accessible metadata is available. Summaries for these sources must stay grounded in feed title/snippet unless full text is legitimately accessible.
- Latest timestamps come from feed item metadata. If a publisher backfills, republishes, or omits timestamps, the health job should record that rather than inferring freshness from fetch time.

