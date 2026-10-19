/* One claim: what it says and who the studies covered, what the app does with
   it, why it has its status, and every study behind it by role (counted,
   still being checked, against or mixed, background). Ported from Claim in
   prototype/src/87-evidence.js. Builder E. */
import { router, useLocalSearchParams } from 'expo-router';

import {
  CitationCard, ClaimCard, ClaimStatusBadge, claimFor, countedFor, isVerified, sourcesOf
} from '@/features/evidence/library';
import { data as D, domain as M, type Source } from '@/shared';
import { Callout, DisclaimerBand, EmptyAnswer, LinkButton, Row, Screen, Section, Stack } from '@/ui';

/* The citation line is "<authors>. <journal> <citation>.": drop the full stop
   some authors lists ("et al.") and citations already end with, so it
   doesn't read "et al.." */
const tidy = (src: Source): Source => ({ ...src, authors: src.authors.replace(/\.$/, ''), citation: src.citation.replace(/\.$/, '') });

/* "1. … 2. …" (or "1) … 2) …", or one item per line) reads better as a list
   than as one paragraph. Split only at the next number in sequence, so
   "Baz-Valle 2022. Most…" stays whole. */
function numbered(text: string): string[] {
  const style = /^1([.)])\s/.exec(text);
  if (!style) return [text];
  const mark = style[1] === '.' ? '\\.' : '\\)';
  const parts: string[] = [];
  let start = 0;
  for (let n = 2; ; n++) {
    const m = new RegExp(`\\s${n}${mark}\\s`).exec(text.slice(start));
    if (!m) break;
    parts.push(text.slice(start, start + m.index).trim());
    start += m.index + 1;
  }
  parts.push(text.slice(start).trim());
  return parts;
}
function Paragraphs({ text }: { text: string }) {
  const parts = text.split(/\n+/).map((t) => t.trim()).filter(Boolean).flatMap(numbered);
  return <Stack gap="sm">{parts.map((p, i) => <Callout key={i}>{p}</Callout>)}</Stack>;
}

function Studies({ title, caption, sources, role }: { title: string; caption: string; sources: Source[]; role?: 'contradicts' | 'context' }) {
  if (!sources.length) return null;
  return (
    <Section title={title} caption={caption}>
      {sources.map((src) => <CitationCard key={src.id} source={tidy(src)} role={role} />)}
    </Section>
  );
}

export default function ClaimScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const claim = claimFor(Array.isArray(key) ? key[0] : key);
  if (!claim) {
    return (
      <Screen title="Claim">
        <EmptyAnswer icon="doc.text" title="We couldn't find this claim" body="It may have been renamed in a newer version of the library.">
          <LinkButton label="See the evidence library" align="center" onPress={() => router.replace('/evidence')} />
        </EmptyAnswer>
      </Screen>
    );
  }
  const active = claim.status === 'active';
  const counted = countedFor(claim);
  const others = sourcesOf(claim.sources).filter((s) => !isVerified(s));
  const contra = sourcesOf(claim.contradicting);
  const context = sourcesOf(claim.context);
  return (
    <Screen title={claim.title} subtitle={active ? 'Enough verified evidence' : 'Not enough evidence yet'}>
      <Stack gap="sm">
        <Row><ClaimStatusBadge claim={claim} /></Row>
        <ClaimCard claim={claim} verifiedCount={counted.length} required={M.REQUIRED_SOURCES} label={active ? 'The claim' : 'The claim being tested'} />
      </Stack>
      {claim.appUse ? (
        <Section title={active ? 'What we do with it' : 'What we would do with it'}>
          <Callout>{claim.appUse}</Callout>
        </Section>
      ) : null}
      {claim.verdict ? <Section title="Why this status"><Paragraphs text={claim.verdict} /></Section> : null}
      <Studies title="Studies that count" caption="Each one passed all six checks." sources={counted} />
      <Studies title="Studies still being checked" caption="These don't count until they pass every check." sources={others} />
      <Studies title="Evidence against, or mixed" caption="Listed so you can see both sides. It never counts toward the claim." sources={contra} role="contradicts" />
      <Studies title="Background" caption="Useful context that doesn't count toward the claim." sources={context} role="context" />
      {claim.gaps ? <Section title="What would change this"><Paragraphs text={claim.gaps} /></Section> : null}
      <DisclaimerBand text={D.DISCLAIMER.short} />
    </Screen>
  );
}
