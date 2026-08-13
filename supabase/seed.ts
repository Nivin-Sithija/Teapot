/**
 * Pushes the bundled research corpus into Supabase, and uploads any PDFs found
 * in `research/pdfs/` to the `research-pdfs` storage bucket.
 *
 *   npm run db:seed            upsert corpus + upload PDFs
 *   npm run db:seed -- --reset delete all rows first, then upsert
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY — this bypasses RLS, so it must never be
 * exposed to the browser or committed. Run it locally or from CI only.
 */

import { createClient } from '@supabase/supabase-js';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

import { PAPERS } from '../src/lib/data/seed/papers';
import { DATASETS } from '../src/lib/data/seed/datasets';
import { OPPORTUNITIES } from '../src/lib/data/seed/opportunities';
import { computeEdges } from '../src/lib/data/edges';

/**
 * Minimal .env.local reader. Next loads these automatically for the app, but a
 * bare `tsx` process does not — and a one-file parser beats another dependency
 * for a handful of keys. Real environment variables always win, so CI can
 * override without touching the file.
 */
function loadEnvLocal() {
  const path = join(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/.exec(line);
    if (!match || line.trimStart().startsWith('#')) continue;
    const [, key, raw = ''] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = raw.trim().replace(/^(['"])(.*)\1$/, '$2');
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    '\n  Missing credentials.\n\n' +
      '  Set these in .env.local (see .env.example):\n' +
      '    NEXT_PUBLIC_SUPABASE_URL\n' +
      '    SUPABASE_SERVICE_ROLE_KEY   (Project Settings → API → service_role)\n',
  );
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });
const reset = process.argv.includes('--reset');

/** camelCase (TypeScript) → snake_case (Postgres). */
function snake(obj: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`), v]),
  );
}

async function upsert(table: string, rows: readonly object[]) {
  if (reset) {
    // `neq id ''` matches every row; Supabase requires a filter on delete.
    const { error } = await db.from(table).delete().neq('id', '');
    if (error) throw new Error(`clearing ${table}: ${error.message}`);
  }

  const payload = rows.map(snake);
  const { error } = await db.from(table).upsert(payload, { onConflict: 'id' });
  if (error) throw new Error(`seeding ${table}: ${error.message}`);

  console.log(`  ✓ ${table.padEnd(17)} ${rows.length} rows`);
}

/**
 * Recomputes the research graph from the current papers + datasets and
 * replaces `research_edges` wholesale. Unlike `upsert`, this never leaves
 * stale rows: edges are a pure function of the corpus, so a tag or modality
 * match that no longer holds must disappear on every run, not just `--reset`.
 */
async function seedEdges() {
  const edges = computeEdges(PAPERS, DATASETS).map((e) => ({
    id: `${e.stageSlug}:${e.sourceKind}:${e.sourceId}:${e.targetKind}:${e.targetId}`,
    ...e,
  }));

  const { error: delError } = await db.from('research_edges').delete().neq('id', '');
  if (delError) throw new Error(`clearing research_edges: ${delError.message}`);

  if (edges.length > 0) {
    const { error } = await db.from('research_edges').insert(edges.map(snake));
    if (error) throw new Error(`seeding research_edges: ${error.message}`);
  }

  console.log(`  ✓ ${'research_edges'.padEnd(17)} ${edges.length} rows`);
}

/**
 * Uploads `research/pdfs/*.pdf` to storage. Filenames are used verbatim as
 * object paths, so setting `pdfPath: 'my-paper.pdf'` on a Paper is enough to
 * make the PDF link appear on its card.
 */
async function uploadPdfs() {
  const dir = join(process.cwd(), 'research', 'pdfs');
  if (!existsSync(dir)) {
    console.log('  – research/pdfs/ not present, skipping PDF upload');
    return;
  }

  const files = (await readdir(dir)).filter((f) => f.toLowerCase().endsWith('.pdf'));
  if (files.length === 0) {
    console.log('  – no PDFs in research/pdfs/');
    return;
  }

  for (const file of files) {
    const body = await readFile(join(dir, file));
    const { error } = await db.storage.from('research-pdfs').upload(file, body, {
      contentType: 'application/pdf',
      upsert: true,
    });
    if (error) {
      console.warn(`  ! ${file}: ${error.message}`);
      continue;
    }
    console.log(`  ✓ uploaded ${file}`);
  }
}

async function main() {
  console.log(`\n  Seeding ${url}${reset ? ' (reset)' : ''}\n`);

  await upsert('papers', PAPERS);
  await upsert('datasets', DATASETS);
  await upsert('ai_opportunities', OPPORTUNITIES);
  await seedEdges();

  console.log('');
  await uploadPdfs();

  console.log('\n  Done.\n');
}

main().catch((err) => {
  console.error(`\n  Failed: ${err instanceof Error ? err.message : err}\n`);
  process.exit(1);
});
