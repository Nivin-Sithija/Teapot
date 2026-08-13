'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Leaf } from 'lucide-react';
import type { StageDetail } from '@/lib/types';
import { useAtlas } from '@/lib/store';
import { TopBar } from './ui/TopBar';
import { StageRailMobile } from './ui/StageRail';
import { StageDrawer } from './ui/StageDrawer';

/**
 * three.js has no business running on the server, and pulling it out of the SSR
 * bundle keeps the first paint to the shell alone.
 */
const TeaAtlas = dynamic(() => import('./scene/TeaAtlas').then((m) => m.TeaAtlas), {
  ssr: false,
  loading: () => <SceneLoading />,
});

function SceneLoading() {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <div className="flex flex-col items-center gap-3">
        <Leaf size={22} className="animate-pulse text-[var(--color-leaf)]" aria-hidden />
        <p className="text-[12.5px] text-[var(--color-muted)]">Growing the plantation…</p>
      </div>
    </div>
  );
}

function Hint() {
  const selected = useAtlas((s) => s.selected);
  if (selected) return null;
  return (
    <p className="pointer-events-none fixed inset-x-0 bottom-20 z-10 hidden text-center text-[12.5px] text-[var(--color-faint)] lg:block">
      Click any stage to inspect it · drag to orbit · scroll to zoom
    </p>
  );
}

export function AtlasShell({
  details,
  initialStage,
}: {
  details: Record<string, StageDetail>;
  initialStage?: string;
}) {
  const select = useAtlas((s) => s.select);
  const selected = useAtlas((s) => s.selected);

  // Apply a deep-linked stage once on mount.
  useEffect(() => {
    if (initialStage) select(initialStage);
  }, [initialStage, select]);

  // Keep the address bar in step with the selection without a navigation, so
  // every stage is shareable and the back button behaves.
  useEffect(() => {
    const url = selected ? `/stage/${selected}` : '/';
    if (window.location.pathname !== url) {
      window.history.replaceState(null, '', url);
    }
  }, [selected]);

  const counts = {
    papers: Object.values(details).reduce((n, d) => n + d.papers.length, 0),
    datasets: Object.values(details).reduce((n, d) => n + d.datasets.length, 0),
  };

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <TeaAtlas />
      <TopBar counts={counts} />
      <Hint />
      <StageRailMobile />
      <StageDrawer details={details} />
    </main>
  );
}
