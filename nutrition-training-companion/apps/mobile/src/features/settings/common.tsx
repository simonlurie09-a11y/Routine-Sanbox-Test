/* Pieces shared by Settings and the setup pages (prototype/src/35-setup.js
   and 85-settings.js): the health and safety questions, training choices,
   target fields, and the save-and-go-back step every setup page ends with. */
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { domain as M } from '@/shared';
import { A, type Profile, type SetupKey, type TargetKey, type TargetValues } from '@/store';
import { spacing } from '@/theme';
import { goBack, overlay, T } from '@/ui';

export const NOT_YET = 'Not set yet';

export const SAFETY: { flag: string; label: string; detail: string; onlyWith?: string }[] = [
  { flag: 'injury_reported', label: 'An injury or pain', detail: 'Anything that affects how you train.' },
  { flag: 'condition_reported', label: 'A medical condition', detail: 'Anything a doctor is treating or monitoring.' },
  { flag: 'clinician_supervised', label: 'A professional supervises my training', detail: 'For example a doctor or physiotherapist. It lifts the hold a medical condition puts on suggestions.', onlyWith: 'condition_reported' },
  { flag: 'pregnancy', label: 'Pregnancy', detail: 'Now, or if you might be.' },
  { flag: 'eating_disorder_history', label: 'A history of disordered eating', detail: 'Now or in the past.' }
];
export const SAFETY_FLAGS = SAFETY.map((x) => x.flag);
export const REGIONS = [
  { value: 'upper', label: 'Upper body' },
  { value: 'lower', label: 'Lower body' },
  { value: 'core', label: 'Core' }
];
export const SEX_OPTIONS: { value: Profile['sexForEquations']; label: string }[] = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'unspecified', label: 'Prefer not to say' }
];
export const EXPERIENCE: { value: Profile['experience']; label: string }[] = [
  { value: 'novice', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' }
];
export const EXPERIENCE_WORDS: Record<string, string> = { novice: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
export const SESSION_MINUTES = [45, 60, 75, 90];

export type TargetField = { key: TargetKey; label: string; name: string; min: number; max: number; format: (v: number) => string };
export const TARGET_FIELDS: TargetField[] = [
  { key: 'energyKcal', label: 'Calories (kcal)', name: 'Calories', min: 1, max: 10000, format: (v) => M.fmt.kcal(v) },
  { key: 'proteinG', label: 'Protein (g)', name: 'Protein', min: 0, max: 1000, format: (v) => M.fmt.g(v) },
  { key: 'carbohydrateG', label: 'Carbs (g)', name: 'Carbs', min: 0, max: 1000, format: (v) => M.fmt.g(v) },
  { key: 'fatG', label: 'Fat (g)', name: 'Fat', min: 0, max: 1000, format: (v) => M.fmt.g(v) },
  { key: 'fiberG', label: 'Fibre (g)', name: 'Fibre', min: 0, max: 300, format: (v) => M.fmt.g(v) }
];
/* "2,300 kcal, 160 g protein, 250 g carbs, 70 g fat, 30 g fibre" */
export function targetSummary(values: TargetValues) {
  return TARGET_FIELDS.filter((f) => values[f.key] != null)
    .map((f, i) => (i === 0 ? f.format(values[f.key] as number) : `${f.format(values[f.key] as number)} ${f.name.toLowerCase()}`)).join(', ');
}

/* A setup page's last step: mark it done (when it's a setup item), say so, go back. */
export function saved(key?: SetupKey | null, message = 'Saved', variant: 'info' | 'success' = 'info') {
  if (key) A.completeSetup(key);
  overlay.toast(message, variant);
  goBack();
}

/* A setup item's title mid-sentence: "health and safety", but "Apple Health". */
export const lowerTitle = (t: string) => (t.startsWith('Apple') ? t : t.charAt(0).toLowerCase() + t.slice(1));

/* A plain bulleted list (React Native has no <ul>). */
export function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((item, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
          <T size="callout" color="inkMuted80">•</T>
          <T size="callout" color="inkMuted80" style={{ flex: 1 }}>{item}</T>
        </View>
      ))}
    </View>
  );
}
