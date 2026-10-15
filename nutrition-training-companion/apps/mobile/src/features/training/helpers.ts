/* Training helpers shared by the Training routes (builder D). Ported from the
   helpers at the top of prototype/src/70-training.js, plus the navigation the
   prototype did with A.push / A.replace / A.present. */
import { router } from 'expo-router';

import { isDone } from '@/features/setup';
import { plural } from '@/features/shared';
import { data as D, domain as M } from '@/shared';
import { A, getState, S, type AppState, type Recommendation, type SplitDay, type SplitDefinition, type SplitItem } from '@/store';

export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const REGION_WORDS: Record<string, string> = { upper: 'upper body', lower: 'lower body', core: 'core' };
export const NEW_ITEM = { sets: 3, repMin: 8, repMax: 12, rir: 2, restS: 90 }; // "3 sets of 8–12"
export const NOT_UNDERSTOOD = 'We couldn’t tell what to change. Try “build my back” or “get stronger”.';

export type Exercise = { id: string; name: string; equipment: string[]; region: string; credit: Record<string, number> };
export type Muscle = { id: string; name: string; group: string };
export type Source = {
  id: string; short: string; title: string; authors: string; journal: string; citation: string; design?: string;
  found?: string; limitations?: string; verifiedAt?: string; pmid?: string | null; doi?: string | null; url?: string | null;
  checks: Record<string, string>;
};
export type Claim = { key: string; status: string; statement: string; population?: string; sources: string[]; appliesTo?: Record<string, unknown> };
export type DiffOp = { op: 'add' | 'change' | 'remove'; name: string; text: string; dayKey?: string; exercise?: string };
export type Delta = { muscle: string; name: string; before: number; after: number };
export type MinuteChange = { dayKey: string; label: string; before: number; after: number; limit: number };
export type Proposal = { ops?: DiffOp[]; deltas?: Delta[]; minutes?: MinuteChange[]; targets?: TargetChange[]; definition?: SplitDefinition };
export type TargetChange = { key: string; label: string; before: number | null; after: number; unit: string };

export const exercise = (id: string) => M.exerciseById(id) as Exercise;
export const EXERCISES = D.EXERCISES as Exercise[];
export const MUSCLES = D.MUSCLES as Muscle[];

export const uniq = <V,>(list: V[]) => [...new Set(list)];
export const lower = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
export const nextVersionNumber = (s: AppState) => (s.split ? Math.max(...s.split.versions.map((v) => v.number)) + 1 : 1);
export const versionByNumber = (s: AppState, n: number) => (s.split ? s.split.versions.find((v) => v.number === n) || null : null);
export const longDate = (ts: number) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
export const sessionLimit = (s: AppState) => (s.profile && s.profile.sessionMinutes) || 60;
export const muscleName = (id: string) => (M.muscleById(id) as Muscle).name;
const weekdayIndex = (day: SplitDay) => (day.weekday == null ? 99 : WEEK_ORDER.indexOf(day.weekday));
export const sortedDays = (def: SplitDefinition) => def.days.slice().sort((a, b) => weekdayIndex(a) - weekdayIndex(b));
export const weekdayName = (n: number) => M.fmt.weekday(n) as string;
export const dayTitle = (day: SplitDay) => M.dayLabelWithWeekday(day) as string;
export const dayMinutes = (day: SplitDay) => M.dayMinutes(day) as number;
export const hasDays = (def: SplitDefinition | null) => !!def && def.days.length > 0;
export const hasExercises = (def: SplitDefinition | null) => !!def && def.days.some((d) => d.items.length > 0);

/* "90 s", "2 min", "2 min 30 s" */
export function restShort(sec: number) {
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  if (!m) return `${r} s`;
  return r ? `${m} min ${r} s` : `${m} min`;
}
export const restText = (sec: number) => `${restShort(sec)} rest`;
/* "3 sets of 8–12, 2 reps in reserve, 2 min rest" */
export const prescription = (it: SplitItem) => `${plural(it.sets, 'set')} of ${it.repMin}–${it.repMax}, ${plural(it.rir, 'rep')} in reserve, ${restText(it.restS)}`;
export const repsLine = (it: SplitItem) => `${it.repMin}–${it.repMax} reps, ${plural(it.rir, 'rep')} in reserve`;

/* Which muscles one hard set is credited to (1 for the main muscle, half for helpers). */
export function creditLine(exerciseId: string) {
  const credit = Object.entries(exercise(exerciseId).credit);
  const main = credit.filter(([, c]) => c >= 1).map(([m]) => muscleName(m).toLowerCase());
  const help = credit.filter(([, c]) => c < 1).map(([m]) => muscleName(m).toLowerCase());
  return `Counts for ${M.listJoin(main)}${help.length ? `, and half for ${M.listJoin(help)}` : ''}.`;
}
export const primaryMuscle = (ex: Exercise) => (Object.entries(ex.credit).find(([, c]) => c >= 1) || [Object.keys(ex.credit)[0]])[0];

export const dayRegions = (day: SplitDay) => uniq(day.items.map((it) => exercise(it.exercise).region));
/* The body region a session mostly loads (core work rides along with either). */
export function mainRegion(day: SplitDay) {
  const sets: Record<string, number> = {};
  day.items.forEach((it) => {
    const r = exercise(it.exercise).region;
    if (r !== 'core') sets[r] = (sets[r] || 0) + it.sets;
  });
  return Object.keys(sets).sort((a, b) => sets[b] - sets[a])[0] || 'core';
}

/* Minutes per day that change between two definitions, for VolumeCard. */
export function minuteChanges(before: SplitDefinition, after: SplitDefinition, limit: number): MinuteChange[] {
  return after.days.map((d) => {
    const prev = before.days.find((x) => x.key === d.key);
    return { dayKey: d.key, label: d.label, before: prev ? dayMinutes(prev) : 0, after: dayMinutes(d), limit };
  }).filter((m) => m.before !== m.after);
}

/* ---------------------------------------------------- recommendations */
export const targetChange = (rec: Recommendation): TargetChange | null =>
  (rec.proposal && rec.proposal.targets && rec.proposal.targets[0]) || null;
export const isFromReview = (rec: Recommendation) => rec.trigger === 'split_review' || !!(rec.intent && rec.intent.source === 'split_review');
export function quoted(text: string) {
  const t = String(text).trim();
  return `“${/[.?!]$/.test(t) ? t : `${t}.`}”`;
}
export function originLine(rec: Recommendation) {
  if (isFromReview(rec)) return 'From your split review';
  if (rec.requestText) return `From your request: ${quoted(rec.requestText)}`;
  return rec.intent && rec.intent.summary ? `From your request: ${rec.intent.summary}` : 'From your request';
}
/* Only sources the gate still accepts are ever shown (docs/06 §6.6). */
export const shownSources = (rec: Recommendation): Source[] =>
  ((rec.sourceIds as string[] | undefined) || []).map(M.sourceById).filter(Boolean).filter(M.isVerified);
export const verifiedStudies = (n: number) => `${n} verified ${n === 1 ? 'study' : 'studies'}`;

/* The split review's "Ask for more <muscle> work": straight through the gate. */
export function reviewIntent(muscle: string) {
  return { type: 'develop_muscle', muscle, source: 'split_review', summary: `Build your ${muscleName(muscle).toLowerCase()}.` };
}
export function askFromReview(muscle: string, how: 'push' | 'replace' = 'push') {
  const draft = M.evaluateChange(reviewIntent(muscle), getState());
  const id = A.createRecommendation(draft, { trigger: 'split_review' });
  if (how === 'replace') router.replace(`/recommendation/${id}`);
  else router.push(`/recommendation/${id}`);
}
/* Run the same request again against the current split. */
export function askAgain(rec: Recommendation) {
  if (isFromReview(rec) && rec.intent && rec.intent.muscle) {
    askFromReview(rec.intent.muscle, 'replace');
    return;
  }
  router.push({ pathname: '/change-request', params: rec.requestText ? { text: rec.requestText } : {} });
}
export const editMyself = () => router.push('/training/edit');

/* A request that waited for a detail (health answers, weight, a split): has it been given? */
export function needMet(s: AppState, rec: Recommendation) {
  if (rec.needs === 'health') return isDone(s, 'health');
  if (rec.needs === 'weight') return s.profile.weightKg != null;
  if (rec.needs === 'split') return hasDays(S.currentDefinition(s));
  return false;
}
/* Run the same intent through the gate again and show the new answer. */
export function recheck(rec: Recommendation) {
  const draft = M.evaluateChange(rec.intent, getState(), { requestText: rec.requestText });
  const id = A.createRecommendation(draft, { trigger: rec.trigger || 'user_request', requestText: rec.requestText });
  router.replace(`/recommendation/${id}`);
}

/* Back to a tab root (or a screen on top of it), closing whatever is open. */
export function resetTo(href: '/training' | '/targets') {
  if (router.canDismiss()) router.dismissAll();
  if (href === '/training') router.navigate('/training');
  else router.push(href);
}
