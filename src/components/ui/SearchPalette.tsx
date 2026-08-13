'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Database, ExternalLink, Layers, Lightbulb, Search, FileText } from 'lucide-react';
import clsx from 'clsx';
import type { SearchHit } from '@/lib/types';
import { STAGE_BY_SLUG } from '@/lib/data/stages';
import { useAtlas } from '@/lib/store';

const ICONS = {
  stage: Layers,
  opportunity: Lightbulb,
  paper: FileText,
  dataset: Database,
} as const;

const KIND_LABEL = {
  stage: 'Stage',
  opportunity: 'AI opportunity',
  paper: 'Paper',
  dataset: 'Dataset',
} as const;

/** Case-insensitive substring scoring: title matches rank above subtitle matches. */
function score(hit: SearchHit, q: string): number {
  const title = hit.title.toLowerCase();
  const sub = (hit.subtitle ?? '').toLowerCase();
  if (title.startsWith(q)) return 3;
  if (title.includes(q)) return 2;
  if (sub.includes(q)) return 1;
  return 0;
}

/**
 * ⌘K palette over every paper, dataset, opportunity and stage in the corpus.
 *
 * Deliberately a plain substring ranker rather than a fuzzy-search dependency —
 * the index is a few hundred rows, and filtering it is not worth another package.
 */
export function SearchPalette({ index }: { index: SearchHit[] }) {
  const open = useAtlas((s) => s.searchOpen);
  const setOpen = useAtlas((s) => s.setSearchOpen);
  const select = useAtlas((s) => s.select);

  const [q, setQ] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQ('');
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return index.filter((h) => h.kind === 'stage');
    return index
      .map((h) => ({ h, s: score(h, needle) }))
      .filter(({ s }) => s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 40)
      .map(({ h }) => h);
  }, [index, q]);

  useEffect(() => setCursor(0), [q]);

  // Keep the highlighted row in view as the cursor moves through a long list.
  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor]);

  const commit = (hit: SearchHit) => {
    select(hit.stageSlug);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    }
    if (e.key === 'Enter' && results[cursor]) {
      e.preventDefault();
      commit(results[cursor]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-[rgb(20_30_24/0.35)] px-4 pt-[12vh] backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={() => setOpen(false)}
        >
          <motion.div
            className="card w-full max-w-xl overflow-hidden p-0"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Search the research corpus"
          >
            <div className="flex items-center gap-2.5 border-b border-[var(--color-line)] px-4 py-3">
              <Search size={16} className="shrink-0 text-[var(--color-faint)]" aria-hidden />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search papers, datasets, techniques…"
                className="w-full bg-transparent text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-faint)] focus:outline-none"
              />
              <kbd className="shrink-0 rounded border border-[var(--color-line)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--color-faint)]">
                esc
              </kbd>
            </div>

            <div ref={listRef} className="scroll-thin max-h-[52vh] overflow-y-auto p-1.5">
              {results.length === 0 && (
                <p className="px-3 py-8 text-center text-[13px] text-[var(--color-muted)]">
                  Nothing matches “{q}”.
                </p>
              )}
              {results.map((hit, i) => {
                const Icon = ICONS[hit.kind];
                const stage = STAGE_BY_SLUG.get(hit.stageSlug);
                return (
                  <button
                    key={`${hit.kind}-${hit.id}`}
                    data-active={i === cursor}
                    onMouseEnter={() => setCursor(i)}
                    onClick={() => commit(hit)}
                    className={clsx(
                      'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                      i === cursor && 'bg-[var(--color-surface-2)]',
                    )}
                  >
                    <Icon size={14} className="mt-0.5 shrink-0 text-[var(--color-faint)]" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="line-clamp-2 block text-[13px] leading-snug font-medium text-[var(--color-ink)]">
                        {hit.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11.5px] text-[var(--color-faint)]">
                        {stage && (
                          <span className="inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: stage.color }} />
                            {stage.name}
                          </span>
                        )}
                        <span>·</span>
                        <span>{KIND_LABEL[hit.kind]}</span>
                        {hit.subtitle && (
                          <>
                            <span>·</span>
                            <span className="truncate">{hit.subtitle}</span>
                          </>
                        )}
                      </span>
                    </span>
                    {hit.url && (
                      <ExternalLink size={12} className="mt-1 shrink-0 text-[var(--color-faint)]" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
