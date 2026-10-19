/* The evidence library (builder E), ported from prototype/src/87-evidence.js:
   every claim the app could act on, its status and the studies behind it,
   bundled with the app (src/shared). The citation cards are the ones the
   suggestion screens use (src/features/training/evidence.tsx, read-only here),
   so a study looks the same wherever it's cited. */
import { View } from 'react-native';

import { plural } from '@/features/shared';
import { data as D, domain as M, type Claim, type Source } from '@/shared';
import { Badge } from '@/ui';

export { CitationCard, ClaimCard, isoDate } from '@/features/training/evidence';

export const AREAS = [
  { key: 'training', title: 'Training' },
  { key: 'recovery', title: 'Recovery' },
  { key: 'measurement', title: 'Wearables' },
  { key: 'nutrition', title: 'Nutrition' }
];

export const allClaims = (): Claim[] => D.CLAIMS || [];
export const allSources = (): Source[] => D.SOURCES || [];
export const claimFor = (key: string | undefined) => (key ? allClaims().find((c) => c.key === key) || null : null);
const sourceById = (id: string): Source | null => allSources().find((s) => s.id === id) || null;
export const sourcesOf = (ids: string[] | undefined) => (ids || []).map(sourceById).filter((s): s is Source => !!s);
export const isVerified = (s: Source) => M.isVerified(s) as boolean;

/* Verified studies that count toward the claim (the gate's own rule). */
export const countedFor = (claim: Claim) => sourcesOf(claim.sources).filter(isVerified);

/* The one line under each claim in the library list. */
export function claimDetail(claim: Claim) {
  const n = countedFor(claim).length;
  if (claim.status === 'active') return `Enough evidence. ${plural(n, 'verified study', 'verified studies')}.`;
  /* A draft can have enough verified studies that each back a different part
     of it (its verdict says why); "3 of the 3 we need" would contradict its status. */
  if (n >= M.REQUIRED_SOURCES) return `Not enough evidence yet. ${plural(n, 'verified study', 'verified studies')}, still under review.`;
  return n ? `Not enough evidence yet. ${n} of the ${M.REQUIRED_SOURCES} verified studies we need.` : 'Not enough evidence yet.';
}

/* Wrapped so it centres in a row (the badge itself hugs the top-left). */
export const ClaimStatusBadge = ({ claim }: { claim: Claim }) => (
  <View>
    <Badge palette="sourceVerification" status={claim.status === 'active' ? 'verified' : 'needs_human'} label={claim.status === 'active' ? 'Active' : 'Draft'} />
  </View>
);

/* "How we check a study": the six checks every counted study passed. */
export const STUDY_CHECKS: [string, string][] = [
  ['Its PMID or DOI points to it', 'Required'],
  ['Title, authors, journal and year match', 'Required'],
  ['Strong design', 'Required'],
  ['Peer reviewed and indexed', 'Required'],
  ['Not retracted', 'Required'],
  ['Its abstract supports the finding', 'Required']
];
