/* History helpers (builder E), ported from prototype/src/80-history.js: the
   filters, which suggestions count as "not changed", and the one-line
   summaries each card shows. Every entry is a frozen record from state:
   split versions, recommendations and the target history. */
import { isTargetRec, plural } from '@/features/shared';
import { domain as M } from '@/shared';
import type { AppState, Recommendation, SplitVersion, TargetKey, TargetValues } from '@/store';

export type Filter = 'split' | 'nutrition' | 'not_changed';
export const FILTERS: { value: Filter; label: string }[] = [
  { value: 'split', label: 'Split' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'not_changed', label: 'Not changed' }
];

/* The chosen filter survives opening an entry and coming back, while the app
   is open (a module-level variable, as in the prototype). */
let lastFilter: Filter = 'split';
export const getLastFilter = () => lastFilter;
export const rememberFilter = (f: Filter) => { lastFilter = f; };

/* Recommendation states where nothing was changed. */
export const NOT_CHANGED = ['blocked_insufficient_evidence', 'blocked_safety', 'blocked_constraints', 'blocked_verification_unavailable',
  'rejected', 'superseded', 'withdrawn', 'expired', 'not_needed'];
export const notChanged = (s: AppState) =>
  s.recommendations.filter((r) => NOT_CHANGED.includes(r.status)).slice().sort((a, b) => b.createdAt - a.createdAt);

/* The splitOrigin palette has no word for the version a split started from. */
export const ORIGIN_LABELS: Record<string, string> = { template: 'Starting point' };

export const TARGET_FIELDS: { key: TargetKey; label: string; format: (v: number) => string }[] = [
  { key: 'energyKcal', label: 'Calories', format: (v) => M.fmt.kcal(v) },
  { key: 'proteinG', label: 'Protein', format: (v) => M.fmt.g(v) },
  { key: 'carbohydrateG', label: 'Carbs', format: (v) => M.fmt.g(v) },
  { key: 'fatG', label: 'Fat', format: (v) => M.fmt.g(v) },
  { key: 'fiberG', label: 'Fibre', format: (v) => M.fmt.g(v) }
];
const MAX_DELTAS = 3;

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
function quoted(text: string) {
  const t = String(text).trim();
  return `“${/[.?!]$/.test(t) ? t : `${t}.`}”`;
}
export const dayMonth = (ts: number) => M.fmt.dayMonth(ts) as string;

/* "Weekly sets: rear delts 2 → 4, upper back 9 → 10." against the previous version. */
export function deltaLine(prev: SplitVersion | null, v: SplitVersion) {
  if (!prev) return null;
  const deltas: { name: string; before: number; after: number }[] = M.volumeDeltas(prev.definition, v.definition);
  if (!deltas.length) return null;
  const shown = deltas.slice(0, MAX_DELTAS).map((d) => `${lowerFirst(d.name)} ${M.fmt.sets(d.before)} → ${M.fmt.sets(d.after)}`);
  const more = deltas.length > MAX_DELTAS ? ` and ${deltas.length - MAX_DELTAS} more` : '';
  return `Weekly sets: ${shown.join(', ')}${more}.`;
}

/* What a "Not changed" card quotes: the request in the person's words. */
export function requestLine(rec: Recommendation): string | null {
  if (rec.requestText) return quoted(rec.requestText);
  if (rec.trigger === 'split_review' || (rec.intent && rec.intent.source === 'split_review')) return 'From your split review.';
  return rec.intent && rec.intent.summary ? rec.intent.summary : null;
}
/* Why nothing changed. Target suggestions talk about targets, not the split. */
export function reasonLine(rec: Recommendation): string | null {
  const target = isTargetRec(rec);
  if (rec.status === 'rejected') {
    return target ? 'You declined this suggestion, so your targets stayed as they were.' : 'You declined this suggestion, so your split stayed as it was.';
  }
  if (rec.status === 'superseded') {
    return target ? 'Your targets changed before you applied it, so we left it.' : 'Your split changed before you applied it, so we left it.';
  }
  if (rec.status === 'withdrawn' && rec.withdrawnReason === 'needs_health') return 'We needed your health and safety answers first, so we withdrew it.';
  if (rec.status === 'withdrawn') return 'Its studies no longer passed our checks, so we withdrew it.';
  if (rec.status === 'expired') return 'It expired before you decided.';
  return rec.reason || null;
}
/* ", 3 verified studies" or ", 1 of 3 studies verified": the count stored when it was decided. */
export function studiesLine(rec: Recommendation) {
  if (typeof rec.verifiedCount !== 'number') return '';
  const required: number = rec.required || M.REQUIRED_SOURCES;
  return rec.verifiedCount >= required
    ? `, ${plural(rec.verifiedCount, 'verified study', 'verified studies')}`
    : `, ${rec.verifiedCount} of ${required} studies verified`;
}

/* "Changed protein from 160 g to 170 g." against the entry before it. */
type TargetEntry = AppState['targets']['history'][number];
const shownValue = (f: (typeof TARGET_FIELDS)[number], v: number | null) => (v == null ? 'no target' : f.format(v));
export function targetChangeLine(entry: TargetEntry, prev: TargetEntry | null) {
  if (!prev) return 'Your starting targets.';
  const changed = TARGET_FIELDS.filter((f) => (entry.values[f.key] ?? null) !== (prev.values[f.key] ?? null));
  if (!changed.length) return 'Saved with no changes.';
  return `Changed ${M.listJoin(changed.map((f) => (prev.values[f.key] == null
    ? `${f.label.toLowerCase()} to ${shownValue(f, entry.values[f.key])}`
    : `${f.label.toLowerCase()} from ${shownValue(f, prev.values[f.key])} to ${shownValue(f, entry.values[f.key])}`)))}.`;
}
export const targetFacts = (values: TargetValues) =>
  TARGET_FIELDS.filter((f) => values[f.key] != null).map((f) => [f.label, f.format(values[f.key] as number)] as [string, string]);

/* The target suggestions the evidence covers today (the gate's own rule). */
export function readyTargetLabels(): string[] {
  return Object.values(M.TARGET_RULES as Record<string, { claim: string; label: string }>)
    .filter((r) => M.verifiedSourcesFor(M.claimByKey(r.claim)).length >= M.REQUIRED_SOURCES)
    .map((r) => r.label);
}
