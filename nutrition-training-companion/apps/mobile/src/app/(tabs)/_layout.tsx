/* The five tabs: the native iOS tab bar with SF Symbols (docs/08 §8.10), and
   the router's own tab bar on web previews. Sign-up comes first. */
import { Redirect, Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { useApp } from '@/store';
import { colors } from '@/theme';
import { Icon } from '@/ui';

const TABS = [
  { name: 'index', label: 'Today', sf: 'house', selected: 'house.fill' },
  { name: 'food', label: 'Food', sf: 'fork.knife', selected: 'fork.knife' },
  { name: 'training', label: 'Training', sf: 'dumbbell', selected: 'dumbbell.fill' },
  { name: 'recovery', label: 'Recovery', sf: 'heart', selected: 'heart.fill' },
  { name: 'history', label: 'History', sf: 'clock.arrow.circlepath', selected: 'clock.arrow.circlepath' }
] as const;

export default function TabsLayout() {
  const onboarded = useApp((s) => s.onboarded);
  if (!onboarded) return <Redirect href="/sign-up" />;
  if (Platform.OS !== 'ios') {
    return (
      <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.inkMuted48, tabBarStyle: { backgroundColor: colors.canvas, borderTopColor: colors.hairline } }}>
        {TABS.map((t) => (
          <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label, tabBarIcon: ({ focused }) => <Icon name={t.sf} size={22} color={focused ? 'primary' : 'inkMuted48'} /> }} />
        ))}
      </Tabs>
    );
  }
  return (
    <NativeTabs tintColor={colors.primary}>
      {TABS.map((t) => (
        <NativeTabs.Trigger key={t.name} name={t.name}>
          <NativeTabs.Trigger.Label>{t.label}</NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Icon sf={{ default: t.sf, selected: t.selected }} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
