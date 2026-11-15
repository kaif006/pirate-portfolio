-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.

create extension if not exists vector with schema extensions;

-- Chunks of your CV and project descriptions, with their embeddings.
create table if not exists documents (
  id bigserial primary key,
  source text not null,
  heading text not null,
  content text not null,
  embedding extensions.vector(768) not null,
  created_at timestamptz not null default now()
);

create index if not exists documents_embedding_idx
  on documents using hnsw (embedding extensions.vector_cosine_ops);

-- Counters for rate limiting (one row per hashed visitor + scope).
create table if not exists rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits int not null default 0
);

-- Lock the tables: only the server (service role key) can read or write them.
alter table documents enable row level security;
alter table rate_limits enable row level security;

-- Nearest-neighbour search by cosine similarity.
create or replace function match_documents(
  query_embedding extensions.vector(768),
  match_count int default 5
)
returns table (id bigint, source text, content text, similarity float)
language sql stable
set search_path = public, extensions
as $$
  select d.id, d.source, d.content, 1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- Atomic rate limiter: returns true while the visitor is under the limit.
create or replace function check_rate_limit(
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
set search_path = public
as $$
declare
  v_hits int;
begin
  insert into rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case
      when r.window_start < now() - make_interval(secs => p_window_seconds) then now()
      else r.window_start end,
    hits = case
      when r.window_start < now() - make_interval(secs => p_window_seconds) then 1
      else r.hits + 1 end
  returning hits into v_hits;
  return v_hits <= p_limit;
end;
$$;

-- Only the server may call these functions, never the public anon key.
revoke execute on function match_documents(extensions.vector, int) from public, anon, authenticated;
revoke execute on function check_rate_limit(text, int, int) from public, anon, authenticated;

grant execute on function match_documents(extensions.vector, int) to service_role;
grant execute on function check_rate_limit(text, int, int) to service_role;
