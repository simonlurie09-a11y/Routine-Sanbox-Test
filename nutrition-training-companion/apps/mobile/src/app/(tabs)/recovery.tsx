/* Recovery (prototype/src/55-recovery.js): today's readiness against the
   person's own Apple Health baseline, what it means for today's training
   (a change would go through the evidence gate, and its claim is a draft, so
   nothing changes), the last 7 nights, and where the data comes from. */
import { router } from 'expo-router';
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';

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
      <T size="caption" color="inkMuted48" align="center">{healthSettingsHint}</T>
      <HealthLink dev={dev} align="center" />
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
   One row per night; each number column takes the width of its widest cell
   (measured), so the numbers line up, and a night label may wrap ("Your
   usual" on two lines). When even one word of a label wouldn't fit beside the
   columns (a narrow phone, or larger text), each night is stacked instead:
   its name, then its numbers. */
function LastNights({ s, r }: { s: AppState; r: Readiness }) {
  const [colWidth, setColWidth] = useState<Record<string, number>>({});
  const [labelWidth, setLabelWidth] = useState(0);
  const [tableWidth, setTableWidth] = useState(0);
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

  const fit = (m: string) => (e: LayoutChangeEvent) => {
    const w = Math.ceil(e.nativeEvent.layout.width);
    setColWidth((prev) => ((prev[m] || 0) >= w ? prev : { ...prev, [m]: w }));
  };
  const measured = tableWidth > 0 && labelWidth > 0 && metrics.every((m) => colWidth[m]);
  const stacked = measured && labelWidth + metrics.reduce((sum, m) => sum + colWidth[m], 0) > tableWidth;

  const line = (key: string, label: string, values: string[], o: { first?: boolean; header?: boolean; bold?: boolean }) => (
    <View key={key} style={{ flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.sm, borderTopWidth: o.first ? 0 : 1, borderTopColor: colors.dividerSoft }}>
      <View style={{ flex: 1, minWidth: 0 }}>
        <T size={o.header ? 'caption' : 'callout'} color={o.header ? 'inkMuted48' : o.bold ? 'ink' : 'inkMuted80'} weight={o.bold ? 'semiBold' : undefined}>{label}</T>
      </View>
      {metrics.map((m, i) => (
        <View key={m} onLayout={fit(m)} style={{ minWidth: colWidth[m], paddingLeft: spacing.md }}>
          <T size={o.header ? 'caption' : 'callout'} color={o.header ? 'inkMuted48' : 'ink'} weight={o.bold ? 'semiBold' : undefined}
            align="right" tabular={!o.header} numberOfLines={1}>{values[i]}</T>
        </View>
      ))}
    </View>
  );
  /* The stacked form: "Last night", then "HRV 55 ms   Resting HR 54 bpm   Sleep 6 h 10 min". */
  const block = (key: string, label: string, values: string[], o: { first?: boolean; bold?: boolean }) => (
    <View key={key} style={{ gap: spacing.xxs, paddingVertical: spacing.sm, borderTopWidth: o.first ? 0 : 1, borderTopColor: colors.dividerSoft }}>
      <T size="callout" color={o.bold ? 'ink' : 'inkMuted80'} weight={o.bold ? 'semiBold' : undefined}>{label}</T>
      <Row wrap gap="md" style={{ rowGap: 0 }}>
        {metrics.map((m, i) => (
          <T key={m} size="callout" weight={o.bold ? 'semiBold' : undefined} tabular>
            <T size="caption" color="inkMuted48">{`${COLUMN_LABEL[m]} `}</T>{values[i]}
          </T>
        ))}
      </Row>
    </View>
  );
  return (
    <Section title="Last 7 nights" caption={caption}>
      <Card>
        {/* The widest word of the night labels, at its natural width, to choose the layout. */}
        <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
          onLayout={(e) => setLabelWidth(Math.ceil(e.nativeEvent.layout.width))}
          style={{ position: 'absolute', opacity: 0, alignItems: 'flex-start' }}>
          {['Night', 'Last', 'night', 'Wed'].map((w) => <T key={w} size="callout">{w}</T>)}
          {['Your', 'usual'].map((w) => <T key={w} size="callout" weight="semiBold">{w}</T>)}
        </View>
        <View accessible accessibilityLabel={`Last 7 nights. ${spoken}`} onLayout={(e) => setTableWidth(Math.floor(e.nativeEvent.layout.width))}>
          {stacked ? (
            <>
              {nights.map((n) => block(`n${n}`, nightLabel(n), metrics.map((m) => at(m, n)), { first: n === 0 }))}
              {known ? block('u', 'Your usual', metrics.map((m) => usual(m)), { bold: true }) : null}
            </>
          ) : (
            <>
              {line('h', 'Night', metrics.map((m) => COLUMN_LABEL[m]), { first: true, header: true })}
              {nights.map((n) => line(`n${n}`, nightLabel(n), metrics.map((m) => at(m, n)), {}))}
              {known ? line('u', 'Your usual', metrics.map((m) => usual(m)), { bold: true }) : null}
            </>
          )}
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
