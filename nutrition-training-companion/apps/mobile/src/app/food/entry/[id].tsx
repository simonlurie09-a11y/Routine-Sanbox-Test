/* A logged entry (prototype/src/60-food.js LogEntry): change the amount and
   the meal, or delete it (with a confirm). A quick add has no weight, so its
   calories are edited instead. */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { AmountStepper, MealPicker } from '@/features/food/components';
import { foodHref, isQuickFood, mealLabel, num, parseNumber, str } from '@/features/food/helpers';
import { NutrientFacts } from '@/features/food/NutritionCard';
import { whenText } from '@/features/shared';
import { domain as M, type Food, type Nutrients } from '@/shared';
import { A, useApp, type Meal } from '@/store';
import { Badge, Button, Caption, EmptyAnswer, goBack, Input, LinkButton, overlay, Row, Screen, Stack, T } from '@/ui';

export default function LogEntryRoute() {
  const p = useLocalSearchParams<{ id: string }>();
  const id = str(p.id);
  const entry = useApp((s) => s.foodLog.find((e) => e.id === id) || null);
  const customFoods = useApp((s) => s.customFoods);
  const [grams, setGrams] = useState(entry ? entry.grams : 100);
  const [meal, setMeal] = useState<Meal>(entry ? entry.meal : 'snack');
  const [kcalText, setKcalText] = useState(entry && entry.nutrients.energyKcal != null ? String(Math.round(entry.nutrients.energyKcal)) : '');
  /* The entry can change under this screen (saved from its food's page): start again from what's stored. */
  const storedMeal = entry ? entry.meal : null;
  const storedGrams = entry ? entry.grams : null;
  const storedKcal = entry ? entry.nutrients.energyKcal : null;
  useEffect(() => {
    if (storedMeal) setMeal(storedMeal);
    if (storedGrams != null) setGrams(storedGrams);
    setKcalText(storedKcal != null ? String(Math.round(storedKcal)) : '');
  }, [storedMeal, storedGrams, storedKcal]);

  if (!entry) {
    return (
      <Screen title="Entry">
        <EmptyAnswer icon="info.circle" title="This entry isn't in your log" body="It may have been deleted.">
          <Button variant="outline" label="Go to Food" onPress={() => router.dismissTo('/food')} />
        </EmptyAnswer>
      </Screen>
    );
  }

  const food = M.findFood(entry.foodId, customFoods) as Food | null;
  const quick = !food || isQuickFood(food);
  /* A quick add's calories can change only while its food is kept. */
  const kcalEditable = quick && !!food;
  const unit = entry.isBeverage ? 'ml' : 'g';
  const scale = entry.grams ? grams / entry.grams : 1;
  const kcalNew = parseNumber(kcalText);
  const kcalOk = kcalNew != null && !Number.isNaN(kcalNew) && kcalNew > 0 && kcalNew <= 5000;
  const preview: Record<string, number | null> = {};
  (Object.keys(entry.nutrients) as (keyof Nutrients | 'saltG')[]).forEach((k) => {
    const v = entry.nutrients[k];
    preview[k] = v == null ? null : quick ? v : v * scale;
  });
  if (kcalEditable && kcalOk) preview.energyKcal = kcalNew;

  const kcalChanged = kcalEditable && kcalOk && Math.round(kcalNew as number) !== Math.round(entry.nutrients.energyKcal || 0);
  const changed = meal !== entry.meal || (quick ? kcalChanged : grams !== entry.grams);
  const canSave = changed && (!kcalEditable || kcalOk);

  function save() {
    if (!entry) return;
    if (quick) {
      if (kcalChanged && food) {
        A.saveCustomFood({ ...food, nutrients: { ...food.nutrients, energyKcal: kcalNew } });
        A.updateLogEntry(entry.id, { grams: entry.grams, meal });
      } else A.updateLogEntry(entry.id, { meal });
    } else A.updateLogEntry(entry.id, { grams, meal });
    overlay.toast('Entry updated', 'success');
    goBack();
  }
  function remove() {
    if (!entry) return;
    const entryId = entry.id;
    overlay.alert({
      title: 'Delete this entry?',
      message: `${entry.name} comes off ${M.fmt.relativeDay(entry.at) === 'Today' ? "today's" : "that day's"} log and totals. You can log it again at any time.`,
      buttons: [
        { label: 'Cancel', style: 'cancel' },
        { label: 'Delete', style: 'destructive', onPress: () => { goBack(); A.deleteLogEntry(entryId); overlay.toast('Entry deleted'); } }
      ]
    });
  }

  return (
    <Screen title={entry.name} subtitle={`${mealLabel(entry.meal)} · ${whenText(entry.at)}`}>
      <Stack>
        <NutrientFacts nu={preview} title={quick ? 'Nutrition' : `Nutrition, ${num(grams)} ${unit}`} />
        {entry.confidence && entry.confidence !== 'high' ? (
          <Stack gap="xs">
            <Row><Badge palette="estimateConfidence" status={entry.confidence} /></Row>
            <Caption>This entry uses estimated values, so treat the numbers as a guide.</Caption>
          </Stack>
        ) : null}
        {!quick ? (
          <LinkButton label="See nutrition and rating" onPress={() => router.push(foodHref(entry.foodId, { entryId: entry.id }))} />
        ) : null}
      </Stack>

      <Stack>
        {kcalEditable ? (
          <Input label="Calories (kcal)" keyboardType="decimal-pad" autoComplete="off" value={kcalText} onChangeText={setKcalText}
            error={kcalText.trim() && !kcalOk ? 'Enter a number from 1 to 5,000.' : null} />
        ) : !quick ? (
          <Row between>
            <T size="callout" weight="semiBold">Amount</T>
            <AmountStepper unit={unit} value={grams} onChange={setGrams} />
          </Row>
        ) : null}
        <MealPicker value={meal} onChange={setMeal} />
      </Stack>

      <Stack gap="sm">
        <Button label="Save changes" disabled={!canSave} onPress={save} />
        <Button variant="danger" label="Delete entry" icon="trash" onPress={remove} />
      </Stack>
    </Screen>
  );
}
