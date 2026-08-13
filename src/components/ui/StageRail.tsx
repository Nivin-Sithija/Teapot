'use client';

import clsx from 'clsx';
import { STAGES } from '@/lib/data/stages';
import { useAtlas } from '@/lib/store';

/**
 * Stage stepper, shown inline under the masthead.
 *
 * Each stage is represented by a numbered badge + name + tagline — replacing
 * the old coloured dots. Core research stages are marked with a small amber
 * indicator dot. Unboxed — no card, no fixed positioning — the caller places it.
 */
export function StageRail() {
  const selected = useAtlas((s) => s.selected);
  const hovered = useAtlas((s) => s.hovered);
  const select = useAtlas((s) => s.select);
  const hover = useAtlas((s) => s.hover);

  return (
    <div className="pointer-events-auto hidden flex-wrap items-center justify-center gap-0.5 lg:flex">
      {STAGES.map((stage) => {
        const active = selected === stage.slug;
        const warm = hovered === stage.slug;
        return (
          <button
            key={stage.slug}
            onClick={() => select(active ? null : stage.slug)}
            onMouseEnter={() => hover(stage.slug)}
            onMouseLeave={() => hover(null)}
            title={`${stage.index}. ${stage.name} — ${stage.tagline}`}
            className={clsx(
              'group relative flex items-center gap-1.5 rounded-full px-2.5 py-1.5 transition-colors',
              active ? 'bg-[var(--color-surface-2)]' : 'hover:bg-[var(--color-surface-2)]',
            )}
          >
            <span
              className={clsx(
                'grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white transition-transform',
                (active || warm) && 'scale-110',
              )}
              style={{ background: stage.color }}
            >
              {stage.index}
            </span>
            <span
              className={clsx(
                'text-[12px] font-medium whitespace-nowrap transition-colors',
                active ? 'text-[var(--color-ink)]' : 'text-[var(--color-muted)]',
              )}
            >
              {stage.name}
            </span>
            {stage.researchDepth === 'core' && (
              <span
                title="Backed by a full research document"
                className="h-1 w-1 rounded-full bg-[var(--color-amber)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Compact horizontal scroller shown instead of the rail on small screens. */
export function StageRailMobile() {
  const selected = useAtlas((s) => s.selected);
  const select = useAtlas((s) => s.select);

  return (
    <div className="scroll-thin pointer-events-auto fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t border-[var(--color-line)] bg-[var(--color-surface)] px-2 py-1.5 sm:gap-1.5 sm:px-3 sm:py-2 lg:hidden">
      {STAGES.map((stage) => (
        <button
          key={stage.slug}
          onClick={() => select(selected === stage.slug ? null : stage.slug)}
          className={clsx(
            'flex shrink-0 items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium whitespace-nowrap transition-colors sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-[12px]',
            selected === stage.slug
              ? 'border-[var(--color-line)] bg-[var(--color-surface-2)] text-[var(--color-ink)]'
              : 'border-transparent text-[var(--color-muted)]',
          )}
        >
          <span
            className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full text-[8px] font-bold text-white sm:h-4 sm:w-4 sm:text-[9px]"
            style={{ background: stage.color }}
          >
            {stage.index}
          </span>
          {stage.name}
        </button>
      ))}
    </div>
  );
}
