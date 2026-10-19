/* Food detail (prototype/src/60-food.js FoodDetail): the amount, the
   nutrition card, "How healthy is it?", where the numbers come from, and the
   Log button that names the outcome ("Log 1 bar, 165 kcal").
   Params: id; optional meal, via ('barcode' | 'qr'), from ('yours'), grams,
   and entryId (editing a logged entry: the button saves instead). */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking } from 'react-native';

import { AmountStepper, MealPicker } from '@/features/food/components';
import { HealthRatingList } from '@/features/food/HealthRatingList';
import {
  amountPhrase, defaultMeal, detailSubtitle, isMeal, isPlain100, mealTarget, num, offProductUrl, parseNumber,
  servingInfo, sourceSentence, str, unitOf, type ServingInfo
} from '@/features/food/helpers';
import { NutritionCard } from '@/features/food/NutritionCard';
import { domain as M, type Food } from '@/shared';
import { A, useApp, type Meal } from '@/store';
import { Badge, Button, Caption, ChoiceChips, EmptyAnswer, goBack, LinkButton, overlay, Row, Screen, Section, Stack, Stepper, T } from '@/ui';

type Amount = { mode: 'serving' | 'grams'; servings: number; grams: number };

function initialAmount(info: ServingInfo | null, startGrams: number): Amount {
  if (info) {
    const n = startGrams / info.grams;
    if (Math.abs(n * 2 - Math.round(n * 2)) < 1e-9 && n >= 0.5) return { mode: 'serving', servings: n, grams: 100 };
  }
  return { mode: 'grams', servings: 1, grams: Math.round(startGrams) || 100 };
}

export default function FoodDetailRoute() {
  const p = useLocalSearchParams<{ id: string; meal?: string; via?: string; from?: string; grams?: string; entryId?: string }>();
  const customFoods = useApp((s) => s.customFoods);
  const foodLog = useApp((s) => s.foodLog);
  const food = M.findFood(str(p.id), customFoods) as Food | null;
  const entryId = str(p.entryId);
  const entry = entryId ? foodLog.find((e) => e.id === entryId) || null : null;
  const info = food ? servingInfo(food) : null;
  const unit = unitOf(food);
  const serving = info && !isPlain100(info, unit) ? info : null;
  const gramsParam = parseNumber(str(p.grams));
  const startGrams = entry ? entry.grams : gramsParam && !Number.isNaN(gramsParam) ? gramsParam : serving ? serving.grams : 100;
  const [amount, setAmount] = useState<Amount>(() => initialAmount(serving, startGrams));
  const [meal, setMeal] = useState<Meal>(() => (entry ? entry.meal : isMeal(str(p.meal)) ? (str(p.meal) as Meal) : defaultMeal()));

  if (!food) {
    return (
      <Screen title="Food">
        <EmptyAnswer icon="magnifyingglass" title="We couldn't find this food" body="It may have been removed from your foods.">
          <Button variant="outline" label="Search foods" onPress={() => router.replace('/food/search')} />
        </EmptyAnswer>
      </Screen>
    );
  }

  const grams = amount.mode === 'serving' && serving ? amount.servings * serving.grams : amount.grams;
  const nu = M.nutrientsFor(food, grams);
  const kcal = nu.energyKcal == null ? null : Math.round(nu.energyKcal);
  const phrase = amountPhrase(food, grams, amount.mode);
  const isEstimate = !!food.confidence && food.confidence !== 'high';

  const basis = [
    serving ? { value: 'serving' as const, label: serving.chip } : null,
    { value: 'grams' as const, label: `Per 100 ${unit}` }
  ].filter(Boolean) as { value: 'serving' | 'grams'; label: string }[];
  const setBasis = (v: 'serving' | 'grams') =>
    setAmount((a) => (v === 'serving' ? { ...a, mode: 'serving', servings: 1 } : { ...a, mode: 'grams', grams: 100 }));

  function log() {
    if (!food) return;
    if (entry) {
      A.updateLogEntry(entry.id, { grams, meal });
      overlay.toast('Entry updated', 'success');
      goBack();
      return;
    }
    A.logFood({ food, grams, meal });
    overlay.toast(`Logged ${phrase} ${mealTarget(meal)}`, 'success');
    router.dismissTo('/food');
  }
  const cta = entry ? 'Save changes' : kcal == null ? `Log ${phrase}` : `Log ${phrase}, ${M.fmt.int(kcal)} kcal`;
  const offCode = food.source === 'open_food_facts' && food.gtin ? food.gtin : null;
  const via = str(p.via);
  const sentence = str(p.from) === 'yours'
    ? `${via === 'qr' ? "We read the barcode number from the pack's QR code. " : ''}Found in your foods. ${sourceSentence(food, undefined)}`
    : sourceSentence(food, via);

  return (
    <Screen title={food.name} subtitle={detailSubtitle(food) || null}>
      <Stack>
        <ChoiceChips options={basis} value={amount.mode === 'serving' && serving ? 'serving' : 'grams'} onChange={setBasis} />
        <Row between>
          <T size="callout" weight="semiBold">Amount</T>
          {amount.mode === 'serving' && serving ? (
            <Stepper label="Amount" value={amount.servings} min={0.5} max={20} step={0.5}
              format={(v) => (serving.countable ? amountPhrase(food, v * serving.grams, 'serving') : `${num(v * serving.grams)} ${unit}`)}
              onChange={(v) => setAmount((a) => ({ ...a, servings: v }))} />
          ) : (
            <AmountStepper unit={unit} value={amount.grams} onChange={(v) => setAmount((a) => ({ ...a, grams: v }))} />
          )}
        </Row>
        <NutritionCard food={food} grams={grams} />
        <Stack gap="xs">
          {isEstimate ? <Row><Badge palette="estimateConfidence" status={food.confidence as string} /></Row> : null}
          <Caption>{sentence}</Caption>
          {offCode ? (
            <LinkButton size="caption" icon="link" label="See this product on Open Food Facts"
              onPress={() => { Linking.openURL(offProductUrl(offCode)).catch(() => {}); }} />
          ) : null}
        </Stack>
      </Stack>

      <Section title="How healthy is it?" caption={`Each line compares this food with a published reference, per 100 ${unit}.`}>
        <HealthRatingList food={food} />
      </Section>

      <Stack>
        <MealPicker value={meal} onChange={setMeal} />
        <Button label={cta} onPress={log} />
      </Stack>
    </Screen>
  );
}
