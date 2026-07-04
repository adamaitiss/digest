#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
IMAGE="${POSTGRES_VECTOR_IMAGE:-pgvector/pgvector:pg16}"
CONTAINER_NAME="digest-migration-validate-$RANDOM"
PORT="${POSTGRES_VALIDATE_PORT:-15432}"
PASSWORD="postgres"

cleanup() {
  docker rm -f "$CONTAINER_NAME" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run \
  --name "$CONTAINER_NAME" \
  -e POSTGRES_PASSWORD="$PASSWORD" \
  -p "127.0.0.1:${PORT}:5432" \
  -d "$IMAGE" >/dev/null

for _ in $(seq 1 60); do
  if docker exec "$CONTAINER_NAME" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

TMP_SQL="$(mktemp)"
cat >"$TMP_SQL" <<'SQL'
create schema if not exists auth;
create table if not exists auth.users (
  id uuid primary key,
  email text,
  created_at timestamptz not null default now()
);
create role authenticated nologin;
create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;
SQL

docker cp "$TMP_SQL" "$CONTAINER_NAME:/tmp/supabase-auth-mock.sql"
docker cp "$ROOT_DIR/supabase/migrations/001_initial_schema.sql" "$CONTAINER_NAME:/tmp/001_initial_schema.sql"
docker cp "$ROOT_DIR/supabase/migrations/002_seed_source_registry.sql" "$CONTAINER_NAME:/tmp/002_seed_source_registry.sql"

docker exec "$CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U postgres -d postgres -f /tmp/supabase-auth-mock.sql
docker exec "$CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U postgres -d postgres -f /tmp/001_initial_schema.sql
docker exec "$CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U postgres -d postgres -f /tmp/002_seed_source_registry.sql
docker exec "$CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U postgres -d postgres -c "select count(*) as active_sources from public.source where active;"

cat >"$TMP_SQL" <<'SQL'
insert into auth.users (id, email)
values ('00000000-0000-0000-0000-000000000001', 'smoke@example.com');

with inserted_cluster as (
  insert into public.event_cluster (
    cluster_key,
    representative_headline,
    representative_summary,
    topic,
    countries,
    entities,
    first_seen_at,
    latest_update_at,
    source_count,
    primary_source_id,
    supporting_sources,
    business_significance_score,
    must_know_score,
    novelty_score,
    personal_relevance_score,
    ranking_score,
    deduplication_confidence
  )
  values (
    'smoke-cluster',
    'Fed signals caution on rate cuts',
    'Federal Reserve officials signaled caution on rate cuts.',
    'central_banks',
    '["US"]'::jsonb,
    '["Federal Reserve"]'::jsonb,
    now() - interval '2 hours',
    now() - interval '1 hour',
    1,
    'bloomberg_economics',
    '[{"sourceName":"Bloomberg - Economics","url":"https://www.bloomberg.com/economics"}]'::jsonb,
    0.9,
    0.8,
    0.5,
    0.7,
    0.9,
    0.8
  )
  returning cluster_id
)
insert into public.article (
  article_key,
  canonical_url,
  original_url,
  source_id,
  title,
  snippet,
  language,
  published_at,
  topic,
  countries,
  entities,
  business_significance_score,
  novelty_score,
  source_quality_score,
  must_know_score,
  ranking_score,
  cluster_id,
  summary,
  confidence_note,
  grounding_passed
)
select
  'smoke-article',
  'https://www.reuters.com/smoke',
  'https://www.reuters.com/smoke',
  'bloomberg_economics',
  'Fed signals caution on rate cuts',
  'Federal Reserve officials signaled caution on rate cuts.',
  'en',
  now() - interval '1 hour',
  'central_banks',
  '["US"]'::jsonb,
  '["Federal Reserve"]'::jsonb,
  0.9,
  0.5,
  0.9,
  0.8,
  0.9,
  cluster_id,
  'Federal Reserve officials signaled caution on rate cuts.',
  'Single source; treat as preliminary.',
  true
from inserted_cluster;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);

select user_id from public.get_or_create_profile();
select count(*) as cards_before_reaction from public.training_cards_today;
select public.record_card_reaction(article_id, cluster_id, 'interesting', 'training_queue')
from public.article
where article_key = 'smoke-article';
select public.get_training_session_state();
select public.save_item(article_id, cluster_id)
from public.article
where article_key = 'smoke-article';
select count(*) as saved_items from public.saved_items_view;

reset role;

with smoke_digest as (
  insert into public.digest (
    user_id,
    digest_date,
    generated_at,
    item_count,
    topic_groups,
    status,
    cost_estimate_usd
  )
  values (
    '00000000-0000-0000-0000-000000000001',
    current_date,
    now(),
    1,
    '["Markets and Policy"]'::jsonb,
    'ready',
    0.01
  )
  returning digest_id
)
insert into public.digest_item (
  digest_id,
  cluster_id,
  group_name,
  title,
  summary,
  why_it_matters,
  why_selected,
  source_links,
  confidence_note,
  rank
)
select
  digest_id,
  (select cluster_id from public.event_cluster where cluster_key = 'smoke-cluster'),
  'Markets and Policy',
  'Fed signals caution on rate cuts',
  'Federal Reserve officials signaled caution on rate cuts.',
  'This can affect markets.',
  'Selected by the must-know layer.',
  '[{"sourceName":"Bloomberg - Economics","url":"https://www.bloomberg.com/economics"}]'::jsonb,
  'Single source; treat as preliminary.',
  1
from smoke_digest;

set role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', false);
select count(*) as digest_rows from public.digest_today;
select count(*) as digest_items from public.digest_items_view;
select public.record_digest_feedback(digest_item_id, 'useful')
from public.digest_items_view
limit 1;
select count(*) as health_rows from public.source_health_status;
SQL

docker cp "$TMP_SQL" "$CONTAINER_NAME:/tmp/rpc-view-smoke.sql"
docker exec "$CONTAINER_NAME" psql -v ON_ERROR_STOP=1 -U postgres -d postgres -f /tmp/rpc-view-smoke.sql

rm -f "$TMP_SQL"
