/* Alerts, action sheets and toasts are the app's own (docs/08 §8.10: never
   Alert.alert or ActionSheetIOS), rendered once at the root. Anything can
   open one through `overlay` (no hook needed); handlers run after it closes. */
import { useEffect } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';

import { colors, curve, radius, spacing } from '@/theme';
import { T } from './kit';

type AlertButton = { label: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void };
type SheetOption = { label: string; style?: 'default' | 'destructive'; onPress?: () => void };
type OverlayState = {
  alert: { title: string; message?: string; buttons: AlertButton[] } | null;
  sheet: { title?: string; message?: string; options: SheetOption[]; cancelLabel?: string } | null;
  toast: { id: number; message: string; variant: 'info' | 'success' | 'error' } | null;
};
const useOverlay = create<OverlayState>(() => ({ alert: null, sheet: null, toast: null }));
const AFTER_CLOSE_MS = 240;
let toastSeq = 0;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export const overlay = {
  alert(props: { title: string; message?: string; buttons?: AlertButton[] }) {
    useOverlay.setState({ alert: { ...props, buttons: props.buttons && props.buttons.length ? props.buttons : [{ label: 'OK' }] } });
  },
  sheet(props: { title?: string; message?: string; options: SheetOption[]; cancelLabel?: string }) {
    useOverlay.setState({ sheet: props });
  },
  toast(message: string, variant: 'info' | 'success' | 'error' = 'info') {
    if (toastTimer) clearTimeout(toastTimer);
    useOverlay.setState({ toast: { id: ++toastSeq, message, variant } });
    toastTimer = setTimeout(() => useOverlay.setState({ toast: null }), 3500);
  }
};
const close = (key: 'alert' | 'sheet', then?: () => void) => {
  useOverlay.setState({ [key]: null } as Partial<OverlayState>);
  if (then) setTimeout(then, AFTER_CLOSE_MS);
};

function AlertView() {
  const a = useOverlay((s) => s.alert);
  if (!a) return null;
  const stacked = a.buttons.length > 2;
  return (
    <Modal transparent animationType="fade" visible onRequestClose={() => close('alert')}>
      <View style={{ flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <View accessibilityViewIsModal accessibilityRole="alert" style={{ width: 280, backgroundColor: colors.canvas, borderRadius: radius.lg, ...curve, overflow: 'hidden' }}>
          <View style={{ padding: spacing.lg, gap: spacing.xs }}>
            <T size="body" weight="semiBold" align="center">{a.title}</T>
            {a.message ? <T size="callout" color="inkMuted80" align="center">{a.message}</T> : null}
          </View>
          <View style={{ flexDirection: stacked ? 'column' : 'row', borderTopWidth: 1, borderTopColor: colors.hairline }}>
            {a.buttons.map((b, i) => (
              <Pressable key={b.label} accessibilityRole="button" onPress={() => close('alert', b.onPress)}
                style={({ pressed }) => ({ flex: stacked ? undefined : 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: spacing.md,
                  borderLeftWidth: !stacked && i ? 1 : 0, borderTopWidth: stacked && i ? 1 : 0, borderColor: colors.hairline, backgroundColor: pressed ? colors.dividerSoft : colors.canvas })}>
                <T size="body" weight={b.style === 'cancel' ? 'semiBold' : 'regular'} color={b.style === 'destructive' ? 'danger' : 'primary'}>{b.label}</T>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SheetView() {
  const sh = useOverlay((s) => s.sheet);
  const insets = useSafeAreaInsets();
  if (!sh) return null;
  const row = (label: string, color: 'primary' | 'danger', onPress: () => void, bold?: boolean, first?: boolean) => (
    <Pressable key={label} accessibilityRole="button" onPress={onPress}
      style={({ pressed }) => ({ minHeight: 56, alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderTopWidth: first ? 0 : 1, borderTopColor: colors.hairline, backgroundColor: pressed ? colors.dividerSoft : colors.canvas })}>
      <T size="body" weight={bold ? 'semiBold' : 'regular'} color={color}>{label}</T>
    </Pressable>
  );
  return (
    <Modal transparent animationType="slide" visible onRequestClose={() => close('sheet')}>
      <Pressable accessibilityLabel="Dismiss" style={{ flex: 1, backgroundColor: colors.scrim }} onPress={() => close('sheet')} />
      <View style={{ position: 'absolute', left: spacing.sm, right: spacing.sm, bottom: insets.bottom + spacing.sm, gap: spacing.sm }}>
        <View style={{ backgroundColor: colors.canvas, borderRadius: radius.lg, ...curve, overflow: 'hidden' }}>
          {sh.title || sh.message ? (
            <View style={{ padding: spacing.base, gap: spacing.xxs }}>
              {sh.title ? <T size="caption" weight="semiBold" color="inkMuted80" align="center">{sh.title}</T> : null}
              {sh.message ? <T size="caption" color="inkMuted48" align="center">{sh.message}</T> : null}
            </View>
          ) : null}
          {sh.options.map((o, i) => row(o.label, o.style === 'destructive' ? 'danger' : 'primary', () => close('sheet', o.onPress), false, i === 0 && !sh.title && !sh.message))}
        </View>
        <View style={{ backgroundColor: colors.canvas, borderRadius: radius.lg, ...curve, overflow: 'hidden' }}>
          {row(sh.cancelLabel || 'Cancel', 'primary', () => close('sheet'), true, true)}
        </View>
      </View>
    </Modal>
  );
}

function ToastView() {
  const t = useOverlay((s) => s.toast);
  const insets = useSafeAreaInsets();
  useEffect(() => () => { if (toastTimer) clearTimeout(toastTimer); }, []);
  if (!t) return null;
  const bg = t.variant === 'success' ? colors.success : t.variant === 'error' ? colors.danger : colors.ink;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: insets.top + spacing.sm, left: 0, right: 0, alignItems: 'center' }}>
      <Pressable accessibilityRole="alert" accessibilityLiveRegion="polite" onPress={() => useOverlay.setState({ toast: null })}
        style={{ maxWidth: '92%', paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.lg, ...curve, backgroundColor: bg }}>
        <T size="callout" color="onPrimary" align="center">{t.message}</T>
      </Pressable>
    </View>
  );
}

export function OverlayHost() {
  return (
    <>
      <AlertView />
      <SheetView />
      <ToastView />
    </>
  );
}
