import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AtlasShell } from '@/components/AtlasShell';
import { getAllStageDetails } from '@/lib/data/repository';
import { STAGES, getStage } from '@/lib/data/stages';

export const revalidate = 3600;

/** Pre-render all ten stages — the set is fixed and tiny. */
export function generateStaticParams() {
  return STAGES.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const stage = getStage(slug);
  if (!stage) return { title: 'Stage not found — Teapot' };

  const title = `${stage.name} — Tea Pipeline Research Atlas`;
  const description = `${stage.tagline}. ${stage.aiSummary.slice(0, 155)}…`;

  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
    alternates: { canonical: `/stage/${stage.slug}` },
  };
}

export default async function StagePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!getStage(slug)) notFound();

  const details = await getAllStageDetails();
  return <AtlasShell details={details} initialStage={slug} />;
}
