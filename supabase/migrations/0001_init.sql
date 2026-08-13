-- Ath Udawwa — research atlas schema
--
-- Run this once against a fresh Supabase project (SQL Editor → New query → paste
-- → Run), then `npm run db:seed` to populate it from the bundled corpus.
--
-- Design notes:
--   * Stage definitions deliberately live in code (src/lib/data/stages.ts), not
--     here — they carry 3D world positions and palette values that belong with
--     the scene, and the set is fixed at ten. Only the *research* content, which
--     grows over time, is stored in Postgres.
--   * RLS is on for all three tables with SELECT granted to anon. That is what
--     makes it safe to ship the anon key to the browser: the public site can
--     read everything and write nothing. Inserts require the service-role key,
--     which stays server-side in the seed script.

-- ─────────────────────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.papers (
  id           text primary key,
  stage_slug   text        not null,
  title        text        not null,
  authors      text,
  year         integer,
  venue        text,
  url          text        not null,
  doi          text,
  tier         text        not null default 'peer-reviewed'
                 check (tier in ('peer-reviewed', 'preprint', 'gray', 'flagged')),
  finding      text,
  metric       text,
  modality     text,
  tags         text[]      not null default '{}',
  pdf_path     text,
  caveat       text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.datasets (
  id           text primary key,
  stage_slug   text        not null,
  name         text        not null,
  size         text,
  categories   text,
  region       text,
  url          text,
  license      text,
  modality     text,
  notes        text,
  restricted   boolean     not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.ai_opportunities (
  id           text primary key,
  stage_slug   text        not null,
  title        text        not null,
  description  text        not null,
  techniques   text[]      not null default '{}',
  maturity     text        not null default 'emerging'
                 check (maturity in ('mature', 'emerging', 'open-gap')),
  evidence     text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Connections between papers/datasets — the research graph, persisted rather
-- than recomputed client-side on every page load. `id` is a deterministic
-- composite key (see supabase/seed.ts), which makes reseeding idempotent.
-- Edges are fully derived from papers + datasets, so the seed script always
-- replaces this table wholesale rather than upserting — a tag or modality
-- match that no longer holds should not leave a stale edge behind.
create table if not exists public.research_edges (
  id           text primary key,
  stage_slug   text not null,
  source_kind  text not null check (source_kind in ('paper', 'dataset')),
  source_id    text not null,
  target_kind  text not null check (target_kind in ('paper', 'dataset')),
  target_id    text not null,
  reason       text not null,
  created_at   timestamptz not null default now()
);

-- Every read is scoped by stage, so index that column on all three.
create index if not exists papers_stage_idx        on public.papers (stage_slug);
create index if not exists datasets_stage_idx      on public.datasets (stage_slug);
create index if not exists opportunities_stage_idx on public.ai_opportunities (stage_slug);
create index if not exists research_edges_stage_idx on public.research_edges (stage_slug);

-- Full-text search over the paper corpus, for when the client-side ⌘K index
-- outgrows being shipped to the browser wholesale.
create index if not exists papers_search_idx on public.papers
  using gin (to_tsvector('english', title || ' ' || coalesce(finding, '')));

-- ─────────────────────────────────────────────────────────────────────────────
-- updated_at maintenance
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists papers_touch on public.papers;
create trigger papers_touch before update on public.papers
  for each row execute function public.touch_updated_at();

drop trigger if exists datasets_touch on public.datasets;
create trigger datasets_touch before update on public.datasets
  for each row execute function public.touch_updated_at();

drop trigger if exists opportunities_touch on public.ai_opportunities;
create trigger opportunities_touch before update on public.ai_opportunities
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row-level security: world-readable, service-role-writable
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.papers           enable row level security;
alter table public.datasets         enable row level security;
alter table public.ai_opportunities enable row level security;
alter table public.research_edges   enable row level security;

drop policy if exists "papers are public" on public.papers;
create policy "papers are public" on public.papers
  for select to anon, authenticated using (true);

drop policy if exists "datasets are public" on public.datasets;
create policy "datasets are public" on public.datasets
  for select to anon, authenticated using (true);

drop policy if exists "opportunities are public" on public.ai_opportunities;
create policy "opportunities are public" on public.ai_opportunities
  for select to anon, authenticated using (true);

drop policy if exists "edges are public" on public.research_edges;
create policy "edges are public" on public.research_edges
  for select to anon, authenticated using (true);

-- No INSERT/UPDATE/DELETE policies are defined, so those operations are denied
-- for anon and authenticated. The service-role key bypasses RLS entirely, which
-- is how the seed script writes.

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage: research PDFs
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('research-pdfs', 'research-pdfs', true)
on conflict (id) do update set public = true;

drop policy if exists "research pdfs are public" on storage.objects;
create policy "research pdfs are public" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'research-pdfs');
