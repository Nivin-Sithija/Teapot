'use client';

import clsx from 'clsx';
import type { Maturity, SourceTier } from '@/lib/types';
import type { Scope } from '@/lib/data/scope';

const MATURITY_META: Record<Maturity, { label: string; color: string; hint: string }> = {
  mature: {
    label: 'Solved',
    color: 'var(--color-mature)',
    hint: 'Heavily replicated in the literature — adopt an existing approach rather than innovating.',
  },
  emerging: {
    label: 'Emerging',
    color: 'var(--color-emerging)',
    hint: 'Real precedent exists, but thin, single-site, or not yet externally validated.',
  },
  'open-gap': {
    label: 'Open gap',
    color: 'var(--color-gap)',
    hint: 'Named as unaddressed by review papers, or no published approach was found.',
  },
};

export function MaturityChip({ maturity }: { maturity: Maturity }) {
  const meta = MATURITY_META[maturity];
  return (
    <span
      title={meta.hint}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

const TIER_META: Record<SourceTier, { label: string; className: string; hint: string }> = {
  'peer-reviewed': {
    label: 'Peer-reviewed',
    className: 'text-[var(--color-mature)]',
    hint: 'Published in a peer-reviewed venue.',
  },
  preprint: {
    label: 'Preprint',
    className: 'text-[var(--color-emerging)]',
    hint: 'Preprint — not yet peer-reviewed.',
  },
  gray: {
    label: 'Gray lit.',
    className: 'text-[var(--color-muted)]',
    hint: 'Industry, repository mirror, or other non-peer-reviewed source.',
  },
  flagged: {
    label: 'Flagged',
    className: 'text-[var(--color-gap)]',
    hint: 'Integrity or indexing concerns — read the caveat before citing.',
  },
};

export function TierChip({ tier }: { tier: SourceTier }) {
  const meta = TIER_META[tier];
  return (
    <span
      title={meta.hint}
      className={clsx('text-[11px] font-semibold tracking-wide uppercase', meta.className)}
    >
      {meta.label}
    </span>
  );
}

const SCOPE_META: Record<Scope, { label: string; color: string; hint: string }> = {
  local: {
    label: 'Local',
    color: 'var(--color-leaf)',
    hint: 'Sri Lanka-focused study.',
  },
  global: {
    label: 'Global',
    color: 'var(--color-clay)',
    hint: 'International literature.',
  },
};

export function ScopeChip({ scope }: { scope: Scope }) {
  const meta = SCOPE_META[scope];
  return (
    <span
      title={meta.hint}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ color: meta.color, background: `color-mix(in srgb, ${meta.color} 12%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[11px] text-[var(--color-muted)]">
      {children}
    </span>
  );
}
