/* Your training (prototype TrainingPage): experience, days a week, session
   length and equipment, so anything suggested fits the week. */
import { useState } from 'react';

import { EXPERIENCE, saved, SESSION_MINUTES } from '@/features/settings/common';
import { data as D, domain as M } from '@/shared';
import { A, useApp, type Profile } from '@/store';
import { Button, ChoiceChips, Field, FormPage, MultiChips, Row, Stepper, T } from '@/ui';

type Form = Pick<Profile, 'experience' | 'daysPerWeek' | 'sessionMinutes' | 'equipment'>;

export default function TrainingPage() {
  const p = useApp((s) => s.profile);
  const [form, setForm] = useState<Form>(() => ({
    experience: p.experience || 'intermediate',
    daysPerWeek: p.daysPerWeek || 4,
    sessionMinutes: SESSION_MINUTES.includes(p.sessionMinutes) ? p.sessionMinutes : 60,
    equipment: (p.equipment || D.EQUIPMENT).slice()
  }));
  const set = (patch: Partial<Form>) => setForm((f) => ({ ...f, ...patch }));
  const save = () => {
    A.updateProfile({ ...form, equipment: form.equipment.slice() });
    saved('training');
  };
  const equipment = (D.EQUIPMENT as string[]);
  return (
    <FormPage title="Your training" subtitle="So anything we suggest fits your week."
      footer={<Button label="Save" onPress={save} />}>
      <Field label="Experience">
        <ChoiceChips options={EXPERIENCE} value={form.experience} onChange={(v) => set({ experience: v })} />
      </Field>
      <Row between>
        <T size="callout" weight="semiBold">Days per week</T>
        <Stepper label="days per week" value={form.daysPerWeek} min={1} max={7} onChange={(v) => set({ daysPerWeek: v })} />
      </Row>
      <Field label="Session length" hint="Including warm-up. We keep suggestions inside it.">
        <ChoiceChips options={SESSION_MINUTES.map((m) => ({ value: m, label: `${m} min` }))}
          value={form.sessionMinutes} onChange={(v) => set({ sessionMinutes: v })} />
      </Field>
      <Field label="Equipment you can use" hint="Pick everything you have access to.">
        <MultiChips options={equipment.map((e) => ({ value: e, label: M.capitalise(e) as string }))}
          values={form.equipment} order={equipment} onChange={(v) => set({ equipment: v })} />
      </Field>
    </FormPage>
  );
}
