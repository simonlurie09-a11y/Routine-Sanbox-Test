/* Food tab (prototype/src/60-food.js FoodHome): today's log by meal with the
   totals, the add actions, and your own foods. Starts empty on a new install;
   targets may not be set yet (then totals show without "of"). */
import { router } from 'expo-router';

import { EstimateBadge, openAddFood, SearchPill } from '@/features/food/components';
import { entryAmount, foodHref, href, isQuickFood, kcalText, listedFoods, MEALS, perServingText } from '@/features/food/helpers';
import { SetupCard } from '@/features/setup';
import { domain as M, type Food } from '@/shared';
import { S, useApp, type AppState, type LogEntry, type Meal } from '@/store';
import { BellButton, Caption, Card, CardTitle, Facts, IconButton, LinkButton, Row, Rows, Section, Stack, T, TabScreen } from '@/ui';

const YOUR_FOODS_SHOWN = 8;

function entryDetail(e: LogEntry, s: AppState) {
  const kcal = kcalText(e.nutrients.energyKcal);
  const food = M.findFood(e.foodId, s.customFoods) as Food | null;
  return !food || isQuickFood(food) ? kcal : `${entryAmount(e)} · ${kcal}`;
}

function MealSection({ meal, entries, s }: { meal: { value: Meal; label: string }; entries: LogEntry[]; s: AppState }) {
  const list = entries.filter((e) => e.meal === meal.value).sort((a, b) => a.at - b.at);
  const kcal = list.reduce((sum, e) => sum + (e.nutrients.energyKcal || 0), 0);
  return (
    <Section title={meal.label} action={list.length ? <T size="callout" color="inkMuted80" tabular>{M.fmt.kcal(kcal)}</T> : null}>
      {list.length ? (
        <Rows rows={list.map((e) => ({
          key: e.id, label: e.name, detail: entryDetail(e, s), right: <EstimateBadge confidence={e.confidence} />,
          accessibilityLabel: `${e.name}, ${entryDetail(e, s)}. Edit entry`,
          onPress: () => router.push(`/food/entry/${encodeURIComponent(e.id)}`)
        }))} />
      ) : <Caption>Nothing logged yet.</Caption>}
      <LinkButton icon="plus" label={`Add to ${meal.label.toLowerCase()}`} onPress={() => openAddFood(meal.value)} />
    </Section>
  );
}

export default function FoodHome() {
  const s = useApp();
  const entries = S.todayEntries(s);
  const totals = S.todayTotals(s);
  const t = s.targets;
  const estimates = entries.filter((e) => e.confidence && e.confidence !== 'high').length;
  const ofTarget = (v: number, target: number | null, unit: string) =>
    (target ? `${M.fmt.int(v)} of ${M.fmt.int(target)} ${unit}` : `${M.fmt.int(v)} ${unit}`);
  const yours = listedFoods(s.customFoods);
  const right = (
    <Row gap="xs">
      <IconButton name="plus" label="Add food" onPress={() => openAddFood()} />
      <BellButton />
    </Row>
  );

  return (
    <TabScreen title="Food" subtitle={M.fmt.weekdayLong(Date.now())} right={right}>
      <SetupCard keys={['targets']} title="Set your daily targets" />
      <Stack>
        <SearchPill onPress={() => router.push('/food/search')} onScan={() => router.push('/scanner')} />
        <Card>
          <Row between>
            <CardTitle>Eaten today</CardTitle>
            <T size="caption" color="inkMuted48">{entries.length === 1 ? '1 entry' : `${entries.length} entries`}</T>
          </Row>
          <Facts rows={[
            ['Calories', ofTarget(totals.energyKcal, t.energyKcal, 'kcal')],
            ['Protein', ofTarget(totals.proteinG, t.proteinG, 'g')],
            ['Carbs', ofTarget(totals.carbohydrateG, t.carbohydrateG, 'g')],
            ['Fat', ofTarget(totals.fatG, t.fatG, 'g')]
          ]} />
          {estimates ? (
            <Caption>{`${estimates} of today's ${entries.length} entries ${estimates === 1 ? 'is an estimate' : 'are estimates'}, marked below.`}</Caption>
          ) : null}
        </Card>
      </Stack>

      {MEALS.map((meal) => <MealSection key={meal.value} meal={meal} entries={entries} s={s} />)}

      <Section title="Your foods" caption="Products you scanned or found online, and foods you added from a label. They work offline.">
        {yours.length ? (
          <Rows rows={yours.slice(0, YOUR_FOODS_SHOWN).map((f) => {
            const day = f.createdAt ? (M.fmt.relativeDay(f.createdAt) as string) : null;
            const when = day ? `Saved ${day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day} · ` : '';
            return {
              key: f.id, label: f.name, detail: `${when}${perServingText(f)}`,
              right: <EstimateBadge confidence={f.confidence} />,
              onPress: () => router.push(foodHref(f.id))
            };
          })} />
        ) : <Caption>Foods you scan or add from a label appear here.</Caption>}
        {yours.length > YOUR_FOODS_SHOWN ? (
          <LinkButton label={`See all ${yours.length}`} onPress={() => router.push(href('/food/search', { filter: 'yours' }))} />
        ) : null}
        <LinkButton icon="plus" label="Add a food from its label" onPress={() => router.push('/food/new')} />
      </Section>
    </TabScreen>
  );
}
