/* Small pieces several areas use (Today, Training, History, Recovery). */
import { domain as M } from '@/shared';
import type { Recommendation } from '@/store';
import { Badge } from '@/ui';

/* Statuses the recommendation palette doesn't name. */
export const EXTRA_LABELS: Record<string, string> = {
  blocked_constraints: "Didn't fit", not_understood: 'Not understood', user_edit: 'Your edit', not_needed: 'No change needed'
};
export function RecBadge({ status, needs }: { status: string; needs?: string | null }) {
  const label = status === 'blocked_constraints' && needs ? 'Needed a detail' : EXTRA_LABELS[status];
  return <Badge palette="recommendation" status={status} label={label} />;
}
/* Sources the gate still accepts as verified, for a stored recommendation. */
export const verifiedCount = (rec: Recommendation) =>
  ((rec.sourceIds as string[] | undefined) || []).map(M.sourceById).filter(Boolean).filter(M.isVerified).length;
export const isTargetRec = (rec: Recommendation) => rec.kind === 'target_change' || !!(rec.intent && rec.intent.type === 'nutrition_target');

export const plural = (n: number, one: string, many?: string) => `${n.toLocaleString('en-GB')} ${n === 1 ? one : many || `${one}s`}`;
export const longDate = (ts: number) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
export const dayMonthLong = (ts: number) => new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
/* "today at 07:12", "yesterday at 06:40", "9 Oct at 06:40" */
export function whenText(ts: number) {
  const day = M.fmt.relativeDay(ts) as string;
  return `${day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day} at ${M.fmt.time(ts)}`;
}
