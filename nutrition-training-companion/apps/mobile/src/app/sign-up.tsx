/* Sign-up (prototype/src/40-onboarding.js): splash, three slides, the
   disclaimer, the health-data consent, Apple Health (optional), age, weight,
   then what you want to work on. One route holding a small step machine, with
   back between steps from the consent step on. Answers stay in memory until
   Finish, so nothing is saved half-way. */
import { Redirect, router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

import { checkWeight } from '@/features/signup/fields';
import { emptyAnswers, STEP_COMPONENTS, type Answers, type StepName } from '@/features/signup/steps';
import { disconnectAppleHealth } from '@/services/healthSync';
import { A, getState, type Profile } from '@/store';
import { overlay } from '@/ui';

/* The first steps have no back chevron. */
const NO_BACK: StepName[] = ['splash', 'slides', 'disclaimer'];

export default function SignUp() {
  const [startedOnboarded] = useState(() => getState().onboarded);
  const [nav, setNav] = useState<{ step: StepName; trail: StepName[] }>({ step: 'splash', trail: [] });
  const [ans, setAns] = useState<Answers>(emptyAnswers);

  /* A sign-up left half-way through starts again from the splash, so a
     connection made then is dropped until the person chooses again. */
  useEffect(() => {
    const s = getState();
    if (!s.onboarded && s.devices.apple_health.status !== 'revoked') disconnectAppleHealth();
  }, []);

  const set = useCallback((patch: Partial<Answers>) => setAns((a) => ({ ...a, ...patch })), []);
  const go = useCallback((next: StepName) => setNav((n) => ({ step: next, trail: [...n.trail, n.step] })), []);
  const back = useCallback(() => setNav((n) => (n.trail.length
    ? { step: n.trail[n.trail.length - 1], trail: n.trail.slice(0, -1) }
    : n)), []);

  const finish = () => {
    const h = ans.health;
    const keepDate = ans.birthDate && ans.birthDate.slice(0, 4) === ans.birthYear ? ans.birthDate : null;
    const profile: Partial<Profile> = {
      goal: ans.goal,
      birthYear: Number(ans.birthYear),
      birthDate: keepDate,
      weightKg: checkWeight(ans.weight, ans.weightUnit).kg,
      weightUnit: ans.weightUnit
    };
    /* Height and sex come with Health when it has them. */
    if (h && h.heightCm) profile.heightCm = Math.round(h.heightCm.value);
    if (h && h.sex) profile.sexForEquations = h.sex;
    const connected = ans.healthSource === 'connected' && getState().devices.apple_health.status === 'active';
    A.completeOnboarding(profile, { setup: { body: !!profile.heightCm, devices: connected } });
    overlay.toast("You're set up", 'success');
    router.replace('/');
  };

  if (startedOnboarded) return <Redirect href="/" />;
  const Step = STEP_COMPONENTS[nav.step];
  const canGoBack = nav.trail.length > 0 && !NO_BACK.includes(nav.step);
  return <Step key={nav.step} ans={ans} set={set} go={go} back={canGoBack ? back : null} finish={finish} />;
}
