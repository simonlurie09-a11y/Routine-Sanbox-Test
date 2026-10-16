/* The Apple Design System, ported to React Native (docs/08 §8.10). Every
   value comes from the tokens in src/theme. Screens compose these pieces;
   they never style with raw values. */
import * as Haptics from 'expo-haptics';
import { forwardRef, type ReactNode } from 'react';
import {
  Platform, Pressable, Switch as RNSwitch, Text, TextInput, View,
  type StyleProp, type TextInputProps, type TextStyle, type ViewStyle
} from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

import { colors, curve, palettes, radius, spacing, textStyle, type ColorToken, type TextSize, type TextWeight } from '@/theme';
import { Icon } from './Icon';

const light = () => {
  if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};
/* Press feedback: buttons 0.95, cards 0.98, chips 0.96, skipped with Reduce Motion. */
function usePressScale(scale: number) {
  const reduce = useReducedMotion();
  return (pressed: boolean): ViewStyle => (pressed && !reduce ? { transform: [{ scale }] } : {});
}

/* ----------------------------------------------------------------- text */
export type TProps = {
  size?: TextSize; weight?: TextWeight; color?: ColorToken; align?: TextStyle['textAlign'];
  tabular?: boolean; style?: StyleProp<TextStyle>; children?: ReactNode; numberOfLines?: number;
  accessibilityRole?: 'header' | 'text'; selectable?: boolean;
};
/* Every string goes through T: a size, a weight and a colour token. */
export function T({ size = 'body', weight, color = 'ink', align, tabular, style, children, numberOfLines, accessibilityRole, selectable }: TProps) {
  return (
    <Text
      style={[textStyle(size, weight), { color: colors[color], textAlign: align }, tabular ? { fontVariant: ['tabular-nums'] } : null, style]}
      numberOfLines={numberOfLines} accessibilityRole={accessibilityRole} selectable={selectable}>
      {children}
    </Text>
  );
}
export const Title = ({ children }: { children: ReactNode }) => <T size="title2" weight="bold" accessibilityRole="header">{children}</T>;
export const H2 = ({ children }: { children: ReactNode }) => <T size="headline" weight="bold" accessibilityRole="header">{children}</T>;
export const CardTitle = ({ children }: { children: ReactNode }) => <T size="headline" weight="semiBold" accessibilityRole="header">{children}</T>;
export const Body = ({ children, color = 'ink' }: { children: ReactNode; color?: ColorToken }) => <T size="body" color={color}>{children}</T>;
export const Callout = ({ children, color = 'inkMuted80' }: { children: ReactNode; color?: ColorToken }) => <T size="callout" color={color}>{children}</T>;
export const Caption = ({ children, color = 'inkMuted48' }: { children: ReactNode; color?: ColorToken }) => <T size="caption" color={color}>{children}</T>;
export const Micro = ({ children }: { children: ReactNode }) => <T size="micro" color="inkMuted48">{children}</T>;

/* --------------------------------------------------------------- layout */
export const Stack = ({ gap = 'base', children, style }: { gap?: keyof typeof spacing; children: ReactNode; style?: StyleProp<ViewStyle> }) =>
  <View style={[{ gap: spacing[gap] }, style]}>{children}</View>;
export const Row = ({ gap = 'sm', children, between, wrap, style }: { gap?: keyof typeof spacing; children: ReactNode; between?: boolean; wrap?: boolean; style?: StyleProp<ViewStyle> }) =>
  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing[gap], justifyContent: between ? 'space-between' : 'flex-start', flexWrap: wrap ? 'wrap' : 'nowrap' }, style]}>{children}</View>;
export const HairlineTop = ({ children }: { children: ReactNode }) =>
  <View style={{ borderTopWidth: 1, borderTopColor: colors.dividerSoft, paddingTop: spacing.base, gap: spacing.sm }}>{children}</View>;

export function Section({ title, caption, action, children }: { title?: string; caption?: string | null; action?: ReactNode; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.base }}>
      {title ? (
        <View style={{ gap: spacing.xs }}>
          <Row between><H2>{title}</H2>{action || null}</Row>
          {caption ? <Caption>{caption}</Caption> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

/* --------------------------------------------------------------- button */
type ButtonVariant = 'primary' | 'outline' | 'ghost' | 'danger';
const BUTTON: Record<ButtonVariant, { bg: ColorToken; fg: ColorToken; border?: ColorToken }> = {
  primary: { bg: 'primary', fg: 'onPrimary' },
  outline: { bg: 'canvas', fg: 'primary', border: 'primary' },
  ghost: { bg: 'canvas', fg: 'primary' },
  danger: { bg: 'danger', fg: 'onPrimary' }
};
export function Button({ label, onPress, variant = 'primary', disabled, loading, icon, black, accessibilityLabel }: {
  label: string; onPress?: () => void; variant?: ButtonVariant; disabled?: boolean; loading?: boolean; icon?: string;
  /* Apple's own black "Sign in with Apple" style. */ black?: boolean; accessibilityLabel?: string;
}) {
  const v = BUTTON[variant];
  const scaled = usePressScale(0.95);
  const blocked = disabled || loading;
  const bg = black ? colors.surfaceBlack : colors[v.bg];
  const fg = black ? colors.onDark : colors[v.fg];
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={accessibilityLabel || label}
      accessibilityState={{ disabled: !!blocked, busy: !!loading }}
      disabled={blocked}
      onPress={() => { light(); onPress && onPress(); }}
      style={({ pressed }) => [{
        minHeight: 50, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, borderRadius: radius.pill, ...curve,
        backgroundColor: bg, borderWidth: 1, borderColor: v.border ? colors[v.border] : bg,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
        opacity: blocked ? 0.5 : 1, alignSelf: 'stretch'
      }, scaled(pressed)]}>
      {icon ? <Icon name={icon} size={18} color={black ? 'onDark' : v.fg} /> : null}
      <Text style={[textStyle('body'), { color: fg }]}>{loading ? 'Please wait…' : label}</Text>
    </Pressable>
  );
}
/* A text link (navigation within a screen, secondary actions). */
export function LinkButton({ label, onPress, color = 'primary', size = 'body', icon, align = 'flex-start' }: {
  label: string; onPress: () => void; color?: ColorToken; size?: TextSize; icon?: string; align?: ViewStyle['alignSelf'];
}) {
  return (
    <Pressable accessibilityRole="link" accessibilityLabel={label} onPress={onPress} hitSlop={8}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: align, minHeight: 44, opacity: pressed ? 0.6 : 1 })}>
      {icon ? <Icon name={icon} size={size === 'caption' ? 16 : 18} color={color} /> : null}
      <T size={size} color={color}>{label}</T>
    </Pressable>
  );
}
export function IconButton({ name, label, onPress, color = 'primary', size = 22 }: { name: string; label: string; onPress: () => void; color?: ColorToken; size?: number }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={10}
      style={({ pressed }) => ({ minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 })}>
      <Icon name={name} size={size} color={color} />
    </Pressable>
  );
}

/* ----------------------------------------------------------------- card */
export function Card({ children, onPress, selected, style, accessibilityLabel }: {
  children: ReactNode; onPress?: () => void; selected?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string;
}) {
  const scaled = usePressScale(0.98);
  const base: ViewStyle = {
    padding: selected ? spacing.lg - 1 : spacing.lg, gap: spacing.sm, backgroundColor: colors.canvas,
    borderWidth: selected ? 2 : 1, borderColor: selected ? colors.primaryFocus : colors.hairline, borderRadius: radius.lg, ...curve
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} accessibilityState={{ selected: !!selected }}
      onPress={() => { light(); onPress(); }} style={({ pressed }) => [base, scaled(pressed), style]}>
      {children}
    </Pressable>
  );
}
export const CardFooter = ({ children }: { children: ReactNode }) =>
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>{children}</View>;

/* Selectable option card: the system's "account type" pattern (goal, split). */
export function OptionCard({ icon, title, body, selected, onPress }: { icon: string; title: string; body: string; selected: boolean; onPress: () => void }) {
  return (
    <Card selected={selected} onPress={onPress} accessibilityLabel={`${title}. ${body}`} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.base }}>
      <Icon name={icon} size={28} color={selected ? 'primary' : 'ink'} />
      <View style={{ flex: 1, gap: spacing.xs }}>
        <T size="headline" weight="semiBold">{title}</T>
        <T size="callout" color="inkMuted48">{body}</T>
      </View>
    </Card>
  );
}

/* ----------------------------------------------------------------- chips */
export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const scaled = usePressScale(0.96);
  const box: ViewStyle = { paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.md, borderRadius: radius.pill, ...curve, backgroundColor: active ? colors.primary : colors.canvasParchment };
  const text = <T size="callout" color={active ? 'onPrimary' : onPress ? 'ink' : 'inkMuted80'}>{label}</T>;
  if (!onPress) return <View style={box}>{text}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: !!active }} hitSlop={4}
      onPress={() => { light(); onPress(); }} style={({ pressed }) => [box, scaled(pressed)]}>{text}</Pressable>
  );
}
export function ChoiceChips<V extends string | number>({ options, value, onChange }: { options: { value: V; label: string }[]; value: V | null; onChange: (v: V) => void }) {
  return <Row wrap>{options.map((o) => <Chip key={String(o.value)} label={o.label} active={o.value === value} onPress={() => onChange(o.value)} />)}</Row>;
}
export function MultiChips<V extends string>({ options, values, onChange, order }: { options: { value: V; label: string }[]; values: V[]; onChange: (v: V[]) => void; order?: V[] }) {
  const toggle = (v: V) => {
    const next = values.includes(v) ? values.filter((x) => x !== v) : [...values, v];
    onChange(order ? next.sort((a, b) => order.indexOf(a) - order.indexOf(b)) : next);
  };
  return <Row wrap>{options.map((o) => <Chip key={o.value} label={o.label} active={values.includes(o.value)} onPress={() => toggle(o.value)} />)}</Row>;
}

/* ----------------------------------------------------------------- input */
type InputProps = Omit<TextInputProps, 'style'> & { label: string; hint?: string | null; error?: string | null; leftIcon?: string };
export const Input = forwardRef<TextInput, InputProps>(function Input({ label, hint, error, leftIcon, ...rest }, ref) {
  return (
    <View style={{ gap: spacing.xs }}>
      <T size="callout" weight="semiBold">{label}</T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.base, minHeight: 48, backgroundColor: colors.canvas, borderWidth: 1, borderColor: error ? colors.danger : colors.hairline, borderRadius: radius.md, ...curve }}>
        {leftIcon ? <Icon name={leftIcon} size={18} color="inkMuted48" /> : null}
        <TextInput ref={ref} accessibilityLabel={label} placeholderTextColor={colors.inkMuted48}
          style={[textStyle('body'), { flex: 1, color: colors.ink, paddingVertical: spacing.md, minWidth: 0 }]} {...rest} />
      </View>
      {error ? <T size="caption" color="danger">{error}</T> : hint ? <Caption>{hint}</Caption> : null}
    </View>
  );
});

/* A labelled group of controls (the label matches the Input label style). */
export function Field({ label, hint, children }: { label: string; hint?: string | null; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <T size="callout" weight="semiBold">{label}</T>
      {children}
      {hint ? <Caption>{hint}</Caption> : null}
    </View>
  );
}

/* ---------------------------------------------------------------- switch */
export function Switch({ on, onChange, label, disabled }: { on: boolean; onChange?: (on: boolean) => void; label: string; disabled?: boolean }) {
  return (
    <RNSwitch value={on} onValueChange={onChange} disabled={disabled} accessibilityLabel={label}
      trackColor={{ true: colors.primary, false: colors.hairline }} thumbColor={colors.canvas} ios_backgroundColor={colors.hairline} />
  );
}

/* A tick box (the design system has none): an iOS-style selection circle. */
export function Check({ checked, onChange, label, detail, error }: { checked: boolean; onChange: (v: boolean) => void; label: string; detail?: string; error?: string | null }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} accessibilityLabel={label} accessibilityHint={detail}
      onPress={() => { light(); onChange(!checked); }} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.base, minHeight: 44 }}>
      <View style={{ width: 24, height: 24, marginTop: 1, borderRadius: radius.pill, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
        borderColor: error ? colors.danger : checked ? colors.primary : colors.inkMuted48, backgroundColor: checked ? colors.primary : colors.canvas }}>
        {checked ? <Icon name="checkmark" size={14} color="onPrimary" /> : null}
      </View>
      <View style={{ flex: 1, gap: spacing.xxs }}>
        <T size="body">{label}</T>
        {detail ? <T size="caption" color="inkMuted80">{detail}</T> : null}
        {error ? <T size="caption" color="danger">{error}</T> : null}
      </View>
    </Pressable>
  );
}

/* --------------------------------------------------------------- stepper */
export function Stepper({ value, onChange, min = 0, max = 99, step = 1, label, format }: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; label: string; format?: (v: number) => string;
}) {
  const btn = (name: string, text: string, next: number, off: boolean) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`${text} ${label}`} accessibilityState={{ disabled: off }} disabled={off}
      onPress={() => { light(); onChange(next); }} hitSlop={6}
      style={{ width: 36, height: 36, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center', opacity: off ? 0.5 : 1 }}>
      <Icon name={name} size={18} color="primary" />
    </Pressable>
  );
  return (
    <Row gap="sm">
      {btn('minus', 'Decrease', Math.max(min, value - step), value <= min)}
      <T size="body" weight="semiBold" tabular align="center" style={{ minWidth: 44 }}>{format ? format(value) : String(value)}</T>
      {btn('plus', 'Increase', Math.min(max, value + step), value >= max)}
    </Row>
  );
}

/* ------------------------------------------------------- grouped rows */
export type RowSpec = {
  key: string; label: string; detail?: ReactNode; right?: ReactNode; onPress?: () => void;
  color?: ColorToken; icon?: string; iconColor?: ColorToken; chevron?: boolean; accessibilityLabel?: string;
};
/* Grouped rows (surfacePearl, dividerSoft) with an optional second line. */
export function Rows({ rows }: { rows: (RowSpec | null | false | undefined)[] }) {
  const list = rows.filter(Boolean) as RowSpec[];
  return (
    <View style={{ backgroundColor: colors.surfacePearl, borderRadius: radius.lg, ...curve, overflow: 'hidden' }}>
      {list.map((r, i) => {
        const inner = (
          <>
            {r.icon ? <Icon name={r.icon} size={22} color={r.iconColor || 'primary'} /> : null}
            <View style={{ flex: 1, gap: spacing.xxs }}>
              <T size="body" color={r.color || 'ink'}>{r.label}</T>
              {r.detail ? (typeof r.detail === 'string' ? <T size="caption" color="inkMuted80">{r.detail}</T> : r.detail) : null}
            </View>
            {r.right || null}
            {r.onPress && r.chevron !== false ? <Icon name="chevron.right" size={16} color="inkMuted48" /> : null}
          </>
        );
        const style: ViewStyle = { flexDirection: 'row', alignItems: 'center', gap: spacing.base, paddingVertical: spacing.base, paddingHorizontal: spacing.lg, minHeight: 52, borderTopWidth: i ? 1 : 0, borderTopColor: colors.dividerSoft };
        return r.onPress ? (
          <Pressable key={r.key} accessibilityRole="button" accessibilityLabel={r.accessibilityLabel}
            onPress={r.onPress} style={({ pressed }) => [style, pressed ? { backgroundColor: colors.dividerSoft } : null]}>{inner}</Pressable>
        ) : <View key={r.key} style={style}>{inner}</View>;
      })}
    </View>
  );
}

/* Label/value list with hairline rows. */
export function Facts({ rows }: { rows: ([string, string, { valueColor?: ColorToken; tabular?: boolean }?] | null | false)[] }) {
  const list = rows.filter(Boolean) as [string, string, { valueColor?: ColorToken; tabular?: boolean }?][];
  return (
    <View>
      {list.map(([k, v, o], i) => (
        <View key={`${k}${i}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.base, paddingVertical: spacing.sm, borderTopWidth: i ? 1 : 0, borderTopColor: colors.dividerSoft }}>
          <T size="callout" color="inkMuted80" style={{ flexShrink: 1 }}>{k}</T>
          <T size="callout" color={(o && o.valueColor) || 'ink'} tabular={!(o && o.tabular === false)} align="right" style={{ flexShrink: 1 }}>{v}</T>
        </View>
      ))}
    </View>
  );
}

/* ----------------------------------------------------------------- badge */
/* Status badges come from the app palettes (design/app-palettes.json). */
export function Badge({ palette, status, label }: { palette: string; status: string; label?: string }) {
  const pal = palettes[palette];
  if (!pal) throw new Error(`Unknown palette ${palette}`);
  const entry = pal[status] || { bg: 'canvasParchment' as ColorToken, fg: 'inkMuted80' as ColorToken, label: status };
  return (
    <View style={{ alignSelf: 'flex-start', paddingVertical: spacing.xxs, paddingHorizontal: spacing.sm, borderRadius: radius.pill, ...curve, backgroundColor: colors[entry.bg] }}>
      <T size="caption" color={entry.fg}>{label || entry.label}</T>
    </View>
  );
}

/* -------------------------------------------------------------- gauge */
export function StatGauge({ value, label, pct }: { value: string; label: string; pct: number }) {
  const p = Math.max(0, Math.min(1, pct || 0));
  return (
    <View accessible accessibilityLabel={`${value}. ${label}`} style={{ flex: 1, minWidth: 0, gap: spacing.sm, padding: spacing.base, backgroundColor: colors.canvasParchment, borderRadius: radius.lg, ...curve }}>
      <T size="headline" weight="semiBold" tabular numberOfLines={1}>{value}</T>
      <T size="caption" color="inkMuted80" numberOfLines={2}>{label}</T>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.hairline, overflow: 'hidden' }}>
        <View style={{ width: `${Math.round(p * 100)}%`, height: '100%', borderRadius: 3, backgroundColor: colors.primary }} />
      </View>
    </View>
  );
}
export const Grid2 = ({ children }: { children: ReactNode[] }) => {
  const items = (children as ReactNode[]).filter(Boolean);
  const pairs: ReactNode[][] = [];
  for (let i = 0; i < items.length; i += 2) pairs.push(items.slice(i, i + 2));
  return (
    <View style={{ gap: spacing.md }}>
      {pairs.map((pair, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: spacing.md }}>
          {pair.map((c, j) => <View key={j} style={{ flex: 1, minWidth: 0 }}>{c}</View>)}
          {pair.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
};

/* ------------------------------------------------------- empty answer */
/* "Nothing here" and gate answers: the EmptyState layout with any glyph. */
export function EmptyAnswer({ icon = 'magnifyingglass', title, body, children }: { icon?: string; title: string; body?: string | null; children?: ReactNode }) {
  return (
    <View style={{ alignItems: 'center', gap: spacing.base, paddingVertical: spacing.xxxl, paddingHorizontal: spacing.base }}>
      <Icon name={icon} size={44} color="inkMuted48" />
      <T size="title3" weight="semiBold" align="center" accessibilityRole="header">{title}</T>
      {body ? <T size="body" color="inkMuted48" align="center">{body}</T> : null}
      {children ? <View style={{ alignSelf: 'stretch', gap: spacing.sm }}>{children}</View> : null}
    </View>
  );
}

/* The disclaimer on a canvasParchment band. */
export function DisclaimerBand({ text }: { text: string }) {
  return (
    <View style={{ backgroundColor: colors.canvasParchment, borderRadius: radius.lg, ...curve, padding: spacing.base }}>
      <Caption color="inkMuted80">{text}</Caption>
    </View>
  );
}

/* The source line under a value Apple Health filled in. */
export const FromHealth = ({ text }: { text: string }) => (
  <Row><Icon name="heart" size={16} color="primary" /><T size="caption" color="inkMuted80" style={{ flex: 1 }}>{text}</T></Row>
);
