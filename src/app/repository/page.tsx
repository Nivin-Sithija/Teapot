import type { Metadata } from 'next';
import { RepositoryShell } from '@/components/RepositoryShell';
import { getDatasets, getPapers } from '@/lib/data/repository';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Research & Dataset Repository — Teapot',
  description:
    'Search and filter every paper and dataset behind the ten stages of the tea pipeline, by stage, year, tags, source tier and local/global origin.',
};

export default async function RepositoryPage() {
  const [papers, datasets] = await Promise.all([getPapers(), getDatasets()]);
  return <RepositoryShell papers={papers} datasets={datasets} />;
}
