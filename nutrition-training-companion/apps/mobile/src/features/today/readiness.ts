/* Readiness helpers shared by Today, Recovery and How readiness works: the
   prototype's C.readinessKit (prototype/src/50-today.js) and the small
   formatters from 55-recovery.js. In version 1 readiness comes only from
   Apple Health, so the wording names it instead of "a device". */
import { whenText } from '@/features/shared';
import { data as D, domain as M } from '@/shared';
import type { AppState, Device, Series } from '@/store';

export type Effect = 'normal' | 'reduced' | 'low';
export type Driver = {
  metric: string; label: string; unit: string; value: number; mean: number; sd: number; z: number; effect: Effect;
  text: { value: string; context: string };
};
export type Readiness = {
  level: Effect | 'unknown'; provider: string | null; providerName?: string;
  drivers: Driver[]; vendor: { label: string; value: number; unit: string }[]; syncedAt?: number | null;
};

/* M.readiness compares last night with the person's own 28-night baseline. */
export const readinessOf = (s: AppState): Readiness => M.readiness(s);

/* The data types readiness can use (docs/07 §7.8), and the Apple Health metric each one fills. */
export const READINESS_TYPES = ['hrv', 'resting_hr', 'sleep'] as const;
export type ReadinessType = (typeof READINESS_TYPES)[number];
export const TYPE_METRIC: Record<ReadinessType, string> = { hrv: 'hrv_sdnn_ms', resting_hr: 'resting_hr_bpm', sleep: 'sleep_total_min' };
export const METRIC_TYPE: Record<string, ReadinessType> = { hrv_sdnn_ms: 'hrv', hrv_rmssd_ms: 'hrv', resting_hr_bpm: 'resting_hr', sleep_total_min: 'sleep' };
export const typeLabel = (t: string): string => D.DATA_TYPE_LABELS[t];
export const MIN_NIGHTS: number = M.MIN_BASELINE_NIGHTS;

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const ALL_OR = 'sleep, heart rate variability or resting heart rate';
const ALL_AND = 'sleep, heart rate variability and resting heart rate';

export const isConnected = (dev: Device | undefined) => !!dev && dev.status !== 'revoked';
export const healthSeries = (s: AppState): Record<string, Series> => s.wearableSeries.apple_health || {};
export const isToday = (ts: number) => ts >= D.startOfToday() && ts < D.startOfToday() + D.DAY;

/* Readiness data types the person has switched off for Apple Health. */
export function offTypes(dev: Device | undefined): ReadinessType[] {
  if (!dev || dev.status === 'revoked') return [];
  return READINESS_TYPES.filter((t) => !dev.dataTypes[t]);
}

/* Nights Apple Health has shared for the readiness types that are switched on. */
export function nightsShared(s: AppState) {
  const dev = s.devices.apple_health;
  const series = healthSeries(s);
  const on = READINESS_TYPES.filter((t) => dev && dev.dataTypes[t]);
  return on.reduce((n, t) => Math.max(n, ((series[TYPE_METRIC[t]] && series[TYPE_METRIC[t]].points) || []).length), 0);
}

/* One plain line under the Apple Health row: last sync, and a note when a
   data type is off. The connection badge beside it carries the status word. */
export function syncLine(dev: Device | undefined): string {
  if (!dev || dev.status === 'revoked') return 'Sleep, HRV and resting heart rate, for readiness.';
  if (dev.status === 'pending') return 'Connecting';
  const last = dev.lastSync ? whenText(dev.lastSync) : null;
  let line = dev.status === 'active'
    ? (last ? `Synced ${last}` : 'Not synced yet')
    : (last ? `Last synced ${last}` : 'Not synced yet');
  const off = offTypes(dev);
  if (off.length && dev.status === 'active') {
    line += `. ${M.capitalise(M.listJoin(off.map((t) => lower(typeLabel(t)))))} ${off.length > 1 ? 'are' : 'is'} switched off`;
  }
  return line;
}

/* When readiness is unknown: which data is missing, in one plain sentence. */
export function missingReadinessText(s: AppState): string {
  const dev = s.devices.apple_health;
  if (!dev || dev.status === 'revoked') {
    return `Apple Health isn't sharing your ${ALL_OR} with us. Connect it to see your readiness.`;
  }
  if (dev.status === 'pending') return 'Apple Health is still connecting. Your readiness shows once it shares your nights.';
  if (dev.status !== 'active') return `Apple Health isn't sharing ${ALL_OR} right now. It's connected but not syncing.`;
  if (offTypes(dev).length === READINESS_TYPES.length) return `Apple Health is connected, but ${ALL_AND} are switched off.`;
  const nights = nightsShared(s);
  if (!nights) return `Apple Health hasn't shared any ${ALL_OR} yet. We set your baseline once it has ${MIN_NIGHTS} nights.`;
  if (nights < MIN_NIGHTS + 1) {
    const have = Math.max(0, nights - 1);
    return `Apple Health hasn't sent enough nights of ${ALL_OR} to set your baseline yet: ${have} of the ${MIN_NIGHTS} we need.`;
  }
  return `Apple Health hasn't sent last night's ${ALL_OR} yet.`;
}

/* "From Apple Health, last night. Synced at 07:12." */
export function sourceLine(r: Readiness): string | null {
  if (!r.provider) return null;
  if (r.syncedAt && isToday(r.syncedAt)) return `From ${r.providerName}, last night. Synced at ${M.fmt.time(r.syncedAt)}.`;
  return r.syncedAt ? `From ${r.providerName}. Last synced ${whenText(r.syncedAt)}.` : `From ${r.providerName}.`;
}

/* Keep a unit on the same line as its number ("51 ± 4 ms"). */
export const keepUnits = (str: string) => String(str).replace(/ (ms|bpm|min|kcal|g)\b/g, ' $1').replace(/ ± /g, ' ± ');

export const LEVEL_TEXT: Record<Effect, string> = {
  normal: "Last night's numbers are within your usual range.",
  reduced: "Some of last night's numbers are outside your usual range.",
  low: "Last night's numbers are well outside your usual range."
};

/* One metric value in its own unit: "44 ms", "54 bpm", "6 h 10 min". */
export function metricValue(metric: string, v: number): string {
  if (metric === 'sleep_total_min') return M.fmt.minutes(v);
  if (metric === 'resting_hr_bpm') return `${Math.round(v)} bpm`;
  return `${Math.round(v)} ms`;
}
/* Baseline as mean ± sd in the metric's unit. */
export function baselineValue(d: Driver): string {
  if (d.metric === 'sleep_total_min') return `${M.fmt.minutes(d.mean)} ± ${Math.round(d.sd)} min`;
  return `${Math.round(d.mean)} ± ${Math.round(d.sd)} ${d.unit}`;
}
export function differenceText(d: Driver): string {
  const z = Math.abs(d.z);
  if (z < 0.05) return 'Same as your usual';
  return `${M.fmt.num(z, 1)} standard deviations ${d.z < 0 ? 'below' : 'above'}`;
}

/* "Last night", then "Wed", "Tue" … for the morning each night ended. */
export function nightLabel(daysAgo: number): string {
  if (daysAgo === 0) return 'Last night';
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toLocaleDateString('en-GB', { weekday: 'short' });
}
