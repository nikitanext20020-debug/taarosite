import { notFound } from 'next/navigation';
import { SPREAD_BY_ID, SPREADS } from '@/lib/tarot/spreads';
import DivineClient from './DivineClient';

export function generateStaticParams() {
  return SPREADS.map((s) => ({ spreadId: s.id }));
}

export default async function DivinePage({
  params,
}: {
  params: { spreadId: string };
}) {
  const spread = SPREAD_BY_ID.get(params.spreadId);
  if (!spread) notFound();

  return <DivineClient spread={spread} />;
}
