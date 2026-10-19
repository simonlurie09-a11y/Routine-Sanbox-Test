/* The descriptive split review (docs/07 §7.5): facts about the plan, never
   instructions. "Ask for more <muscle> work" goes straight through the gate.
   Ported from SplitReview in prototype/src/70-training.js. Builder D. */
import { router } from 'expo-router';
import { View } from 'react-native';

import { askFromReview, dayTitle, hasDays, muscleName, sessionLimit, sortedDays, verifiedStudies } from '@/features/training/helpers';
import { domain as M } from '@/shared';
import { S, useApp } from '@/store';
import { colors, spacing } from '@/theme';
import { Button, Callout, Caption, Card, CardTitle, EmptyAnswer, Facts, HairlineTop, LinkButton, Screen, Section, Stack, T } from '@/ui';

type Finding = { code: string; title: string; detail: string; muscles?: string[] };

function FindingCard({ f, vol }: { f: Finding; vol: Record<string, number> }) {
  return (
    <Card>
      <CardTitle>{f.title}</CardTitle>
      <Callout>{f.detail}</Callout>
      {f.code === 'low_volume' && f.muscles ? (
        <HairlineTop>
          <Caption>Ask for more work on one of these and we’ll check the evidence before suggesting anything.</Caption>
          {f.muscles.map((m, i) => (
            <View key={m} style={{ gap: spacing.xxs, borderTopWidth: i ? 1 : 0, borderTopColor: colors.dividerSoft, paddingTop: i ? spacing.sm : 0 }}>
              <T size="callout" tabular>{`${muscleName(m)}, ${M.fmt.sets(vol[m])} weekly sets`}</T>
              <LinkButton label={`Ask for more ${muscleName(m).toLowerCase()} work`} onPress={() => askFromReview(m)} />
            </View>
          ))}
        </HairlineTop>
      ) : null}
    </Card>
  );
}

export default function SplitReviewScreen() {
  const s = useApp();
  const def = S.currentDefinition(s);
  if (!s.split || !def || !hasDays(def)) {
    return (
      <Screen title="Split review" subtitle="Facts about your plan">
        <EmptyAnswer icon="list.bullet" title={s.split ? 'No training days yet' : 'No split yet'}
          body={s.split ? 'Add your training days and exercises, and we’ll describe the plan here.' : 'Choose a split, and we’ll describe the plan here.'}>
          {s.split
            ? <Button label="Add a day" onPress={() => router.push('/training/edit')} />
            : <Button label="Choose a split" onPress={() => router.push('/setup/split')} />}
        </EmptyAnswer>
      </Screen>
    );
  }
  const review = M.reviewSplit(def, s.profile) as { findings: Finding[]; volume: Record<string, number>; minutes: Record<string, number> };
  return (
    <Screen title="Split review" subtitle="Facts about your plan">
      <Stack gap="sm">
        <Callout>{`These findings describe version ${s.split.current} of your split as it is. They aren’t instructions.`}</Callout>
        <Caption>{`A suggestion only appears when ${verifiedStudies(M.REQUIRED_SOURCES)} support it.`}</Caption>
      </Stack>
      <Stack>
        {review.findings.length
          ? review.findings.map((f, i) => <FindingCard key={f.code + i} f={f} vol={review.volume} />)
          : (
            <Card>
              <CardTitle>Nothing stands out</CardTitle>
              <Callout>Every muscle gets some work, and each session fits your time limit.</Callout>
            </Card>
          )}
      </Stack>
      <Section title="Session length" caption={`Your limit is ${sessionLimit(s)} minutes. Times include a warm-up, each set and its rest.`}>
        <Card>
          <Facts rows={sortedDays(def).map((d) => [dayTitle(d), `${review.minutes[d.key]} min`] as [string, string])} />
        </Card>
      </Section>
    </Screen>
  );
}
