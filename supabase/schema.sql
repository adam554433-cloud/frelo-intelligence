-- frelo-intelligence schema
-- All tables prefixed `intel_` to avoid collisions with other frelo apps on shared Supabase.
-- Run this once in the Supabase SQL editor.

create extension if not exists vector;
create extension if not exists pg_trgm;

-- ============================================================
-- SOURCES: raw scrape jobs (one row per ingestion run)
-- ============================================================
create table if not exists intel_sources (
  id bigserial primary key,
  platform text not null,                -- reddit | tiktok | youtube | amazon | trustpilot | podcast | pubmed | x | quora
  query text not null,                    -- the search query used
  hypothesis_id bigint,                    -- optional link to hypothesis that triggered this run
  status text not null default 'pending',  -- pending | running | done | error
  items_found int default 0,
  error_message text,
  started_at timestamptz default now(),
  finished_at timestamptz,
  metadata jsonb default '{}'::jsonb
);

create index if not exists intel_sources_platform_idx on intel_sources(platform);
create index if not exists intel_sources_status_idx on intel_sources(status);
create index if not exists intel_sources_started_idx on intel_sources(started_at desc);

-- ============================================================
-- ITEMS: individual scraped posts/comments/reviews
-- ============================================================
create table if not exists intel_items (
  id bigserial primary key,
  source_id bigint references intel_sources(id) on delete cascade,
  platform text not null,
  external_id text,                        -- platform-native ID for dedup
  content text not null,
  author text,
  url text,
  source_title text,                       -- subreddit, channel, product name, etc.
  posted_at timestamptz,
  engagement int default 0,                -- upvotes, likes, comments count
  created_at timestamptz default now(),

  -- Enrichment (populated by analyzer)
  sentiment text,                          -- positive | negative | neutral | mixed
  category text,                           -- pain_point | desire | frustration | breakthrough | objection | testimonial | competitor_complaint
  sub_theme text,
  belief_map text,
  emotional_intensity int,
  frelo_relevance int,                     -- 0-10 score for how relevant to frelo specifically
  key_phrases jsonb default '[]'::jsonb,
  marketing_angle text,
  analyzed_at timestamptz,

  -- Semantic search
  embedding vector(1536),                  -- OpenAI text-embedding-3-small dimension
  embedded_at timestamptz
);

create unique index if not exists intel_items_external_uniq on intel_items(platform, external_id) where external_id is not null;
create index if not exists intel_items_source_idx on intel_items(source_id);
create index if not exists intel_items_category_idx on intel_items(category) where category is not null;
create index if not exists intel_items_relevance_idx on intel_items(frelo_relevance desc) where frelo_relevance is not null;
create index if not exists intel_items_posted_idx on intel_items(posted_at desc);
create index if not exists intel_items_content_trgm on intel_items using gin (content gin_trgm_ops);
create index if not exists intel_items_embedding_idx on intel_items using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ============================================================
-- CLUSTERS: semantic groupings of items (computed post-embed)
-- ============================================================
create table if not exists intel_clusters (
  id bigserial primary key,
  label text,
  summary text,
  size int default 0,
  centroid vector(1536),
  avg_relevance numeric,
  platforms jsonb default '[]'::jsonb,     -- list of platforms represented
  cross_platform_score int,                -- 1-10: how many platforms validate this cluster
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists intel_cluster_items (
  cluster_id bigint references intel_clusters(id) on delete cascade,
  item_id bigint references intel_items(id) on delete cascade,
  similarity numeric,
  primary key (cluster_id, item_id)
);

-- ============================================================
-- AVATARS: synthesized audience personas (grounded in clusters)
-- ============================================================
create table if not exists intel_avatars (
  id bigserial primary key,
  name text not null,
  age_range text,
  gender_skew text,
  profile text,                            -- 4-5 sentence psychographic
  discovery_source text,                   -- which cluster/data revealed this
  market_size text,                        -- small | medium | large
  where_they_are jsonb default '[]'::jsonb,

  pain_points jsonb default '[]'::jsonb,
  desires jsonb default '[]'::jsonb,
  current_solutions jsonb default '[]'::jsonb,
  why_current_fails text,
  purchase_blockers jsonb default '[]'::jsonb,
  language_patterns jsonb default '[]'::jsonb,
  emotional_triggers jsonb default '[]'::jsonb,

  how_frelo_fits text,
  hooks jsonb default '[]'::jsonb,
  marketing_angles jsonb default '[]'::jsonb,
  sales_messages jsonb default '[]'::jsonb,
  ad_headlines jsonb default '[]'::jsonb,
  video_script jsonb,

  -- Grounding: every claim should link back to source items
  source_item_ids bigint[] default array[]::bigint[],
  citation_count int default 0,
  confidence_score int,                    -- 1-10 based on data density
  momentum_score int,                      -- 1-10 based on recency/growth
  cluster_ids bigint[] default array[]::bigint[],

  status text default 'active',            -- active | archived | superseded
  version int default 1,
  parent_avatar_id bigint references intel_avatars(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists intel_avatars_status_idx on intel_avatars(status);
create index if not exists intel_avatars_confidence_idx on intel_avatars(confidence_score desc);

-- ============================================================
-- HYPOTHESES: CMO-written assumptions the system tests
-- ============================================================
create table if not exists intel_hypotheses (
  id bigserial primary key,
  statement text not null,                 -- "Women 45-60 are underserved in creatine because of gym-bro branding"
  author text default 'cmo',
  status text default 'open',              -- open | testing | validated | refuted | inconclusive
  target_avatar_id bigint references intel_avatars(id),

  -- Decomposed sub-claims (LLM-generated)
  sub_claims jsonb default '[]'::jsonb,

  -- Evidence collected
  supporting_item_ids bigint[] default array[]::bigint[],
  refuting_item_ids bigint[] default array[]::bigint[],
  confidence_score int,                    -- 0-100 % confidence after testing
  verdict text,                            -- LLM summary verdict

  queries_generated jsonb default '[]'::jsonb,
  tested_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists intel_hypotheses_status_idx on intel_hypotheses(status);

-- ============================================================
-- ALERTS: delta detection + notifications
-- ============================================================
create table if not exists intel_alerts (
  id bigserial primary key,
  kind text not null,                      -- new_theme | competitor_complaint | momentum_spike | narrative_shift | avatar_discovered
  severity text default 'info',            -- info | warning | critical
  title text not null,
  body text,
  evidence_item_ids bigint[] default array[]::bigint[],
  seen boolean default false,
  acted_on boolean default false,
  created_at timestamptz default now()
);

create index if not exists intel_alerts_seen_idx on intel_alerts(seen, created_at desc);

-- ============================================================
-- CHAT: Ask-Anything conversations with grounded citations
-- ============================================================
create table if not exists intel_chat_threads (
  id bigserial primary key,
  title text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists intel_chat_messages (
  id bigserial primary key,
  thread_id bigint references intel_chat_threads(id) on delete cascade,
  role text not null,                      -- user | assistant
  content text not null,
  citations jsonb default '[]'::jsonb,     -- list of item_ids referenced
  created_at timestamptz default now()
);

create index if not exists intel_chat_messages_thread_idx on intel_chat_messages(thread_id, created_at);

-- ============================================================
-- COMPETITORS: tracked brand adversaries
-- ============================================================
create table if not exists intel_competitors (
  id bigserial primary key,
  name text not null,
  slug text unique not null,
  domain text,
  category text,                           -- creatine_powder | gummies | chews | bars
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Seed known competitors (safe to re-run)
insert into intel_competitors (name, slug, domain, category) values
  ('Create Wellness', 'create-wellness', 'trycreate.co', 'gummies'),
  ('Optimum Nutrition', 'optimum-nutrition', 'optimumnutrition.com', 'creatine_powder'),
  ('MyProtein', 'myprotein', 'myprotein.com', 'creatine_powder'),
  ('Thorne', 'thorne', 'thorne.com', 'creatine_powder'),
  ('Transparent Labs', 'transparent-labs', 'transparentlabs.com', 'creatine_powder')
on conflict (slug) do nothing;

-- ============================================================
-- EVENTS: audit log of what the system did
-- ============================================================
create table if not exists intel_events (
  id bigserial primary key,
  kind text not null,                      -- ingest_started | ingest_finished | avatar_created | hypothesis_tested | chat_answered
  payload jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists intel_events_kind_idx on intel_events(kind, created_at desc);

-- ============================================================
-- RPC: semantic search helper
-- ============================================================
create or replace function intel_search_items(
  query_embedding vector(1536),
  match_threshold float default 0.75,
  match_count int default 20,
  min_relevance int default 0
)
returns table (
  id bigint,
  content text,
  platform text,
  url text,
  similarity float,
  frelo_relevance int
)
language sql stable
as $$
  select
    i.id,
    i.content,
    i.platform,
    i.url,
    1 - (i.embedding <=> query_embedding) as similarity,
    i.frelo_relevance
  from intel_items i
  where i.embedding is not null
    and (i.frelo_relevance is null or i.frelo_relevance >= min_relevance)
    and 1 - (i.embedding <=> query_embedding) > match_threshold
  order by i.embedding <=> query_embedding
  limit match_count;
$$;
