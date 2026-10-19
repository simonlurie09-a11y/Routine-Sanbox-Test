/* One version of the split: where it came from, what changed from the version
   before, and the days it held. Going back saves a copy as a new version.
   Ported from SplitVersion in prototype/src/70-training.js. Builder D. */
import { router, useLocalSearchParams } from 'expo-router';

import { plural } from '@/features/shared';
import { editOps } from '@/features/training/diff';
import { DiffCard, VolumeCard } from '@/features/training/evidence';
import { dayMinutes, dayTitle, exercise, longDate, minuteChanges, nextVersionNumber, sessionLimit, sortedDays, versionByNumber, type Delta } from '@/features/training/helpers';
import { domain as M } from '@/shared';
import { A, useApp } from '@/store';
import { Badge, Body, Button, Callout, Caption, EmptyAnswer, LinkButton, overlay, Row, Rows, Screen, Section, Stack } from '@/ui';

/* The splitOrigin palette has no word for the version a split started from. */
const ORIGIN_LABELS: Record<string, string> = { template: 'Starting point' };

export default function SplitVersionScreen() {
  const params = useLocalSearchParams<{ n: string }>();
  const n = Number(params.n);
  const s = useApp();
  const v = versionByNumber(s, n);
  if (!s.split || !v) {
    return (
      <Screen title="Split version">
        <EmptyAnswer icon="clock.arrow.circlepath" title="We couldn’t find this version"
          body={s.split ? `Your split has versions 1 to ${nextVersionNumber(s) - 1}.` : 'You haven’t chosen a split yet.'}>
          {!s.split ? <Button label="Choose a split" onPress={() => router.push('/setup/split')} /> : null}
        </EmptyAnswer>
      </Screen>
    );
  }
  const split = s.split;
  const prev = split.versions.filter((x) => x.number < n).sort((a, b) => b.number - a.number)[0] || null;
  const ops = prev ? editOps(prev.definition, v.definition) : [];
  const deltas: Delta[] = prev ? M.volumeDeltas(prev.definition, v.definition) : [];
  const minutes = prev ? minuteChanges(prev.definition, v.definition, sessionLimit(s)) : [];
  const isCurrent = split.current === n;
  const confirmRevert = () => overlay.alert({
    title: `Go back to version ${n}?`,
    message: `We’ll save a copy of it as version ${nextVersionNumber(s)}. Version ${split.current} stays in your history.`,
    buttons: [{ label: 'Cancel', style: 'cancel' }, {
      label: 'Go back',
      onPress: () => {
        const num = A.revertToVersion(n);
        if (num == null) return;
        overlay.toast(`Went back to version ${n}`, 'success');
        router.replace(`/training/version/${num}`);
      }
    }]
  });
  const days = sortedDays(v.definition);
  return (
    <Screen title={`Version ${n}`} subtitle={longDate(v.createdAt)}>
      <Stack gap="sm">
        <Row><Badge palette="splitOrigin" status={v.origin} label={ORIGIN_LABELS[v.origin]} /></Row>
        <Body>{v.note}</Body>
        <Caption>{isCurrent ? 'This is your current version.' : `Your current version is ${split.current}.`}</Caption>
        {v.origin === 'app_recommendation' && v.recommendationId
          ? <LinkButton label="See the suggestion and its evidence" onPress={() => router.push(`/recommendation/${v.recommendationId}`)} />
          : null}
      </Stack>

      <Section title="What changed" caption={prev ? `Compared with version ${prev.number}.` : null}
        action={prev ? <LinkButton size="caption" label={`See version ${prev.number}`} onPress={() => router.push(`/training/version/${prev.number}`)} /> : null}>
        {!prev
          ? <Callout>This is where your history starts.</Callout>
          : ops.length ? (
            <>
              <DiffCard ops={ops} />
              {deltas.length || minutes.length ? <VolumeCard deltas={deltas} minutes={minutes} /> : null}
            </>
          )
          : <Callout>{`Same exercises and sets as version ${prev.number}.`}</Callout>}
      </Section>

      <Section title="The split">
        {days.length ? (
          <Rows rows={days.map((d) => ({
            key: d.key,
            label: dayTitle(d),
            detail: d.items.length
              ? `${M.capitalise(M.listJoin(d.items.map((it) => M.exerciseWords(exercise(it.exercise).name))))}. About ${dayMinutes(d)} min.`
              : 'No exercises.'
          }))} />
        ) : <Callout>{`No training days in version ${n}.`}</Callout>}
        {days.length ? <Caption>{`${plural(days.length, 'training day')}.`}</Caption> : null}
      </Section>

      {isCurrent ? null : <Button variant="outline" label="Go back to this version" onPress={confirmRevert} />}
    </Screen>
  );
}
