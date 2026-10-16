/* Age (prototype AgePage), with the same under-18 rules as sign-up: a year
   that makes someone under 18 can't be saved, and a year that turns 18 this
   year asks first (docs/07 §7.9). */
import { useState } from 'react';

import { saved } from '@/features/settings/common';
import { ADULT_AGE, AgeField, checkAge, longBirth } from '@/features/signup/fields';
import { A, useApp } from '@/store';
import { Button, Caption, FormPage, FromHealth, overlay } from '@/ui';

export default function AgePage() {
  const p = useApp((s) => s.profile);
  const [year, setYear] = useState(() => (p.birthYear ? String(p.birthYear) : ''));
  const keepDate = p.birthDate && Number(p.birthDate.slice(0, 4)) === Number(year) ? p.birthDate : null;
  const check = checkAge(year, keepDate);
  const minor = check.valid && check.verdict === 'minor';
  const store = () => {
    A.updateProfile({ birthYear: check.year, birthDate: keepDate });
    saved(null);
  };
  /* Born exactly 18 years ago: the year alone can't tell, so ask (as sign-up does). */
  const save = () => (check.verdict !== 'ask' ? store() : overlay.alert({
    title: `Have you turned ${ADULT_AGE} yet?`,
    message: `If you were born in ${check.year}, you turn ${ADULT_AGE} this year.`,
    buttons: [
      { label: 'Not yet', style: 'cancel', onPress: () => overlay.toast(`Companion is for adults, ${ADULT_AGE} and over, so we haven't saved it.`, 'error') },
      { label: `Yes, I'm ${ADULT_AGE}`, onPress: store }
    ]
  }));
  return (
    <FormPage title="What year were you born?" subtitle={`Companion is for adults, ${ADULT_AGE} and over.`}
      footer={<Button label="Save" onPress={save} disabled={!check.valid || minor || check.year === p.birthYear} />}>
      <AgeField value={year} onChange={setYear}
        error={check.error || (minor ? `Companion is for adults, ${ADULT_AGE} and over, so we can't save this year.` : null)} />
      {keepDate ? <FromHealth text={`Born ${longBirth(keepDate)}, from Apple Health.`} /> : null}
      <Caption>We use it for energy estimates.</Caption>
    </FormPage>
  );
}
