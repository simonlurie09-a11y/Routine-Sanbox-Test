/* The Training tab: the split and its weekly volume, pending suggestions, the
   split review, and the ways in to change requests, the editor and workouts.
   Ported from Training in prototype/src/70-training.js. Builder D. */
import { router } from 'expo-router';

import { SetupCard } from '@/features/setup';
import { RecBadge, isTargetRec, plural, verifiedCount } from '@/features/shared';
import {
  MUSCLES, WEEK_ORDER, dayMinutes, dayTitle, isFromReview, nextVersionNumber, sortedDays,
  uniq, verifiedStudies, weekdayName
} from '@/features/training/helpers';
import { domain as M } from '@/shared';
import { S, useApp, type AppState, type Recommendation } from '@/store';
import {
  Button, Callout, Caption, Card, CardFooter, CardTitle, EmptyAnswer, Facts, Icon, LinkButton, overlay, Row, Rows, Section, Stack, TabScreen
} from '@/ui';

function SuggestionCard({ s, rec }: { s: AppState; rec: Recommendation }) {
  const n = verifiedCount(rec);
  const split = s.split;
  const stale = !!split && rec.fromVersion != null && rec.fromVersion !== split.current;
  const footer = isTargetRec(rec) ? 'Your daily targets'
    : !split ? 'Your split'
    : stale ? `Made for version ${rec.fromVersion}`
    : `Version ${split.current} to ${nextVersionNumber(s)}`;
  return (
    <Card onPress={() => router.push(`/recommendation/${rec.id}`)} accessibilityLabel={`Suggested: ${rec.title}. ${footer}`}>
      <Row><RecBadge status="proposed" /></Row>
      <CardTitle>{rec.title}</CardTitle>
      <Callout>{`${isFromReview(rec) ? 'From your split review' : 'From your request'}, backed by ${verifiedStudies(n)}.`}</Callout>
      <CardFooter>
        <Caption>{footer}</Caption>
        <Icon name="chevron.right" size={18} color="inkMuted48" />
      </CardFooter>
    </Card>
  );
}

const GROUPS = uniq(MUSCLES.map((m) => m.group));
const MUSCLES_BY_GROUP = MUSCLES.slice().sort((a, b) => GROUPS.indexOf(a.group) - GROUPS.indexOf(b.group));

export default function Training() {
  const s = useApp();
  const split = s.split;
  const def = S.currentDefinition(s);
  const pending = s.recommendations.filter((r) => r.status === 'proposed');
  const suggestions = pending.length ? (
    <Section title="Suggested changes">
      <Stack gap="sm">{pending.map((rec) => <SuggestionCard key={rec.id} s={s} rec={rec} />)}</Stack>
    </Section>
  ) : null;
  const setup = <SetupCard keys={['health', 'training', 'split']} title="Before we suggest changes" />;

  /* No split yet: it's chosen in setup (a template, or build your own). */
  if (!split || !def) {
    return (
      <TabScreen title="Training">
        {setup}
        {suggestions}
        <EmptyAnswer icon="list.bullet" title="No split yet"
          body="Start from a template or build your own. Then you’ll see your weekly sets per muscle, and you can ask for changes.">
          <Button label="Choose a split" onPress={() => router.push('/setup/split')} />
        </EmptyAnswer>
      </TabScreen>
    );
  }

  const days = sortedDays(def);
  const subtitle = `${split.name}, version ${split.current}`;

  /* "Build my own" starts with an empty week. */
  if (!days.length) {
    return (
      <TabScreen title="Training" subtitle={subtitle}>
        {setup}
        {suggestions}
        <EmptyAnswer icon="dumbbell" title="No training days yet"
          body="Add your training days and their exercises. We’ll show your weekly sets per muscle as you build it.">
          <Button label="Add a day" onPress={() => router.push('/training/edit')} />
        </EmptyAnswer>
        {split.current > 1 ? (
          <LinkButton label={`What changed in version ${split.current}`} onPress={() => router.push(`/training/version/${split.current}`)} />
        ) : null}
      </TabScreen>
    );
  }

  const vol = M.weeklyVolume(def) as Record<string, number>;
  const review = M.reviewSplit(def, s.profile) as { findings: { title: string }[] };
  const trainingDays = new Set(def.days.map((d) => d.weekday).filter((w) => w != null));
  const rest = WEEK_ORDER.filter((w) => !trainingDays.has(w)).map(weekdayName);
  const findings = review.findings.length;
  const workoutDays = days.filter((d) => d.items.length);
  const startWorkout = () => overlay.sheet({
    title: 'Which workout are you starting?',
    options: workoutDays.map((d) => ({ label: dayTitle(d), onPress: () => router.push(`/workout/${d.key}`) }))
  });

  return (
    <TabScreen title="Training" subtitle={subtitle}>
      {setup}
      {suggestions}

      <Section title="Your split">
        <Rows rows={days.map((d) => ({
          key: d.key,
          label: dayTitle(d),
          detail: d.items.length ? `${plural(d.items.length, 'exercise')}, about ${dayMinutes(d)} min` : 'No exercises yet',
          accessibilityLabel: `${dayTitle(d)}. ${d.items.length ? `${plural(d.items.length, 'exercise')}, about ${dayMinutes(d)} minutes` : 'No exercises yet'}`,
          onPress: () => router.push(`/training/day/${d.key}`)
        }))} />
        <Caption>{rest.length ? `Rest days: ${M.listJoin(rest)}.` : 'No rest days in this split.'}</Caption>
        <LinkButton label={`What changed in version ${split.current}`} onPress={() => router.push(`/training/version/${split.current}`)} />
      </Section>

      <Section title="Weekly sets per muscle" caption="Hard sets per week. A set counts fully for its main muscle and half for muscles that help.">
        <Card>
          <Facts rows={MUSCLES_BY_GROUP.map((m) => [m.name, M.fmt.sets(vol[m.id])] as [string, string])} />
        </Card>
      </Section>

      <Section title="Review">
        <Card onPress={() => router.push('/training/review')} accessibilityLabel="Split review. Facts about your plan, not instructions">
          <CardTitle>{findings ? `${plural(findings, 'finding')} about your plan` : 'Nothing stands out in your plan'}</CardTitle>
          {findings ? <Callout>{`${review.findings.map((f) => f.title).join('. ')}.`}</Callout> : null}
          <CardFooter>
            <Caption>Facts about your plan, not instructions</Caption>
            <Icon name="chevron.right" size={18} color="inkMuted48" />
          </CardFooter>
        </Card>
      </Section>

      <Stack gap="sm">
        <Button label="Ask for a change" onPress={() => router.push('/change-request')} />
        <Button variant="outline" label="Edit split" onPress={() => router.push('/training/edit')} />
        {workoutDays.length ? <Button variant="outline" label="Start a workout" onPress={startWorkout} /> : null}
      </Stack>
    </TabScreen>
  );
}
