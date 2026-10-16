/* The difference between two split definitions, for the editor and the
   version page. M.diffDefinitions covers exercises added, removed and changed
   in sets or reps; the editor can also add, remove, rename and move days, and
   change reps in reserve, rest and order, so this covers those too. The text
   follows the domain's wording ("Monday, Upper A. 3 sets of 8–12, …"). */
import { plural } from '@/features/shared';
import { domain as M } from '@/shared';
import type { SplitDefinition, SplitItem } from '@/store';
import { dayTitle, exercise, restShort, weekdayName, type DiffOp } from './helpers';

type Kind = 'dayAdd' | 'dayRemove' | 'dayChange' | 'exAdd' | 'exRemove' | 'exChange';
export type EditOp = DiffOp & { kind: Kind; short: string };

const sets = (items: SplitItem[]) => items.reduce((acc, it) => acc + it.sets, 0);
const words = (name: string) => M.exerciseWords(name) as string;

export function editOps(base: SplitDefinition, draft: SplitDefinition): EditOp[] {
  const ops: EditOp[] = [];
  base.days.forEach((b) => {
    if (draft.days.some((d) => d.key === b.key)) return;
    ops.push({
      kind: 'dayRemove', op: 'remove', dayKey: b.key, name: dayTitle(b), short: `Removed ${b.label}`,
      text: b.items.length ? `Day removed, with ${plural(b.items.length, 'exercise')} and ${plural(sets(b.items), 'set')}.` : 'Day removed.'
    });
  });
  draft.days.forEach((d) => {
    const b = base.days.find((x) => x.key === d.key) || null;
    const label = dayTitle(d);
    if (!b) {
      ops.push({ kind: 'dayAdd', op: 'add', dayKey: d.key, name: label, short: `Added ${d.label}`, text: d.weekday != null ? `New training day on ${weekdayName(d.weekday)}.` : 'New training day.' });
    } else {
      if (b.label !== d.label) {
        ops.push({ kind: 'dayChange', op: 'change', dayKey: d.key, name: label, short: `Renamed ${b.label} to ${d.label}`, text: `Renamed from ${b.label}.` });
      }
      if (b.weekday !== d.weekday) {
        const text = d.weekday == null ? `No longer set to ${weekdayName(b.weekday as number)}.`
          : b.weekday == null ? `Now on ${weekdayName(d.weekday)}.`
          : `Moved from ${weekdayName(b.weekday)} to ${weekdayName(d.weekday)}.`;
        ops.push({ kind: 'dayChange', op: 'change', dayKey: d.key, name: label, short: `${d.label} ${text.charAt(0).toLowerCase()}${text.slice(1, -1)}`, text });
      }
    }
    const before = b ? b.items : [];
    d.items.forEach((it) => {
      const prev = before.find((x) => x.exercise === it.exercise);
      const name = exercise(it.exercise).name;
      if (!prev) {
        ops.push({
          kind: 'exAdd', op: 'add', dayKey: d.key, exercise: it.exercise, name, short: `Added ${words(name)}`,
          text: `${label}. ${plural(it.sets, 'set')} of ${it.repMin}–${it.repMax}, ${plural(it.rir, 'rep')} in reserve.`
        });
        return;
      }
      const parts: string[] = [];
      if (prev.sets !== it.sets) parts.push(`${plural(prev.sets, 'set')} to ${plural(it.sets, 'set')}`);
      if (prev.repMin !== it.repMin || prev.repMax !== it.repMax) parts.push(`${prev.repMin}–${prev.repMax} reps to ${it.repMin}–${it.repMax}`);
      if (prev.rir !== it.rir) parts.push(`${prev.rir} to ${plural(it.rir, 'rep')} in reserve`);
      if (prev.restS !== it.restS) parts.push(`${restShort(prev.restS)} to ${restShort(it.restS)} rest`);
      if (parts.length) {
        ops.push({ kind: 'exChange', op: 'change', dayKey: d.key, exercise: it.exercise, name, short: `${name} ${parts.join(', ')}`, text: `${label}. ${M.capitalise(parts.join(', '))}.` });
      }
    });
    before.forEach((it) => {
      if (d.items.some((x) => x.exercise === it.exercise)) return;
      const name = exercise(it.exercise).name;
      ops.push({ kind: 'exRemove', op: 'remove', dayKey: d.key, exercise: it.exercise, name, short: `Removed ${words(name)}`, text: `${label}. ${plural(it.sets, 'set')} removed.` });
    });
    if (b) {
      const kept = d.items.map((x) => x.exercise).filter((e) => before.some((y) => y.exercise === e));
      const was = before.map((x) => x.exercise).filter((e) => d.items.some((y) => y.exercise === e));
      if (kept.join('|') !== was.join('|')) {
        ops.push({ kind: 'dayChange', op: 'change', dayKey: d.key, name: label, short: `Reordered ${d.label}`, text: 'Exercise order changed.' });
      }
    }
  });
  return ops;
}

/* A short plain note for the version ("Added lat pulldown. Removed cable fly."). */
export function summarizeEdit(ops: EditOp[]) {
  if (!ops.length) return 'No changes.';
  if (ops.length <= 4) return `${ops.map((o) => o.short).join('. ')}.`;
  const count = (k: Kind) => ops.filter((o) => o.kind === k).length;
  const pair = (days: number, exercises: number) =>
    M.listJoin([days ? plural(days, 'day') : '', exercises ? plural(exercises, 'exercise') : ''].filter(Boolean)) as string;
  const parts: string[] = [];
  if (count('dayAdd') || count('exAdd')) parts.push(`Added ${pair(count('dayAdd'), count('exAdd'))}`);
  if (count('dayRemove') || count('exRemove')) parts.push(`Removed ${pair(count('dayRemove'), count('exRemove'))}`);
  if (count('dayChange') || count('exChange')) parts.push(`Changed ${pair(count('dayChange'), count('exChange'))}`);
  return `${parts.join('. ')}.`;
}
