/* The evidence library: every claim the app could act on, grouped by area,
   with its status and how many verified studies back it. Settings, About,
   Readiness and the health rating link here. Ported from Evidence in
   prototype/src/87-evidence.js (the dataset catalogue and downloads stay in
   the prototype). Builder E. */
import { router } from 'expo-router';

import {
  AREAS, ClaimStatusBadge, STUDY_CHECKS, allClaims, allSources, claimDetail, isVerified, isoDate
} from '@/features/evidence/library';
import { plural } from '@/features/shared';
import { data as D, domain as M } from '@/shared';
import { Callout, Caption, DisclaimerBand, Facts, Rows, Screen, Section, Stack } from '@/ui';

export default function EvidenceLibrary() {
  const all = allClaims();
  const active = all.filter((c) => c.status === 'active').length;
  const sources = allSources();
  const verified = sources.filter(isVerified).length;
  const reviewed: string | undefined = D.EVIDENCE && D.EVIDENCE.reviewedAt;
  return (
    <Screen title="Evidence library" subtitle="What our suggestions rest on">
      <Stack gap="sm">
        <Callout>{`We only change your plan when a claim has at least ${M.REQUIRED_SOURCES} strong, verified, peer-reviewed studies behind it. ${active} of our ${all.length} claims ${active === 1 ? 'has' : 'have'} that today. The rest stay drafts, and we never use them to change your plan.`}</Callout>
        <Caption>{`${plural(sources.length, 'study', 'studies')} listed, ${verified} passed every check${reviewed ? `. Last reviewed ${isoDate(reviewed)}` : ''}.`}</Caption>
      </Stack>

      {AREAS.map((area) => {
        const list = all.filter((c) => c.area === area.key)
          .sort((a, b) => (a.status === b.status ? 0 : a.status === 'active' ? -1 : 1));
        if (!list.length) return null;
        return (
          <Section key={area.key} title={area.title}>
            <Rows rows={list.map((c) => ({
              key: c.key,
              label: c.title,
              detail: claimDetail(c),
              right: <ClaimStatusBadge claim={c} />,
              accessibilityLabel: `${c.title}. ${c.status === 'active' ? 'Active' : 'Draft'}. ${claimDetail(c)}`,
              onPress: () => router.push(`/evidence/${encodeURIComponent(c.key)}`)
            }))} />
          </Section>
        );
      })}

      <Section title="How we check a study">
        <Facts rows={STUDY_CHECKS.map(([a, b]) => [a, b, { tabular: false }])} />
        <Caption>The checks were made through searches of PubMed, PubMed Central, DOI and publisher pages. The library comes with the app, so it works offline, and the evidence check uses only the studies that passed.</Caption>
      </Section>

      <DisclaimerBand text={D.DISCLAIMER.short} />
    </Screen>
  );
}
