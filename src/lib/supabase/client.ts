import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { safeStoragePath } from '@/lib/safeUrl';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when Supabase credentials are present. When false the app falls back to
 * the bundled seed corpus, so the site is fully functional before any backend
 * exists — which also means a Vercel deploy works on the first push.
 */
export const isSupabaseConfigured = Boolean(url && anonKey);

let cached: SupabaseClient | null = null;

/**
 * Anonymous, read-only Supabase client. Row-level security in
 * `supabase/migrations/0001_init.sql` restricts the anon role to SELECT, so
 * shipping this key to the browser is safe by design — writes require the
 * service-role key, which stays server-side in the seed script.
 */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  cached ??= createClient(url!, anonKey!, {
    auth: { persistSession: false },
  });
  return cached;
}

/**
 * Public URL for a PDF stored in the `research-pdfs` bucket. `pdf_path` is a
 * DB-editable value interpolated into a URL, so it is validated as a plain
 * object key first — see `safeStoragePath`.
 */
export function pdfPublicUrl(path: string): string | null {
  const client = getSupabase();
  if (!client) return null;
  const key = safeStoragePath(path);
  if (!key) return null;
  return client.storage.from('research-pdfs').getPublicUrl(key).data.publicUrl;
}
