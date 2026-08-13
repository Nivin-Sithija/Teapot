import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { STAGES, getStage } from '@/lib/data/stages';
import { PAPERS } from '@/lib/data/seed/papers';
import { DATASETS } from '@/lib/data/seed/datasets';
import { OPPORTUNITIES } from '@/lib/data/seed/opportunities';
import { computeEdges } from '@/lib/data/edges';
import type { AIOpportunity, Dataset, Paper, ResearchEdge, SearchHit, StageDetail } from '@/lib/types';

/**
 * Single data-access surface for the app.
 *
 * Every function reads from Supabase when it is configured and silently falls
 * back to the bundled seed corpus otherwise — including when a Supabase query
 * errors, so a transient backend problem degrades to stale-but-correct content
 * instead of an empty page.
 *
 * The seed corpus is also the source of truth for `npm run db:seed`, so the two
 * paths cannot drift apart in content, only in freshness.
 */

type Row = Record<string, unknown>;

/** snake_case (Postgres) → camelCase (TypeScript). */
function camelize<T>(row: Row): T {
  const out: Row = {};
  for (const [k, v] of Object.entries(row)) {
    out[k.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] = v;
  }
  return out as T;
}

async function query<T>(table: string, stageSlug?: string): Promise<T[] | null> {
  const client = getSupabase();
  if (!client) return null;
  try {
    let q = client.from(table).select('*');
    if (stageSlug) q = q.eq('stage_slug', stageSlug);
    const { data, error } = await q;
    if (error || !data) {
      console.warn(`[repository] ${table} query failed, using seed data:`, error?.message);
      return null;
    }
    return data.map((r) => camelize<T>(r as Row));
  } catch (err) {
    console.warn(`[repository] ${table} threw, using seed data:`, err);
    return null;
  }
}

export async function getPapers(stageSlug?: string): Promise<Paper[]> {
  const remote = await query<Paper>('papers', stageSlug);
  if (remote?.length) return remote;
  return stageSlug ? PAPERS.filter((p) => p.stageSlug === stageSlug) : PAPERS;
}

/** Single paper by id, for the dedicated /repository/paper/[id] detail page. */
export async function getPaperById(id: string): Promise<Paper | null> {
  const client = getSupabase();
  if (client) {
    try {
      const { data, error } = await client.from('papers').select('*').eq('id', id).single();
      if (!error && data) return camelize<Paper>(data as Row);
    } catch (err) {
      console.warn(`[repository] paper ${id} threw, using seed data:`, err);
    }
  }
  return PAPERS.find((p) => p.id === id) ?? null;
}

export async function getDatasets(stageSlug?: string): Promise<Dataset[]> {
  const remote = await query<Dataset>('datasets', stageSlug);
  if (remote?.length) return remote;
  return stageSlug ? DATASETS.filter((d) => d.stageSlug === stageSlug) : DATASETS;
}

export async function getOpportunities(stageSlug?: string): Promise<AIOpportunity[]> {
  const remote = await query<AIOpportunity>('ai_opportunities', stageSlug);
  if (remote?.length) return remote;
  return stageSlug ? OPPORTUNITIES.filter((o) => o.stageSlug === stageSlug) : OPPORTUNITIES;
}

/**
 * The research graph: connections between papers/datasets, read from the
 * persisted `research_edges` table when Supabase is configured. Falls back to
 * recomputing them client-side with the same `computeEdges` function the seed
 * script uses, so the graph shape never depends on the backend being up.
 */
export async function getEdges(stageSlug?: string): Promise<ResearchEdge[]> {
  const remote = await query<ResearchEdge>('research_edges', stageSlug);
  if (remote?.length) return remote;
  const papers = stageSlug ? PAPERS.filter((p) => p.stageSlug === stageSlug) : PAPERS;
  const datasets = stageSlug ? DATASETS.filter((d) => d.stageSlug === stageSlug) : DATASETS;
  return computeEdges(papers, datasets);
}

/** Everything the stage drawer renders, in one round trip per table. */
export async function getStageDetail(slug: string): Promise<StageDetail | null> {
  const stage = getStage(slug);
  if (!stage) return null;

  const [opportunities, papers, datasets, edges] = await Promise.all([
    getOpportunities(slug),
    getPapers(slug),
    getDatasets(slug),
    getEdges(slug),
  ]);

  return { stage, opportunities, papers, datasets, edges };
}

/** Preloaded detail for all ten stages — used to hydrate the client scene once. */
export async function getAllStageDetails(): Promise<Record<string, StageDetail>> {
  const [papers, datasets, opportunities, edges] = await Promise.all([
    getPapers(),
    getDatasets(),
    getOpportunities(),
    getEdges(),
  ]);

  const out: Record<string, StageDetail> = {};
  for (const stage of STAGES) {
    out[stage.slug] = {
      stage,
      opportunities: opportunities.filter((o) => o.stageSlug === stage.slug),
      papers: papers.filter((p) => p.stageSlug === stage.slug),
      datasets: datasets.filter((d) => d.stageSlug === stage.slug),
      edges: edges.filter((e) => e.stageSlug === stage.slug),
    };
  }
  return out;
}

/** Flat index powering the ⌘K palette. Built once on the server, sent to the client. */
export async function getSearchIndex(): Promise<SearchHit[]> {
  const [papers, datasets, opportunities] = await Promise.all([
    getPapers(),
    getDatasets(),
    getOpportunities(),
  ]);

  return [
    ...STAGES.map<SearchHit>((s) => ({
      kind: 'stage',
      id: s.slug,
      stageSlug: s.slug,
      title: s.name,
      subtitle: s.tagline,
    })),
    ...opportunities.map<SearchHit>((o) => ({
      kind: 'opportunity',
      id: o.id,
      stageSlug: o.stageSlug,
      title: o.title,
      subtitle: o.techniques.join(' · '),
    })),
    ...papers.map<SearchHit>((p) => ({
      kind: 'paper',
      id: p.id,
      stageSlug: p.stageSlug,
      title: p.title,
      subtitle: [p.venue, p.year].filter(Boolean).join(' · ') || undefined,
      url: p.url,
    })),
    ...datasets.map<SearchHit>((d) => ({
      kind: 'dataset',
      id: d.id,
      stageSlug: d.stageSlug,
      title: d.name,
      subtitle: d.categories,
      url: d.url,
    })),
  ];
}

export { isSupabaseConfigured };
