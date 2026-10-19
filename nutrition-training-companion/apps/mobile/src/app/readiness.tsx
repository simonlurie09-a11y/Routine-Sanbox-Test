/* How readiness works (prototype/src/55-recovery.js, "readiness"): the rules,
   last night against the person's own Apple Health baseline, what is read,
   and why readiness never changes the plan (the evidence gate). */
import { router } from 'expo-router';

import { claimEvidence, HealthLink, ReadinessHeader, RelatedEvidence } from '@/features/today/components';
import {
  baselineValue, differenceText, healthSeries, isConnected, metricValue, missingReadinessText, MIN_NIGHTS, READINESS_TYPES,
  readinessOf, sourceLine, TYPE_METRIC, typeLabel, type Readiness
} from '@/features/today/readiness';
import { data as D, domain as M } from '@/shared';
import { useApp, type AppState } from '@/store';
import {
  Badge, Callout, Caption, Card, CardTitle, DisclaimerBand, Facts, HairlineTop, Icon, LinkButton, Row, Rows, Screen, Section, Stack, T
} from '@/ui';

const RULES = [
  { key: 'hrv', label: 'Heart rate variability', detail: 'More than one standard deviation below your usual HRV is reduced. More than two is low.' },
  { key: 'resting_hr', label: 'Resting heart rate', detail: 'More than one standard deviation above your usual resting heart rate is reduced. More than two is low.' },
  { key: 'sleep', label: 'Sleep', detail: 'More than one standard deviation below your usual sleep time is reduced.' }
];

function DriverTable({ r }: { r: Readiness }) {
  return (
    <Card>
      {r.drivers.map((d, i) => {
        const block = (
          <Stack gap="xs">
            <Row between>
              <T size="body" weight="semiBold">{d.label}</T>
              <Badge palette="readiness" status={d.effect} />
            </Row>
            <Facts rows={[
              ['Last night', metricValue(d.metric, d.value)],
              ['Your usual', baselineValue(d)],
              ['Difference', differenceText(d), { tabular: false }]
            ]} />
          </Stack>
        );
        return i ? <HairlineTop key={d.metric}>{block}</HairlineTop> : <Stack key={d.metric} gap="xs">{block}</Stack>;
      })}
    </Card>
  );
}

/* What readiness reads from Apple Health, and whether each type is in use. */
function SharedData({ s }: { s: AppState }) {
  const dev = s.devices.apple_health;
  const series = healthSeries(s);
  const rows = READINESS_TYPES.map((t): [string, string, { tabular: boolean }] => {
    const pts = series[TYPE_METRIC[t]] ? series[TYPE_METRIC[t]].points : [];
    return [typeLabel(t), !dev.dataTypes[t] ? 'Off' : pts.length ? 'Used' : 'No data yet', { tabular: false }];
  });
  return (
    <Stack gap="sm">
      <Card>
        <Row between>
          <CardTitle>Apple Health</CardTitle>
          <Badge palette="connection" status={dev.status} />
        </Row>
        <Facts rows={rows} />
      </Card>
      <HealthLink dev={dev} />
    </Stack>
  );
}

function EvidenceStatus() {
  const claim = claimEvidence('recovery.hrv_guided_lifting_volume');
  if (!claim) return null;
  const req = M.REQUIRED_SOURCES as number;
  return (
    <Section title="Changing your training" caption={`Lowering today's training because readiness is down would be a change to your plan, so it needs ${req} verified studies like any other change.`}>
      <Card onPress={() => router.push('/evidence/recovery.hrv_guided_lifting_volume')}>
        <Row between>
          <Caption>{claim.status === 'draft' ? 'The claim, still a draft' : 'The claim'}</Caption>
          {claim.enough
            ? <Badge palette="sourceVerification" status="verified" />
            : <Badge palette="recommendation" status="blocked_insufficient_evidence" />}
        </Row>
        <T size="callout">{claim.statement}</T>
        <HairlineTop>
          <Row gap="sm">
            <Icon name="checkmark.seal.fill" size={18} color={claim.enough ? 'primary' : 'inkMuted48'} />
            <T size="caption" color="inkMuted80" style={{ flex: 1 }}>{claim.enough ? `${claim.verified} verified studies` : `${claim.verified} of ${req} studies verified`}</T>
            <Icon name="chevron.right" size={18} color="inkMuted48" />
          </Row>
        </HairlineTop>
      </Card>
      {claim.enough ? null : <Callout>{`Until ${req} studies are verified, readiness never changes your plan. We show it so you can decide for yourself.`}</Callout>}
    </Section>
  );
}

export default function Readiness() {
  const s = useApp();
  const r = readinessOf(s);
  const connected = isConnected(s.devices.apple_health);
  return (
    <Screen title="How readiness works" subtitle="Last night against your own baseline">
      <Stack gap="xxl">
        <Section title="How we work it out">
          <Callout>{`Each morning we compare last night's numbers from Apple Health with your own average over up to 28 nights before. We never compare you with anyone else. Until there are ${MIN_NIGHTS} nights to set your baseline, readiness shows Not enough data.`}</Callout>
          <Rows rows={RULES.map((x) => ({ key: x.key, label: x.label, detail: x.detail }))} />
          <Caption>A standard deviation is how much your numbers usually vary from night to night. Your readiness is the lowest of these.</Caption>
        </Section>

        <Section title="Last night" caption={r.provider ? `${sourceLine(r)} Your usual is your average over up to 28 nights before, ± how much it usually varies.` : null}>
          {r.level === 'unknown' ? (
            <Card>
              <ReadinessHeader level="unknown" />
              <Callout>{missingReadinessText(s)}</Callout>
            </Card>
          ) : <DriverTable r={r} />}
        </Section>

        <Section title="What we use" caption="We read these from Apple Health on your phone, only to compare you with your own baseline. A data type that's off is never used, and nothing we read is saved.">
          {connected ? <SharedData s={s} /> : <LinkButton label="Connect Apple Health" onPress={() => router.push('/apple-health')} />}
        </Section>

        <EvidenceStatus />
        <RelatedEvidence />
        <DisclaimerBand text={D.DISCLAIMER.short} />
      </Stack>
    </Screen>
  );
}
