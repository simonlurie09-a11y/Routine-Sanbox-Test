/* Health and safety (prototype HealthPage, docs/07 §7.9): yes/no questions
   first, where an injury is, what the answers change, then optional notes.
   "A professional supervises my training" appears only with a condition. */
import { useState } from 'react';
import { View } from 'react-native';

import { Bullets, REGIONS, saved, SAFETY, SAFETY_FLAGS } from '@/features/settings/common';
import { domain as M } from '@/shared';
import { A, useApp } from '@/store';
import { spacing } from '@/theme';
import { Button, Callout, Caption, Card, CardTitle, Field, FormPage, HairlineTop, Icon, Input, MultiChips, Rows, Switch } from '@/ui';

export default function HealthPage() {
  const p = useApp((s) => s.profile);
  const [flags, setFlags] = useState<string[]>(() => p.safetyFlags.filter((f) => SAFETY_FLAGS.includes(f)));
  const [regions, setRegions] = useState<string[]>(() => p.injuryRegions.slice());
  const [notes, setNotes] = useState(() => p.healthNotes || '');
  const has = (f: string) => flags.includes(f);
  const injured = has('injury_reported');
  const needsRegion = injured && !regions.length;
  const regionWords = REGIONS.filter((r) => regions.includes(r.value)).map((r) => r.label.toLowerCase());

  const changes: string[] = [];
  if (injured) {
    changes.push(regionWords.length
      ? `We won't suggest changes that load your ${M.listJoin(regionWords)}.`
      : 'Tell us where, so we know which suggestions to pause.');
  }
  if (has('condition_reported')) {
    changes.push(has('clinician_supervised')
      ? "A professional supervises your training, so we'll make suggestions and note it on each one."
      : 'We hold training suggestions until you tell us a professional is supervising your training.');
  }
  if (has('pregnancy')) changes.push("We won't make training or nutrition suggestions. Logging still works.");
  if (has('eating_disorder_history')) changes.push("We won't suggest calorie-deficit or weight-loss targets.");

  const setFlag = (flag: string, on: boolean) => {
    let next = flags.filter((f) => f !== flag);
    if (on) next = [...next, flag].sort((a, b) => SAFETY_FLAGS.indexOf(a) - SAFETY_FLAGS.indexOf(b));
    if (flag === 'condition_reported' && !on) next = next.filter((f) => f !== 'clinician_supervised');
    setFlags(next);
  };
  const save = () => {
    const others = p.safetyFlags.filter((f) => !SAFETY_FLAGS.includes(f));
    A.updateProfile({ safetyFlags: [...others, ...flags], injuryRegions: injured ? regions.slice() : [], healthNotes: notes.trim() });
    saved('health');
  };
  const shown = SAFETY.filter((q) => !q.onlyWith || has(q.onlyWith));
  return (
    <FormPage title="Health and safety" subtitle="Do any of these apply to you?"
      footer={<Button label="Save" onPress={save} disabled={needsRegion} />}>
      <Rows rows={shown.map((q) => ({
        key: q.flag, label: q.label, detail: q.detail,
        right: <Switch on={has(q.flag)} label={q.label} onChange={(on) => setFlag(q.flag, on)} />
      }))} />
      {injured ? (
        <Field label="Where is it?" hint={needsRegion ? 'Pick at least one area to save.' : 'Pick every area that applies.'}>
          <MultiChips options={REGIONS} values={regions} order={REGIONS.map((r) => r.value)} onChange={setRegions} />
        </Field>
      ) : null}
      {changes.length ? (
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Icon name="info.circle" size={22} color="ink" />
            <CardTitle>What this changes</CardTitle>
          </View>
          <Bullets items={changes} />
          <HairlineTop>
            <Callout>Please talk to a qualified healthcare professional before you change your training or diet.</Callout>
          </HairlineTop>
        </Card>
      ) : <Caption>If none of these apply, leave them off and save. You can change them any time.</Caption>}
      <Input label="Anything else we should know?" value={notes} hint="Optional. Kept on this iPhone, encrypted by iOS."
        onChangeText={setNotes} multiline />
    </FormPage>
  );
}
