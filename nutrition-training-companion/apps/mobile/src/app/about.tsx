/* About and disclaimer (prototype About): the disclaimer with its version
   and when you accepted it, how suggestions are checked, data sources and
   their licences, privacy and support, and the app version. */
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Linking, View } from 'react-native';

import { longDate, plural } from '@/features/shared';
import { data as D, domain as M, type Claim, type Source } from '@/shared';
import { useApp } from '@/store';
import { colors, curve, radius, spacing } from '@/theme';
import { Body, Callout, Caption, H2, LinkButton, Rows, Screen, Section, Stack, T } from '@/ui';

type Extra = { privacyPolicyUrl?: string; supportUrl?: string; supportEmail?: string };
const extra = ((Constants.expoConfig && Constants.expoConfig.extra) || {}) as Extra;
const version = Application.nativeApplicationVersion || (Constants.expoConfig && Constants.expoConfig.version) || null;
const build = Application.nativeBuildVersion;

const isoDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};
/* Studies behind active claims that still pass every check. */
function verifiedStudies(): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  (D.CLAIMS as Claim[]).filter((c) => c.status === 'active').forEach((claim) => (M.verifiedSourcesFor(claim) as Source[]).forEach((src) => {
    if (!seen.has(src.id)) {
      seen.add(src.id);
      out.push(src);
    }
  }));
  return out;
}

async function open(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    Linking.openURL(url).catch(() => {});
  }
}

export default function About() {
  const ack = useApp((s) => s.disclaimerAcknowledgedAt);
  const studies = verifiedStudies();
  const checked = studies.length && studies[0].verifiedAt ? isoDate(studies[0].verifiedAt) : null;
  const sources = D.SOURCES as Source[];
  const email = extra.supportEmail || null;
  return (
    <Screen title="About and disclaimer">
      <View style={{ backgroundColor: colors.canvasParchment, borderRadius: radius.lg, ...curve, padding: spacing.lg, gap: spacing.sm }}>
        <H2>Not medical advice</H2>
        <Body>{D.DISCLAIMER.full}</Body>
        <Caption color="inkMuted80">{`Version ${D.DISCLAIMER.version}.${ack ? ` You read and accepted it on ${longDate(ack)}.` : ''}`}</Caption>
      </View>

      <Section title="How suggestions are checked">
        <Callout>{`We suggest a change to your training or targets only when its claim is backed by ${M.REQUIRED_SOURCES} verified studies. Otherwise we say so and change nothing.`}</Callout>
        <Callout>Requests you type are read on this iPhone by simple rules, not by an AI service. The evidence check then decides, the same as always.</Callout>
        {studies.length ? (
          <Stack gap="sm">
            <Callout>{`The ${plural(sources.length, 'cited study', 'cited studies')} ${sources.length === 1 ? 'is a real publication' : 'are real publications'}. ${plural(studies.length, 'study', 'studies')} currently back the claims we act on${checked ? `, last checked ${checked}` : ''}.`}</Callout>
            <LinkButton label="See the evidence library" onPress={() => router.push('/evidence')} />
          </Stack>
        ) : null}
      </Section>

      <Section title="Data sources and licences">
        <Rows rows={[
          { key: 'off', icon: 'link', iconColor: 'ink', label: 'Open Food Facts',
            detail: 'Products found by barcode or search. Database available under the Open Database Licence (ODbL); product photos carry their own licences.',
            onPress: () => open('https://world.openfoodfacts.org'), accessibilityLabel: 'Open Food Facts, opens the website' },
          { key: 'fdc', icon: 'link', iconColor: 'ink', label: 'USDA FoodData Central',
            detail: 'The generic foods that work offline. Public domain.',
            onPress: () => open('https://fdc.nal.usda.gov'), accessibilityLabel: 'USDA FoodData Central, opens the website' },
          { key: 'studies', icon: 'checkmark.seal.fill', iconColor: 'ink', label: 'The evidence library',
            detail: 'Each study is cited with its authors, journal and year, and links to its record.', onPress: () => router.push('/evidence') },
          { key: 'design', icon: 'doc.text', iconColor: 'ink', label: 'Design system',
            detail: 'Tokens and components from rukkiecodes/claude-apple-design-system, MIT licence.' }
        ]} />
      </Section>

      <Section title="Privacy and support">
        <Callout>Companion has no account and no server. What you log stays on this iPhone; you can export it or delete it in Settings, under Your data.</Callout>
        <Rows rows={[
          extra.privacyPolicyUrl ? { key: 'privacy', icon: 'lock.shield', iconColor: 'ink' as const, label: 'Privacy policy', onPress: () => open(extra.privacyPolicyUrl as string) } : null,
          extra.supportUrl ? { key: 'support', icon: 'info.circle', iconColor: 'ink' as const, label: 'Support', onPress: () => open(extra.supportUrl as string) } : null,
          email ? {
            key: 'email', icon: 'envelope', iconColor: 'ink' as const, label: 'Email us',
            detail: <T size="caption" color="inkMuted80" selectable>{email}</T>,
            right: <LinkButton label="Write" size="callout" onPress={() => Linking.openURL(`mailto:${email}`).catch(() => {})} />
          } : null
        ]} />
      </Section>

      <Caption>{version ? `Companion ${version}${build ? ` (${build})` : ''}` : 'Companion'}</Caption>
    </Screen>
  );
}
