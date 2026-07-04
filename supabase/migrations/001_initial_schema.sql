create extension if not exists vector;
create extension if not exists pgcrypto;

create table public.source (
  source_id text primary key,
  name text not null,
  url text not null,
  rss_url text,
  final_rss_url text,
  language text not null check (language in ('en', 'ru')),
  country_region text,
  source_type text not null,
  topics_usually_covered jsonb not null default '[]'::jsonb,
  authority_score numeric not null default 0.5,
  noise_score numeric not null default 0.5,
  paywall_status text,
  crawl_frequency_minutes integer not null default 240,
  http_status integer,
  item_count integer not null default 0,
  latest_published_at timestamptz,
  last_successful_fetch timestamptz,
  error_status text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.source_health_log (
  source_health_log_id uuid primary key default gen_random_uuid(),
  source_id text not null references public.source(source_id) on delete cascade,
  checked_at timestamptz not null default now(),
  http_status integer,
  item_count integer not null default 0,
  latest_published_at timestamptz,
  error_status text,
  success boolean not null default false
);

create table public.event_cluster (
  cluster_id uuid primary key default gen_random_uuid(),
  cluster_key text not null unique,
  representative_headline text not null,
  representative_summary text,
  topic text,
  subtopic text,
  countries jsonb not null default '[]'::jsonb,
  entities jsonb not null default '[]'::jsonb,
  event_type text,
  first_seen_at timestamptz,
  latest_update_at timestamptz,
  source_count integer not null default 1,
  primary_source_id text references public.source(source_id),
  supporting_sources jsonb not null default '[]'::jsonb,
  business_significance_score numeric not null default 0.5,
  must_know_score numeric not null default 0.5,
  novelty_score numeric not null default 0.5,
  personal_relevance_score numeric not null default 0.5,
  ranking_score numeric not null default 0.5,
  deduplication_confidence numeric not null default 0.5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.article (
  article_id uuid primary key default gen_random_uuid(),
  article_key text not null unique,
  canonical_url text not null,
  original_url text,
  source_id text not null references public.source(source_id),
  title text not null,
  snippet text,
  language text not null check (language in ('en', 'ru')),
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  author text,
  raw_tags jsonb not null default '[]'::jsonb,
  entities jsonb not null default '[]'::jsonb,
  countries jsonb not null default '[]'::jsonb,
  topic text,
  event_type text,
  business_significance_score numeric not null default 0.5,
  novelty_score numeric not null default 0.5,
  source_quality_score numeric not null default 0.5,
  must_know_score numeric not null default 0.5,
  ranking_score numeric not null default 0.5,
  paywall_limited boolean not null default false,
  embedding vector(256),
  cluster_id uuid references public.event_cluster(cluster_id),
  summary text,
  why_it_matters text,
  confidence_note text,
  grounding_passed boolean not null default false,
  grounding_report jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_profile (
  user_id uuid primary key references auth.users(id) on delete cascade,
  interest_description text not null default '',
  learned_topic_weights jsonb not null default '{}'::jsonb,
  learned_country_weights jsonb not null default '{}'::jsonb,
  learned_entity_weights jsonb not null default '{}'::jsonb,
  learned_source_preferences jsonb not null default '{}'::jsonb,
  blocked_sources jsonb not null default '[]'::jsonb,
  demoted_sources jsonb not null default '[]'::jsonb,
  blocked_topics jsonb not null default '[]'::jsonb,
  demoted_topics jsonb not null default '[]'::jsonb,
  novelty_preference numeric not null default 0.5,
  business_significance_preference numeric not null default 0.7,
  language_preferences jsonb not null default '["en","ru"]'::jsonb,
  profile_embedding vector(256),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.training_session (
  training_session_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  cards_shown integer not null default 0,
  cards_reacted_to integer not null default 0,
  positive_count integer not null default 0,
  negative_count integer not null default 0,
  saves_count integer not null default 0,
  exploration_cards_shown integer not null default 0,
  must_know_cards_shown integer not null default 0,
  target_cards integer not null default 60,
  completion_status text not null default 'in_progress',
  unique (user_id, session_date)
);

create table public.user_signal (
  signal_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid references public.article(article_id),
  cluster_id uuid references public.event_cluster(cluster_id),
  digest_item_id uuid,
  signal_type text not null,
  signal_strength numeric not null default 0,
  signal_context text not null,
  reason_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  undone_at timestamptz
);

create table public.digest (
  digest_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  digest_date date not null default current_date,
  generated_at timestamptz not null default now(),
  training_session_id uuid references public.training_session(training_session_id),
  item_count integer not null default 0,
  topic_groups jsonb not null default '[]'::jsonb,
  summary_text text,
  status text not null default 'generating',
  cost_estimate_usd numeric not null default 0,
  unique (user_id, digest_date)
);

create table public.digest_item (
  digest_item_id uuid primary key default gen_random_uuid(),
  digest_id uuid not null references public.digest(digest_id) on delete cascade,
  cluster_id uuid not null references public.event_cluster(cluster_id),
  group_name text not null,
  title text not null,
  summary text not null,
  why_it_matters text not null,
  why_selected text not null,
  source_links jsonb not null default '[]'::jsonb,
  confidence_note text not null,
  rank integer not null,
  feedback_status text,
  unique (digest_id, cluster_id)
);

alter table public.user_signal
  add constraint user_signal_digest_item_fk
  foreign key (digest_item_id) references public.digest_item(digest_item_id);

create table public.saved_item (
  saved_item_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.article(article_id),
  cluster_id uuid references public.event_cluster(cluster_id),
  saved_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create table public.job_run (
  job_run_id uuid primary key default gen_random_uuid(),
  job_name text not null,
  status text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  details jsonb not null default '{}'::jsonb
);

create table public.ai_cost_log (
  ai_cost_log_id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  task text not null,
  model_uri text not null,
  article_id uuid references public.article(article_id),
  digest_id uuid references public.digest(digest_id),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  estimated_cost_usd numeric not null default 0
);

create index article_source_idx on public.article(source_id);
create index article_cluster_idx on public.article(cluster_id);
create index article_published_idx on public.article(published_at desc);
create index article_canonical_url_idx on public.article(canonical_url);
create index article_embedding_idx on public.article using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index event_cluster_latest_idx on public.event_cluster(latest_update_at desc);
create index event_cluster_ranking_idx on public.event_cluster(ranking_score desc);
create index user_signal_user_created_idx on public.user_signal(user_id, created_at desc);
create index training_session_user_date_idx on public.training_session(user_id, session_date desc);
create index digest_user_date_idx on public.digest(user_id, digest_date desc);
create index saved_item_user_saved_idx on public.saved_item(user_id, saved_at desc);
create index source_health_source_checked_idx on public.source_health_log(source_id, checked_at desc);
create index job_run_name_started_idx on public.job_run(job_name, started_at desc);
create index ai_cost_created_idx on public.ai_cost_log(created_at desc);

alter table public.source enable row level security;
alter table public.source_health_log enable row level security;
alter table public.article enable row level security;
alter table public.event_cluster enable row level security;
alter table public.user_profile enable row level security;
alter table public.training_session enable row level security;
alter table public.user_signal enable row level security;
alter table public.digest enable row level security;
alter table public.digest_item enable row level security;
alter table public.saved_item enable row level security;
alter table public.job_run enable row level security;
alter table public.ai_cost_log enable row level security;

create policy "authenticated read sources" on public.source for select to authenticated using (true);
create policy "authenticated read source health" on public.source_health_log for select to authenticated using (true);
create policy "authenticated read articles" on public.article for select to authenticated using (true);
create policy "authenticated read clusters" on public.event_cluster for select to authenticated using (true);
create policy "own profile" on public.user_profile for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own sessions" on public.training_session for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own signals" on public.user_signal for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own digests" on public.digest for select to authenticated using (user_id = auth.uid());
create policy "own digest items" on public.digest_item for select to authenticated using (
  exists (select 1 from public.digest d where d.digest_id = digest_item.digest_id and d.user_id = auth.uid())
);
create policy "own saved items" on public.saved_item for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "authenticated read job runs" on public.job_run for select to authenticated using (true);
create policy "authenticated read ai costs" on public.ai_cost_log for select to authenticated using (true);

create or replace function public.signal_strength(p_signal_type text)
returns numeric
language sql
immutable
as $$
  select case p_signal_type
    when 'save' then 1.0
    when 'show_more_like_this' then 1.0
    when 'interesting' then 0.7
    when 'useful' then 0.7
    when 'important' then 0.55
    when 'important_not_interesting' then 0.55
    when 'open_summary' then 0.18
    when 'not_interesting' then -0.35
    when 'not_useful' then -0.35
    when 'too_obvious' then -0.55
    when 'too_noisy' then -0.55
    when 'duplicate' then -0.55
    when 'hide_topic' then -1.0
    when 'hide_source' then -1.0
    else 0
  end;
$$;

create or replace function public.get_or_create_profile()
returns public.user_profile
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.user_profile;
begin
  insert into public.user_profile (user_id)
  values (auth.uid())
  on conflict (user_id) do nothing;

  select * into profile from public.user_profile where user_id = auth.uid();
  return profile;
end;
$$;

create or replace function public.update_profile(p_interest_description text)
returns public.user_profile
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.user_profile;
begin
  insert into public.user_profile (user_id, interest_description)
  values (auth.uid(), coalesce(p_interest_description, ''))
  on conflict (user_id) do update
    set interest_description = excluded.interest_description,
        updated_at = now();
  select * into profile from public.user_profile where user_id = auth.uid();
  return profile;
end;
$$;

create or replace function public.get_training_session_state()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.training_session;
begin
  insert into public.training_session (user_id, session_date)
  values (auth.uid(), current_date)
  on conflict (user_id, session_date) do nothing;

  select * into session_row
  from public.training_session
  where user_id = auth.uid() and session_date = current_date;

  return jsonb_build_object(
    'sessionId', session_row.training_session_id,
    'cardsShown', session_row.cards_shown,
    'cardsReactedTo', session_row.cards_reacted_to,
    'targetCards', session_row.target_cards,
    'positiveCount', session_row.positive_count,
    'negativeCount', session_row.negative_count,
    'savesCount', session_row.saves_count,
    'explorationCardsShown', session_row.exploration_cards_shown,
    'mustKnowCardsShown', session_row.must_know_cards_shown,
    'completionStatus', session_row.completion_status
  );
end;
$$;

create or replace function public.start_training_session()
returns public.training_session
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.training_session;
begin
  insert into public.training_session (user_id, session_date)
  values (auth.uid(), current_date)
  on conflict (user_id, session_date) do update
    set started_at = coalesce(training_session.started_at, now()),
        completion_status = 'in_progress';
  select * into session_row from public.training_session where user_id = auth.uid() and session_date = current_date;
  return session_row;
end;
$$;

create or replace function public.complete_training_session()
returns public.training_session
language plpgsql
security definer
set search_path = public
as $$
declare
  session_row public.training_session;
begin
  update public.training_session
  set completed_at = now(), completion_status = 'complete'
  where user_id = auth.uid() and session_date = current_date
  returning * into session_row;
  return session_row;
end;
$$;

create or replace function public.record_card_reaction(
  p_article_id uuid,
  p_cluster_id uuid,
  p_signal_type text,
  p_context text default 'training_queue'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.start_training_session();

  insert into public.user_signal (user_id, article_id, cluster_id, signal_type, signal_strength, signal_context)
  values (auth.uid(), p_article_id, p_cluster_id, p_signal_type, public.signal_strength(p_signal_type), p_context);

  update public.training_session
  set cards_reacted_to = cards_reacted_to + 1,
      cards_shown = greatest(cards_shown, cards_reacted_to + 1),
      positive_count = positive_count + case when public.signal_strength(p_signal_type) > 0 then 1 else 0 end,
      negative_count = negative_count + case when public.signal_strength(p_signal_type) < 0 then 1 else 0 end,
      saves_count = saves_count + case when p_signal_type = 'save' then 1 else 0 end,
      exploration_cards_shown = exploration_cards_shown + case when exists (select 1 from public.article a where a.article_id = p_article_id and coalesce(a.ranking_score, 0) between 0.35 and 0.55) then 1 else 0 end,
      must_know_cards_shown = must_know_cards_shown + case when exists (select 1 from public.article a where a.article_id = p_article_id and coalesce(a.must_know_score, 0) >= 0.7) then 1 else 0 end
  where user_id = auth.uid() and session_date = current_date;

  if p_signal_type = 'save' then
    perform public.save_item(p_article_id, p_cluster_id);
  end if;
end;
$$;

create or replace function public.undo_last_card_reaction()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  last_signal public.user_signal;
begin
  select * into last_signal
  from public.user_signal
  where user_id = auth.uid()
    and signal_context = 'training_queue'
    and undone_at is null
  order by created_at desc
  limit 1;

  if last_signal.signal_id is null then
    return;
  end if;

  update public.user_signal set undone_at = now() where signal_id = last_signal.signal_id;
  update public.training_session
  set cards_reacted_to = greatest(0, cards_reacted_to - 1)
  where user_id = auth.uid() and session_date = current_date;
end;
$$;

create or replace function public.save_item(p_article_id uuid, p_cluster_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.saved_item (user_id, article_id, cluster_id)
  values (auth.uid(), p_article_id, p_cluster_id)
  on conflict (user_id, article_id) do nothing;
end;
$$;

create or replace function public.unsave_item(p_saved_item_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.saved_item where saved_item_id = p_saved_item_id and user_id = auth.uid();
$$;

create or replace function public.record_digest_feedback(p_digest_item_id uuid, p_feedback text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  digest_user uuid;
  cluster uuid;
begin
  select d.user_id, di.cluster_id into digest_user, cluster
  from public.digest_item di
  join public.digest d on d.digest_id = di.digest_id
  where di.digest_item_id = p_digest_item_id;

  if digest_user <> auth.uid() then
    raise exception 'not allowed';
  end if;

  update public.digest_item set feedback_status = p_feedback where digest_item_id = p_digest_item_id;
  insert into public.user_signal (user_id, cluster_id, digest_item_id, signal_type, signal_strength, signal_context)
  values (auth.uid(), cluster, p_digest_item_id, p_feedback, public.signal_strength(p_feedback), 'digest');
end;
$$;

create or replace view public.training_cards_today as
select
  a.article_id::text as card_id,
  a.article_id,
  a.cluster_id,
  a.title as headline,
  s.name as source_name,
  a.published_at,
  a.language,
  coalesce(a.topic, ec.topic, 'global_news') as topic,
  coalesce(a.countries, ec.countries, '[]'::jsonb) as countries,
  coalesce(a.entities, ec.entities, '[]'::jsonb) as entities,
  (a.summary is not null) as summary_ready,
  coalesce(a.summary, a.snippet, '') as summary,
  case
    when coalesce(a.must_know_score, ec.must_know_score, 0) >= 0.7 then 'Must-know item from the recall-first layer.'
    when coalesce(a.ranking_score, ec.ranking_score, 0) between 0.35 and 0.55 then 'Exploration item near the model decision boundary.'
    else 'Matches your learned topic, source, or entity preferences.'
  end as why_shown,
  coalesce(a.confidence_note, 'Single source; treat as preliminary.') as confidence_note,
  a.canonical_url as source_link,
  coalesce(ec.supporting_sources, jsonb_build_array(jsonb_build_object('sourceName', s.name, 'url', a.canonical_url))) as supporting_links,
  case
    when coalesce(a.must_know_score, ec.must_know_score, 0) >= 0.7 then 'must_know'
    when coalesce(a.ranking_score, ec.ranking_score, 0) between 0.35 and 0.55 then 'exploration'
    else 'predicted_relevant'
  end as queue_reason
from public.article a
join public.source s on s.source_id = a.source_id
left join public.event_cluster ec on ec.cluster_id = a.cluster_id
where a.published_at >= now() - interval '3 days'
  and not exists (
    select 1 from public.user_signal us
    where us.user_id = auth.uid()
      and us.article_id = a.article_id
      and us.signal_context = 'training_queue'
      and us.undone_at is null
  )
order by
  case when coalesce(a.must_know_score, ec.must_know_score, 0) >= 0.7 then 0 else 1 end,
  coalesce(a.ranking_score, ec.ranking_score, 0) desc,
  a.published_at desc;

create or replace view public.digest_today as
select
  d.digest_id,
  d.digest_date,
  d.generated_at,
  d.status,
  d.item_count,
  d.cost_estimate_usd,
  coalesce(ts.completion_status, 'skipped') as training_status
from public.digest d
left join public.training_session ts on ts.training_session_id = d.training_session_id
where d.user_id = auth.uid()
  and d.digest_date = current_date
order by d.generated_at desc
limit 1;

create or replace view public.digest_items_view as
select
  di.digest_item_id,
  di.digest_id,
  di.cluster_id,
  di.group_name,
  di.title,
  di.summary,
  di.why_it_matters,
  di.why_selected,
  di.source_links,
  di.confidence_note,
  di.rank,
  di.feedback_status,
  ec.latest_update_at as published_at,
  coalesce((select a.language from public.article a where a.cluster_id = di.cluster_id order by a.published_at desc limit 1), 'en') as language
from public.digest_item di
join public.digest d on d.digest_id = di.digest_id
left join public.event_cluster ec on ec.cluster_id = di.cluster_id
where d.user_id = auth.uid();

create or replace view public.saved_items_view as
select
  si.saved_item_id,
  si.article_id,
  si.cluster_id,
  a.title,
  s.name as source_name,
  a.canonical_url as source_link,
  coalesce(a.topic, ec.topic, 'global_news') as topic,
  a.language,
  si.saved_at,
  a.published_at,
  coalesce(a.summary, a.snippet, '') as summary
from public.saved_item si
join public.article a on a.article_id = si.article_id
join public.source s on s.source_id = a.source_id
left join public.event_cluster ec on ec.cluster_id = si.cluster_id
where si.user_id = auth.uid();

create or replace view public.source_health_status as
select
  s.source_id,
  s.name,
  s.language,
  s.country_region,
  s.active,
  s.authority_score,
  s.noise_score,
  s.last_successful_fetch,
  s.error_status as last_error,
  coalesce((
    select count(*)::integer
    from public.article a
    where a.source_id = s.source_id
      and a.fetched_at >= now() - interval '24 hours'
  ), 0) as fetched_items_24h,
  s.latest_published_at
from public.source s;

grant usage on schema public to authenticated;
grant select on public.source, public.source_health_log, public.article, public.event_cluster, public.job_run, public.ai_cost_log to authenticated;
grant select on public.training_cards_today, public.digest_today, public.digest_items_view, public.saved_items_view, public.source_health_status to authenticated;
grant execute on function public.get_or_create_profile() to authenticated;
grant execute on function public.update_profile(text) to authenticated;
grant execute on function public.get_training_session_state() to authenticated;
grant execute on function public.start_training_session() to authenticated;
grant execute on function public.complete_training_session() to authenticated;
grant execute on function public.record_card_reaction(uuid, uuid, text, text) to authenticated;
grant execute on function public.undo_last_card_reaction() to authenticated;
grant execute on function public.save_item(uuid, uuid) to authenticated;
grant execute on function public.unsave_item(uuid) to authenticated;
grant execute on function public.record_digest_feedback(uuid, text) to authenticated;

