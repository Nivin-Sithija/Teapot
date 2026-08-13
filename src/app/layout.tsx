import type { Metadata, Viewport } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  axes: ['SOFT', 'WONK'],
});

export const metadata: Metadata = {
  title: 'Teapot — Tea Pipeline Research Atlas',
  description:
    'An interactive 3D atlas of the ten stages of tea manufacture, mapping where AI and machine learning apply at each step, with the research papers and datasets behind them.',
  keywords: [
    'tea',
    'machine learning',
    'computer vision',
    'tea quality',
    'withering',
    'fermentation',
    'agriculture AI',
    'research atlas',
  ],
  openGraph: {
    title: 'Teapot — Tea Pipeline Research Atlas',
    description:
      'Ten stages of tea manufacture in 3D, each linked to the AI/ML research and datasets that apply to it.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f5f3ea' },
    { media: '(prefers-color-scheme: dark)', color: '#131a15' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Applied before paint so a stored theme preference doesn't flash the
          opposite palette on load.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('atlas-theme');document.documentElement.dataset.theme=t==='light'?'light':'dark'}catch(e){document.documentElement.dataset.theme='dark'}`,
          }}
        />
      </head>
      <body className={`${inter.variable} ${fraunces.variable}`}>{children}</body>
    </html>
  );
}
