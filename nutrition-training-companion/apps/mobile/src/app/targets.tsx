/* Your daily targets (prototype Targets): your own numbers, checked against
   the evidence only when you ask, with the latest changes. Targets start
   empty in the app, so the fields start empty and Save waits for all five. */
import { router } from 'expo-router';
import { useState } from 'react';

import { isDone } from '@/features/setup';
import { saved, TARGET_FIELDS, targetSummary, type TargetField } from '@/features/settings/common';
import { digitsOnly, parseNumber } from '@/features/signup/fields';
import { domain as M } from '@/shared';
import { A, getState, S, useApp, type TargetKey, type TargetValues } from '@/store';
import { Badge, Button, Callout, Caption, Card, FormPage, Grid2, Input, Rows, Section } from '@/ui';

const RECENT_CHANGES = 3;
const CHECKS: [TargetKey, string][] = [['proteinG', 'Check my protein target'], ['fiberG', 'Check my fibre target']];

/* Runs the evidence gate on one target and opens the answer. */
function checkTarget(key: TargetKey, label: string) {
  const intent = { type: 'nutrition_target', nutrient: key, summary: `Check your daily ${M.TARGET_RULES[key].label} target against the evidence.` };
  const draft = M.evaluateChange(intent, getState(), { requestText: label });
  const id = A.createRecommendation(draft, { trigger: 'user_request', requestText: label });
  router.push(`/recommendation/${id}`);
}

export default function Targets() {
  const s = useApp();
  const t = s.targets;
  const done = isDone(s, 'targets');
  const hasValues = S.hasTargets(s);
  const [form, setForm] = useState<Record<TargetKey, string>>(() =>
    Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, t[f.key] != null ? String(t[f.key]) : ''])) as Record<TargetKey, string>);
  const values = Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, parseNumber(form[f.key])])) as Record<TargetKey, number>;
  const invalid = (f: TargetField) => Number.isNaN(values[f.key]) || values[f.key] < f.min || values[f.key] > f.max;
  const ok = TARGET_FIELDS.every((f) => !invalid(f));
  const changed = TARGET_FIELDS.some((f) => values[f.key] !== t[f.key]);
  const edHistory = s.profile.safetyFlags.includes('eating_disorder_history');
  const save = () => {
    if (changed) A.setTargets(Object.fromEntries(TARGET_FIELDS.map((f) => [f.key, Math.round(values[f.key])])) as TargetValues);
    saved('targets', changed ? 'Targets saved' : 'Targets kept', 'success');
  };
  /* An empty field isn't an error yet: it just keeps Save off until all five are in. */
  const field = (f: TargetField) => (
    <Input key={f.key} label={f.label} keyboardType="number-pad" maxLength={5} value={form[f.key]}
      error={form[f.key] !== '' && invalid(f) ? `Enter ${f.min} to ${f.max.toLocaleString('en-GB')}.` : null}
      onChangeText={(v) => { const next = digitsOnly(v, 5); setForm((x) => ({ ...x, [f.key]: next })); }} />
  );
  const history = t.history.slice().reverse();
  const label = !done && !changed && hasValues ? 'These are right' : 'Save targets';

  return (
    <FormPage title="Your daily targets" subtitle="Your own numbers. We never change them without asking."
      footer={<Button label={label} disabled={!ok || (done && !changed)} onPress={save} />}>
      {field(TARGET_FIELDS[0])}
      <Grid2>{TARGET_FIELDS.slice(1).map(field)}</Grid2>
      {edHistory ? (
        <Card>
          <Callout>You told us about a history of disordered eating, so we won't suggest calorie targets. Keep these numbers, or change them yourself.</Callout>
        </Card>
      ) : null}
      <Caption>{`We suggest a change only when its claim has ${M.REQUIRED_SOURCES} verified studies, and only when you ask.`}</Caption>

      <Section title="Check against the evidence" caption="We look at your target, your goal and your weight, and suggest a change only if verified studies back it.">
        <Rows rows={CHECKS.map(([key, text]) => {
          const claim = M.claimByKey(M.TARGET_RULES[key].claim);
          return {
            key, label: text, icon: 'checkmark.seal.fill', iconColor: 'ink' as const,
            detail: claim && claim.status === 'active' ? 'Backed by verified studies.' : "Not enough evidence yet. We'll tell you why.",
            onPress: () => checkTarget(key, text)
          };
        })} />
      </Section>

      {history.length ? (
        <Section title="Changes" caption={history.length > RECENT_CHANGES
          ? `The latest ${RECENT_CHANGES}, newest first. Every change is in History, under Nutrition.`
          : 'Newest first. Every change is also in History, under Nutrition.'}>
          <Rows rows={history.slice(0, RECENT_CHANGES).map((h, i) => ({
            key: `${h.at}-${i}`,
            label: `${M.fmt.relativeDay(h.at)}${i === 0 ? ', current' : ''}`,
            detail: targetSummary(h.values),
            right: <Badge palette="splitOrigin" status={h.origin || 'user_edit'} />
          }))} />
        </Section>
      ) : null}
    </FormPage>
  );
}
