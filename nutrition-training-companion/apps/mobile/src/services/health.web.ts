/* Web previews and screenshots only: HealthKit exists only on iPhone, so the
   web build reads the prototype's sample series instead. This file is never
   part of the iOS app (Metro picks health.ts there). */
import { data as D } from '@/shared';
import type { Series } from '@/store';
import type { HealthProfile } from './health';

export type { HealthProfile };
export const SIMULATED = true;

export async function isAvailable() { return true; }
export async function requestAccess() { return true; }
export async function readProfile(): Promise<HealthProfile> {
  return { birthDate: '1994-03-08', sex: null, weightKg: { value: 82.4, at: Date.now() - 2 * 86400000 }, heightCm: { value: 180, at: Date.now() - 200 * 86400000 } };
}
export function nightlySleep() { return []; }
export async function readSeries(): Promise<Record<string, Series>> {
  const ws = D.WEARABLE_SERIES;
  return {
    hrv_sdnn_ms: { unit: 'ms', label: 'HRV (SDNN)', points: ws.apple_health.hrv_sdnn_ms.points },
    resting_hr_bpm: { unit: 'bpm', label: 'Resting heart rate', points: ws.oura.resting_hr_bpm.points },
    sleep_total_min: { unit: 'min', label: 'Sleep', points: ws.oura.sleep_total_min.points }
  };
}
