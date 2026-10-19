/* Pieces Today, Recovery and How readiness works share (builder B). */
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppState as RNAppState, View } from 'react-native';

import { data as D, domain as M } from '@/shared';
import type { AppState, Device } from '@/store';
import { colors, curve, radius, spacing } from '@/theme';
import { Badge, Callout, Card, CardTitle, LinkButton, overlay, Row, Rows, Section, T } from '@/ui';
import { isConnected, missingReadinessText, syncLine, type Readiness } from './readiness';

/* The time now, refreshed whenever the screen comes into view or the app
   comes back to the front (the greeting, "today" and the date move on). */
export function useNow() {
  const [now, setNow] = useState(() => Date.now());
  useFocusEffect(useCallback(() => { setNow(Date.now()); }, []));
  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (st) => { if (st === 'active') setNow(Date.now()); });
    return () => sub.remove();
  }, []);
  return now;
}

/* "Readiness" with its badge, the top of every readiness card. */
export function ReadinessHeader({ level }: { level: Readiness['level'] }) {
  return (
    <Row between>
      <CardTitle>Readiness</CardTitle>
      <Badge palette="readiness" status={level} />
    </Row>
  );
}

/* The link under an unknown readiness: connect, or see what Health shares. */
export function HealthLink({ dev, align }: { dev: Device | undefined; align?: 'center' }) {
  return isConnected(dev)
    ? <LinkButton label="See what Apple Health shares" align={align} onPress={() => router.push('/apple-health')} />
    : <LinkButton label="Connect Apple Health" align={align} onPress={() => router.push('/apple-health')} />;
}

/* Readiness is unknown: the badge, the missing data in one sentence, and the fix. */
export function UnknownReadinessCard({ s, link = true }: { s: AppState; link?: boolean }) {
  return (
    <Card>
      <ReadinessHeader level="unknown" />
      <Callout>{missingReadinessText(s)}</Callout>
      {link ? <HealthLink dev={s.devices.apple_health} /> : null}
    </Card>
  );
}

/* The one data source in version 1: Apple Health, with its connection badge and sync line. */
export function HealthSourceRows({ s }: { s: AppState }) {
  const dev = s.devices.apple_health;
  return (
    <Rows rows={[{
      key: 'apple_health',
      label: 'Apple Health',
      detail: syncLine(dev),
      right: <Badge palette="connection" status={dev ? dev.status : 'revoked'} />,
      onPress: () => router.push('/apple-health')
    }]} />
  );
}

/* Claims in the evidence library that explain readiness. */
const RELATED = ['recovery.hrv_guided_lifting_volume', 'recovery.sleep_loss_impairs_performance', 'wearables.measurement_validity', 'recovery.hrv_guided_endurance_training'];
type ClaimLite = { key: string; title: string; status: string };
export function RelatedEvidence() {
  const claims = RELATED.map((k) => ((D.CLAIMS || []) as ClaimLite[]).find((c) => c.key === k)).filter((c): c is ClaimLite => !!c);
  if (!claims.length) return null;
  return (
    <Section title="Related evidence">
      <Rows rows={claims.map((c) => ({
        key: c.key, label: c.title,
        detail: c.status === 'active' ? 'Enough verified evidence' : 'Not enough evidence yet',
        onPress: () => router.push(`/evidence/${c.key}`)
      }))} />
    </Section>
  );
}

/* The verified-evidence count for a claim, as on the prototype's evidence footers. */
export function claimEvidence(key: string): { statement: string; status: string; verified: number; enough: boolean } | null {
  const claim = M.claimByKey(key);
  if (!claim) return null;
  const verified = M.verifiedSourcesFor(claim).length as number;
  return { statement: claim.statement, status: claim.status, verified, enough: verified >= M.REQUIRED_SOURCES };
}

/* "Add food": the same four ways in as the Food tab (prototype C.flows.openAddFood). */
export function openAddFood() {
  overlay.sheet({
    title: 'Add food',
    options: [
      { label: 'Scan a barcode', onPress: () => router.push('/scanner') },
      { label: 'Add a food from its label', onPress: () => router.push('/food/new') },
      { label: 'Search foods', onPress: () => router.push('/food/search') },
      { label: 'Quick add calories', onPress: () => router.push('/food/quick-add') }
    ]
  });
}

/* The design system's StatGauge, with a value that may wrap to a second line
   ("412 g, 152 over" doesn't fit half a phone's width on one line). It fills
   its Grid2 cell, so the two gauges in a row stay the same height with their
   bars on one line. Used for today's food, where over-target values get long. */
export function WrapGauge({ value, label, pct }: { value: string; label: string; pct: number }) {
  const p = Math.max(0, Math.min(1, pct || 0));
  return (
    <View accessible accessibilityLabel={`${value}. ${label}`} style={{ flex: 1, minWidth: 0, gap: spacing.sm, padding: spacing.base, backgroundColor: colors.canvasParchment, borderRadius: radius.lg, ...curve }}>
      <View style={{ flex: 1, gap: spacing.sm }}>
        <T size="headline" weight="semiBold" tabular numberOfLines={2}>{value}</T>
        <T size="caption" color="inkMuted80" numberOfLines={2}>{label}</T>
      </View>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.hairline, overflow: 'hidden' }}>
        <View style={{ width: `${Math.round(p * 100)}%`, height: '100%', borderRadius: 3, backgroundColor: colors.primary }} />
      </View>
    </View>
  );
}
