import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Origin of the Supabase project, when one is configured. Only the origin is
 * used — never the key — so the CSP names exactly one backend host instead of
 * allowing `*.supabase.co` wholesale.
 */
const supabaseOrigin = (() => {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
})();

/**
 * Content-Security-Policy.
 *
 * `script-src` keeps `'unsafe-inline'` deliberately: Next streams the RSC
 * payload through inline `<script>` tags whose content changes per request,
 * and the pre-paint theme script in `app/layout.tsx` is inline by necessity
 * (a deferred file would flash the wrong palette). Locking these down needs
 * per-request nonces from middleware, which would opt every route out of the
 * ISR caching that `export const revalidate` buys us — a bad trade for a
 * public, read-only site with no authenticated session to steal. The rest of
 * the policy is strict, and `object-src`/`base-uri`/`frame-ancestors` still
 * close the injection paths that matter most.
 */
const csp = [
  `default-src 'self'`,
  // 'unsafe-eval' is dev-only: the Next dev overlay and HMR runtime need it.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  // Tailwind emits static CSS, but React inline `style` props (stage colours,
  // transforms from framer-motion) are attribute styles, hence unsafe-inline.
  `style-src 'self' 'unsafe-inline'`,
  // next/font self-hosts Inter and Fraunces at build time — no Google origin.
  `font-src 'self' data:`,
  // blob: covers canvas/texture readback from the three.js scene.
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ''}`,
  `media-src 'self'`,
  // drei instantiates loader workers from blob URLs.
  `worker-src 'self' blob:`,
  `connect-src 'self'${supabaseOrigin ? ` ${supabaseOrigin}` : ''}${isDev ? ' ws: http://localhost:*' : ''}`,
  `frame-ancestors 'none'`,
  `form-action 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  // Legacy companion to frame-ancestors, for browsers that predate CSP3.
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // No route asks for any of these; deny them so an injected script cannot.
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  // Isolates our browsing context from windows we open with target=_blank.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // Two years, matching the hstspreload.org submission requirement.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Don't advertise the framework version to scanners.
  poweredByHeader: false,
  // three ships untranspiled ESM in a few subpaths; keep the transform explicit
  // so the Vercel build and local dev agree.
  transpilePackages: ['three'],
  experimental: {
    // Pull only the icons actually imported instead of the whole lucide barrel.
    optimizePackageImports: ['lucide-react', '@react-three/drei'],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
