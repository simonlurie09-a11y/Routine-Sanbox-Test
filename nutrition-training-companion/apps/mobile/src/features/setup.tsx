/* What's left to set up after sign-up (docs/07 §7.1). Sign-up asks only for
   the essentials; these items are set up from the tabs, in any order, each on
   its own page in the sign-up layout. Shared by Today, Food, Training,
   Settings and the setup list. */
import { router, type Href } from 'expo-router';

import { useApp, type AppState, type SetupKey } from '@/store';
import { Caption, Card, CardTitle, LinkButton, Rows, Stack } from '@/ui';

export type SetupItem = { key: SetupKey; route: Href; icon: string; title: string; why: string };
export const SETUP_ITEMS: SetupItem[] = [
  { key: 'health', route: '/setup/health', icon: 'heart', title: 'Health and safety', why: 'We need this before we suggest any change.' },
  { key: 'training', route: '/setup/training', icon: 'dumbbell', title: 'Your training', why: 'Experience, days a week, session length and equipment.' },
  { key: 'split', route: '/setup/split', icon: 'list.bullet', title: 'Your split', why: 'Start from a template, or build your own.' },
  { key: 'targets', route: '/targets', icon: 'target', title: 'Daily targets', why: 'Calories, protein, carbs, fat and fibre.' },
  { key: 'body', route: '/setup/body', icon: 'person.crop.circle', title: 'Height and sex', why: 'Optional. For energy estimates.' },
  { key: 'devices', route: '/apple-health', icon: 'heart', title: 'Apple Health', why: 'Sleep, HRV and resting heart rate, for readiness.' }
];

export const isDone = (s: AppState, key: SetupKey) => s.setup[key] !== false;
export const remaining = (s: AppState, keys?: SetupKey[]) => SETUP_ITEMS.filter((i) => (!keys || keys.includes(i.key)) && !isDone(s, i.key));

/* Shown in a tab while any of `keys` (default: all) is left to do. */
export function SetupCard({ keys, title = 'Finish setting up', max = 3 }: { keys?: SetupKey[]; title?: string; max?: number }) {
  const s = useApp();
  const left = remaining(s, keys);
  if (!left.length) return null;
  const total = keys ? keys.length : SETUP_ITEMS.length;
  const single = !!keys && keys.length === 1;
  return (
    <Card>
      <Stack gap="xs">
        <CardTitle>{title}</CardTitle>
        <Caption>{single ? left[0].why : `${total - left.length} of ${total} done. Each takes about a minute.`}</Caption>
      </Stack>
      <Rows rows={left.slice(0, max).map((item) => ({
        key: item.key, icon: item.icon, iconColor: 'ink' as const, label: item.title,
        detail: single ? undefined : item.why, onPress: () => router.push(item.route)
      }))} />
      {left.length > max ? <LinkButton size="callout" label={`See all ${left.length}`} onPress={() => router.push('/setup')} /> : null}
    </Card>
  );
}
