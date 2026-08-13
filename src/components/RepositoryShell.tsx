'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import clsx from 'clsx';
import type { Dataset, Modality, Paper, SourceTier } from '@/lib/types';
import { STAGES, STAGE_BY_SLUG } from '@/lib/data/stages';
import { paperScope, datasetScope, type Scope } from '@/lib/data/scope';
import { safeUrl } from '@/lib/safeUrl';
import { BackButton, Logo, ThemeToggle } from './ui/TopBar';

/* ────────────────────────── normalised item shape ───────────────────────── */

type Kind = 'paper' | 'dataset';

interface RepoItem {
  kind: Kind;
  id: string;
  stageSlug: string;
  title: string;
  year?: number;
  tags: string[];
  tier?: SourceTier;
  modality?: Modality;
  scope: Scope;
  paper?: Paper;
  dataset?: Dataset;
}

function normalize(papers: Paper[], datasets: Dataset[]): RepoItem[] {
  const paperItems: RepoItem[] = papers.map((p) => ({
    kind: 'paper',
    id: p.id,
    stageSlug: p.stageSlug,
    title: p.title,
    year: p.year,
    tags: p.tags,
    tier: p.tier,
    modality: p.modality,
    scope: paperScope(p),
    paper: p,
  }));
  const datasetItems: RepoItem[] = datasets.map((d) => ({
    kind: 'dataset',
    id: d.id,
    stageSlug: d.stageSlug,
    title: d.name,
    tags: [],
    modality: d.modality,
    scope: datasetScope(d),
    dataset: d,
  }));
  return [...paperItems, ...datasetItems];
}

function haystack(item: RepoItem): string {
  if (item.paper) {
    return [item.paper.title, item.paper.authors, item.paper.venue, item.paper.finding, ...item.paper.tags]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }
  if (item.dataset) {
    return [item.dataset.name, item.dataset.categories, item.dataset.region, item.dataset.notes]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
  }
  return item.title.toLowerCase();
}

/* ────────────────────────────── filter state ────────────────────────────── */

type SortKey = 'newest' | 'oldest' | 'title-asc' | 'title-desc' | 'stage';

interface Filters {
  q: string;
  kind: Kind | 'all';
  stage: string;
  year: string;
  tag: string;
  scope: Scope | 'all';
  tier: SourceTier | 'all';
  modality: Modality | 'all';
  sort: SortKey;
}

const DEFAULT_FILTERS: Filters = {
  q: '',
  kind: 'all',
  stage: 'all',
  year: 'all',
  tag: 'all',
  scope: 'all',
  tier: 'all',
  modality: 'all',
  sort: 'newest',
};

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title-asc', label: 'Title (A–Z)' },
  { value: 'title-desc', label: 'Title (Z–A)' },
  { value: 'stage', label: 'Pipeline order' },
];

const TIER_OPTIONS: { value: SourceTier; label: string }[] = [
  { value: 'peer-reviewed', label: 'Peer-reviewed' },
  { value: 'preprint', label: 'Preprint' },
  { value: 'gray', label: 'Gray lit.' },
  { value: 'flagged', label: 'Flagged' },
];

function matches(item: RepoItem, f: Filters): boolean {
  if (f.kind !== 'all' && item.kind !== f.kind) return false;
  if (f.stage !== 'all' && item.stageSlug !== f.stage) return false;
  if (f.year !== 'all' && String(item.year ?? '') !== f.year) return false;
  if (f.tag !== 'all' && !item.tags.includes(f.tag)) return false;
  if (f.scope !== 'all' && item.scope !== f.scope) return false;
  if (f.tier !== 'all' && item.tier !== f.tier) return false;
  if (f.modality !== 'all' && item.modality !== f.modality) return false;
  if (f.q.trim() && !haystack(item).includes(f.q.trim().toLowerCase())) return false;
  return true;
}

function sortItems(items: RepoItem[], sort: SortKey): RepoItem[] {
  const copy = [...items];
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => (b.year ?? 0) - (a.year ?? 0));
    case 'oldest':
      return copy.sort((a, b) => (a.year ?? 9999) - (b.year ?? 9999));
    case 'title-asc':
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':
      return copy.sort((a, b) => b.title.localeCompare(a.title));
    case 'stage':
      return copy.sort(
        (a, b) => (STAGE_BY_SLUG.get(a.stageSlug)?.index ?? 0) - (STAGE_BY_SLUG.get(b.stageSlug)?.index ?? 0),
      );
  }
}

const PAGE_SIZE = 8;

/* ─────────────────────────────── sub UI ──────────────────────────────────── */

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 text-[11px] text-[var(--color-ink-2)] sm:gap-1.5 sm:rounded-xl sm:px-3 sm:py-2 sm:text-[12.5px]">
      <span className="shrink-0 text-[var(--color-faint)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 bg-transparent text-[11px] font-medium text-[var(--color-ink)] focus:outline-none sm:text-[12.5px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

/** One dense, database-table row — title links straight to the detail page or source. */
function TableRow({ item }: { item: RepoItem }) {
  const router = useRouter();
  const stage = STAGE_BY_SLUG.get(item.stageSlug);
  const isPaper = item.kind === 'paper';
  const meta = isPaper
    ? [item.paper?.venue, item.paper?.authors].filter(Boolean).join(' · ')
    : [item.dataset?.size, item.dataset?.region].filter(Boolean).join(' · ');

  const open = () => {
    if (isPaper) {
      router.push(`/repository/paper/${item.id}`);
      return;
    }
    // `window.open` executes `javascript:` URLs just as an href would, so the
    // dataset link is scheme-checked before it gets there.
    const url = safeUrl(item.dataset?.url);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <tr
      onClick={open}
      className="cursor-pointer border-b border-[var(--color-line)] transition-colors last:border-b-0 hover:bg-[var(--color-surface-2)]"
    >
      <td className="min-w-0 py-2.5 pr-3 pl-3">
        <div className="flex items-center gap-2">
          {stage && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: stage.color }} />}
          <span className="truncate text-[13.5px] font-medium text-[var(--color-ink)]">{item.title}</span>
        </div>
      </td>
      <td className="hidden py-2.5 pr-3 text-[12px] whitespace-nowrap text-[var(--color-muted)] sm:table-cell">
        {stage?.name ?? '—'}
      </td>
      <td className="py-2.5 pr-3 text-[10.5px] font-semibold tracking-wide whitespace-nowrap text-[var(--color-faint)] uppercase">
        {isPaper ? 'Paper' : 'Dataset'}
      </td>
      <td className="hidden py-2.5 pr-3 text-[12px] whitespace-nowrap text-[var(--color-muted)] md:table-cell">
        {isPaper ? (item.year ?? '—') : '—'}
      </td>
      <td className="hidden max-w-[300px] truncate py-2.5 pr-3 text-[12px] text-[var(--color-faint)] lg:table-cell">
        {meta || '—'}
      </td>
    </tr>
  );
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  if (pageCount <= 1) return null;
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-1.5">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        aria-label="Previous page"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--color-line)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] disabled:pointer-events-none disabled:opacity-35"
      >
        <ChevronLeft size={14} />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={clsx(
            'grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-[12.5px] font-medium transition-colors',
            p === page
              ? 'border-[var(--color-amber)] bg-[var(--color-amber)] text-white'
              : 'border-[var(--color-line)] text-[var(--color-ink-2)] hover:bg-[var(--color-surface-2)]',
          )}
        >
          {p}
        </button>
      ))}
      <button
        disabled={page === pageCount}
        onClick={() => onChange(page + 1)}
        aria-label="Next page"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[var(--color-line)] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] disabled:pointer-events-none disabled:opacity-35"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

/* ───────────────────────────────── shell ─────────────────────────────────── */

export function RepositoryShell({ papers, datasets }: { papers: Paper[]; datasets: Dataset[] }) {
  const items = useMemo(() => normalize(papers, datasets), [papers, datasets]);
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);

  // Deep link from a stage click in the 3D atlas: /repository?stage=x&kind=paper|dataset
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stage = params.get('stage');
    const kind = params.get('kind');
    const q = params.get('q');
    setFilters((f) => ({
      ...f,
      stage: stage && STAGE_BY_SLUG.has(stage) ? stage : f.stage,
      kind: kind === 'paper' || kind === 'dataset' ? kind : f.kind,
      q: q ?? f.q,
    }));
  }, []);

  // Keep the address bar in step so filtered views are shareable.
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.stage !== 'all') params.set('stage', filters.stage);
    if (filters.kind !== 'all') params.set('kind', filters.kind);
    if (filters.q) params.set('q', filters.q);
    const qs = params.toString();
    const url = qs ? `/repository?${qs}` : '/repository';
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, '', url);
    }
  }, [filters.stage, filters.kind, filters.q]);

  useEffect(() => setPage(1), [filters]);

  const years = useMemo(
    () =>
      Array.from(new Set(papers.map((p) => p.year).filter((y): y is number => Boolean(y)))).sort((a, b) => b - a),
    [papers],
  );
  const tags = useMemo(() => Array.from(new Set(papers.flatMap((p) => p.tags))).sort(), [papers]);
  const modalities = useMemo(
    () => Array.from(new Set(items.map((i) => i.modality).filter((m): m is Modality => Boolean(m)))).sort(),
    [items],
  );

  const filtered = useMemo(() => items.filter((i) => matches(i, filters)), [items, filters]);
  const sorted = useMemo(() => sortItems(filtered, filters.sort), [filtered, filters.sort]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = useMemo(() => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [sorted, page]);

  const hasActiveFilters =
    filters.q !== '' ||
    filters.kind !== 'all' ||
    filters.stage !== 'all' ||
    filters.year !== 'all' ||
    filters.tag !== 'all' ||
    filters.scope !== 'all' ||
    filters.tier !== 'all' ||
    filters.modality !== 'all';

  const clearFilters = () => setFilters(DEFAULT_FILTERS);
  const set = <K extends keyof Filters>(key: K) => (value: string) => setFilters((f) => ({ ...f, [key]: value as Filters[K] }));

  return (
    <div className="min-h-dvh bg-[var(--color-paper)]">
      <div className="fixed top-4 left-4 z-30">
        <Logo />
      </div>

      <div className="fixed top-4 right-4 z-30 flex items-center gap-1">
        <BackButton />
        <ThemeToggle />
      </div>

      {/* Hero */}
      <section className="w-full px-5 pt-12 pb-6 sm:px-8 sm:pt-12 lg:px-12">
        <h1 className="max-w-2xl text-[32px] leading-[1.08] font-semibold text-[var(--color-ink)] sm:text-[42px]">
          Teapot Research Repository
        </h1>
        <p className="mt-4 max-w-xl text-[14.5px] leading-relaxed text-[var(--color-ink-2)]">
          Every paper and dataset behind the ten stages of the tea pipeline — searchable, filterable, and traceable
          back to the stage it belongs to.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-ink-2)]">
            {papers.length} papers
          </span>
          <span className="rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-ink-2)]">
            {datasets.length} datasets
          </span>
          <span className="rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-ink-2)]">
            10 pipeline stages
          </span>
        </div>
      </section>

      {/* Search + filters */}
      <section className="w-full px-5 pb-4 sm:px-8 lg:px-12">
        <div className="card space-y-2 p-3 sm:space-y-3 sm:p-4">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
            <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-2.5 py-1.5 sm:gap-2 sm:rounded-xl sm:px-3 sm:py-2.5">
              <Search size={14} className="shrink-0 text-[var(--color-faint)]" aria-hidden />
              <input
                value={filters.q}
                onChange={(e) => set('q')(e.target.value)}
                placeholder="Search research and datasets…"
                className="w-full bg-transparent text-[12.5px] text-[var(--color-ink)] placeholder:text-[var(--color-faint)] focus:outline-none sm:text-[13.5px]"
              />
              {filters.q && (
                <button
                  onClick={() => set('q')('')}
                  aria-label="Clear search"
                  className="shrink-0 rounded p-0.5 text-[var(--color-faint)] hover:text-[var(--color-ink)]"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <FilterSelect label="Sort by" value={filters.sort} onChange={set('sort')} options={SORT_OPTIONS} />
          </div>

          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            <FilterSelect
              label="Type"
              value={filters.kind}
              onChange={set('kind')}
              options={[
                { value: 'all', label: 'Papers & datasets' },
                { value: 'paper', label: 'Papers only' },
                { value: 'dataset', label: 'Datasets only' },
              ]}
            />
            <FilterSelect
              label="Stage"
              value={filters.stage}
              onChange={set('stage')}
              options={[{ value: 'all', label: 'All stages' }, ...STAGES.map((s) => ({ value: s.slug, label: s.name }))]}
            />
            <FilterSelect
              label="Year"
              value={filters.year}
              onChange={set('year')}
              options={[{ value: 'all', label: 'All years' }, ...years.map((y) => ({ value: String(y), label: String(y) }))]}
            />
            <FilterSelect
              label="Tags"
              value={filters.tag}
              onChange={set('tag')}
              options={[{ value: 'all', label: 'All tags' }, ...tags.map((t) => ({ value: t, label: t }))]}
            />
            <FilterSelect
              label="Origin"
              value={filters.scope}
              onChange={set('scope')}
              options={[
                { value: 'all', label: 'Local & global' },
                { value: 'local', label: 'Local (Sri Lanka)' },
                { value: 'global', label: 'Global' },
              ]}
            />
            <FilterSelect
              label="Source"
              value={filters.tier}
              onChange={set('tier')}
              options={[{ value: 'all', label: 'All sources' }, ...TIER_OPTIONS]}
            />
            <FilterSelect
              label="Modality"
              value={filters.modality}
              onChange={set('modality')}
              options={[
                { value: 'all', label: 'All modalities' },
                ...modalities.map((m) => ({ value: m, label: m })),
              ]}
            />
          </div>

          <div className="flex items-center justify-between text-[12px] text-[var(--color-faint)]">
            <span>
              {sorted.length} result{sorted.length === 1 ? '' : 's'}
            </span>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="font-medium text-[var(--color-amber)] hover:underline">
                Clear filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="w-full px-5 pb-16 sm:px-8 lg:px-12">
        {paged.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-[14px] text-[var(--color-muted)]">No papers or datasets match these filters.</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-3 text-[13px] font-medium text-[var(--color-amber)] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-[var(--color-line)]">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[var(--color-line)] bg-[var(--color-surface-2)] text-[10.5px] font-semibold tracking-wide text-[var(--color-faint)] uppercase">
                  <th className="py-2 pr-3 pl-3 font-semibold">Title</th>
                  <th className="hidden py-2 pr-3 font-semibold sm:table-cell">Stage</th>
                  <th className="py-2 pr-3 font-semibold">Type</th>
                  <th className="hidden py-2 pr-3 font-semibold md:table-cell">Year</th>
                  <th className="hidden py-2 pr-3 font-semibold lg:table-cell">Source</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <TableRow key={`${item.kind}-${item.id}`} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pageCount={pageCount} onChange={setPage} />
      </section>
    </div>
  );
}
