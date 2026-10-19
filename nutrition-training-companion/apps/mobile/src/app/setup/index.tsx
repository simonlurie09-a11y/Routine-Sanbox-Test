/* Finish setting up: every setup item, done or not (prototype SetupList). */
import { router } from 'expo-router';

import { isDone, remaining, SETUP_ITEMS } from '@/features/setup';
import { useApp } from '@/store';
import { Button, Caption, FormPage, goBack, Rows } from '@/ui';

export default function SetupList() {
  const s = useApp();
  const left = remaining(s);
  const done = SETUP_ITEMS.length - left.length;
  return (
    <FormPage title="Finish setting up"
      subtitle={left.length ? `${done} of ${SETUP_ITEMS.length} done. Each takes about a minute.` : "You're all set up."}
      footer={<Button label="Done" onPress={goBack} />}>
      <Rows rows={SETUP_ITEMS.map((item) => {
        const ok = isDone(s, item.key);
        return {
          key: item.key, icon: ok ? 'checkmark' : item.icon, iconColor: ok ? 'primary' as const : 'ink' as const,
          label: item.title, detail: ok ? 'Done' : item.why, onPress: () => router.push(item.route),
          accessibilityLabel: `${item.title}. ${ok ? 'Done' : item.why}`
        };
      })} />
      <Caption>You can change any of these later in Settings.</Caption>
    </FormPage>
  );
}
