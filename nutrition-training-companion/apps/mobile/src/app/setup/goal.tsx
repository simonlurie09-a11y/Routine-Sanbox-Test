/* Goal (prototype GoalPage): the same cards as sign-up. */
import { useState } from 'react';

import { saved } from '@/features/settings/common';
import { GoalOptions } from '@/features/signup/fields';
import { A, useApp } from '@/store';
import { Button, FormPage } from '@/ui';

export default function GoalPage() {
  const current = useApp((s) => s.profile.goal);
  const [goal, setGoal] = useState<string | null>(() => current || null);
  const save = () => {
    A.updateProfile({ goal });
    saved(null);
  };
  return (
    <FormPage title="What do you want to work on?" subtitle="Pick one. We use it to decide which studies apply to you."
      footer={<Button label="Save" onPress={save} disabled={!goal || goal === current} />}>
      <GoalOptions value={goal} onChange={setGoal} />
    </FormPage>
  );
}
