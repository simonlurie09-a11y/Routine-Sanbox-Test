/* Connecting Apple Health and keeping readiness up to date. */
import { Platform } from 'react-native';

import { A, getState } from '@/store';
import * as Health from './health';

export const HEALTH_TYPES = { sleep: true, hrv: true, resting_hr: true };

/* Ask iOS for access (Apple's sheet), then read. Returns what Health gave us. */
export async function connectAppleHealth(): Promise<{ ok: boolean; profile: Health.HealthProfile | null }> {
  if (!(await Health.isAvailable())) return { ok: false, profile: null };
  A.setAppleHealth({ status: 'pending' });
  const granted = await Health.requestAccess();
  if (!granted) {
    A.setAppleHealth({ status: 'revoked' });
    return { ok: false, profile: null };
  }
  A.setAppleHealth({ status: 'active', connectedAt: Date.now(), dataTypes: { ...HEALTH_TYPES } });
  const profile = await Health.readProfile();
  await syncHealth();
  return { ok: true, profile };
}

/* Read last night's numbers and the 28-night baseline. Called on launch and
   whenever the app comes to the front. Nothing read here is saved. */
let running = false;
export async function syncHealth() {
  const dev = getState().devices.apple_health;
  if (running || !dev || dev.status !== 'active') return;
  running = true;
  try {
    const series = await Health.readSeries();
    A.setWearableSeries(Object.keys(series).length ? series : undefined, Date.now());
  } finally {
    running = false;
  }
}

/* Stop reading (the person can also turn access off in the Health app). */
export function disconnectAppleHealth() {
  A.setAppleHealth({ status: 'revoked', connectedAt: null, lastSync: null, dataTypes: {} });
  A.setWearableSeries(undefined, 0);
}

export const healthIsSimulated = Health.SIMULATED;
export const healthSettingsHint = Platform.OS === 'ios'
  ? 'To change what Companion can read, open the Health app, tap your picture, then Apps, then Companion.'
  : 'Apple Health is only on iPhone.';
export { readProfile } from './health';
