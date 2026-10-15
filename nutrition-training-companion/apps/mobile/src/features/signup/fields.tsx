/* Profile answers shared by sign-up and the setup pages in Settings: the age
   gate, weight in kg or lb, the goal cards and what Apple Health is read for.
   Ported from prototype/src/35-setup.js (checkAge, checkWeight, AgeField,
   WeightField, GoalOptions) and 33-health-import.js (ageOn). */
import { domain as M } from '@/shared';
import { ChoiceChips, Input, OptionCard, Stack } from '@/ui';

export const ADULT_AGE = 18;
export const EARLIEST_YEAR = 1900;
const LB = 0.45359237;

export type WeightUnit = 'kg' | 'lb';
export const WEIGHT_UNITS: { value: WeightUnit; label: string }[] = [{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }];

/* What Apple Health is read for, in the order the permission sheet asks.
   It matches the read types in src/services/health.ts exactly. */
export const HEALTH_READS = [
  { key: 'dob', icon: 'person.crop.circle', label: 'Date of birth', detail: "Your age, so you don't type it." },
  { key: 'body', icon: 'target', label: 'Weight, height and sex', detail: 'Protein and energy targets.' },
  { key: 'readiness', icon: 'waveform.path.ecg', label: 'Sleep, HRV and resting heart rate', detail: 'Readiness, against your own baseline.' }
];

/* ------------------------------------------------------------- helpers */
export const thisYear = () => new Date().getFullYear();
export const parseNumber = (v: string | number | null | undefined) => {
  const t = String(v == null ? '' : v).trim().replace(',', '.');
  return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
};
export const digitsOnly = (v: string, max: number) => String(v || '').replace(/[^0-9]/g, '').slice(0, max);
export const decimalOnly = (v: string) => String(v || '').replace(/[^0-9.,]/g, '').slice(0, 6);
export const longBirth = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};
export const shortDay = (ts: number) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/* Age in whole years on a day, from an ISO birth date (YYYY-MM-DD). */
export function ageOn(birthDate: string, now = new Date()) {
  const [y, m, d] = birthDate.split('-').map(Number);
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age -= 1;
  return age;
}
/* The person's age from what the profile holds (exact when Health gave a date). */
export function profileAge(p: { birthDate: string | null; birthYear: number | null }) {
  if (p.birthDate) return ageOn(p.birthDate);
  return p.birthYear ? thisYear() - p.birthYear : null;
}

export type AgeVerdict = 'adult' | 'minor' | 'ask';
export type AgeCheck = { valid: boolean; error: string | null; year: number; age: number | null; verdict: AgeVerdict | null };
/* Birth year (and the exact date, when Health gave one) -> can they use the app? */
export function checkAge(yearText: string, birthDate: string | null): AgeCheck {
  const y = Number(yearText);
  const now = thisYear();
  const complete = String(yearText || '').length === 4;
  const valid = complete && y >= EARLIEST_YEAR && y <= now;
  const error = complete && !valid ? `Enter a year between ${EARLIEST_YEAR} and ${now}.` : null;
  if (!valid) return { valid: false, error, year: y, age: null, verdict: null };
  const exact = birthDate && Number(birthDate.slice(0, 4)) === y ? ageOn(birthDate) : null;
  const age = exact != null ? exact : now - y;
  /* Born exactly 18 years ago with no exact date: the year alone can't tell. */
  const verdict: AgeVerdict = exact != null
    ? (exact >= ADULT_AGE ? 'adult' : 'minor')
    : age > ADULT_AGE ? 'adult' : age < ADULT_AGE ? 'minor' : 'ask';
  return { valid: true, error: null, year: y, age, verdict };
}

/* Weight text in kg (30 to 300) or lb (66 to 661) -> kilograms. Pounds are
   kept to 0.01 kg so they convert back to exactly what was typed. */
const WEIGHT_RANGE: Record<WeightUnit, [number, number]> = { kg: [30, 300], lb: [66, 661] };
export function checkWeight(text: string, unit: WeightUnit) {
  const v = parseNumber(text);
  const [lo, hi] = WEIGHT_RANGE[unit] || WEIGHT_RANGE.kg;
  const error = text !== '' && !(v >= lo && v <= hi) ? `Between ${lo} and ${hi} ${unit}.` : null;
  const kg = unit === 'lb' ? Math.round(v * LB * 100) / 100 : Math.round(v * 10) / 10;
  return { valid: text !== '' && !error, error, kg };
}
export const weightText = (kg: number | null, unit: WeightUnit) =>
  (kg == null ? '' : String(unit === 'lb' ? Math.round((kg / LB) * 10) / 10 : Math.round(kg * 10) / 10));
/* "82.4 kg" or "181.7 lb", in the unit the person chose. */
export const weightLabel = (kg: number, unit: WeightUnit) =>
  (unit === 'lb' ? `${weightText(kg, 'lb')} lb` : `${M.fmt.num(kg, 1)} kg`);

/* --------------------------------------------- fields shared with Settings */
export function GoalOptions({ value, onChange }: { value: string | null; onChange: (goal: string) => void }) {
  return (
    <Stack gap="base">
      {(M.GOALS as { id: string; label: string; body: string; icon: string }[]).map((g) => (
        <OptionCard key={g.id} icon={g.icon} title={g.label} body={g.body} selected={value === g.id} onPress={() => onChange(g.id)} />
      ))}
    </Stack>
  );
}

export function AgeField({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: string | null }) {
  return (
    <Input label="Birth year" keyboardType="number-pad" autoComplete="birthdate-year" placeholder="For example, 1990"
      maxLength={4} value={value} error={error} onChangeText={(v) => onChange(digitsOnly(v, 4))} />
  );
}

export function WeightField({ value, unit, onChange, onUnit, error }: {
  value: string; unit: WeightUnit; onChange: (v: string) => void; onUnit: (u: WeightUnit) => void; error?: string | null;
}) {
  const changeUnit = (next: WeightUnit) => {
    if (next === unit) return;
    const v = parseNumber(value);
    if (!Number.isNaN(v)) onChange(String(Math.round((next === 'lb' ? v / LB : v * LB) * 10) / 10));
    onUnit(next);
  };
  return (
    <Stack gap="sm">
      <Input label={`Weight (${unit})`} keyboardType="decimal-pad" autoComplete="off" value={value} error={error}
        placeholder={unit === 'lb' ? 'For example, 165' : 'For example, 75'} onChangeText={(v) => onChange(decimalOnly(v))} />
      <ChoiceChips options={WEIGHT_UNITS} value={unit} onChange={changeUnit} />
    </Stack>
  );
}
