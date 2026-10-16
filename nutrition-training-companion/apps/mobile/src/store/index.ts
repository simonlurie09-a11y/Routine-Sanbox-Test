/* The app's state, actions and selectors. One zustand store; screens read it
   with useApp(selector) and change it only through `A` (the actions). The
   action logic is ported from the prototype's store (prototype/src/20-store.js)
   so both behave the same, including the evidence gate re-check on accept.
   Everything lives on the phone (see ./persistence). */
import { create } from 'zustand';

import { data as D, domain as M, type Food } from '@/shared';
import { eraseSaved, loadSaved, saveNow } from './persistence';
import type { AppState, Device, LogEntry, Meal, Profile, Recommendation, SetupKey, Split, SplitDefinition, TargetValues } from './types';

export * from './types';

let nextId = 1;
export const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(nextId++).toString(36)}`;

export const SETUP_KEYS: SetupKey[] = ['health', 'training', 'split', 'targets', 'body', 'devices'];
const EMPTY_TARGETS: TargetValues = { energyKcal: null, proteinG: null, carbohydrateG: null, fatG: null, fiberG: null };
const NO_DEVICE: Device = { status: 'revoked', connectedAt: null, lastSync: null, dataTypes: {} };

/* A new install: nothing logged, nothing set up, no targets, no split. */
export function freshState(): AppState {
  return {
    version: 1,
    onboarded: false,
    profile: {
      goal: null, heightCm: null, weightKg: null, weightUnit: 'kg', birthYear: null, birthDate: null,
      sexForEquations: 'unspecified', experience: 'intermediate', daysPerWeek: 4, sessionMinutes: 60,
      equipment: D.EQUIPMENT.slice(), safetyFlags: [], injuryRegions: [], healthNotes: '', splitSource: null
    },
    setup: Object.fromEntries(SETUP_KEYS.map((k) => [k, false])) as Record<SetupKey, boolean>,
    consents: { health_data_processing: false },
    disclaimerAcknowledgedAt: null,
    targets: { ...EMPTY_TARGETS, history: [] },
    customFoods: [],
    foodLog: [],
    split: null,
    recommendations: [],
    sessions: [],
    devices: { apple_health: { ...NO_DEVICE } },
    wearableSeries: {},
    notificationsReadAt: 0
  };
}

/* Saved keys. wearableSeries is read from HealthKit each launch and never saved. */
const PERSISTED: (keyof AppState)[] = ['version', 'onboarded', 'profile', 'setup', 'consents', 'disclaimerAcknowledgedAt', 'targets',
  'customFoods', 'foodLog', 'split', 'recommendations', 'sessions', 'devices', 'notificationsReadAt'];

function initialState(): AppState {
  const base = freshState();
  const saved = loadSaved() as Partial<AppState> | null;
  if (!saved || saved.version !== 1) return base;
  const merged = { ...base } as AppState;
  PERSISTED.forEach((k) => { if (saved[k] !== undefined) (merged as Record<string, unknown>)[k] = saved[k]; });
  merged.profile = { ...base.profile, ...(saved.profile || {}) };
  merged.setup = { ...base.setup, ...(saved.setup || {}) };
  return merged;
}

export const useApp = create<AppState>(() => initialState());
export const getState = () => useApp.getState();
const set = (patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) => useApp.setState(patch as Partial<AppState>);

/* Save a moment after each change (one write for a burst of changes). */
let saveTimer: ReturnType<typeof setTimeout> | null = null;
useApp.subscribe((s) => {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    const out: Record<string, unknown> = {};
    PERSISTED.forEach((k) => { out[k] = s[k]; });
    saveNow(JSON.stringify(out));
  }, 300);
});

/* ---------------------------------------------------------------- helpers */
function logEntry(food: Food, grams: number, meal: Meal, at: number): LogEntry {
  return {
    id: uid('log'), at, meal, foodId: food.id, name: food.name, brand: food.brand || null, grams,
    isBeverage: !!food.isBeverage, nutrients: M.nutrientsFor(food, grams), confidence: food.confidence || 'high', source: food.source
  };
}
const startOfToday = () => D.startOfToday() as number;
const DAY = D.DAY as number;

/* ---------------------------------------------------------------- actions */
export const A = {
  /* Profile, sign-up, setup */
  updateProfile(patch: Partial<Profile>) {
    set((s) => ({ profile: { ...s.profile, ...patch } }));
  },
  acknowledgeDisclaimer() {
    set({ disclaimerAcknowledgedAt: Date.now() });
  },
  agreeToHealthData() {
    set({ consents: { health_data_processing: true } });
  },
  completeOnboarding(profilePatch: Partial<Profile>, extra?: { setup?: Partial<Record<SetupKey, boolean>> }) {
    set((s) => ({
      onboarded: true,
      profile: { ...s.profile, ...profilePatch },
      setup: { ...s.setup, ...((extra && extra.setup) || {}) },
      disclaimerAcknowledgedAt: s.disclaimerAcknowledgedAt || Date.now()
    }));
  },
  completeSetup(key: SetupKey) {
    set((s) => ({ setup: { ...s.setup, [key]: true } }));
  },

  /* Food */
  logFood({ food, grams, meal, at }: { food: Food; grams: number; meal?: Meal; at?: number }) {
    const e = logEntry(food, grams, meal || 'snack', at || Date.now());
    set((s) => ({ foodLog: [...s.foodLog, e] }));
    return e.id;
  },
  updateLogEntry(id: string, patch: Partial<Pick<LogEntry, 'grams' | 'meal' | 'at'>>) {
    set((s) => ({
      foodLog: s.foodLog.map((e) => {
        if (e.id !== id) return e;
        const next = { ...e, ...patch };
        if (patch.grams != null) {
          const food = M.findFood(e.foodId, s.customFoods);
          if (food) next.nutrients = M.nutrientsFor(food, patch.grams);
        }
        return next;
      })
    }));
  },
  deleteLogEntry(id: string) {
    set((s) => ({ foodLog: s.foodLog.filter((e) => e.id !== id) }));
  },
  /* Your own foods, and products fetched from Open Food Facts (kept so they work offline). */
  saveCustomFood(food: Food) {
    const f: Food = { ...food, id: food.id || uid('food'), createdAt: Date.now() };
    set((s) => ({ customFoods: [f, ...s.customFoods.filter((x) => x.id !== f.id)] }));
    return f.id;
  },
  setTargets(values: TargetValues) {
    set((s) => ({ targets: { ...s.targets, ...values, history: [...s.targets.history, { at: Date.now(), origin: 'user_edit', values }] } }));
  },

  /* Training */
  /* Start from the template (the prototype's four-day upper/lower split) or an empty week. */
  chooseSplit(kind: 'sample' | 'own') {
    const definition: SplitDefinition = kind === 'sample'
      ? D.clone(D.SPLIT_V3)
      : { style: 'hypertrophy', days: [] };
    const split: Split = {
      name: kind === 'sample' ? 'Upper / Lower, 4 days' : 'My split',
      current: 1,
      versions: [{ number: 1, createdAt: Date.now(), origin: 'template', note: kind === 'sample' ? 'Started from the upper/lower template.' : 'Started an empty split.', definition }]
    };
    set((s) => ({ split, profile: { ...s.profile, splitSource: kind } }));
  },
  saveSplitEdit(definition: SplitDefinition, note?: string) {
    let number = 0;
    set((s) => {
      if (!s.split) return {};
      number = Math.max(...s.split.versions.map((v) => v.number)) + 1;
      const version = { number, createdAt: Date.now(), origin: 'user_edit' as const, note: note || 'Your edit.', definition };
      return { split: { ...s.split, current: number, versions: [...s.split.versions, version] } };
    });
    return number;
  },
  renameSplit(name: string) {
    set((s) => (s.split ? { split: { ...s.split, name } } : {}));
  },
  revertToVersion(target: number) {
    const s = getState();
    const v = s.split && s.split.versions.find((x) => x.number === target);
    if (!v) return null;
    return A.saveSplitEdit(D.clone(v.definition), `Went back to version ${target}.`);
  },
  logSession(session: Omit<AppState['sessions'][number], 'id' | 'at'> & { at?: number }) {
    const s2: AppState['sessions'][number] = { id: uid('ses'), at: Date.now(), ...session };
    set((s) => ({ sessions: [...s.sessions, s2] }));
    return s2.id;
  },

  /* Recommendations. create() stores whatever the gate decided. */
  createRecommendation(draft: Partial<Recommendation>, extra?: { trigger?: string; requestText?: string | null }) {
    const s = getState();
    const rec = {
      id: uid('rec'), createdAt: Date.now(), trigger: (extra && extra.trigger) || 'user_request',
      requestText: (extra && extra.requestText) || null, fromVersion: s.split ? s.split.current : null, ...draft
    } as Recommendation;
    set((st) => ({ recommendations: [rec, ...st.recommendations] }));
    return rec.id;
  },
  /* Accept re-checks the gate before writing anything (the database does the same). */
  acceptRecommendation(id: string): { ok: boolean; reason?: string; version?: number; targets?: unknown } {
    const state = getState();
    const rec = state.recommendations.find((r) => r.id === id);
    if (!rec || rec.status !== 'proposed') return { ok: false, reason: 'not_proposed' };
    const mark = (status: string, extra?: Record<string, unknown>) =>
      set((s) => ({ recommendations: s.recommendations.map((r) => (r.id === id ? { ...r, status, decidedAt: Date.now(), ...(extra || {}) } : r)) }));
    const claim = M.claimByKey(rec.claimKey);
    if (!claim || claim.status !== 'active' || M.verifiedSourcesFor(claim).length < M.REQUIRED_SOURCES) {
      mark('withdrawn');
      return { ok: false, reason: 'gate_failed' };
    }
    if (state.setup.health === false) {
      mark('withdrawn');
      return { ok: false, reason: 'needs_health' };
    }
    if (rec.kind === 'target_change') {
      const changes: { key: keyof TargetValues; before: number | null; after: number }[] = (rec.proposal && rec.proposal.targets) || [];
      const moved = changes.some((t) => Math.round(state.targets[t.key] == null ? -1 : (state.targets[t.key] as number)) !== (t.before == null ? -1 : t.before));
      if (moved) {
        mark('superseded');
        return { ok: false, reason: 'superseded' };
      }
      set((s) => {
        const values: TargetValues = { energyKcal: s.targets.energyKcal, proteinG: s.targets.proteinG, carbohydrateG: s.targets.carbohydrateG, fatG: s.targets.fatG, fiberG: s.targets.fiberG };
        changes.forEach((t) => { values[t.key] = t.after; });
        return {
          targets: { ...s.targets, ...values, history: [...s.targets.history, { at: Date.now(), origin: 'app_recommendation', recommendationId: id, values }] },
          recommendations: s.recommendations.map((r) => (r.id === id ? { ...r, status: 'accepted', decidedAt: Date.now() } : r))
        };
      });
      return { ok: true, targets: changes };
    }
    if (!state.split || rec.fromVersion !== state.split.current) {
      mark('superseded');
      return { ok: false, reason: 'superseded' };
    }
    let number = 0;
    set((s) => {
      if (!s.split) return {};
      number = Math.max(...s.split.versions.map((v) => v.number)) + 1;
      const version = { number, createdAt: Date.now(), origin: 'app_recommendation' as const, recommendationId: id, note: M.summarizeOps(rec.proposal.ops), definition: rec.proposal.definition };
      return {
        split: { ...s.split, current: number, versions: [...s.split.versions, version] },
        recommendations: s.recommendations.map((r) => (r.id === id ? { ...r, status: 'accepted', decidedAt: Date.now(), toVersion: number } : r))
      };
    });
    return { ok: true, version: number };
  },
  rejectRecommendation(id: string) {
    set((s) => ({ recommendations: s.recommendations.map((r) => (r.id === id ? { ...r, status: 'rejected', decidedAt: Date.now() } : r)) }));
  },

  /* Apple Health */
  setAppleHealth(patch: Partial<Device>) {
    set((s) => ({ devices: { ...s.devices, apple_health: { ...s.devices.apple_health, ...patch } } }));
  },
  setWearableSeries(series: AppState['wearableSeries']['apple_health'] | undefined, syncedAt: number) {
    set((s) => ({
      wearableSeries: series ? { apple_health: series } : {},
      devices: { ...s.devices, apple_health: { ...s.devices.apple_health, lastSync: syncedAt } }
    }));
  },

  /* Notifications and privacy */
  markNotificationsRead() {
    set({ notificationsReadAt: Date.now() });
  },
  /* Delete everything on this phone and start again from sign-up. */
  eraseAll() {
    eraseSaved();
    useApp.setState(freshState(), true);
  }
};

/* -------------------------------------------------------------- selectors */
export const S = {
  todayEntries: (s: AppState) => s.foodLog.filter((e) => e.at >= startOfToday() && e.at < startOfToday() + DAY),
  todayTotals: (s: AppState) => M.sumNutrients(S.todayEntries(s)),
  currentVersion: (s: AppState) => (s.split ? s.split.versions.find((v) => v.number === s.split!.current) || null : null),
  currentDefinition: (s: AppState): SplitDefinition | null => { const v = S.currentVersion(s); return v ? v.definition : null; },
  /* Sessions in the last 7 days, and the sets they covered per muscle. */
  weekSessions: (s: AppState) => s.sessions.filter((x) => x.at >= startOfToday() - 6 * DAY),
  weekDoneVolume: (s: AppState) => {
    const vol: Record<string, number> = Object.fromEntries(D.MUSCLES.map((m: { id: string }) => [m.id, 0]));
    S.weekSessions(s).forEach((ses) => ses.sets.forEach((st) => {
      const ex = M.exerciseById(st.exercise);
      if (!ex) return;
      Object.entries(ex.credit as Record<string, number>).forEach(([mu, c]) => { vol[mu] += st.setsDone * c; });
    }));
    return vol;
  },
  recommendation: (s: AppState, id: string) => s.recommendations.find((r) => r.id === id) || null,
  hasTargets: (s: AppState) => s.targets.energyKcal != null
};
