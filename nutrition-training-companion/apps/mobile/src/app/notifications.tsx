/* Notifications (prototype/src/80-history.js, "notifications"): what needs
   you, from M.notifications. Version 1 sends no push notifications, so this
   in-app list is the only place they show. Opening it marks them read. */
import { router } from 'expo-router';
import { useEffect } from 'react';

import { domain as M } from '@/shared';
import { A, useApp } from '@/store';
import { Caption, EmptyAnswer, Rows, Screen, Stack } from '@/ui';

type Note = { id: string; kind: 'suggestion' | 'device'; title: string; body: string; screen: string; params: { id?: string; provider?: string } };

function open(n: Note) {
  if (n.kind === 'device') router.push('/apple-health');
  else if (n.params.id) router.push(`/recommendation/${n.params.id}`);
}

export default function Notifications() {
  const s = useApp();
  const items = M.notifications(s) as Note[];
  useEffect(() => {
    A.markNotificationsRead();
  }, []);
  return (
    <Screen title="Notifications">
      <Stack gap="xl">
        {items.length ? (
          <Rows rows={items.map((n) => ({
            key: n.id,
            icon: n.kind === 'device' ? 'applewatch' : 'dumbbell',
            iconColor: 'ink' as const,
            label: n.title || 'A suggested change',
            detail: n.body,
            onPress: () => open(n)
          }))} />
        ) : (
          <EmptyAnswer icon="bell" title="You're all caught up" body="Suggestions to review show up here." />
        )}
        <Caption>Notifications show only here, in the app. Companion doesn't send them to your phone's lock screen.</Caption>
      </Stack>
    </Screen>
  );
}
