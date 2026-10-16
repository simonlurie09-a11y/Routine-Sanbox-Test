/* Quick add (prototype/src/60-food.js QuickAdd), presented as a modal: the
   calories, optionally protein, carbs and fat, and the meal. It's saved as a
   food (source 'quick_add', left out of lists and search) and logged once, so
   the entry can be edited later. */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { MealPicker } from '@/features/food/components';
import { defaultMeal, isMeal, mealTarget, parseNumber, str } from '@/features/food/helpers';
import { domain as M, type Food } from '@/shared';
import { A, type Meal } from '@/store';
import { spacing } from '@/theme';
import { Button, Caption, FormPage, goBack, Input, LinkButton, overlay, Stack } from '@/ui';

type Key = 'kcal' | 'protein' | 'carbs' | 'fat';

export default function QuickAdd() {
  const p = useLocalSearchParams<{ meal?: string; kcal?: string }>();
  const [vals, setVals] = useState<Record<Key, string>>({ kcal: str(p.kcal) || '', protein: '', carbs: '', fat: '' });
  const [meal, setMeal] = useState<Meal>(isMeal(str(p.meal)) ? (str(p.meal) as Meal) : defaultMeal());
  const set = (k: Key) => (v: string) => setVals((x) => ({ ...x, [k]: v }));

  const kcal = parseNumber(vals.kcal);
  const kcalOk = kcal != null && !Number.isNaN(kcal) && kcal > 0 && kcal <= 5000;
  const kcalError = vals.kcal.trim() && !kcalOk ? 'Enter a number from 1 to 5,000.' : null;
  const macroError = (k: Key) => {
    const n = parseNumber(vals[k]);
    return n != null && (Number.isNaN(n) || n > 500) ? 'Use 0 to 500' : null;
  };
  const ok = kcalOk && (['protein', 'carbs', 'fat'] as Key[]).every((k) => !macroError(k));

  function log() {
    if (!ok) return;
    const v = (k: Key) => {
      const n = parseNumber(vals[k]);
      return n == null || Number.isNaN(n) ? null : n;
    };
    /* Per 100 "g" and logged at 100, so the entry carries exactly these numbers. */
    const draft: Food = {
      id: '', name: 'Quick add', source: 'quick_add', confidence: 'high',
      serving: { grams: 100, label: '1 quick add' },
      nutrients: { energyKcal: kcal, proteinG: v('protein'), carbohydrateG: v('carbs'), sugarsG: null, fatG: v('fat'), saturatedFatG: null, fiberG: null, sodiumMg: null }
    };
    const id = A.saveCustomFood(draft);
    A.logFood({ food: { ...draft, id }, grams: 100, meal });
    overlay.toast(`Logged quick add ${mealTarget(meal)}`, 'success');
    goBack();
  }

  const field = (k: Key, label: string) => (
    <View style={{ flex: 1, minWidth: 0 }}>
      <Input label={label} keyboardType="decimal-pad" autoComplete="off" value={vals[k]} error={macroError(k)} onChangeText={set(k)} />
    </View>
  );

  return (
    <FormPage title="Quick add" subtitle="For when you know the calories but not the food."
      topLeft={<LinkButton label="Cancel" onPress={goBack} />}
      footer={<Button label={ok ? `Log ${M.fmt.kcal(kcal)}` : 'Log calories'} disabled={!ok} onPress={log} />}>
      <Input label="Calories (kcal)" keyboardType="decimal-pad" autoComplete="off" autoFocus value={vals.kcal} error={kcalError}
        onChangeText={set('kcal')} returnKeyType="done" />
      <Stack gap="sm">
        <Caption>Protein, carbs and fat are optional.</Caption>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {field('protein', 'Protein (g)')}
          {field('carbs', 'Carbs (g)')}
          {field('fat', 'Fat (g)')}
        </View>
      </Stack>
      <MealPicker value={meal} onChange={setMeal} />
    </FormPage>
  );
}
