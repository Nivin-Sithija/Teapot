import { AtlasShell } from '@/components/AtlasShell';
import { getAllStageDetails } from '@/lib/data/repository';

// Content changes only when the corpus does; revalidate hourly so Supabase
// edits appear without a redeploy.
export const revalidate = 3600;

export default async function Home() {
  const details = await getAllStageDetails();
  return <AtlasShell details={details} />;
}
