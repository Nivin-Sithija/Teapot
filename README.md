# Teapot — Tea Pipeline Research Atlas

An interactive 3D atlas of the ten stages of tea manufacture, mapping where AI
and machine learning apply at each step, with the research papers and datasets
behind them.

Two surfaces:

- **`/`** — the 3D journey. Ten stage platforms along a path; click one to open
  a drawer with what physically happens, where ML fits, and the evidence.
- **`/repository`** — the finder. Every paper and dataset in one filterable
  table (stage, year, tags, source tier, local/global scope), with a detail
  page per paper at `/repository/paper/[id]`.

Long-form research write-ups live in [`research/`](research/) as Markdown.

## Stack

| Layer    | Choice                                                       |
| -------- | ------------------------------------------------------------ |
| Frontend | Next.js 15 (App Router, RSC) · React 19 · TypeScript          |
| 3D       | three.js · @react-three/fiber · @react-three/drei             |
| Styling  | Tailwind CSS v4 · framer-motion                               |
| State    | zustand                                                       |
| Backend  | Supabase (Postgres + Storage) — **optional**                  |
| Hosting  | Vercel (frontend) · Supabase (backend)                        |

## Quick start

```bash
nvm use            # Node 20+
npm ci
npm run dev        # http://localhost:3000
```

No environment variables are needed to run the site. With Supabase unset, all
content is served from the bundled corpus in `src/lib/data/seed/`.

## Scripts

| Script              | What it does                                          |
| ------------------- | ----------------------------------------------------- |
| `npm run dev`       | Dev server                                            |
| `npm run build`     | Production build                                      |
| `npm start`         | Serve the production build                            |
| `npm run typecheck` | `tsc --noEmit`                                        |
| `npm run lint`      | ESLint (flat config)                                  |
| `npm run db:seed`   | Push the seed corpus + `research/pdfs/` into Supabase |
| `npm run db:reset`  | Same, but truncates the tables first                  |

## Architecture

### Content has two sources, one shape

`src/lib/data/repository.ts` is the only data-access surface. Every read tries
Supabase first and falls back to the bundled seed corpus — including when a
query *errors*, so a backend outage degrades to stale-but-correct content
rather than an empty page. Both paths return the same types from
`src/lib/types.ts`, and `npm run db:seed` pushes the seed corpus into Postgres,
so the two cannot drift in content, only in freshness.

Practical consequence: **the first Vercel deploy works before Supabase
exists.** Wire the backend up whenever you want the corpus editable without a
redeploy.

### What lives where

- **Stage definitions** stay in code (`src/lib/data/stages.ts`) — they carry 3D
  world positions and palette values that belong with the scene, and the set is
  fixed at ten.
- **Research content** (papers, datasets, AI opportunities, graph edges) is the
  part that grows, so it is what Postgres stores.

Pages use ISR (`export const revalidate = 3600`), so Supabase edits appear
within the hour without a redeploy.

## Backend setup (Supabase)

Optional. Skip it and the site runs off the bundled corpus.

1. Create a project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) →
   **Run**. This creates the four tables, their indexes, RLS policies, and the
   public `research-pdfs` storage bucket.
3. Copy `.env.example` to `.env.local` and fill in all three values from
   **Project Settings → API**.
4. Seed it:

   ```bash
   npm run db:seed          # upsert corpus + upload research/pdfs/*.pdf
   npm run db:seed -- --reset   # truncate first
   ```

5. Add **only** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   to Vercel. The service-role key never leaves your machine.

## Frontend deploy (Vercel)

1. **Add New → Project** → import this repository.
2. Framework preset: **Next.js**. The defaults are correct; no build-command
   override is needed.
3. Environment variables (Settings → Environment Variables), if using Supabase:

   | Name                            | Value               | Environments |
   | ------------------------------- | ------------------- | ------------ |
   | `NEXT_PUBLIC_SUPABASE_URL`      | Project URL         | All          |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / public key   | All          |

   > Never add `SUPABASE_SERVICE_ROLE_KEY` to Vercel. It bypasses RLS and is
   > only needed by the local seed script.

4. Deploy. Pushes to `main` ship to production; every other branch gets a
   preview URL.

Note that `NEXT_PUBLIC_SUPABASE_URL` is read at build time to pin the Supabase
origin in the Content-Security-Policy, so **changing it requires a redeploy**,
not just an env-var save.

## Security posture

This is a public, read-only site with no accounts, no sessions, and no user
data. The controls in place reflect that shape:

- **RLS on every table.** `SELECT` is granted to `anon`; no `INSERT`/`UPDATE`/
  `DELETE` policy exists, so those are denied. That is what makes shipping the
  anon key to the browser safe — writes require the service-role key, which
  bypasses RLS and stays server-side in the seed script.
- **URL allow-listing.** Paper and dataset URLs are editable in Postgres
  without code review, so every DB-sourced value that reaches an `href`,
  `window.open`, or a storage path is filtered through `src/lib/safeUrl.ts`.
  Only `http:`/`https:` and same-origin relative links survive; `javascript:`,
  `data:`, and protocol-relative values are dropped. React escapes text, but it
  does nothing about link schemes.
- **Security headers** are set for all routes in `next.config.ts`: a CSP,
  `X-Frame-Options: DENY`, `nosniff`, `strict-origin-when-cross-origin`
  referrer policy, a deny-all `Permissions-Policy`, `COOP: same-origin`, and
  HSTS. `X-Powered-By` is suppressed.
- **`rel="noopener noreferrer"`** on every `target="_blank"` link.
- **No secrets in the repo.** `.env*` files are gitignored; `.env.example`
  documents the three variables without values.

### CSP caveat

`script-src` keeps `'unsafe-inline'`. Next streams the RSC payload through
inline `<script>` tags whose content changes per request, and the pre-paint
theme script in `src/app/layout.tsx` must be inline to avoid a palette flash.
Removing it requires per-request nonces from middleware, which would opt every
route out of the ISR caching above. For a site with no authenticated session to
steal, that trade isn't worth it — `object-src 'none'`, `base-uri 'self'`, and
`frame-ancestors 'none'` still close the paths that matter most here.

### Known advisories

`npm audit` reports three high-severity advisories inherited transitively from
Next.js 15:

- **postcss** — `sourceMappingURL` can read arbitrary `.map` files. Build-time
  only, and this project's CSS is not attacker-supplied.
- **sharp / libvips** (2 advisories) — reached through `next/image`, which this
  project does not use. Vercel also performs image optimization on its own
  infrastructure rather than through the bundled `sharp`.

Neither path is reachable at runtime here. The fix upstream is Next.js 16, a
major upgrade deliberately deferred. CI runs `npm audit` as an advisory step
that reports without gating merges; Dependabot opens weekly PRs.

## Repository layout

```
src/
  app/                 App Router pages (/, /stage/[slug], /repository, …)
  components/
    scene/             three.js scene: atlas, stage nodes, dioramas, camera rig
    ui/                drawer, rail, cards, search palette, research graph
  lib/
    data/              data access + seed corpus + stage definitions
    safeUrl.ts         URL/scheme allow-listing for DB-sourced content
    supabase/client.ts anon read-only client
supabase/
  migrations/          schema, RLS policies, storage bucket
  seed.ts              corpus + PDF uploader (service-role key)
research/              long-form Markdown write-ups per stage
```

## License

[MIT](LICENSE)
