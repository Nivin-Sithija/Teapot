'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Leaf, Moon, Sun } from 'lucide-react';
import { StageRail } from './StageRail';

/** Small persistent brand mark, linking back to the atlas — mirrors the paper-detail header. */
export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Leaf size={16} className="text-[var(--color-leaf)]" aria-hidden />
      <span className="text-[15px] font-semibold text-[var(--color-ink)]">Teapot</span>
    </Link>
  );
}

const backButtonClass =
  'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12.5px] text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]';

export function BackButton({ href, label = 'Back' }: { href?: string; label?: string }) {
  const router = useRouter();

  if (href) {
    return (
      <Link href={href} className={backButtonClass}>
        <ArrowLeft size={13} aria-hidden /> {label}
      </Link>
    );
  }

  return (
    <button onClick={() => router.back()} className={backButtonClass}>
      <ArrowLeft size={13} aria-hidden /> {label}
    </button>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('atlas-theme');
    if (stored === 'light') {
      setDark(false);
      document.documentElement.dataset.theme = 'light';
    } else {
      setDark(true);
      document.documentElement.dataset.theme = 'dark';
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    localStorage.setItem('atlas-theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      aria-label="Toggle colour theme"
      className="grid h-8 w-8 place-items-center rounded-full text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]"
    >
      {dark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center px-4 first:pl-0 last:pr-0">
      <span className="font-display text-[20px] leading-none font-bold text-[var(--color-ink)] sm:text-[24px]">
        {value}
      </span>
      <span className="mt-1 text-[10px] font-semibold tracking-[0.14em] text-[var(--color-faint)] uppercase">
        {label}
      </span>
    </div>
  );
}

export function TopBar({ counts }: { counts: { papers: number; datasets: number } }) {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex flex-col items-center gap-3 px-4 pt-6 pb-3 text-center">
      {/* Scrim: fades the scene behind the masthead so it stays legible over
          whatever the 3D scene happens to render underneath — a soft wash
          instead of a hard-edged box. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-gradient-to-b from-[var(--color-paper)] via-[var(--color-paper)]/75 to-transparent sm:h-64" />

      <div className="pointer-events-auto absolute top-4 left-4">
        <Logo />
      </div>

      <div className="pointer-events-auto absolute top-4 right-4 flex items-center gap-1">
        <BackButton />
        <ThemeToggle />
      </div>

      <Link
        href="/repository"
        className="group pointer-events-auto fixed right-4 bottom-16 z-30 flex items-center gap-1.5 rounded-full border-2 border-[var(--color-ink)] px-3.5 py-2 text-[13px] font-semibold text-[var(--color-ink)] transition-colors hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] sm:right-8 sm:bottom-24 sm:gap-2.5 sm:px-7 sm:py-3.5 sm:text-[24px] lg:right-12 lg:text-[30px]"
      >
        Research
        <ArrowRight
          className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 sm:h-6 sm:w-6 lg:h-7 lg:w-7"
          aria-hidden
        />
      </Link>

      <p className="pointer-events-none fixed bottom-16 left-4 z-20 hidden max-w-[220px] text-[11.5px] leading-relaxed text-[var(--color-faint)] sm:block sm:bottom-24 sm:left-6 sm:max-w-[340px]">
        Not every stage is fully documented yet — this atlas is still in development, and papers are going through an
        ongoing validation process.
      </p>

      <h1
        className="font-display text-[26px] leading-tight font-bold tracking-tight text-[var(--color-ink)] sm:text-[38px] lg:text-[44px]"
        style={{ fontVariationSettings: '"SOFT" 40, "WONK" 1' }}
      >
        TEAPOT 
      </h1>

      <div className="pointer-events-auto flex items-stretch divide-x divide-[var(--color-line)]">
        <Stat value={counts.papers} label="Papers" />
        <Stat value={counts.datasets} label="Datasets" />
        <Stat value={10} label="Stages" />
      </div>

      <div className="mt-1">
        <StageRail />
      </div>
    </header>
  );
}
