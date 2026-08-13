'use client';

import { useEffect, useState } from 'react';

/** Personal scratch notes for a paper — kept in this browser only, no account needed. */
export function PaperNotes({ paperId }: { paperId: string }) {
  const storageKey = `teapot-notes:${paperId}`;
  const [notes, setNotes] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setNotes(localStorage.getItem(storageKey) ?? '');
    setLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!loaded) return;
    const id = setTimeout(() => {
      if (notes) localStorage.setItem(storageKey, notes);
      else localStorage.removeItem(storageKey);
    }, 300);
    return () => clearTimeout(id);
  }, [notes, storageKey, loaded]);

  // A ruled-paper feel: horizontal lines that scroll with the typed text,
  // spaced to match the textarea's line-height exactly.
  const LINE = 28;

  return (
    <div className="flex h-full flex-col">
      <h2 className="eyebrow mb-3 shrink-0">Notes</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Jot down your own notes on this paper…"
        className="w-full min-h-[420px] flex-1 resize-none rounded-xl border border-[var(--color-line)] p-3.5 text-[13.5px] text-[var(--color-ink)] placeholder:text-[var(--color-faint)] focus:border-[var(--color-amber)] focus:outline-none"
        style={{
          lineHeight: `${LINE}px`,
          backgroundColor: 'var(--color-surface)',
          backgroundAttachment: 'local',
          backgroundImage: `repeating-linear-gradient(to bottom, transparent, transparent ${LINE - 1}px, var(--color-line) ${LINE - 1}px, var(--color-line) ${LINE}px)`,
          backgroundPosition: '0 2px',
        }}
      />
      <p className="mt-2 shrink-0 text-[11px] text-[var(--color-faint)]">Saved on this device only.</p>
    </div>
  );
}
