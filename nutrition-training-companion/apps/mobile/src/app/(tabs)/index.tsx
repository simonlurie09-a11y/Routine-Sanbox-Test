/* Today: the dashboard (prototype/src/50-today.js, docs/08 §8.6 "Today").
   The one tab root with a fixed, non-collapsing hero: the greeting, the date,
   Settings and the bell. Then what's left to set up, today's food, readiness,
   this week's training, suggestions and the data source. */
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SetupCard } from '@/features/setup';
import { isTargetRec, verifiedCount } from '@/features/shared';
import { HealthSourceRows, openAddFood, ReadinessHeader, UnknownReadinessCard, useNow, WrapGauge } from '@/features/today/components';
import { keepUnits, readinessOf, sourceLine } from '@/features/today/readiness';
import { domain as M } from '@/shared';
import { S, useApp, type AppState, type Recommendation, type TargetKey } from '@/store';
import { colors, GUTTER, spacing } from '@/theme';
import {
  Badge, BellButton, Button, Callout, Caption, Card, CardFooter, CardTitle, Grid2, Icon, IconButton,
  LinkButton, Row, Section, Stack, StatGauge, T
} from '@/ui';

function greetingFor(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/* ------------------------------------------------------------- gauges */
type Gauge = { key: string; value: string; label: string; pct: number };
const kcalText = (v: number) => M.fmt.kcal(v) as string;
const gramText = (v: number) => `${M.fmt.int(v)} g`;

/* Over target, the value says how much over; the gauge stays primary and full.
   No targets at all yet: the total, the name and an empty gauge (the "Set your
   targets" link sits under the grid). One target missing: "…, no target set". */
function nutrientGauge(key: TargetKey, name: string, totals: Record<string, number>, targets: AppState['targets'], unit: 'kcal' | 'g'): Gauge {
  const total = totals[key] || 0;
  const target = targets[key];
  const fmtV = unit === 'kcal' ? kcalText : gramText;
  if (!target) return { key, value: fmtV(total), label: targets.energyKcal == null ? name : `${name}, no target set`, pct: 0 };
  const over = Math.round(total) - Math.round(target);
  return {
    key,
    value: over > 0 ? `${fmtV(total)}, ${M.fmt.int(over)} over` : fmtV(total),
    label: `${name}, of ${unit === 'kcal' ? M.fmt.int(target) : gramText(target)}`,
    pct: Math.min(1, total / target)
  };
}

/* Muscle groups in the mockup's order, with the singular the labels use. */
const GROUPS = ['Back', 'Chest', 'Legs', 'Shoulders', 'Arms', 'Core'];
const GROUP_LABEL: Record<string, string> = { Back: 'Back', Chest: 'Chest', Legs: 'Leg', Shoulders: 'Shoulder', Arms: 'Arm', Core: 'Core' };

/* ----------------------------------------------------------- sections */
function NutritionSection({ s }: { s: AppState }) {
  const totals = S.todayTotals(s) as Record<string, number>;
  const entries = S.todayEntries(s);
  const estimates = entries.filter((e) => e.confidence !== 'high').length;
  const sessions = S.weekSessions(s).length;
  const def = S.currentDefinition(s);
  const planned = def ? def.days.length : 0;
  const gauges: Gauge[] = [
    nutrientGauge('energyKcal', 'Calories', totals, s.targets, 'kcal'),
    nutrientGauge('proteinG', 'Protein', totals, s.targets, 'g'),
    nutrientGauge('carbohydrateG', 'Carbs', totals, s.targets, 'g'),
    nutrientGauge('fatG', 'Fat', totals, s.targets, 'g'),
    nutrientGauge('fiberG', 'Fibre', totals, s.targets, 'g'),
    /* No split, or one with no days yet: just the count. */
    planned
      ? { key: 'workouts', value: `${sessions} of ${planned}`, label: 'Workouts, last 7 days', pct: Math.min(1, sessions / planned) }
      : { key: 'workouts', value: String(sessions), label: 'Workouts, last 7 days', pct: 0 }
  ];
  return (
    <Stack gap="sm">
      <Grid2>{gauges.map((g) => <WrapGauge key={g.key} value={g.value} label={g.label} pct={g.pct} />)}</Grid2>
      {!S.hasTargets(s) ? (
        <Row wrap gap="xs">
          <Caption>No daily targets yet.</Caption>
          <LinkButton label="Set your targets" size="caption" onPress={() => router.push('/targets')} />
        </Row>
      ) : null}
      {!entries.length
        ? <Caption>Nothing logged yet today.</Caption>
        : estimates ? (
          <Row wrap gap="xs">
            <Caption>{estimates === 1
              ? `1 of today's ${entries.length} entries is an estimate.`
              : `${estimates} of today's ${entries.length} entries are estimates.`}</Caption>
            <LinkButton label="Review" size="caption" onPress={() => router.navigate('/food')} />
          </Row>
        ) : null}
      <Button variant="outline" icon="plus" label="Add food" onPress={openAddFood} />
    </Stack>
  );
}

function ReadinessCard({ s }: { s: AppState }) {
  const r = readinessOf(s);
  if (r.level === 'unknown') return <UnknownReadinessCard s={s} />;
  return (
    <Card onPress={() => router.navigate('/recovery')}>
      <ReadinessHeader level={r.level} />
      <View>
        {r.drivers.map((d, i) => (
          <View key={d.metric} style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: i ? 1 : 0, borderTopColor: colors.dividerSoft }}>
            <T size="callout" tabular>{keepUnits(d.text.value)}</T>
            <T size="callout" color="inkMuted80" align="right" tabular style={{ flex: 1 }}>{keepUnits(d.text.context)}</T>
          </View>
        ))}
      </View>
      <CardFooter>
        <View style={{ flex: 1 }}><Caption>{sourceLine(r)}</Caption></View>
        <Icon name="chevron.right" size={18} color="inkMuted48" />
      </CardFooter>
    </Card>
  );
}

function TrainingSection({ s }: { s: AppState }) {
  const def = S.currentDefinition(s);
  if (!def) {
    return (
      <Section title="Training this week">
        <Card>
          <CardTitle>Choose a split</CardTitle>
          <Callout>Start from a template, or build your own. Then this week's sets for each muscle group show here.</Callout>
          <LinkButton label="Choose a split" onPress={() => router.push('/setup/split')} />
        </Card>
      </Section>
    );
  }
  const planned = M.groupVolume(M.weeklyVolume(def)) as Record<string, number>;
  const done = M.groupVolume(S.weekDoneVolume(s)) as Record<string, number>;
  const groups = GROUPS.filter((g) => Math.round(planned[g] || 0) > 0 || Math.round(done[g] || 0) > 0);
  return (
    <Section title="Training this week" caption={groups.length ? 'Sets done in the last 7 days, of the sets in your plan.' : null}>
      {groups.length ? (
        <Grid2>{groups.map((g) => {
          const p = Math.round(planned[g] || 0);
          const d = Math.round(done[g] || 0);
          return <StatGauge key={g} value={`${d} of ${p}`} label={`${GROUP_LABEL[g]} sets`} pct={p ? Math.min(1, d / p) : 0} />;
        })}</Grid2>
      ) : (
        <Card>
          <CardTitle>Your split has no exercises yet</CardTitle>
          <Callout>Add days and exercises, and your sets for the week show here.</Callout>
          <LinkButton label="Edit your split" onPress={() => router.push('/training/edit')} />
        </Card>
      )}
    </Section>
  );
}

function SuggestionCard({ s, rec }: { s: AppState; rec: Recommendation }) {
  const n = verifiedCount(rec);
  const studies = `${n} verified ${n === 1 ? 'study' : 'studies'}`;
  const fromReview = rec.trigger === 'split_review' || (rec.intent && rec.intent.source === 'split_review');
  const target = isTargetRec(rec) || !s.split;
  const next = s.split ? Math.max(...s.split.versions.map((v) => v.number)) + 1 : 0;
  const from = rec.fromVersion != null ? rec.fromVersion : s.split ? s.split.current : 0;
  return (
    <Card onPress={() => router.push(`/recommendation/${rec.id}`)}>
      <Badge palette="recommendation" status="proposed" />
      <CardTitle>{rec.title || 'A suggested change'}</CardTitle>
      <Callout>{fromReview ? `From your split review, backed by ${studies}.` : `From your request, backed by ${studies}.`}</Callout>
      <CardFooter>
        <View style={{ flex: 1 }}><Caption>{target ? 'Your daily targets' : `Split version ${from} to ${next}`}</Caption></View>
        <Icon name="chevron.right" size={18} color="inkMuted48" />
      </CardFooter>
    </Card>
  );
}

function SuggestionsSection({ s }: { s: AppState }) {
  const proposed = s.recommendations.filter((r) => r.status === 'proposed');
  return (
    <Section title="Suggestions">
      {proposed.length ? (
        <Stack gap="sm">{proposed.map((rec) => <SuggestionCard key={rec.id} s={s} rec={rec} />)}</Stack>
      ) : (
        <Card>
          <CardTitle>Want to change your training?</CardTitle>
          <Callout>Tell us what you'd like in your own words. We only suggest a change when 3 verified studies back it.</Callout>
          <LinkButton label="Ask for a change" onPress={() => router.push('/change-request')} />
        </Card>
      )}
    </Section>
  );
}

/* --------------------------------------------------------------- screen */
export default function Today() {
  const s = useApp();
  const now = useNow();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas, paddingTop: insets.top }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: GUTTER, paddingRight: GUTTER - spacing.sm, paddingTop: spacing.sm, paddingBottom: spacing.base }}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <T size="title3" weight="bold" accessibilityRole="header">{greetingFor(new Date(now).getHours())}</T>
          <T size="body" color="inkMuted48">{M.fmt.weekdayLong(now)}</T>
        </View>
        <Row gap="xs">
          <IconButton name="gearshape" label="Settings" onPress={() => router.push('/settings')} />
          <BellButton />
        </Row>
      </View>
      <ScrollView contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: spacing.sm, paddingBottom: spacing.xxxl + insets.bottom }}>
        <Stack gap="xxl">
          <SetupCard />
          <NutritionSection s={s} />
          <Section title="Recovery"><ReadinessCard s={s} /></Section>
          <TrainingSection s={s} />
          <SuggestionsSection s={s} />
          <Section title="Data sources"><HealthSourceRows s={s} /></Section>
        </Stack>
      </ScrollView>
    </View>
  );
}
