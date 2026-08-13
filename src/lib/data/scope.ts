import type { Dataset, Paper } from '@/lib/types';

/**
 * Geographic scope of the underlying study, used by the repository finder's
 * Local/Global filter. Derived on the fly from free text rather than stored,
 * so it never has to be kept in sync with the Supabase schema or backfilled
 * across the seed corpus by hand.
 */
export type Scope = 'local' | 'global';

const LOCAL_PATTERN = /sri lanka|ceylon/i;

export function paperScope(paper: Paper): Scope {
  const haystack = [paper.title, paper.venue, paper.finding, paper.caveat, ...paper.tags]
    .filter(Boolean)
    .join(' ');
  return LOCAL_PATTERN.test(haystack) ? 'local' : 'global';
}

export function datasetScope(dataset: Dataset): Scope {
  const haystack = [dataset.name, dataset.region, dataset.categories, dataset.notes]
    .filter(Boolean)
    .join(' ');
  return LOCAL_PATTERN.test(haystack) ? 'local' : 'global';
}
