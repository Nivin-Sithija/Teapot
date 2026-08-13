'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Database, FileText, X } from 'lucide-react';
import clsx from 'clsx';
import type { StageDetail } from '@/lib/types';
import { adjacentStages } from '@/lib/data/stages';
import { useAtlas } from '@/lib/store';

/**
 * Compact stage identity card — confirms what stage you clicked (name,
 * tagline, what physically happens, where ML/CV fits) and hands you off to
 * the full paper/dataset finder at /repository, pre-filtered to this stage.
 */
export function StageDrawer({ details }: { details: Record<string, StageDetail> }) {
  const selected = useAtlas((s) => s.selected);
  const select = useAtlas((s) => s.select);
  const step = useAtlas((s) => s.step);

  const detail = selected ? details[selected] : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      if (e.key === 'Escape') select(null);
      if (e.key === 'ArrowRight' && !e.metaKey) step(1);
      if (e.key === 'ArrowLeft' && !e.metaKey) step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected, select, step]);

  const { prev, next } = detail ? adjacentStages(detail.stage.slug) : { prev: undefined, next: undefined };

  return (
    <AnimatePresence>
      {detail && (
        <motion.aside
          key="drawer"
          initial={{ opacity: 0, y: -10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.99 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={clsx(
            'pointer-events-auto fixed z-30 flex flex-col overflow-hidden bg-[var(--color-surface)]',
            'inset-x-0 bottom-0 max-h-[64vh] rounded-t-2xl border-t border-[var(--color-line)]',
            'lg:top-24 lg:right-4 lg:bottom-auto lg:left-auto lg:max-h-[calc(100dvh-7rem)] lg:w-[380px] lg:rounded-2xl lg:border',
          )}
          style={{ boxShadow: 'var(--shadow-drawer)' }}
          aria-label={`${detail.stage.name} details`}
        >
          {/* Header */}
          <header className="relative shrink-0 border-b border-[var(--color-line)] px-5 pt-4 pb-3">
            <div
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: `linear-gradient(90deg, ${detail.stage.color}, ${detail.stage.accent})` }}
            />
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold text-white"
                style={{ background: detail.stage.color }}
              >
                {detail.stage.index}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-[19px] leading-tight font-semibold text-[var(--color-ink)]">
                  {detail.stage.name}
                </h2>
                <p className="mt-0.5 text-[13px] text-[var(--color-muted)]">{detail.stage.tagline}</p>
              </div>
              <button
                onClick={() => select(null)}
                aria-label="Close stage details"
                className="-mt-1 -mr-1 rounded-lg p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          {/* Body */}
          <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <div className="animate-fade-up space-y-4">
              <div className="flex flex-wrap gap-1.5">
                <span className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-[11.5px] text-[var(--color-ink-2)]">
                  {detail.papers.length} papers
                </span>
                <span className="rounded-full bg-[var(--color-surface-2)] px-2.5 py-1 text-[11.5px] text-[var(--color-ink-2)]">
                  {detail.datasets.length} datasets
                </span>
              </div>

              <section>
                <h3 className="eyebrow mb-2">The process</h3>
                <p className="text-[13px] leading-relaxed text-[var(--color-ink-2)]">{detail.stage.process}</p>
              </section>

              <section>
                <h3 className="eyebrow mb-2">Where ML &amp; CV fit</h3>
                <p className="text-[13px] leading-relaxed text-[var(--color-ink-2)]">{detail.stage.aiSummary}</p>
              </section>
            </div>
          </div>

          {/* Jump to the filtered repository + prev/next stage nav */}
          <footer className="shrink-0 space-y-2 border-t border-[var(--color-line)] px-4 py-3">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href={`/repository?stage=${detail.stage.slug}&kind=paper`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[12.5px] font-medium text-white transition-opacity hover:opacity-90"
                style={{ background: detail.stage.color }}
              >
                <FileText size={13} aria-hidden /> Papers
              </Link>
              <Link
                href={`/repository?stage=${detail.stage.slug}&kind=dataset`}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--color-line)] px-3 py-2 text-[12.5px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-surface-2)]"
              >
                <Database size={13} aria-hidden /> Datasets
              </Link>
            </div>
            <div className="flex items-center justify-between gap-2">
              <button
                disabled={!prev}
                onClick={() => step(-1)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] disabled:pointer-events-none disabled:opacity-35"
              >
                <ChevronLeft size={13} /> {prev?.name ?? 'Start'}
              </button>
              <button
                disabled={!next}
                onClick={() => step(1)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[12px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)] disabled:pointer-events-none disabled:opacity-35"
              >
                {next?.name ?? 'End'} <ChevronRight size={13} />
              </button>
            </div>
          </footer>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
