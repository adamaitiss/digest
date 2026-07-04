create table if not exists public.authorized_auth_email (
  email text primary key,
  created_at timestamptz not null default now()
);

insert into public.authorized_auth_email (email)
values ('stanislav.adamaytis@gmail.com')
on conflict (email) do nothing;

alter table public.authorized_auth_email enable row level security;

create or replace function public.is_authorized_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from auth.users u
    join public.authorized_auth_email a on lower(a.email) = lower(u.email)
    where u.id = auth.uid()
  );
$$;

create or replace function public.require_authorized_user()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_authorized_user() then
    raise exception 'not allowed' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.before_user_created_allowlist(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_email text;
begin
  requested_email := lower(coalesce(event->'user'->>'email', ''));

  if exists (
    select 1
    from public.authorized_auth_email a
    where lower(a.email) = requested_email
  ) then
    return '{}'::jsonb;
  end if;

  return jsonb_build_object(
    'error',
    jsonb_build_object(
      'http_code', 403,
      'message', 'This digest is private.'
    )
  );
end;
$$;

drop policy if exists "authenticated read sources" on public.source;
drop policy if exists "authenticated read source health" on public.source_health_log;
drop policy if exists "authenticated read articles" on public.article;
drop policy if exists "authenticated read clusters" on public.event_cluster;
drop policy if exists "own profile" on public.user_profile;
drop policy if exists "own sessions" on public.training_session;
drop policy if exists "own signals" on public.user_signal;
drop policy if exists "own digests" on public.digest;
drop policy if exists "own digest items" on public.digest_item;
drop policy if exists "own saved items" on public.saved_item;
drop policy if exists "authenticated read job runs" on public.job_run;
drop policy if exists "authenticated read ai costs" on public.ai_cost_log;
drop policy if exists "authorized read allowlist" on public.authorized_auth_email;

create policy "authenticated read sources" on public.source
  for select to authenticated using (public.is_authorized_user());
create policy "authenticated read source health" on public.source_health_log
  for select to authenticated using (public.is_authorized_user());
create policy "authenticated read articles" on public.article
  for select to authenticated using (public.is_authorized_user());
create policy "authenticated read clusters" on public.event_cluster
  for select to authenticated using (public.is_authorized_user());
create policy "own profile" on public.user_profile
  for all to authenticated
  using (user_id = auth.uid() and public.is_authorized_user())
  with check (user_id = auth.uid() and public.is_authorized_user());
create policy "own sessions" on public.training_session
  for all to authenticated
  using (user_id = auth.uid() and public.is_authorized_user())
  with check (user_id = auth.uid() and public.is_authorized_user());
create policy "own signals" on public.user_signal
  for all to authenticated
  using (user_id = auth.uid() and public.is_authorized_user())
  with check (user_id = auth.uid() and public.is_authorized_user());
create policy "own digests" on public.digest
  for select to authenticated using (user_id = auth.uid() and public.is_authorized_user());
create policy "own digest items" on public.digest_item
  for select to authenticated using (
    public.is_authorized_user()
    and exists (
      select 1
      from public.digest d
      where d.digest_id = digest_item.digest_id
        and d.user_id = auth.uid()
    )
  );
create policy "own saved items" on public.saved_item
  for all to authenticated
  using (user_id = auth.uid() and public.is_authorized_user())
  with check (user_id = auth.uid() and public.is_authorized_user());
create policy "authenticated read job runs" on public.job_run
  for select to authenticated using (public.is_authorized_user());
create policy "authenticated read ai costs" on public.ai_cost_log
  for select to authenticated using (public.is_authorized_user());
create policy "authorized read allowlist" on public.authorized_auth_email
  for select to authenticated using (public.is_authorized_user());

create or replace function public.get_or_create_profile()
returns public.user_profile
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.user_profile;
begin
  perform public.require_authorized_user();

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
  perform public.require_authorized_user();

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
  perform public.require_authorized_user();

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
  perform public.require_authorized_user();

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
  perform public.require_authorized_user();

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
  perform public.require_authorized_user();

  if p_context = 'training_queue' then
    perform public.start_training_session();
  end if;

  insert into public.user_signal (user_id, article_id, cluster_id, signal_type, signal_strength, signal_context)
  values (auth.uid(), p_article_id, p_cluster_id, p_signal_type, public.signal_strength(p_signal_type), p_context);

  if p_context = 'training_queue' then
    update public.training_session
    set cards_reacted_to = cards_reacted_to + 1,
        cards_shown = greatest(cards_shown, cards_reacted_to + 1),
        positive_count = positive_count + case when public.signal_strength(p_signal_type) > 0 then 1 else 0 end,
        negative_count = negative_count + case when public.signal_strength(p_signal_type) < 0 then 1 else 0 end,
        saves_count = saves_count + case when p_signal_type = 'save' then 1 else 0 end,
        exploration_cards_shown = exploration_cards_shown + case
          when exists (
            select 1
            from public.article a
            where a.article_id = p_article_id
              and (a.embedding is not null or a.summary is not null)
              and coalesce(a.ranking_score, 0) between 0.35 and 0.55
          ) then 1
          else 0
        end,
        must_know_cards_shown = must_know_cards_shown + case when exists (select 1 from public.article a where a.article_id = p_article_id and coalesce(a.must_know_score, 0) >= 0.7) then 1 else 0 end
    where user_id = auth.uid() and session_date = current_date;

    if p_signal_type = 'save' then
      perform public.save_item(p_article_id, p_cluster_id);
    end if;
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
  perform public.require_authorized_user();

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
  perform public.require_authorized_user();

  insert into public.saved_item (user_id, article_id, cluster_id)
  values (auth.uid(), p_article_id, p_cluster_id)
  on conflict (user_id, article_id) do nothing;
end;
$$;

create or replace function public.unsave_item(p_saved_item_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_authorized_user();

  delete from public.saved_item where saved_item_id = p_saved_item_id and user_id = auth.uid();
end;
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
  perform public.require_authorized_user();

  select d.user_id, di.cluster_id into digest_user, cluster
  from public.digest_item di
  join public.digest d on d.digest_id = di.digest_id
  where di.digest_item_id = p_digest_item_id;

  if digest_user is null or digest_user <> auth.uid() then
    raise exception 'not allowed' using errcode = '42501';
  end if;

  update public.digest_item set feedback_status = p_feedback where digest_item_id = p_digest_item_id;
  insert into public.user_signal (user_id, cluster_id, digest_item_id, signal_type, signal_strength, signal_context)
  values (auth.uid(), cluster, p_digest_item_id, p_feedback, public.signal_strength(p_feedback), 'digest');
end;
$$;

create or replace function public.reset_learned_preferences()
returns public.user_profile
language plpgsql
security definer
set search_path = public
as $$
declare
  profile public.user_profile;
begin
  perform public.get_or_create_profile();

  update public.user_profile
  set learned_topic_weights = '{}'::jsonb,
      learned_country_weights = '{}'::jsonb,
      learned_entity_weights = '{}'::jsonb,
      learned_source_preferences = '{}'::jsonb,
      blocked_sources = '[]'::jsonb,
      demoted_sources = '[]'::jsonb,
      blocked_topics = '[]'::jsonb,
      demoted_topics = '[]'::jsonb,
      novelty_preference = 0.5,
      business_significance_preference = 0.7,
      language_preferences = '["en","ru"]'::jsonb,
      profile_embedding = null,
      updated_at = now()
  where user_id = auth.uid()
  returning * into profile;

  return profile;
end;
$$;

create or replace function public.export_user_data()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_json jsonb;
begin
  perform public.get_or_create_profile();

  select to_jsonb(up) - 'profile_embedding' into profile_json
  from public.user_profile up
  where up.user_id = auth.uid();

  return jsonb_build_object(
    'exported_at', now(),
    'profile', profile_json,
    'saved_items', (
      select coalesce(jsonb_agg(to_jsonb(si) order by si.saved_at desc), '[]'::jsonb)
      from public.saved_item si
      where si.user_id = auth.uid()
    ),
    'signals', (
      select coalesce(jsonb_agg(to_jsonb(us) order by us.created_at desc), '[]'::jsonb)
      from public.user_signal us
      where us.user_id = auth.uid()
    ),
    'digests', (
      select coalesce(jsonb_agg(to_jsonb(d) order by d.generated_at desc), '[]'::jsonb)
      from public.digest d
      where d.user_id = auth.uid()
    ),
    'digest_items', (
      select coalesce(jsonb_agg(to_jsonb(di) order by d.generated_at desc, di.rank), '[]'::jsonb)
      from public.digest_item di
      join public.digest d on d.digest_id = di.digest_id
      where d.user_id = auth.uid()
    )
  );
end;
$$;

create or replace view public.training_cards_today
with (security_invoker = true)
as
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
    when (a.embedding is not null or a.summary is not null)
      and coalesce(a.ranking_score, ec.ranking_score, 0) between 0.35 and 0.55
      then 'Exploration item near the model decision boundary.'
    else 'Matches your learned topic, source, or entity preferences.'
  end as why_shown,
  coalesce(a.confidence_note, 'Single source; treat as preliminary.') as confidence_note,
  a.canonical_url as source_link,
  coalesce(ec.supporting_sources, jsonb_build_array(jsonb_build_object('sourceName', s.name, 'url', a.canonical_url))) as supporting_links,
  case
    when coalesce(a.must_know_score, ec.must_know_score, 0) >= 0.7 then 'must_know'
    when (a.embedding is not null or a.summary is not null)
      and coalesce(a.ranking_score, ec.ranking_score, 0) between 0.35 and 0.55
      then 'exploration'
    else 'predicted_relevant'
  end as queue_reason
from public.article a
join public.source s on s.source_id = a.source_id
left join public.event_cluster ec on ec.cluster_id = a.cluster_id
where public.is_authorized_user()
  and a.published_at >= now() - interval '3 days'
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

create or replace view public.digest_today
with (security_invoker = true)
as
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
where public.is_authorized_user()
  and d.user_id = auth.uid()
  and d.digest_date = current_date
order by d.generated_at desc
limit 1;

create or replace view public.digest_items_view
with (security_invoker = true)
as
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
where public.is_authorized_user()
  and d.user_id = auth.uid();

create or replace view public.saved_items_view
with (security_invoker = true)
as
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
where public.is_authorized_user()
  and si.user_id = auth.uid();

create or replace view public.source_health_status
with (security_invoker = true)
as
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
from public.source s
where public.is_authorized_user();

grant usage on schema public to supabase_auth_admin;
grant execute on function public.before_user_created_allowlist(jsonb) to supabase_auth_admin;
revoke execute on function public.before_user_created_allowlist(jsonb) from authenticated, anon, public;

revoke execute on function public.is_authorized_user() from anon, public;
revoke execute on function public.require_authorized_user() from anon, public;
grant execute on function public.is_authorized_user() to authenticated;
grant execute on function public.require_authorized_user() to authenticated;

grant select on public.authorized_auth_email to authenticated;
grant select on public.user_profile, public.training_session, public.user_signal, public.digest, public.digest_item, public.saved_item to authenticated;
grant execute on function public.reset_learned_preferences() to authenticated;
grant execute on function public.export_user_data() to authenticated;
