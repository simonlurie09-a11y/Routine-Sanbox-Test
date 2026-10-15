/* Apple Health (HealthKit), read on the iPhone (docs/03 §3.5, docs/07 §7.1).
   The app only reads: nothing is written to Health. It asks for exactly the
   types the sign-up page lists, and nothing it reads is saved by the app;
   readiness is recomputed from Health each time the app opens.

   HealthKit never tells an app whether read access was denied: denied types
   simply return no samples, so every reader here treats "nothing" as "no data". */
import {
  CategoryValueSleepAnalysis,
  getBiologicalSexAsync,
  getDateOfBirthAsync,
  getMostRecentQuantitySample,
  isHealthDataAvailableAsync,
  queryCategorySamples,
  queryQuantitySamples,
  requestAuthorization
} from '@kingstinct/react-native-healthkit';

import type { Series } from '@/store';

export type HealthProfile = {
  birthDate: string | null;
  sex: 'female' | 'male' | null;
  weightKg: { value: number; at: number } | null;
  heightCm: { value: number; at: number } | null;
};

/* The read types, in the order the sign-up page lists them. */
const READ_TYPES = [
  'HKCharacteristicTypeIdentifierDateOfBirth',
  'HKCharacteristicTypeIdentifierBiologicalSex',
  'HKQuantityTypeIdentifierBodyMass',
  'HKQuantityTypeIdentifierHeight',
  'HKCategoryTypeIdentifierSleepAnalysis',
  'HKQuantityTypeIdentifierHeartRateVariabilitySDNN',
  'HKQuantityTypeIdentifierRestingHeartRate'
] as const;

/* Nights of history read for the readiness baseline (28 nights plus margin). */
const HISTORY_DAYS = 35;
const DAY = 24 * 60 * 60 * 1000;

export async function isAvailable(): Promise<boolean> {
  try {
    return await isHealthDataAvailableAsync();
  } catch {
    return false;
  }
}

/* Shows Apple's permission sheet (only the first time; after that iOS returns at once). */
export async function requestAccess(): Promise<boolean> {
  try {
    return await requestAuthorization({ toRead: READ_TYPES as unknown as never[] });
  } catch {
    return false;
  }
}

const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export async function readProfile(): Promise<HealthProfile> {
  const out: HealthProfile = { birthDate: null, sex: null, weightKg: null, heightCm: null };
  try {
    const dob = await getDateOfBirthAsync();
    if (dob) out.birthDate = isoDay(new Date(dob));
  } catch { /* not shared */ }
  try {
    const sex = await getBiologicalSexAsync();
    out.sex = sex === 1 ? 'female' : sex === 2 ? 'male' : null;
  } catch { /* not shared */ }
  try {
    const w = await getMostRecentQuantitySample('HKQuantityTypeIdentifierBodyMass', 'kg');
    if (w && Number.isFinite(w.quantity)) out.weightKg = { value: w.quantity, at: new Date(w.startDate).getTime() };
  } catch { /* not shared */ }
  try {
    const h = await getMostRecentQuantitySample('HKQuantityTypeIdentifierHeight', 'cm');
    if (h && Number.isFinite(h.quantity)) out.heightCm = { value: h.quantity, at: new Date(h.startDate).getTime() };
  } catch { /* not shared */ }
  return out;
}

/* Calendar days ago, in local time (0 = today). */
function daysAgo(at: number, now: number) {
  const a = new Date(at); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

/* One value per day: the mean of that day's samples (HRV), or the last one (resting HR). */
function daily(samples: readonly { startDate: Date; quantity: number }[], how: 'mean' | 'last', now: number) {
  const byDay = new Map<number, number[]>();
  [...samples].sort((x, y) => new Date(x.startDate).getTime() - new Date(y.startDate).getTime()).forEach((s) => {
    const d = daysAgo(new Date(s.startDate).getTime(), now);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d)!.push(s.quantity);
  });
  return [...byDay.entries()]
    .map(([d, vals]) => ({ daysAgo: d, value: Math.round((how === 'mean' ? vals.reduce((a, b) => a + b, 0) / vals.length : vals[vals.length - 1]) * 10) / 10 }))
    .sort((a, b) => b.daysAgo - a.daysAgo);
}

/* Minutes asleep per night. Samples from several sources (watch, phone, ring)
   overlap, so asleep intervals are merged before adding them up. A night
   belongs to the day it ended. */
const ASLEEP = new Set<number>([
  CategoryValueSleepAnalysis.asleepUnspecified, CategoryValueSleepAnalysis.asleepCore,
  CategoryValueSleepAnalysis.asleepDeep, CategoryValueSleepAnalysis.asleepREM
]);
export function nightlySleep(samples: readonly { startDate: Date; endDate: Date; value: number }[], now: number) {
  const byNight = new Map<number, [number, number][]>();
  samples.filter((s) => ASLEEP.has(Number(s.value))).forEach((s) => {
    const start = new Date(s.startDate).getTime();
    const end = new Date(s.endDate).getTime();
    if (!(end > start)) return;
    const night = daysAgo(end, now);
    if (!byNight.has(night)) byNight.set(night, []);
    byNight.get(night)!.push([start, end]);
  });
  return [...byNight.entries()].map(([night, spans]) => {
    spans.sort((a, b) => a[0] - b[0]);
    let total = 0;
    let [cs, ce] = spans[0];
    for (const [s, e] of spans.slice(1)) {
      if (s <= ce) ce = Math.max(ce, e);
      else { total += ce - cs; [cs, ce] = [s, e]; }
    }
    total += ce - cs;
    return { daysAgo: night, value: Math.round(total / 60000) };
  }).filter((p) => p.value >= 60).sort((a, b) => b.daysAgo - a.daysAgo);
}

/* The series the readiness model reads (same shape as the prototype's samples). */
export async function readSeries(now = Date.now()): Promise<Record<string, Series>> {
  const since = new Date(now - HISTORY_DAYS * DAY);
  const filter = { date: { startDate: since } };
  const out: Record<string, Series> = {};
  try {
    const hrv = await queryQuantitySamples('HKQuantityTypeIdentifierHeartRateVariabilitySDNN', { limit: 0, unit: 'ms', filter });
    const pts = daily(hrv as never, 'mean', now);
    if (pts.length) out.hrv_sdnn_ms = { unit: 'ms', label: 'HRV (SDNN)', points: pts };
  } catch { /* not shared */ }
  try {
    const rhr = await queryQuantitySamples('HKQuantityTypeIdentifierRestingHeartRate', { limit: 0, unit: 'count/min', filter });
    const pts = daily(rhr as never, 'last', now);
    if (pts.length) out.resting_hr_bpm = { unit: 'bpm', label: 'Resting heart rate', points: pts };
  } catch { /* not shared */ }
  try {
    const sleep = await queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', { limit: 0, filter });
    const pts = nightlySleep(sleep as never, now);
    if (pts.length) out.sleep_total_min = { unit: 'min', label: 'Sleep', points: pts };
  } catch { /* not shared */ }
  return out;
}

export const SIMULATED = false;
