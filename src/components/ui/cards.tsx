'use client';

import { useRouter } from 'next/navigation';
import { AlertTriangle, Database, ExternalLink, FileText, Lock } from 'lucide-react';
import type { AIOpportunity, Dataset, Paper } from '@/lib/types';
import type { Scope } from '@/lib/data/scope';
import { safeUrl } from '@/lib/safeUrl';
import { pdfPublicUrl } from '@/lib/supabase/client';
import { MaturityChip, ScopeChip, Tag, TierChip } from './chips';

export function OpportunityCard({ item }: { item: AIOpportunity }) {
  return (
    <article className="card p-4">
      <header className="mb-2 flex items-start justify-between gap-3">
        <h4 className="text-[15px] leading-snug font-semibold text-[var(--color-ink)]">{item.title}</h4>
        <MaturityChip maturity={item.maturity} />
      </header>
      <p className="text-[13.5px] leading-relaxed text-[var(--color-ink-2)]">{item.description}</p>

      {item.techniques.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.techniques.map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </div>
      )}

      {item.evidence && (
        <p className="mt-3 border-l-2 border-[var(--color-line)] pl-3 text-[12.5px] leading-relaxed text-[var(--color-muted)] italic">
          {item.evidence}
        </p>
      )}
    </article>
  );
}

export function PaperCard({ item, scope }: { item: Paper; scope?: Scope }) {
  const router = useRouter();
  const pdf = item.pdfPath ? pdfPublicUrl(item.pdfPath) : null;
  const source = safeUrl(item.url);
  const meta = [item.authors, item.venue, item.year].filter(Boolean).join(' · ');
  const detailHref = `/repository/paper/${item.id}`;

  const openDetail = () => router.push(detailHref);
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openDetail}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openDetail();
        }
      }}
      aria-label={`Open details for ${item.title}`}
      className="card cursor-pointer p-4 transition-shadow hover:shadow-[0_2px_4px_rgb(31_61_43/0.06),0_12px_32px_-14px_rgb(31_61_43/0.28)]"
    >
      <div className="mb-1.5 flex items-center gap-2">
        <TierChip tier={item.tier} />
        {scope && <ScopeChip scope={scope} />}
        {item.metric && (
          <span className="ml-auto rounded-md bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[11.5px] text-[var(--color-ink-2)]">
            {item.metric}
          </span>
        )}
      </div>

      <h4 className="text-[19px] leading-snug font-semibold text-balance text-[var(--color-ink)] hover:text-[var(--color-amber)]">
        {item.title}
      </h4>

      {meta && <p className="mt-1 text-[12.5px] text-[var(--color-muted)]">{meta}</p>}

      {item.finding && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--color-ink-2)]">{item.finding}</p>
      )}

      {item.caveat && (
        <p className="mt-2.5 flex gap-2 rounded-lg bg-[color-mix(in_srgb,var(--color-gap)_9%,transparent)] p-2.5 text-[12.5px] leading-relaxed text-[var(--color-ink-2)]">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[var(--color-gap)]" aria-hidden />
          <span>{item.caveat}</span>
        </p>
      )}

      <footer className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {source && (
          <a
            href={source}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--color-amber)] hover:underline"
          >
            <ExternalLink size={12} aria-hidden /> See research paper
          </a>
        )}
        {pdf && (
          <a
            href={pdf}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--color-amber)] hover:underline"
          >
            <FileText size={12} aria-hidden /> PDF
          </a>
        )}
        {item.doi && <span className="font-mono text-[11px] text-[var(--color-faint)]">{item.doi}</span>}
        <span className="ml-auto flex gap-1.5">
          {item.tags.slice(0, 2).map((t) => (
            <Tag key={t}>{t}</Tag>
          ))}
        </span>
      </footer>
    </article>
  );
}

export function DatasetCard({ item, scope }: { item: Dataset; scope?: Scope }) {
  const source = safeUrl(item.url);
  const rows = [
    ['Size', item.size],
    ['Categories', item.categories],
    ['Region', item.region],
    ['License', item.license],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <article className="card p-4">
      <header className="mb-2 flex items-start gap-2">
        {item.restricted ? (
          <Lock size={14} className="mt-0.5 shrink-0 text-[var(--color-faint)]" aria-hidden />
        ) : (
          <Database size={14} className="mt-0.5 shrink-0 text-[var(--color-mature)]" aria-hidden />
        )}
        <h4 className="min-w-0 flex-1 text-[18px] leading-snug font-semibold text-[var(--color-ink)]">
          {source ? (
            <a href={source} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-amber)]">
              {item.name}
            </a>
          ) : (
            item.name
          )}
        </h4>
        {scope && <ScopeChip scope={scope} />}
      </header>

      {rows.length > 0 && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12.5px]">
          {rows.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="text-[var(--color-faint)]">{k}</dt>
              <dd className="text-[var(--color-ink-2)]">{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {item.notes && (
        <p className="mt-2.5 text-[13px] leading-relaxed text-[var(--color-ink-2)]">{item.notes}</p>
      )}

      {item.restricted && (
        <p className="mt-2 text-[11.5px] text-[var(--color-faint)]">
          Not openly downloadable — listed so you know it exists and who holds it.
        </p>
      )}
    </article>
  );
}

/**
 * Compact research-paper summary card for the Overview tab.
 * Inspired by the news-article layout: icon on left, headline + metadata + finding on right.
 */
export function PaperSummaryCard({ item }: { item: Paper }) {
  const source = safeUrl(item.url);
  const meta = [item.authors, item.venue, item.year].filter(Boolean).join(' · ');

  return (
    <article className="group flex gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5 transition-shadow hover:shadow-[0_2px_4px_rgb(31_61_43/0.06),0_12px_32px_-14px_rgb(31_61_43/0.28)]">
      <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[var(--color-surface-2)]">
        <FileText size={16} className="text-[var(--color-amber)]" aria-hidden />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-[13.5px] leading-snug font-semibold text-[var(--color-ink)]">
          {source ? (
            <a href={source} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-amber)]">
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </h4>
        {meta && <p className="mt-0.5 text-[11.5px] text-[var(--color-faint)]">{meta}</p>}
        {item.finding && (
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--color-ink-2)]">{item.finding}</p>
        )}
        {item.metric && (
          <span className="mt-1.5 inline-block rounded-md bg-[var(--color-surface-2)] px-2 py-0.5 font-mono text-[11px] text-[var(--color-ink-2)]">
            {item.metric}
          </span>
        )}
      </div>
    </article>
  );
}
