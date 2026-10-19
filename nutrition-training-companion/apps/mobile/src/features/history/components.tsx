/* History cards and lists (builder E), ported from prototype/src/80-history.js:
   the split timeline (versions plus the requests we didn't apply), the
   nutrition-target timeline, and "Not changed". */
import { router } from 'expo-router';

import { RecBadge, isTargetRec, plural, verifiedCount } from '@/features/shared';
import { domain as M } from '@/shared';
import { S, type AppState, type Recommendation, type SplitVersion } from '@/store';
import { Badge, Callout, Caption, Card, CardFooter, CardTitle, EmptyAnswer, Facts, Icon, LinkButton, Row, Stack, T } from '@/ui';
import {
  ORIGIN_LABELS, dayMonth, deltaLine, notChanged, readyTargetLabels, reasonLine, requestLine, studiesLine, targetChangeLine, targetFacts
} from './helpers';

const Chevron = () => <Icon name="chevron.right" size={18} color="inkMuted48" />;
const End = () => <T size="caption" color="inkMuted48" align="center">That&apos;s everything</T>;
const studiesText = (n: number) => `, ${plural(n, 'verified study', 'verified studies')}`;

/* ---------------------------------------------------------------- cards */
function VersionCard({ v, prev, isCurrent, rec }: { v: SplitVersion; prev: SplitVersion | null; isCurrent: boolean; rec: Recommendation | null }) {
  const deltas = deltaLine(prev, v);
  const studies = v.origin === 'app_recommendation' && rec ? studiesText(verifiedCount(rec)) : '';
  const footer = `${dayMonth(v.createdAt)}${studies}`;
  return (
    <Card onPress={() => router.push(`/training/version/${v.number}`)}
      accessibilityLabel={`Version ${v.number}${isCurrent ? ', current' : ''}. ${v.note} ${deltas || ''} ${footer}`}>
      <Row><Badge palette="splitOrigin" status={v.origin} label={ORIGIN_LABELS[v.origin]} /></Row>
      <Row between>
        <CardTitle>{`Version ${v.number}`}</CardTitle>
        {isCurrent ? <Caption>Current</Caption> : null}
      </Row>
      <Callout>{v.note}</Callout>
      {deltas ? <Caption>{deltas}</Caption> : null}
      <CardFooter><Caption>{footer}</Caption><Chevron /></CardFooter>
    </Card>
  );
}

function NotChangedCard({ rec }: { rec: Recommendation }) {
  const request = requestLine(rec);
  const reason = reasonLine(rec);
  const title: string = rec.title || 'Not changed';
  const footer = `${dayMonth(rec.createdAt)}${studiesLine(rec)}`;
  return (
    <Card onPress={() => router.push(`/recommendation/${rec.id}`)}
      accessibilityLabel={`${title}. ${request || ''} ${reason || ''} ${footer}`}>
      <Row><RecBadge status={rec.status} needs={rec.needs} /></Row>
      <CardTitle>{title}</CardTitle>
      {request ? <Callout>{request}</Callout> : null}
      {reason ? <Caption color="inkMuted80">{reason}</Caption> : null}
      <CardFooter><Caption>{footer}</Caption><Chevron /></CardFooter>
    </Card>
  );
}

type TargetEntry = AppState['targets']['history'][number];
function TargetsCard({ s, entry, prev, isCurrent }: { s: AppState; entry: TargetEntry; prev: TargetEntry | null; isCurrent: boolean }) {
  const origin = entry.origin || 'user_edit';
  /* A target change from a suggestion opens its frozen record. */
  const rec = entry.recommendationId ? S.recommendation(s, entry.recommendationId) : null;
  const footer = `${dayMonth(entry.at)}${origin === 'app_recommendation' && rec ? studiesText(verifiedCount(rec)) : ''}`;
  const line = targetChangeLine(entry, prev);
  return (
    <Card onPress={rec ? () => router.push(`/recommendation/${rec.id}`) : undefined}
      accessibilityLabel={rec ? `Daily targets${isCurrent ? ', current' : ''}. ${line} ${footer}` : undefined}>
      <Row><Badge palette="splitOrigin" status={origin} /></Row>
      <Row between>
        <CardTitle>Daily targets</CardTitle>
        {isCurrent ? <Caption>Current</Caption> : null}
      </Row>
      <Callout>{line}</Callout>
      <Facts rows={targetFacts(entry.values)} />
      <CardFooter><Caption>{footer}</Caption>{rec ? <Chevron /> : null}</CardFooter>
    </Card>
  );
}

/* ---------------------------------------------------------------- lists */
type Item = { kind: 'version'; at: number; order: number; v: SplitVersion } | { kind: 'rec'; at: number; order: number; rec: Recommendation };

export function SplitTimeline({ s }: { s: AppState }) {
  const split = s.split;
  if (!split) {
    return (
      <EmptyAnswer icon="list.bullet" title="No split yet"
        body="Every version of your split shows here, starting with the one you choose.">
        <LinkButton label="Choose a split" align="center" onPress={() => router.push('/setup/split')} />
      </EmptyAnswer>
    );
  }
  const versions = split.versions.slice().sort((a, b) => a.number - b.number);
  const prevOf = (v: SplitVersion) => versions.filter((x) => x.number < v.number).pop() || null;
  /* Target suggestions belong to the nutrition timeline, not the split's. */
  const items: Item[] = [
    ...versions.map((v): Item => ({ kind: 'version', at: v.createdAt, order: v.number, v })),
    ...notChanged(s).filter((r) => !isTargetRec(r)).map((r): Item => ({ kind: 'rec', at: r.createdAt, order: 0, rec: r }))
  ].sort((a, b) => b.at - a.at || b.order - a.order);
  return (
    <Stack>
      <Caption>Every version of your split, and the requests we didn&apos;t apply. Tap one to see the record.</Caption>
      <Stack>
        {items.map((it) => (it.kind === 'version'
          ? <VersionCard key={`v${it.v.number}`} v={it.v} prev={prevOf(it.v)} isCurrent={it.v.number === split.current}
              rec={it.v.recommendationId ? S.recommendation(s, it.v.recommendationId) : null} />
          : <NotChangedCard key={it.rec.id} rec={it.rec} />))}
      </Stack>
      <End />
    </Stack>
  );
}

export function NotChangedList({ s }: { s: AppState }) {
  const recs = notChanged(s);
  if (!recs.length) {
    return (
      <EmptyAnswer icon="clock.arrow.circlepath" title="Nothing here yet"
        body="When we don't make a change you asked for, it shows here with the reason." />
    );
  }
  const targets = recs.filter(isTargetRec).length;
  const stayed = !targets ? 'Your split stayed as it was each time.'
    : targets === recs.length ? 'Your targets stayed as they were each time.'
    : 'Your split and targets stayed as they were each time.';
  return (
    <Stack>
      <Caption>{`Requests and suggestions we didn't apply, and why. ${stayed}`}</Caption>
      <Stack>{recs.map((r) => <NotChangedCard key={r.id} rec={r} />)}</Stack>
      <End />
    </Stack>
  );
}

type TargetItem =
  | { kind: 'entry'; at: number; order: number; entry: TargetEntry; prev: TargetEntry | null; isCurrent: boolean }
  | { kind: 'rec'; at: number; order: number; rec: Recommendation };

export function NutritionList({ s }: { s: AppState }) {
  const history = s.targets.history || [];
  const ready = readyTargetLabels();
  const intro = (
    <Caption>{ready.length
      ? `We suggest a target only when its claim has ${M.REQUIRED_SOURCES} verified studies. Today that covers ${M.listJoin(ready)}. Ask from Targets.`
      : `Target suggestions arrive once our nutrition evidence library has ${M.REQUIRED_SOURCES} verified studies per claim, so for now your targets are yours to set.`}</Caption>
  );
  /* Each change to the targets, and (as the split timeline does) the target
     suggestions we didn't apply, newest first. */
  const items: TargetItem[] = [
    ...history.map((entry, i): TargetItem => ({ kind: 'entry', at: entry.at, order: i + 1, entry, prev: i ? history[i - 1] : null, isCurrent: i === history.length - 1 })),
    ...notChanged(s).filter(isTargetRec).map((r): TargetItem => ({ kind: 'rec', at: r.createdAt, order: 0, rec: r }))
  ].sort((a, b) => b.at - a.at || b.order - a.order);
  const list = items.length ? (
    <>
      <Stack>
        {items.map((x) => (x.kind === 'entry'
          ? <TargetsCard key={`t${x.order}`} s={s} entry={x.entry} prev={x.prev} isCurrent={x.isCurrent} />
          : <NotChangedCard key={x.rec.id} rec={x.rec} />))}
      </Stack>
      <End />
    </>
  ) : null;
  if (!history.length) {
    return (
      <Stack>
        {intro}
        <EmptyAnswer icon="target" title="No target changes yet" body="Your daily targets show here each time you change them.">
          <LinkButton label="Set your targets" align="center" onPress={() => router.push('/targets')} />
        </EmptyAnswer>
        {list}
      </Stack>
    );
  }
  return (
    <Stack>
      {intro}
      <LinkButton label="Change your targets" onPress={() => router.push('/targets')} />
      {list}
    </Stack>
  );
}
