/* The suggestion detail (docs/08 §8.6 "Suggested change" and "Not enough
   evidence"), ported from Recommendation in prototype/src/70-training.js:
   ProposedView, AcceptedView, BlockedView and ClosedView. */
import { router } from 'expo-router';
import type { ReactNode } from 'react';

import { RecBadge } from '@/features/shared';
import { data as D, domain as M } from '@/shared';
import { A, getState, type AppState, type Recommendation } from '@/store';
import {
  Body, Button, Callout, Caption, Card, CardFooter, DisclaimerBand, EmptyAnswer, goBack, LinkButton, overlay, Row, Screen, Section, Stack
} from '@/ui';
import { CitationCard, ClaimCard, DiffCard, DriversList, VolumeCard } from './evidence';
import {
  askAgain, editMyself, isFromReview, needMet, nextVersionNumber, originLine, recheck, resetTo, sessionLimit, shownSources,
  targetChange, verifiedStudies, longDate, type Claim, type Proposal
} from './helpers';
import { isTargetRec } from '@/features/shared';
import { isDone } from '@/features/setup';

const REQUIRED = M.REQUIRED_SOURCES as number;
/* The claim still passes the gate, so a withdrawal wasn't about the evidence. */
const evidenceStillHolds = (rec: Recommendation) => {
  const claim = rec.claimKey ? (M.claimByKey(rec.claimKey) as Claim | null) : null;
  return !!claim && claim.status === 'active' && (M.verifiedSourcesFor(claim) as unknown[]).length >= REQUIRED;
};

/* "You asked" card with the status word and date (mockup: Not enough evidence). */
function YouAsked({ rec }: { rec: Recommendation }) {
  const text = rec.requestText || (rec.intent && rec.intent.summary) || rec.title || 'A change to your split';
  return (
    <Card>
      <Caption>{isFromReview(rec) ? 'You asked, from your split review' : 'You asked'}</Caption>
      <Body>{text}</Body>
      <CardFooter>
        <RecBadge status={rec.status} needs={rec.needs} />
        <Caption>{M.fmt.relativeDay(rec.createdAt)}</Caption>
      </CardFooter>
    </Card>
  );
}

function ChangesSection({ title, proposal }: { title: string; proposal?: Proposal }) {
  if (!proposal || !proposal.ops) return null;
  const hasVolume = (proposal.deltas && proposal.deltas.length) || (proposal.minutes && proposal.minutes.length);
  return (
    <Section title={title}>
      <DiffCard ops={proposal.ops} />
      {hasVolume ? <VolumeCard deltas={proposal.deltas || []} minutes={proposal.minutes} /> : null}
    </Section>
  );
}

function EvidenceSection({ rec, caption }: { rec: Recommendation; caption: string }) {
  const claim = M.claimByKey(rec.claimKey) as Claim | null;
  const sources = shownSources(rec);
  if (!claim && !sources.length) return null;
  return (
    <Section title="Evidence" caption={caption}>
      {claim ? <ClaimCard claim={claim} verifiedCount={rec.verifiedCount || 0} required={rec.required || REQUIRED} /> : null}
      {sources.map((src) => <CitationCard key={src.id} source={src} />)}
    </Section>
  );
}

/* What the library holds for a blocked request. Unverified sources are never listed. */
function EvidenceStatus({ rec }: { rec: Recommendation }) {
  const claim = rec.claimKey ? (M.claimByKey(rec.claimKey) as Claim | null) : null;
  if (!claim) return null;
  const required = rec.required || REQUIRED;
  const verified = M.verifiedSourcesFor(claim) as ReturnType<typeof shownSources>;
  if (claim.status !== 'active') {
    return (
      <Card>
        <Caption>What we’d need evidence for</Caption>
        <Callout color="ink">{claim.statement}</Callout>
        <Caption color="inkMuted80">{`Evidence status: ${claim.status}. ${verified.length} of ${required} studies verified.`}</Caption>
      </Card>
    );
  }
  const ap = (claim.appliesTo || {}) as { maxStartingSets?: number };
  const scope = ap.maxStartingSets ? ` It covers muscles starting under about ${ap.maxStartingSets} weekly sets.` : '';
  return (
    <Section title="What the evidence covers" caption={`This is the closest claim we have verified studies for.${scope}`}>
      <ClaimCard claim={claim} verifiedCount={verified.length} required={required} />
      {verified.map((src) => <CitationCard key={src.id} source={src} />)}
    </Section>
  );
}

function Header({ status, needs, line, origin, children }: { status: string; needs?: string; line: string; origin: string; children?: ReactNode }) {
  return (
    <Stack gap="sm">
      <Row><RecBadge status={status} needs={needs} /></Row>
      <Callout>{line}</Callout>
      <Caption>{origin}</Caption>
      {children}
    </Stack>
  );
}

/* ------------------------------------------------------------- proposed */
export function ProposedView({ s, rec }: { s: AppState; rec: Recommendation }) {
  const tc = isTargetRec(rec) ? targetChange(rec) : null;
  const split = s.split;
  const next = nextVersionNumber(s);
  const stale = !tc && !!split && rec.fromVersion != null && rec.fromVersion !== split.current;

  const apply = () => {
    const res = A.acceptRecommendation(rec.id);
    if (res.ok && tc) {
      overlay.toast(`Your daily ${tc.label.toLowerCase()} target is now ${tc.after} g`, 'success');
      resetTo('/targets');
      return;
    }
    if (res.ok) {
      overlay.toast(`Your split is now version ${res.version}`, 'success');
      resetTo('/training');
      return;
    }
    if (res.reason === 'superseded' && tc) {
      overlay.alert({
        title: 'Your target has changed',
        message: 'You changed this target after we made the suggestion, so it no longer fits and nothing changed. Ask again and we’ll check your current target.',
        buttons: [{ label: 'Not now', style: 'cancel' }, { label: 'Ask again', onPress: () => askAgain(rec) }]
      });
    } else if (res.reason === 'superseded') {
      const now = getState().split;
      overlay.alert({
        title: 'Your split has changed',
        message: now
          ? `You saved version ${now.current} after we made this suggestion, so it no longer fits and nothing changed. Ask again and we’ll check your current split.`
          : 'Your split changed after we made this suggestion, so it no longer fits and nothing changed.',
        buttons: [{ label: 'Not now', style: 'cancel' }, { label: 'Ask again', onPress: () => askAgain(rec) }]
      });
    } else if (res.reason === 'gate_failed') {
      overlay.alert({
        title: 'We withdrew this suggestion',
        message: `It no longer has ${verifiedStudies(REQUIRED)} behind it, so we haven’t changed your plan.`,
        buttons: [{ label: 'Close', style: 'cancel' }]
      });
    } else if (res.reason === 'needs_health') {
      overlay.alert({
        title: 'Answer the health questions first',
        message: `We need your health and safety answers before we change anything, so we withdrew this suggestion. Nothing in ${tc ? 'your targets' : 'your split'} changed.`,
        buttons: [{ label: 'Not now', style: 'cancel' }, { label: 'Answer them', onPress: () => router.push('/setup/health') }]
      });
    } else {
      overlay.toast('This suggestion was already decided');
    }
  };
  const confirm = () => overlay.alert({
    title: 'Apply this change?',
    message: tc
      ? `Your daily ${tc.label.toLowerCase()} target changes to ${tc.after} g. You can change it back in Targets.`
      : split
        ? `Your split moves to version ${next}. You can go back to version ${split.current} from History.`
        : 'Your split moves to a new version. You can go back from History.',
    buttons: [{ label: 'Cancel', style: 'cancel' }, { label: 'Apply', onPress: apply }]
  });
  const decline = () => {
    A.rejectRecommendation(rec.id);
    overlay.toast('Suggestion declined');
    goBack();
  };
  const subtitle = tc ? 'Your daily targets'
    : !split ? 'Your split'
    : stale ? `${split.name}, made for version ${rec.fromVersion}`
    : `${split.name}, version ${split.current} to ${next}`;
  return (
    <Screen title="Suggested change" subtitle={subtitle}>
      <Stack gap="sm">
        <Row><RecBadge status="proposed" /></Row>
        <Callout>{originLine(rec)}</Callout>
        {stale && split ? <Caption>{`You saved version ${split.current} after we made this, so it may no longer fit. Applying it checks again.`}</Caption> : null}
      </Stack>
      <ChangesSection title="What changes" proposal={rec.proposal} />
      <Section title="Why we suggest it"><DriversList drivers={rec.drivers || []} /></Section>
      <EvidenceSection rec={rec} caption={`We only suggest a change when at least ${verifiedStudies(REQUIRED)} support it.`} />
      <Stack>
        <DisclaimerBand text={D.DISCLAIMER.short} />
        <Stack gap="sm">
          <Button label="Apply change" onPress={confirm} />
          <Button variant="ghost" label="Decline" onPress={decline} />
        </Stack>
      </Stack>
    </Screen>
  );
}

/* ------------------------------------------------------------- accepted */
export function AcceptedView({ s, rec }: { s: AppState; rec: Recommendation }) {
  const to = rec.toVersion as number | undefined;
  const when = rec.decidedAt ? longDate(rec.decidedAt) : 'an earlier date';
  const tc = isTargetRec(rec) ? targetChange(rec) : null;
  if (tc) {
    return (
      <Screen title="Applied change" subtitle="Your daily targets">
        <Header status="accepted" line={`Applied on ${when}. Your daily ${tc.label.toLowerCase()} target became ${tc.after} g.`} origin={originLine(rec)}>
          <LinkButton label="See your targets" onPress={() => router.push('/targets')} />
        </Header>
        <ChangesSection title="What changed" proposal={rec.proposal} />
        <Section title="Why we suggested it"><DriversList drivers={rec.drivers || []} /></Section>
        <EvidenceSection rec={rec} caption="The claim and studies as we showed them when you applied this." />
        <DisclaimerBand text={D.DISCLAIMER.short} />
      </Screen>
    );
  }
  const split = s.split;
  const line = !split || to == null ? `Applied on ${when}.`
    : to === split.current ? `Applied on ${when}. Your split is now version ${to}.`
    : `Applied on ${when}. It became version ${to}; your split is now version ${split.current}.`;
  return (
    <Screen title="Applied change" subtitle={split ? `${split.name}, version ${rec.fromVersion} to ${to}` : 'Your split'}>
      <Header status="accepted" line={line} origin={originLine(rec)}>
        {to != null && split ? <LinkButton label={`See version ${to}`} onPress={() => router.push(`/training/version/${to}`)} /> : null}
      </Header>
      <ChangesSection title="What changed" proposal={rec.proposal} />
      <Section title="Why we suggested it"><DriversList drivers={rec.drivers || []} /></Section>
      <EvidenceSection rec={rec} caption="The claim and studies as we showed them when you applied this." />
      <DisclaimerBand text={D.DISCLAIMER.short} />
    </Screen>
  );
}

/* -------------------------------------------------------------- blocked */
/* Blocked answers: the EmptyState layout, never an error (docs/08 §8.11). */
export function BlockedView({ s, rec }: { s: AppState; rec: Recommendation }) {
  const target = isTargetRec(rec);
  const noSplit = !s.split;
  const keep = <Button variant="outline" label={target ? 'Keep my targets' : noSplit ? 'Not now' : 'Keep my current split'} onPress={goBack} />;
  const own = target ? 'Your targets are always yours to set, in Targets.' : 'Your own edits are always yours to make. We’ll label them “Your edit” in History.';
  const editOwn = () => (target ? router.push('/targets') : editMyself());
  const editLabel = target ? 'Set my targets myself' : 'Edit my split myself';
  let answer: ReactNode;
  let actions: ReactNode;
  let caption = own;
  let evidence: ReactNode = null;
  if (rec.status === 'blocked_safety') {
    answer = <EmptyAnswer icon="exclamationmark.triangle" title="Paused for your safety" body={rec.reason} />;
    actions = <><Button label="Update your health details" onPress={() => router.push('/setup/health')} />{keep}</>;
    caption = 'If something hurts, or you have a medical condition, a qualified professional such as a doctor or physiotherapist can tell you what’s safe to train.';
  } else if (rec.status === 'blocked_constraints' && rec.needs && needMet(s, rec)) {
    /* The missing detail has been given since: offer to check again. */
    const body = rec.needs === 'health'
      ? 'You’ve answered the health and safety questions, so we can check your request against the evidence.'
      : rec.needs === 'split'
        ? 'You’ve set up your split, so we can check your request against it.'
        : 'You’ve added your weight, so we can work out a protein target in grams.';
    answer = <EmptyAnswer icon="checkmark" title="Thanks, we can check it now" body={body} />;
    actions = <><Button label="Check my request again" onPress={() => recheck(rec)} />{keep}</>;
  } else if (rec.status === 'blocked_constraints' && rec.needs === 'health') {
    answer = <EmptyAnswer icon="heart" title="Answer the health questions first" body={rec.reason} />;
    actions = <><Button label="Answer the health questions" onPress={() => router.push('/setup/health')} />{keep}</>;
    caption = `They take about a minute. Until then, ${target ? 'your targets stay as they are' : 'your split stays as it is'}. ${own}`;
  } else if (rec.status === 'blocked_constraints' && rec.needs === 'split') {
    answer = <EmptyAnswer icon="list.bullet" title="We need your split first" body={rec.reason} />;
    actions = noSplit
      ? <><Button label="Choose a split" onPress={() => router.push('/setup/split')} />{keep}</>
      : <><Button label="Add days to your split" onPress={editMyself} />{keep}</>;
    caption = noSplit
      ? 'It takes about a minute. Start from a template, or build your own.'
      : 'Your split has no training days yet. Add them in the editor, then ask again.';
  } else if (rec.status === 'blocked_constraints') {
    answer = target
      ? <EmptyAnswer icon="info.circle" title="We need a detail first" body={rec.reason} />
      : <EmptyAnswer icon="info.circle" title="No room in your sessions" body={rec.reason} />;
    actions = target
      ? <><Button label={rec.needs === 'weight' ? 'Add your weight' : 'Update your details'} onPress={() => router.push(rec.needs === 'weight' ? '/setup/weight' : '/setup/training')} />{keep}</>
      : <>
          <Button label="Edit my split myself" onPress={editMyself} />
          <Button variant="outline" label="Change your session length" onPress={() => router.push('/setup/training')} />
        </>;
    caption = target ? own : `Your sessions are set to ${sessionLimit(s)} minutes. ${own}`;
  } else {
    answer = <EmptyAnswer icon="magnifyingglass" title="Not enough evidence yet" body={rec.reason || 'We couldn’t verify enough studies for this change, so we haven’t changed your plan.'} />;
    actions = <><Button label={editLabel} onPress={editOwn} />{keep}</>;
    evidence = <EvidenceStatus rec={rec} />;
  }
  return (
    <Screen title="Your request" subtitle={target ? 'Your targets are unchanged' : noSplit ? 'Nothing has changed' : 'Your split is unchanged'}>
      <Stack>
        <YouAsked rec={rec} />
        {answer}
        <Stack gap="sm">{actions}</Stack>
        <Caption>{caption}</Caption>
      </Stack>
      {evidence}
      <DisclaimerBand text={D.DISCLAIMER.short} />
    </Screen>
  );
}

/* --------------------------------------------------------------- closed */
/* Declined, replaced and withdrawn suggestions: what happened and what next. */
export function ClosedView({ s, rec }: { s: AppState; rec: Recommendation }) {
  const when = rec.decidedAt ? longDate(rec.decidedAt) : null;
  const target = isTargetRec(rec);
  const what = target ? 'your targets' : 'your split';
  let line: string;
  let primary: ReactNode;
  let showEvidence = true;
  if (rec.status === 'not_needed') {
    line = rec.reason;
    primary = <Button label="See your targets" onPress={() => router.push('/targets')} />;
  } else if (rec.status === 'rejected') {
    line = `You declined this${when ? ` on ${when}` : ''}. Nothing in ${what} changed.`;
    primary = <Button label="Ask again" onPress={() => askAgain(rec)} />;
  } else if (rec.status === 'superseded') {
    line = target
      ? 'Your target changed after we made this suggestion, so we didn’t apply it. Ask again and we’ll check your current target.'
      : 'Your split changed after we made this suggestion, so we didn’t apply it. Nothing changed. Ask again and we’ll check your current split.';
    primary = <Button label="Ask again" onPress={() => askAgain(rec)} />;
  } else if (rec.status === 'withdrawn' && evidenceStillHolds(rec)) {
    /* Withdrawn at Apply for another reason: the health answers were missing (the store re-checks them too). */
    line = !isDone(s, 'health')
      ? `We need your health and safety answers before we change anything, so we withdrew it. Nothing in ${what} changed.`
      : `We withdrew it when you tried to apply it, so nothing in ${what} changed. Ask again and we’ll check it against your current details.`;
    primary = !isDone(s, 'health')
      ? <Button label="Answer the health questions" onPress={() => router.push('/setup/health')} />
      : <Button label="Ask again" onPress={() => askAgain(rec)} />;
  } else if (rec.status === 'withdrawn') {
    line = `It no longer had ${verifiedStudies(REQUIRED)} behind it, so we withdrew it. Nothing in ${what} changed.`;
    primary = target
      ? <Button label="Set my targets myself" onPress={() => router.push('/targets')} />
      : <Button label="Edit my split myself" onPress={editMyself} />;
    showEvidence = false;
  } else {
    line = rec.reason || `Nothing in ${what} changed.`;
    primary = <Button label="Ask for a change" onPress={() => askAgain(rec)} />;
  }
  return (
    <Screen title={rec.status === 'not_needed' ? 'Your request' : 'Suggested change'} subtitle={target ? 'Your targets are unchanged' : 'Your split is unchanged'}>
      <Header status={rec.status} needs={rec.needs} line={line} origin={originLine(rec)} />
      <ChangesSection title="What it would have changed" proposal={rec.proposal} />
      {rec.drivers ? <Section title="Why we suggested it"><DriversList drivers={rec.drivers} /></Section> : null}
      {showEvidence ? <EvidenceSection rec={rec} caption="The claim and studies as we showed them." /> : null}
      <Stack>
        {primary}
        <DisclaimerBand text={D.DISCLAIMER.short} />
      </Stack>
    </Screen>
  );
}

export function NotFound() {
  return (
    <Screen title="Suggestion">
      <EmptyAnswer icon="magnifyingglass" title="We couldn’t find this suggestion" body="It may have been removed when the data on this phone was deleted.">
        <Button variant="outline" label="Go to Training" onPress={() => resetTo('/training')} />
      </EmptyAnswer>
    </Screen>
  );
}
