/* A suggestion and its evidence: proposed, applied, blocked by the gate, or
   closed (declined, replaced, withdrawn, not needed). Builder D. */
import { useLocalSearchParams } from 'expo-router';

import { AcceptedView, BlockedView, ClosedView, NotFound, ProposedView } from '@/features/training/recommendation';
import { S, useApp } from '@/store';

export default function RecommendationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useApp();
  const rec = id ? S.recommendation(s, String(id)) : null;
  if (!rec) return <NotFound />;
  if (rec.status === 'proposed') return <ProposedView s={s} rec={rec} />;
  if (rec.status === 'accepted') return <AcceptedView s={s} rec={rec} />;
  if (/^blocked_/.test(rec.status)) return <BlockedView s={s} rec={rec} />;
  return <ClosedView rec={rec} />;
}
