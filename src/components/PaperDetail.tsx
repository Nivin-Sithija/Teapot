import Link from 'next/link';
import { AlertTriangle, ExternalLink, FileText, Layers } from 'lucide-react';
import type { Paper, Stage } from '@/lib/types';
import { paperScope } from '@/lib/data/scope';
import { safeUrl } from '@/lib/safeUrl';
import { pdfPublicUrl } from '@/lib/supabase/client';
import { ScopeChip, Tag, TierChip } from './ui/chips';
import { PaperNotes } from './ui/PaperNotes';
import { BackButton, Logo, ThemeToggle } from './ui/TopBar';

/**
 * Dedicated page for a single paper — the destination when a result card in
 * the repository finder is clicked. Structured as headline → key stat →
 * summary → access links → metadata, rather than the finder's dense list row.
 */
export function PaperDetail({ paper, stage }: { paper: Paper; stage?: Stage }) {
  const pdf = paper.pdfPath ? pdfPublicUrl(paper.pdfPath) : null;
  const source = safeUrl(paper.url);
  const scope = paperScope(paper);
  const byline = [paper.authors, paper.venue, paper.year].filter(Boolean).join(' · ');

  const metaRows = [
    ['DOI', paper.doi],
    ['Modality', paper.modality],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <div className="min-h-dvh bg-[var(--color-paper)]">
      <header className="sticky top-0 z-20 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-paper)_90%,transparent)] backdrop-blur-md">
        <div className="flex w-full items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-12">
          <Logo />
          <nav className="flex items-center gap-1">
            <BackButton
              href={stage ? `/repository?stage=${stage.slug}&kind=paper` : '/repository'}
              label="Repository"
            />
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="w-full px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-x-12 gap-y-10 lg:grid-cols-[1fr_420px]">
          <div className="min-w-0 max-w-3xl">
            {/* Breadcrumb / classification row */}
            <div className="mb-5 flex flex-wrap items-center gap-2">
              {stage && (
                <Link
                  href={`/repository?stage=${stage.slug}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-[11.5px] font-medium text-[var(--color-ink-2)] hover:text-[var(--color-ink)]"
                >
                  <Layers size={12} aria-hidden />
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: stage.color }} />
                  {stage.name}
                </Link>
              )}
              <TierChip tier={paper.tier} />
              <ScopeChip scope={scope} />
            </div>

            {/* Headline */}
            <h1 className="text-[28px] leading-[1.15] font-semibold text-balance text-[var(--color-ink)] sm:text-[36px]">
              {paper.title}
            </h1>
            {byline && <p className="mt-3 text-[14px] text-[var(--color-muted)]">{byline}</p>}

            {/* Headline stat callout */}
            {paper.metric && (
              <div
                className="mt-6 rounded-2xl p-5"
                style={{ background: `color-mix(in srgb, ${stage?.color ?? 'var(--color-leaf)'} 12%, transparent)` }}
              >
                <p className="eyebrow mb-1.5">Reported result</p>
                <p className="font-mono text-[17px] leading-snug font-medium text-[var(--color-ink)] sm:text-[19px]">
                  {paper.metric}
                </p>
              </div>
            )}

            {/* Summary */}
            {paper.finding && (
              <section className="mt-8">
                <h2 className="eyebrow mb-2">Key finding</h2>
                <p className="text-[16px] leading-relaxed text-[var(--color-ink-2)]">{paper.finding}</p>
              </section>
            )}

            {paper.caveat && (
              <p className="mt-4 flex gap-2 rounded-xl bg-[color-mix(in_srgb,var(--color-gap)_9%,transparent)] p-3.5 text-[13px] leading-relaxed text-[var(--color-ink-2)]">
                <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[var(--color-gap)]" aria-hidden />
                <span>{paper.caveat}</span>
              </p>
            )}

            {/* Access */}
            <div className="mt-8 flex flex-wrap gap-2.5">
              {source && (
                <a
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-forest)] px-4 py-2.5 text-[13.5px] font-medium text-white transition-opacity hover:opacity-90"
                >
                  <ExternalLink size={14} aria-hidden /> See research paper
                </a>
              )}
              {pdf && (
                <a
                  href={pdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-line)] px-4 py-2.5 text-[13.5px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <FileText size={14} aria-hidden /> Open PDF
                </a>
              )}
            </div>

            {/* Metadata */}
            {(metaRows.length > 0 || paper.tags.length > 0) && (
              <section className="mt-10 border-t border-[var(--color-line)] pt-6">
                <h2 className="eyebrow mb-3">Details</h2>
                {metaRows.length > 0 && (
                  <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13.5px]">
                    {metaRows.map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-[var(--color-faint)]">{k}</dt>
                        <dd className="font-mono text-[var(--color-ink-2)]">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {paper.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {paper.tags.map((t) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="lg:self-stretch">
            <PaperNotes paperId={paper.id} />
          </aside>
        </div>
      </main>
    </div>
  );
}
