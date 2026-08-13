'use client';

import { create } from 'zustand';
import { STAGES } from '@/lib/data/stages';

type Quality = 'high' | 'low';

interface AtlasState {
  /** Slug of the stage whose drawer is open, or null for the overview. */
  selected: string | null;
  /** Slug under the cursor — drives the 3D hover lift and label emphasis. */
  hovered: string | null;
  searchOpen: boolean;
  /** Set once on mount from device capability; gates shadows and instance counts. */
  quality: Quality;
  /** True while the user is dragging the camera, so the rig yields control. */
  orbiting: boolean;

  select: (slug: string | null) => void;
  hover: (slug: string | null) => void;
  step: (delta: number) => void;
  setSearchOpen: (open: boolean) => void;
  setQuality: (q: Quality) => void;
  setOrbiting: (v: boolean) => void;
}

export const useAtlas = create<AtlasState>((set, get) => ({
  selected: null,
  hovered: null,
  searchOpen: false,
  quality: 'high',
  orbiting: false,

  select: (slug) => set({ selected: slug, hovered: null }),
  hover: (slug) => set({ hovered: slug }),

  /** Move to the previous/next stage, clamped at both ends of the pipeline. */
  step: (delta) => {
    const { selected } = get();
    const i = selected ? STAGES.findIndex((s) => s.slug === selected) : -1;
    const next = Math.min(STAGES.length - 1, Math.max(0, i + delta));
    set({ selected: STAGES[next].slug, hovered: null });
  },

  setSearchOpen: (searchOpen) => set({ searchOpen }),
  setQuality: (quality) => set({ quality }),
  setOrbiting: (orbiting) => set({ orbiting }),
}));
