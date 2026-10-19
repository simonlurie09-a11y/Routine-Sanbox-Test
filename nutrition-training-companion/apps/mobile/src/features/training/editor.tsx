/* Pieces of the split editor (training/edit): the exercise list with its
   controls, the catalogue, and the add-a-day form. */
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { plural } from '@/features/shared';
import type { SplitDay, SplitItem } from '@/store';
import { colors, curve, radius, spacing } from '@/theme';
import { Button, Caption, ChoiceChips, Icon, IconButton, Input, LinkButton, Row, Rows, Stack, Stepper, T } from '@/ui';
import {
  EXERCISES, MUSCLES, NEW_ITEM, WEEK_ORDER, WEEKDAY_SHORT, creditLine, exercise, prescription, primaryMuscle, restShort, uniq,
  weekdayName, type Exercise
} from './helpers';

/* Weekday chips, Monday first, plus "Any day" (-1) for a day with no fixed weekday. */
export const WEEKDAY_OPTIONS = [...WEEK_ORDER.map((w) => ({ value: w, label: WEEKDAY_SHORT[w] })), { value: -1, label: 'Any day' }];

const group = { backgroundColor: colors.surfacePearl, borderRadius: radius.lg, ...curve, overflow: 'hidden' as const };

function StepRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Row between style={{ minHeight: 44 }}>
      <T size="callout" color="inkMuted80" style={{ flexShrink: 1 }}>{label}</T>
      {children}
    </Row>
  );
}

type ItemPatch = Partial<Omit<SplitItem, 'exercise'>>;
function ItemRow({ it, index, count, first, open, onToggle, onChange, onMove, onRemove }: {
  it: SplitItem; index: number; count: number; first: boolean; open: boolean;
  onToggle: () => void; onChange: (patch: ItemPatch) => void; onMove: (by: -1 | 1) => void; onRemove: () => void;
}) {
  const name = exercise(it.exercise).name;
  return (
    <View accessibilityRole="none" style={{ paddingVertical: spacing.base, paddingHorizontal: spacing.lg, gap: spacing.sm, borderTopWidth: first ? 0 : 1, borderTopColor: colors.dividerSoft }}>
      <Row between style={{ alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: spacing.xxs }}>
          <T size="body">{name}</T>
          <T size="caption" color="inkMuted80">{prescription(it)}</T>
        </View>
        <IconButton name="trash" label={`Remove ${name}`} onPress={onRemove} />
      </Row>
      <StepRow label="Sets">
        <Stepper label={`sets for ${name}`} value={it.sets} min={1} max={10} onChange={(v) => onChange({ sets: v })} />
      </StepRow>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }}
        accessibilityLabel={open ? `Hide reps, rest and order for ${name}` : `Reps, rest and order for ${name}`}
        onPress={onToggle} hitSlop={6}
        style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, minHeight: 44, alignSelf: 'flex-start', opacity: pressed ? 0.6 : 1 })}>
        <T size="callout" color="primary">{open ? 'Hide reps, rest and order' : 'Reps, rest and order'}</T>
        <Icon name={open ? 'chevron.down' : 'chevron.right'} size={14} color="primary" />
      </Pressable>
      {open ? (
        <Stack gap="xs">
          <StepRow label="Lowest reps">
            <Stepper label={`lowest reps for ${name}`} value={it.repMin} min={1} max={30}
              onChange={(v) => onChange({ repMin: v, repMax: Math.max(it.repMax, v) })} />
          </StepRow>
          <StepRow label="Highest reps">
            <Stepper label={`highest reps for ${name}`} value={it.repMax} min={it.repMin} max={50} onChange={(v) => onChange({ repMax: v })} />
          </StepRow>
          <StepRow label="Reps in reserve">
            <Stepper label={`reps in reserve for ${name}`} value={it.rir} min={0} max={5} onChange={(v) => onChange({ rir: v })} />
          </StepRow>
          <StepRow label="Rest between sets">
            <Stepper label={`rest for ${name}`} value={it.restS} min={30} max={300} step={15} format={restShort} onChange={(v) => onChange({ restS: v })} />
          </StepRow>
          <Row gap="lg" wrap>
            {index > 0 ? <LinkButton size="callout" label="Move up" onPress={() => onMove(-1)} /> : null}
            {index < count - 1 ? <LinkButton size="callout" label="Move down" onPress={() => onMove(1)} /> : null}
          </Row>
        </Stack>
      ) : null}
    </View>
  );
}

export function EditItems({ day, onChange, onMove, onRemove }: {
  day: SplitDay; onChange: (exerciseId: string, patch: ItemPatch) => void; onMove: (exerciseId: string, by: -1 | 1) => void; onRemove: (exerciseId: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  if (!day.items.length) return <Caption>No exercises on this day yet. Add one below.</Caption>;
  return (
    <View style={group}>
      {day.items.map((it, i) => (
        <ItemRow key={it.exercise} it={it} index={i} count={day.items.length} first={i === 0} open={open === it.exercise}
          onToggle={() => setOpen(open === it.exercise ? null : it.exercise)}
          onChange={(patch) => onChange(it.exercise, patch)} onMove={(by) => onMove(it.exercise, by)} onRemove={() => onRemove(it.exercise)} />
      ))}
    </View>
  );
}

/* The catalogue for one day: exercises that fit the equipment, grouped by muscle. */
export function Catalogue({ day, baseDay, equipment, onAdd, onHide }: {
  day: SplitDay; baseDay: SplitDay | null; equipment: string[]; onAdd: (exerciseId: string) => void; onHide: () => void;
}) {
  const usable = EXERCISES.filter((ex) => ex.equipment.every((e) => equipment.includes(e)) && !day.items.some((it) => it.exercise === ex.id));
  const byMuscle = MUSCLES.map((m) => ({ muscle: m, list: usable.filter((ex) => primaryMuscle(ex) === m.id) })).filter((g) => g.list.length);
  const areas = uniq(byMuscle.map((g) => g.muscle.group));
  const [area, setArea] = useState<string>(areas[0] || '');
  const shown = byMuscle.filter((g) => g.muscle.group === (areas.includes(area) ? area : areas[0]));
  const detail = (ex: Exercise) => {
    const original = baseDay ? baseDay.items.find((it) => it.exercise === ex.id) : null;
    return original
      ? `Put back: ${plural(original.sets, 'set')} of ${original.repMin}–${original.repMax}`
      : `Adds ${plural(NEW_ITEM.sets, 'set')} of ${NEW_ITEM.repMin}–${NEW_ITEM.repMax}. ${creditLine(ex.id)}`;
  };
  return (
    <Stack>
      <ChoiceChips value={areas.includes(area) ? area : areas[0]} onChange={setArea} options={areas.map((a) => ({ value: a, label: a }))} />
      {shown.map((g) => (
        <Stack key={g.muscle.id} gap="sm">
          <T size="callout" weight="semiBold" accessibilityRole="header">{g.muscle.name}</T>
          <Rows rows={g.list.map((ex) => ({
            key: ex.id, label: ex.name, icon: 'plus', chevron: false, detail: detail(ex),
            accessibilityLabel: `Add ${ex.name}. ${detail(ex)}`, onPress: () => onAdd(ex.id)
          }))} />
        </Stack>
      ))}
      <LinkButton label="Hide the list" onPress={onHide} />
    </Stack>
  );
}

/* The form for a new training day: a name and a weekday. */
export function AddDayForm({ taken, takenWeekdays, onAdd, onCancel }: {
  taken: string[]; takenWeekdays: number[]; onAdd: (label: string, weekday: number | null) => void; onCancel?: () => void;
}) {
  const [label, setLabel] = useState('');
  const [weekday, setWeekday] = useState<number>(() => WEEK_ORDER.find((w) => !takenWeekdays.includes(w)) ?? -1);
  const name = label.trim();
  const clash = !!name && taken.some((t) => t.toLowerCase() === name.toLowerCase());
  const add = () => {
    if (!name || clash) return;
    onAdd(name, weekday === -1 ? null : weekday);
  };
  return (
    <Stack>
      <Input label="Day name" value={label} placeholder="For example, Push or Upper A" onChangeText={setLabel}
        error={clash ? `You already have a day called ${name}.` : null} onSubmitEditing={add} returnKeyType="done" autoCapitalize="words" />
      <Stack gap="xs">
        <T size="callout" weight="semiBold">Day of the week</T>
        <ChoiceChips value={weekday} onChange={setWeekday} options={WEEKDAY_OPTIONS} />
        {weekday !== -1 && takenWeekdays.includes(weekday)
          ? <Caption>{`You already train on ${weekdayName(weekday)}. That’s fine if you train twice that day.`}</Caption>
          : null}
      </Stack>
      <Button variant="outline" label={name ? `Add ${name}` : 'Add this day'} disabled={!name || clash} onPress={add} />
      {onCancel ? <LinkButton label="Not now" onPress={onCancel} /> : null}
    </Stack>
  );
}
