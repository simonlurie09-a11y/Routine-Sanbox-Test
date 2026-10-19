/* Evidence pieces for suggestions and split changes, ported from
   prototype/src/30-ui.js: CitationCard, ClaimCard, DiffCard, VolumeCard and
   DriversList. Study links open in the in-app browser (expo-web-browser). */
import * as WebBrowser from 'expo-web-browser';
import { Pressable, View } from 'react-native';

import { domain as M } from '@/shared';
import { colors, spacing } from '@/theme';
import { Badge, Callout, Caption, Card, CardFooter, CardTitle, Facts, HairlineTop, Icon, overlay, Row, Rows, Stack, T } from '@/ui';
import type { Claim, Delta, DiffOp, MinuteChange, Source } from './helpers';

/* '2026-10-12' -> '12 Oct 2026' without timezone drift. */
export function isoDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* PubMed first, then DOI, then the page the source was found on (guidelines). */
export function linkFor(src: Source) {
  if (src.pmid) return { href: `https://pubmed.ncbi.nlm.nih.gov/${src.pmid}/`, text: `PubMed ${src.pmid}` };
  if (src.doi) return { href: `https://doi.org/${src.doi}`, text: `doi.org/${src.doi}` };
  if (src.url) return { href: src.url, text: src.url.replace(/^https?:\/\//, '').replace(/\/$/, '') };
  return null;
}

export function openLink(href: string) {
  WebBrowser.openBrowserAsync(href).catch(() => overlay.toast('We couldn’t open the link. Check your connection and try again.', 'error'));
}

function SourceLink({ href, text }: { href: string; text: string }) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={`Open ${text}`} accessibilityHint="Opens the study in your browser"
      onPress={() => openLink(href)} hitSlop={8}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 44, alignSelf: 'flex-start', maxWidth: '100%', opacity: pressed ? 0.6 : 1 })}>
      <View style={{ flexShrink: 0 }}><Icon name="link" size={16} color="primary" /></View>
      <T size="caption" color="primary" style={{ flexShrink: 1 }}>{text}</T>
    </Pressable>
  );
}

/* role: "supports" (default) shows the verification badge; "contradicts" and
   "context" are listed for honesty and never count toward a claim. */
const ROLE_WORDS: Record<string, string> = { contradicts: 'Contradicting or mixed evidence', context: 'Background, not counted' };
export function CitationCard({ source, role = 'supports' }: { source: Source; role?: 'supports' | 'contradicts' | 'context' }) {
  const link = linkFor(source);
  const verified = M.isVerified(source) as boolean;
  return (
    <Card>
      <Stack gap="xs">
        <CardTitle>{source.short}</CardTitle>
        {source.design ? <Caption>{source.design}</Caption> : null}
      </Stack>
      <T size="callout">{`${source.title.replace(/\.$/, '')}.`}</T>
      {/* Some author lists and citations in the library already end with a full stop. */}
      <Caption>{`${source.authors.replace(/\.$/, '')}. ${source.journal} ${source.citation.replace(/\.$/, '')}.`}</Caption>
      {source.found ? (
        <Stack gap="xs">
          <T size="callout" weight="semiBold">What it found</T>
          <Callout>{source.found}</Callout>
        </Stack>
      ) : null}
      {source.limitations ? (
        <Stack gap="xs">
          <T size="callout" weight="semiBold">Limitations</T>
          <Callout>{source.limitations}</Callout>
        </Stack>
      ) : null}
      <HairlineTop>
        <CardFooter>
          {role === 'supports'
            ? <Badge palette="sourceVerification" status={verified ? 'verified' : 'needs_human'} />
            : <Caption color="inkMuted80">{ROLE_WORDS[role] || ROLE_WORDS.context}</Caption>}
          <Caption>{verified && source.verifiedAt ? `Checked ${isoDate(source.verifiedAt)}` : 'Not yet verified'}</Caption>
        </CardFooter>
        {link ? <SourceLink href={link.href} text={link.text} /> : null}
      </HairlineTop>
    </Card>
  );
}

export function ClaimCard({ claim, verifiedCount, required = 3, label = 'The claim' }: { claim: Claim; verifiedCount: number; required?: number; label?: string }) {
  const enough = verifiedCount >= required;
  /* A draft claim can have enough verified studies and still be under review: it isn't used until it's active. */
  const usable = enough && claim.status === 'active';
  return (
    <Card>
      <Caption>{label}</Caption>
      <T size="callout">{claim.statement}</T>
      {claim.population ? <Caption color="inkMuted80">{`Who the studies covered: ${claim.population}`}</Caption> : null}
      <HairlineTop>
        <Row>
          <Icon name="checkmark.seal.fill" size={18} color={usable ? 'primary' : 'inkMuted48'} />
          <T size="caption" color="inkMuted80" style={{ flex: 1 }}>
            {usable
              ? `${verifiedCount} verified ${verifiedCount === 1 ? 'study' : 'studies'}. We need at least ${required}.`
              : enough
                ? `${verifiedCount} verified ${verifiedCount === 1 ? 'study' : 'studies'}, but the claim is still under review, so the app doesn’t use it yet.`
                : `${verifiedCount} of the ${required} verified studies we need`}
          </T>
        </Row>
      </HairlineTop>
    </Card>
  );
}

export function DiffCard({ ops }: { ops: DiffOp[] }) {
  return (
    <Card>
      {ops.map((o, i) => (
        <View key={`${o.op}${o.exercise || ''}${o.dayKey || ''}${i}`}
          style={{ gap: spacing.xs, borderTopWidth: i ? 1 : 0, borderTopColor: colors.dividerSoft, paddingTop: i ? spacing.base : 0, marginTop: i ? spacing.xs : 0 }}>
          <Row between style={{ alignItems: 'flex-start' }}>
            <T size="body" weight="semiBold" style={{ flex: 1 }}>{o.name}</T>
            <Badge palette="diffOp" status={o.op} />
          </Row>
          <Callout>{o.text}</Callout>
        </View>
      ))}
    </Card>
  );
}

export function VolumeCard({ deltas, minutes }: { deltas: Delta[]; minutes?: MinuteChange[] }) {
  return (
    <Card>
      <CardTitle>Weekly sets</CardTitle>
      {deltas.length ? <Facts rows={deltas.map((d) => [d.name, `${M.fmt.sets(d.before)} → ${M.fmt.sets(d.after)}`] as [string, string])} /> : null}
      {(minutes || []).map((m) => (
        <Caption key={m.dayKey}>
          {m.before
            ? `${m.label} goes from ${m.before} to ${m.after} minutes. Your limit is ${m.limit}.`
            : `${m.label} takes about ${m.after} minutes. Your limit is ${m.limit}.`}
        </Caption>
      ))}
    </Card>
  );
}

export function DriversList({ drivers }: { drivers: { label: string; detail?: string }[] }) {
  return <Rows rows={drivers.map((d, i) => ({ key: `${d.label}${i}`, label: d.label, detail: d.detail }))} />;
}
