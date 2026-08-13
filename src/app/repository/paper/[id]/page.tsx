import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PaperDetail } from '@/components/PaperDetail';
import { getPaperById } from '@/lib/data/repository';
import { getStage } from '@/lib/data/stages';

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const paper = await getPaperById(id);
  if (!paper) return { title: 'Paper not found — Teapot' };

  const title = `${paper.title} — Teapot`;
  const description = paper.finding ?? [paper.authors, paper.venue, paper.year].filter(Boolean).join(' · ');

  return {
    title,
    description,
    openGraph: { title, description, type: 'article' },
  };
}

export default async function PaperPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const paper = await getPaperById(id);
  if (!paper) notFound();

  const stage = getStage(paper.stageSlug);
  return <PaperDetail paper={paper} stage={stage} />;
}
