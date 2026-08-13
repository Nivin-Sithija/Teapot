import type { Dataset, Paper, ResearchEdge } from '@/lib/types';

type Item = { kind: 'paper'; data: Paper } | { kind: 'dataset'; data: Dataset };

/**
 * Pure edge-computation shared by the Supabase seed script (`supabase/seed.ts`)
 * and the client-side fallback in `repository.ts`, so the persisted
 * `research_edges` table and the no-backend-configured path can never drift
 * apart in what counts as a connection.
 *
 * Papers connect to each other via shared tags (excluding generic ones) or
 * matching modality. Datasets connect to other datasets, and to papers, by
 * matching modality only — there's no tag overlap to compare since datasets
 * don't carry tags. Edges never cross stages: two items are only compared
 * when they belong to the same stage.
 */
export function computeEdges(papers: Paper[], datasets: Dataset[]): ResearchEdge[] {
  const items: Item[] = [
    ...papers.map((p): Item => ({ kind: 'paper', data: p })),
    ...datasets.map((d): Item => ({ kind: 'dataset', data: d })),
  ];

  const edges: ResearchEdge[] = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const a = items[i];
      const b = items[j];
      if (a.data.stageSlug !== b.data.stageSlug) continue;

      let reason: string | null = null;

      if (a.kind === 'paper' && b.kind === 'paper') {
        const sharedTags = a.data.tags.filter(
          (t) => b.data.tags.includes(t) && !['survey-sourced', 'core-research'].includes(t),
        );
        const sameModality =
          a.data.modality && b.data.modality && a.data.modality === b.data.modality && a.data.modality !== 'rgb';

        if (sharedTags.length > 0) reason = sharedTags.join(', ');
        else if (sameModality) reason = `${a.data.modality}`;
      } else {
        const sameModality = a.data.modality && b.data.modality && a.data.modality === b.data.modality;
        if (sameModality) reason = `${a.data.modality} data`;
      }

      if (reason) {
        edges.push({
          stageSlug: a.data.stageSlug,
          sourceKind: a.kind,
          sourceId: a.data.id,
          targetKind: b.kind,
          targetId: b.data.id,
          reason,
        });
      }
    }
  }

  return edges;
}
