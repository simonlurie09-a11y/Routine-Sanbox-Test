/* Height and sex (prototype BodyPage): both optional, for energy estimates. */
import { useState } from 'react';

import { saved, SEX_OPTIONS } from '@/features/settings/common';
import { digitsOnly, parseNumber } from '@/features/signup/fields';
import { A, useApp, type Profile } from '@/store';
import { Button, ChoiceChips, Field, FormPage, Input } from '@/ui';

export default function BodyPage() {
  const p = useApp((s) => s.profile);
  const [height, setHeight] = useState(() => (p.heightCm != null ? String(p.heightCm) : ''));
  const [sex, setSex] = useState<Profile['sexForEquations']>(() => p.sexForEquations || 'unspecified');
  const h = parseNumber(height);
  const hErr = height !== '' && !(h >= 100 && h <= 250) ? 'Between 100 and 250 cm.' : null;
  const save = () => {
    A.updateProfile({ heightCm: height === '' ? null : Math.round(h), sexForEquations: sex });
    saved('body');
  };
  return (
    <FormPage title="Height and sex" subtitle="We use these for energy estimates. Both are optional."
      footer={<Button label="Save" onPress={save} disabled={!!hErr} />}>
      <Input label="Height (cm)" keyboardType="number-pad" maxLength={3} value={height} error={hErr}
        placeholder="For example, 175" onChangeText={(v) => setHeight(digitsOnly(v, 3))} />
      <Field label="Sex for energy equations" hint="Energy equations differ slightly by sex, and we use it for nothing else.">
        <ChoiceChips options={SEX_OPTIONS} value={sex} onChange={setSex} />
      </Field>
    </FormPage>
  );
}
