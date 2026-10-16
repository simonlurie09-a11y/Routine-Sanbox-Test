/* Weight (prototype WeightPage): kg or lb, pounds kept to 0.01 kg. */
import { useState } from 'react';

import { saved } from '@/features/settings/common';
import { checkWeight, parseNumber, WeightField, weightText, type WeightUnit } from '@/features/signup/fields';
import { A, useApp } from '@/store';
import { Button, Caption, FormPage } from '@/ui';

export default function WeightPage() {
  const p = useApp((s) => s.profile);
  const [unit, setUnit] = useState<WeightUnit>(() => p.weightUnit || 'kg');
  const [text, setText] = useState(() => weightText(p.weightKg, p.weightUnit || 'kg'));
  const check = checkWeight(text, unit);
  const same = check.valid && unit === (p.weightUnit || 'kg') && parseNumber(text) === parseNumber(weightText(p.weightKg, unit));
  const save = () => {
    A.updateProfile({ weightKg: check.kg, weightUnit: unit });
    saved(null);
  };
  return (
    <FormPage title="What do you weigh?" subtitle="We use it to work out protein and energy targets."
      footer={<Button label="Save" onPress={save} disabled={!check.valid || same} />}>
      <WeightField value={text} unit={unit} onChange={setText} onUnit={setUnit} error={check.error} />
      <Caption>Weigh yourself at the same time of day for the most useful numbers.</Caption>
    </FormPage>
  );
}
