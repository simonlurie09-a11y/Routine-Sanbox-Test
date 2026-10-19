/* Small pieces the food screens share: the add-food sheet, the estimate
   badge, the search box, the meal picker and the amount stepper. Built from
   the kit and the theme tokens only. */
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState, type Ref } from 'react';
import { Platform, Pressable, TextInput, View } from 'react-native';

import type { Meal } from '@/store';
import { colors, curve, radius, spacing, textStyle } from '@/theme';
import { Badge, ChoiceChips, Icon, IconButton, overlay, Stack, T } from '@/ui';
import { href, MEALS, mealLabel, num, parseNumber } from './helpers';

const light = () => {
  if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
};

/* -------------------------------------------------------- add-food sheet */
/* The system's Sheet, options ordered by likelihood (docs/08 §8.6, Add food). */
export function openAddFood(meal?: Meal) {
  const q = { meal };
  overlay.sheet({
    title: meal ? `Add to ${mealLabel(meal).toLowerCase()}` : 'Add food',
    options: [
      { label: 'Scan a barcode', onPress: () => router.push(href('/scanner', q)) },
      { label: 'Add a food from its label', onPress: () => router.push(href('/food/new', q)) },
      { label: 'Search foods', onPress: () => router.push(href('/food/search', q)) },
      { label: 'Quick add calories', onPress: () => router.push(href('/food/quick-add', q)) }
    ]
  });
}

/* ------------------------------------------------------------- badges */
export const EstimateBadge = ({ confidence }: { confidence?: string | null }) =>
  confidence && confidence !== 'high' ? <Badge palette="estimateConfidence" status={confidence} label="Estimate" /> : null;

/* -------------------------------------------------------------- search */
const PILL = {
  flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing.sm, minHeight: 44,
  paddingLeft: spacing.base, paddingRight: spacing.xs, backgroundColor: colors.canvas,
  borderWidth: 1, borderColor: colors.hairline, borderRadius: radius.pill, ...curve
};

/* The pill search field (the system's Input, pill variant). */
export function SearchBox({ value, onChange, placeholder = 'Food or brand', label = 'Search foods', autoFocus, onSubmit, inputRef }: {
  value: string; onChange: (v: string) => void; placeholder?: string; label?: string; autoFocus?: boolean; onSubmit?: () => void; inputRef?: Ref<TextInput>;
}) {
  return (
    <View style={PILL}>
      <Icon name="magnifyingglass" size={18} color="inkMuted48" />
      <TextInput ref={inputRef} value={value} onChangeText={onChange} placeholder={placeholder} accessibilityLabel={label}
        placeholderTextColor={colors.inkMuted48} autoFocus={autoFocus} autoCorrect={false} autoCapitalize="none"
        returnKeyType="search" onSubmitEditing={onSubmit} clearButtonMode="never"
        style={[textStyle('body'), { flex: 1, minWidth: 0, color: colors.ink, paddingVertical: spacing.md }]} />
      {value ? <IconButton name="xmark" label="Clear search" size={16} color="inkMuted48" onPress={() => onChange('')} /> : <View style={{ width: spacing.sm }} />}
    </View>
  );
}

/* The Food tab's search field: a button that opens search, with the scanner beside it. */
export function SearchPill({ onPress, onScan }: { onPress: () => void; onScan: () => void }) {
  return (
    <View style={PILL}>
      <Pressable accessibilityRole="button" accessibilityLabel="Search foods" onPress={onPress}
        style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 44, opacity: pressed ? 0.6 : 1 })}>
        <Icon name="magnifyingglass" size={18} color="inkMuted48" />
        <T size="body" color="inkMuted48">Search foods</T>
      </Pressable>
      <IconButton name="barcode.viewfinder" label="Scan a barcode" onPress={onScan} />
    </View>
  );
}

/* ----------------------------------------------------------- meal picker */
export function MealPicker({ value, onChange, label = 'Meal' }: { value: Meal; onChange: (m: Meal) => void; label?: string }) {
  return (
    <Stack gap="sm">
      <T size="callout" weight="semiBold" accessibilityRole="header">{label}</T>
      <ChoiceChips options={MEALS} value={value} onChange={onChange} />
    </Stack>
  );
}

/* ------------------------------------------------------- amount stepper */
/* Grams (or ml): minus and plus in steps of 10, and the number in between can
   be typed. Steps snap to the grid (15 -> 10 or 20). */
export function AmountStepper({ value, onChange, unit, step = 10, max = 2000, label = 'Amount' }: {
  value: number; onChange: (v: number) => void; unit: string; step?: number; max?: number; label?: string;
}) {
  const [text, setText] = useState(num(value));
  useEffect(() => { setText((t) => (parseNumber(t) === value ? t : num(value))); }, [value]);
  const down = value % step ? Math.floor(value / step) * step : value - step;
  const up = Math.min(max, Math.floor(value / step) * step + step);
  const btn = (name: string, words: string, next: number, off: boolean) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`${words} ${label}`} accessibilityState={{ disabled: off }} disabled={off}
      onPress={() => { light(); onChange(next); }} hitSlop={6}
      style={{ width: 36, height: 36, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center', opacity: off ? 0.5 : 1 }}>
      <Icon name={name} size={18} color="primary" />
    </Pressable>
  );
  function typed(t: string) {
    setText(t);
    const n = parseNumber(t);
    if (n != null && !Number.isNaN(n) && n >= 1 && n <= max) onChange(Math.round(n * 10) / 10);
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
      {btn('minus', 'Decrease', down, down < 1)}
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xxs, minWidth: 76, justifyContent: 'center' }}>
        <TextInput value={text} onChangeText={typed} onBlur={() => setText(num(value))} keyboardType="decimal-pad" selectTextOnFocus
          accessibilityLabel={`${label} in ${unit === 'ml' ? 'millilitres' : 'grams'}`} maxLength={6}
          style={[textStyle('body', 'semiBold'), { color: colors.ink, textAlign: 'right', width: 64, paddingVertical: spacing.xs, fontVariant: ['tabular-nums'],
            borderBottomWidth: 1, borderBottomColor: colors.hairline }]} />
        <T size="body" weight="semiBold">{unit}</T>
      </View>
      {btn('plus', 'Increase', up, value >= max)}
    </View>
  );
}
