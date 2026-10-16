/* Recovery (prototype/src/55-recovery.js): today's readiness against the
   person's own Apple Health baseline, what it means for today's training
   (a change would go through the evidence gate, and its claim is a draft, so
   nothing changes), the last 7 nights, and where the data comes from. */
import { router } from 'expo-router';
import { View } from 'react-native';

import {
  HealthLink, HealthSourceRows, ReadinessHeader, RelatedEvidence, UnknownReadinessCard
} from '@/features/today/components';
import {
  healthSeries, isConnected, keepUnits, LEVEL_TEXT, METRIC_TYPE, metricValue, missingReadinessText, nightLabel,
  nightsShared, sourceLine, type Readiness, readinessOf
} from '@/features/today/readiness';
import { healthSettingsHint } from '@/services/healthSync';
import { domain as M } from '@/shared';
import { S, useApp, type AppState, type SplitDefinition } from '@/store';
import { colors, spacing } from '@/theme';
import {
  Badge, Button, Callout, Caption, Card, CardTitle, EmptyAnswer, Icon, LinkButton, Row, Section, Stack, T, TabScreen
} from '@/ui';

const COLUMN_ORDER = ['hrv_sdnn_ms', 'resting_hr_bpm', 'sleep_total_min'];
const COLUMN_LABEL: Record<string, string> = { hrv_sdnn_ms: 'HRV', resting_hr_bpm: 'Resting HR', sleep_total_min: 'Sleep' };
const SPOKEN_LABEL: Record<string, string> = { hrv_sdnn_ms: 'HRV', resting_hr_bpm: 'resting heart rate', sleep_total_min: 'sleep' };
const todaysDay = (def: SplitDefinition | null) => (def ? def.days.find((d) => d.weekday === new Date().getDay()) || null : null);

/* ------------------------------------------------------------ readiness */
function ReadinessCard({ s, r }: { s: AppState; r: Readiness }) {
  if (r.level === 'unknown') return <UnknownReadinessCard s={s} />;
  return (
    <Card>
      <ReadinessHeader level={r.level} />
      <Callout>{LEVEL_TEXT[r.level]}</Callout>
      <View>
        {r.drivers.map((d, i) => (
          <View key={d.metric} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, borderTopWidth: i ? 1 : 0, borderTopColor: colors.dividerSoft }}>
            <View style={{ flex: 1, gap: spacing.xxs }}>
              <T size="callout" tabular>{keepUnits(d.text.value)}</T>
              <T size="caption" color="inkMuted80" tabular>{keepUnits(d.text.context)}</T>
            </View>
            {d.effect !== 'normal' ? <Badge palette="readiness" status={d.effect} /> : null}
          </View>
        ))}
      </View>
      <Caption>{sourceLine(r)}</Caption>
    </Card>
  );
}

/* Apple Health isn't connected, or hasn't shared a single night yet. */
function NoReadiness({ s }: { s: AppState }) {
  const dev = s.devices.apple_health;
  if (!isConnected(dev)) {
    return (
      <EmptyAnswer icon="heart" title="Connect Apple Health"
        body="Readiness compares last night's sleep, heart rate variability and resting heart rate with your own usual. We read them from Apple Health, on your phone.">
        <Button label="Connect Apple Health" onPress={() => router.push('/apple-health')} />
      </EmptyAnswer>
    );
  }
  return (
    <EmptyAnswer icon="bed.double" title="No nights yet" body={missingReadinessText(s)}>
      <Caption>{healthSettingsHint}</Caption>
      <HealthLink dev={dev} />
    </EmptyAnswer>
  );
}

function TodaysTrainingCard({ s, r }: { s: AppState; r: Readiness }) {
  const adj = M.evaluateRecoveryAdjustment(s) as { status: string; reason: string; verifiedCount: number; required: number } | null;
  const def = S.currentDefinition(s);
  const day = todaysDay(def);
  const plan = !def
    ? "You haven't chosen a split yet."
    : day ? `${day.label}: ${day.items.length} exercises, about ${M.dayMinutes(day)} minutes.` : 'No session in your split today.';
  let body = null;
  if (adj) {
    body = (
      <>
        <Callout>{adj.reason}</Callout>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.dividerSoft, paddingTop: spacing.base }}>
          <Icon name="checkmark.seal.fill" size={18} color="inkMuted48" />
          <T size="caption" color="inkMuted80" style={{ flex: 1 }}>{`${adj.verifiedCount} of ${adj.required} studies verified for changing a session based on readiness`}</T>
        </View>
      </>
    );
  } else if (def) {
    body = <Callout>{r.level === 'normal' ? "Your readiness is normal, so today's session goes ahead as planned." : "Without readiness data, today's session goes ahead as planned."}</Callout>;
  }
  return (
    <Card>
      {adj ? <Badge palette="recommendation" status={adj.status} /> : null}
      <CardTitle>Today's training</CardTitle>
      <T size="callout" weight="semiBold">{plan}</T>
      {body}
      {!def ? <LinkButton label="Choose a split" onPress={() => router.push('/setup/split')} /> : null}
      <LinkButton label="How readiness works" onPress={() => router.push('/readiness')} />
    </Card>
  );
}

/* Last 7 nights from Apple Health: the metrics readiness used (or, while the
   baseline is still building, the ones it has sent), and the person's usual.
   Laid out column by column so the numbers line up; read as one row per night. */
function LastNights({ s, r }: { s: AppState; r: Readiness }) {
  const series = healthSeries(s);
  const dev = s.devices.apple_health;
  const known = r.level !== 'unknown';
  const metrics = COLUMN_ORDER.filter((m) => (known
    ? r.drivers.some((d) => d.metric === m)
    : !!series[m] && !!dev.dataTypes[METRIC_TYPE[m]] && series[m].points.some((p) => p.daysAgo <= 6)));
  if (!metrics.length) return null;
  const nights = [0, 1, 2, 3, 4, 5, 6];
  const at = (m: string, n: number) => {
    const p = series[m].points.find((x) => x.daysAgo === n);
    return p ? metricValue(m, p.value) : '—';
  };
  const usual = (m: string) => {
    const d = r.drivers.find((x) => x.metric === m);
    return d ? metricValue(m, d.mean) : '—';
  };
  const hasHrv = metrics.includes('hrv_sdnn_ms');
  const caption = `From Apple Health${hasHrv ? '. HRV is SDNN' : ''}. ${known
    ? 'Your usual is your average over up to 28 nights before last night.'
    : `Your usual shows once Apple Health has sent ${M.MIN_BASELINE_NIGHTS} nights.`}`;
  const spoken = nights.map((n) => `${nightLabel(n)}: ${metrics.map((m) => `${SPOKEN_LABEL[m]} ${at(m, n) === '—' ? 'no reading' : at(m, n)}`).join(', ')}.`)
    .concat(known ? [`Your usual: ${metrics.map((m) => `${SPOKEN_LABEL[m]} ${usual(m)}`).join(', ')}.`] : []).join(' ');

  const cell = (key: string, text: string, o: { first?: boolean; header?: boolean; bold?: boolean; right?: boolean }) => (
    <View key={key} style={{ paddingVertical: spacing.sm, paddingLeft: o.right ? spacing.md : 0, borderTopWidth: o.first ? 0 : 1, borderTopColor: colors.dividerSoft }}>
      <T size={o.header ? 'caption' : 'callout'} color={o.header ? 'inkMuted48' : !o.right && !o.bold ? 'inkMuted80' : 'ink'}
        weight={o.bold ? 'semiBold' : undefined} align={o.right ? 'right' : 'left'} tabular={o.right} numberOfLines={1}>{text}</T>
    </View>
  );
  return (
    <Section title="Last 7 nights" caption={caption}>
      <Card>
        <View accessible accessibilityLabel={`Last 7 nights. ${spoken}`} style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            {cell('h', 'Night', { first: true, header: true })}
            {nights.map((n) => cell(`n${n}`, nightLabel(n), {}))}
            {known ? cell('u', 'Your usual', { bold: true }) : null}
          </View>
          {metrics.map((m) => (
            <View key={m}>
              {cell('h', COLUMN_LABEL[m], { first: true, header: true, right: true })}
              {nights.map((n) => cell(`n${n}`, at(m, n), { right: true }))}
              {known ? cell('u', usual(m), { bold: true, right: true }) : null}
            </View>
          ))}
        </View>
      </Card>
    </Section>
  );
}

function HrvNote() {
  return (
    <Row gap="sm" style={{ alignItems: 'flex-start' }}>
      <Icon name="info.circle" size={18} color="inkMuted48" />
      <View style={{ flex: 1 }}>
        <Caption>Apple Health reports heart rate variability as SDNN. Other devices often report RMSSD, which measures something different, so we only ever compare your HRV with your own Apple Health baseline.</Caption>
      </View>
    </Row>
  );
}

/* --------------------------------------------------------------- screen */
export default function Recovery() {
  const s = useApp();
  const r = readinessOf(s);
  const empty = r.level === 'unknown' && (!isConnected(s.devices.apple_health) || (s.devices.apple_health.status === 'active' && !nightsShared(s)));
  return (
    <TabScreen title="Recovery" subtitle="Compared with your own baseline">
      <Stack gap="xxl">
        {empty ? <NoReadiness s={s} /> : <ReadinessCard s={s} r={r} />}
        <TodaysTrainingCard s={s} r={r} />
        <LastNights s={s} r={r} />
        <HrvNote />
        <RelatedEvidence />
        <Section title="Data sources" caption="We use this data on your phone to compare you with your own baseline. We never save it, sell it or use it for advertising.">
          <HealthSourceRows s={s} />
        </Section>
      </Stack>
    </TabScreen>
  );
}
