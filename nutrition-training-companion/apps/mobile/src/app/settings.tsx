/* Settings (prototype/src/85-settings.js, docs/08 §8.5): Finish setting up
   while anything is left, then You (each row opens one short page in the
   sign-up layout), Apple Health and your data, and About. v1 has no account,
   notifications or optional privacy choices, so those rows are left out. */
import { router } from 'expo-router';

import { remaining } from '@/features/setup';
import { lowerTitle, NOT_YET, EXPERIENCE_WORDS } from '@/features/settings/common';
import { plural, whenText } from '@/features/shared';
import { profileAge, weightLabel } from '@/features/signup/fields';
import { data as D, domain as M } from '@/shared';
import { S, useApp } from '@/store';
import { Rows, Screen, Section } from '@/ui';

export default function Settings() {
  const s = useApp();
  const p = s.profile;
  const t = s.targets;
  const done = (key: keyof typeof s.setup) => s.setup[key] !== false;
  const left = remaining(s);
  /* "health and safety, your training and more" (the titles have their own "and"). */
  const leftNames = left.slice(0, 2).map((i) => lowerTitle(i.title));
  const leftText = left.length > 2 ? `${leftNames.join(', ')} and more` : M.listJoin(leftNames);
  const flags = p.safetyFlags.filter((f) => f !== 'clinician_supervised');
  const age = profileAge(p);
  const sexWord = p.sexForEquations !== 'unspecified' ? `, ${p.sexForEquations}` : '';
  const body = p.heightCm ? `${p.heightCm} cm${sexWord}` : p.sexForEquations !== 'unspecified' ? M.capitalise(p.sexForEquations) : done('body') ? 'Not given.' : NOT_YET;
  const dev = s.devices.apple_health;
  const health = dev.status === 'active'
    ? (dev.lastSync ? `Connected. Last synced ${whenText(dev.lastSync)}.` : 'Connected.')
    : 'Not connected. Sleep, HRV and resting heart rate, for readiness.';
  const activeClaims = (D.CLAIMS as { status: string }[]).filter((c) => c.status === 'active').length;
  return (
    <Screen title="Settings">
      {left.length ? (
        <Rows rows={[{
          key: 'setup', icon: 'checklist', iconColor: 'primary', label: 'Finish setting up',
          detail: `${plural(left.length, 'thing')} left: ${leftText}.`,
          onPress: () => router.push('/setup')
        }]} />
      ) : null}
      <Section title="You">
        <Rows rows={[
          { key: 'goal', label: 'Goal', detail: M.goalLabel(p.goal), onPress: () => router.push('/setup/goal') },
          { key: 'age', label: 'Age', detail: age != null && p.birthYear ? `${age}, born ${p.birthYear}` : NOT_YET, onPress: () => router.push('/setup/age') },
          { key: 'weight', label: 'Weight', detail: p.weightKg == null ? NOT_YET : weightLabel(p.weightKg, p.weightUnit), onPress: () => router.push('/setup/weight') },
          { key: 'body', label: 'Height and sex', detail: body, onPress: () => router.push('/setup/body') },
          { key: 'health', label: 'Health and safety',
            detail: !done('health') ? 'Not answered yet. We need it before we suggest a change.'
              : flags.length ? `${plural(flags.length, 'thing')} reported. Some suggestions are paused.` : 'Nothing reported.',
            onPress: () => router.push('/setup/health') },
          { key: 'training', label: 'Training',
            detail: done('training') ? `${EXPERIENCE_WORDS[p.experience] || 'Intermediate'}. ${plural(p.daysPerWeek, 'day')} a week, ${p.sessionMinutes} min each.` : NOT_YET,
            onPress: () => router.push('/setup/training') },
          { key: 'targets', label: 'Targets',
            detail: S.hasTargets(s) && t.energyKcal != null && t.proteinG != null ? `${M.fmt.kcal(t.energyKcal)} and ${M.fmt.g(t.proteinG)} protein a day.` : NOT_YET,
            onPress: () => router.push('/targets') }
        ]} />
      </Section>
      <Section title="Health and data">
        <Rows rows={[
          { key: 'apple-health', icon: 'heart', iconColor: 'ink', label: 'Apple Health', detail: health, onPress: () => router.push('/apple-health') },
          { key: 'data', icon: 'square.and.arrow.up', iconColor: 'ink', label: 'Your data', detail: 'Everything is on this iPhone. Export it, or delete it.', onPress: () => router.push('/your-data') }
        ]} />
      </Section>
      <Section title="About">
        <Rows rows={[
          { key: 'evidence', icon: 'checkmark.seal.fill', iconColor: 'ink', label: 'Evidence library',
            detail: `${plural(activeClaims, 'claim')} we can act on, and ${plural(D.SOURCES.length, 'study', 'studies')}.`,
            onPress: () => router.push('/evidence') },
          { key: 'about', icon: 'doc.text', iconColor: 'ink', label: 'About and disclaimer',
            detail: 'Not medical advice. Data sources, privacy and support.', onPress: () => router.push('/about') }
        ]} />
      </Section>
    </Screen>
  );
}
