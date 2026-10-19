/* Screen scaffolds (docs/08 §8.5, §8.10):
   - Screen: large title and grey subtitle, back chevron when pushed, content scrolls.
   - TabScreen: a tab root, with the settings gear on the left and the bell on the right.
   - FormPage: the sign-up page layout used by every sign-up step and setup page:
     back chevron, large title, grey subtitle, the fields, then the primary pill
     button pinned at the bottom (above the keyboard). */
import { router, useNavigation } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type ScrollViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { domain as M } from '@/shared';
import { useApp } from '@/store';
import { colors, GUTTER, spacing } from '@/theme';
import { IconButton, T } from './kit';

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}
function useCanGoBack() {
  const nav = useNavigation();
  return nav.canGoBack();
}

function Bar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  if (!left && !right) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, paddingHorizontal: GUTTER - spacing.sm }}>
      <View>{left || null}</View>
      <View>{right || null}</View>
    </View>
  );
}
export const BackButton = ({ onPress, label = 'Back' }: { onPress?: () => void; label?: string }) =>
  <IconButton name="chevron.left" label={label} size={24} onPress={onPress || goBack} />;

function Heading({ title, subtitle, dark }: { title?: string; subtitle?: string | null; dark?: boolean }) {
  if (!title) return null;
  return (
    <View style={{ gap: spacing.xs }}>
      <T size="title2" weight="bold" color={dark ? 'onDark' : 'ink'} accessibilityRole="header">{title}</T>
      {subtitle ? <T size="body" color={dark ? 'bodyMuted' : 'inkMuted48'}>{subtitle}</T> : null}
    </View>
  );
}

type ScreenProps = {
  title?: string; subtitle?: string | null; left?: ReactNode; right?: ReactNode; children: ReactNode;
  /* Hide the automatic back chevron (modal roots pass their own Close/Cancel as `left`). */
  noBack?: boolean; scrollProps?: ScrollViewProps; dark?: boolean;
};
export function Screen({ title, subtitle, left, right, children, noBack, scrollProps, dark }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const canGoBack = useCanGoBack();
  const leftNode = left !== undefined ? left : !noBack && canGoBack ? <BackButton /> : null;
  return (
    <View style={{ flex: 1, backgroundColor: dark ? colors.surfaceBlack : colors.canvas, paddingTop: insets.top }}>
      <Bar left={leftNode} right={right} />
      <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="never" {...scrollProps}
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingTop: leftNode || right ? spacing.sm : spacing.xl, paddingBottom: spacing.xxxl + insets.bottom, gap: spacing.xl }}>
        <Heading title={title} subtitle={subtitle} dark={dark} />
        {children}
      </ScrollView>
    </View>
  );
}

/* A tab root: gear (Settings) on the left, the bell on the right. */
export function TabScreen({ title, subtitle, children, right }: { title: string; subtitle?: string | null; children: ReactNode; right?: ReactNode }) {
  return (
    <Screen title={title} subtitle={subtitle} noBack
      left={<IconButton name="gearshape" label="Settings" onPress={() => router.push('/settings')} />}
      right={right !== undefined ? right : <BellButton />}>
      {children}
    </Screen>
  );
}

/* The bell: pending suggestions and things to fix. Kept here so every tab root shows it. */
export function BellButton() {
  const count = useApp((s) => M.notifications(s).length);
  return (
    <View>
      <IconButton name="bell" label={count ? `Notifications, ${count} new` : 'Notifications'} onPress={() => router.push('/notifications')} />
      {count ? (
        <View pointerEvents="none" style={{ position: 'absolute', top: 6, right: 6, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' }}>
          <T size="micro" color="onPrimary" weight="semiBold">{String(count)}</T>
        </View>
      ) : null}
    </View>
  );
}

type FormPageProps = {
  title?: string; subtitle?: string | null; children: ReactNode; footer?: ReactNode;
  /* undefined: the back chevron when there's somewhere to go back to; null: none. */
  onBack?: (() => void) | null; topRight?: ReactNode; topLeft?: ReactNode; dark?: boolean;
};
export function FormPage({ title, subtitle, children, footer, onBack, topRight, topLeft, dark }: FormPageProps) {
  const insets = useSafeAreaInsets();
  const canGoBack = useCanGoBack();
  const left = topLeft !== undefined ? topLeft
    : onBack === null ? null
    : onBack ? <BackButton onPress={onBack} />
    : canGoBack ? <BackButton /> : null;
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: dark ? colors.surfaceBlack : colors.canvas, paddingTop: insets.top }}>
      <Bar left={left} right={topRight} />
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: GUTTER, paddingTop: left || topRight ? spacing.sm : spacing.xl, paddingBottom: spacing.xl, gap: spacing.lg }}>
        <Heading title={title} subtitle={subtitle} dark={dark} />
        {children}
      </ScrollView>
      {footer ? (
        <View style={{ paddingHorizontal: GUTTER, paddingTop: spacing.sm, paddingBottom: Math.max(insets.bottom, spacing.base) + spacing.sm, gap: spacing.sm, backgroundColor: dark ? colors.surfaceBlack : colors.canvas }}>
          {footer}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}
