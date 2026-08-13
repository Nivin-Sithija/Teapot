'use client';

import { useCallback, useState } from 'react';

const STORAGE_PREFIX = 'atlas-notes-';

function readNotes(paperId: string): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + paperId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotes(paperId: string, notes: string[]) {
  try {
    if (notes.length === 0) {
      localStorage.removeItem(STORAGE_PREFIX + paperId);
    } else {
      localStorage.setItem(STORAGE_PREFIX + paperId, JSON.stringify(notes));
    }
  } catch {
    // localStorage may be full or unavailable
  }
}

/**
 * Per-paper notes backed by localStorage.
 *
 * Each paper gets an independent array of strings keyed by its ID.
 * Calling add/remove triggers a React re-render so the UI stays in step.
 */
export function useNotes(paperId: string | null) {
  const [notes, setNotes] = useState<string[]>(() => (paperId ? readNotes(paperId) : []));

  // Re-sync when paperId changes
  const syncNotes = useCallback(
    (id: string | null) => {
      setNotes(id ? readNotes(id) : []);
    },
    [],
  );

  const addNote = useCallback(
    (text: string) => {
      if (!paperId || !text.trim()) return;
      const updated = [...readNotes(paperId), text.trim()];
      writeNotes(paperId, updated);
      setNotes(updated);
    },
    [paperId],
  );

  const deleteNote = useCallback(
    (index: number) => {
      if (!paperId) return;
      const current = readNotes(paperId);
      const updated = current.filter((_, i) => i !== index);
      writeNotes(paperId, updated);
      setNotes(updated);
    },
    [paperId],
  );

  return { notes, addNote, deleteNote, syncNotes };
}
