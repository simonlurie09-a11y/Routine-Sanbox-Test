/* Search foods (prototype/src/60-food.js FoodSearch). Your own foods and the
   bundled generic foods are searched on the phone as you type. Open Food Facts
   is searched online only when you tap the button: it limits how often an app
   may search. A product you open from it is saved to your foods. */
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';

import { EstimateBadge, SearchBox } from '@/features/food/components';
import { foodHref, isMeal, listedFoods, mealLabel, perServingText, SOURCE_NAMES, str } from '@/features/food/helpers';
import { ATTRIBUTION, search } from '@/services/openFoodFacts';
import { domain as M, type Food } from '@/shared';
import { A, useApp } from '@/store';
import { Button, Callout, Caption, ChoiceChips, EmptyAnswer, LinkButton, Micro, Rows, Screen, Section, Stack, T } from '@/ui';

type Filter = 'all' | 'generic' | 'yours';
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'generic', label: 'Generic' },
  { value: 'yours', label: 'Your foods' }
];
const isFilter = (v: unknown): v is Filter => FILTERS.some((f) => f.value === v);

type Online =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'done'; query: string; foods: Food[] }
  | { status: 'error'; query: string; message: string };

export default function FoodSearch() {
  const p = useLocalSearchParams<{ meal?: string; query?: string; filter?: string }>();
  const meal = isMeal(str(p.meal)) ? str(p.meal) : undefined;
  const customFoods = useApp((s) => s.customFoods);
  const [query, setQuery] = useState(str(p.query) || '');
  const [filter, setFilter] = useState<Filter>(isFilter(str(p.filter)) ? (str(p.filter) as Filter) : 'all');
  const [online, setOnline] = useState<Online>({ status: 'idle' });
  const seq = useRef(0);

  const yours = listedFoods(customFoods);
  const yourIds = new Set(yours.map((f) => f.id));
  const q = query.trim();
  const results = (M.searchFoods(q, yours) as Food[]).filter((f) => filter === 'all' || (filter === 'yours') === yourIds.has(f.id));
  const filterWord = (FILTERS.find((f) => f.value === filter) as { label: string }).label.toLowerCase();
  const canSearchOnline = q.length >= 2;
  const onlineHere = online.status !== 'idle' && online.query === q;

  async function searchOnline() {
    if (!canSearchOnline) return;
    const mine = ++seq.current;
    setOnline({ status: 'loading', query: q });
    const res = await search(q);
    if (mine !== seq.current) return;
    setOnline(res.error ? { status: 'error', query: q, message: res.error } : { status: 'done', query: q, foods: res.foods });
  }
  function openOnline(food: Food) {
    /* Kept in your foods, so it opens again offline and a later scan finds it. */
    const id = A.saveCustomFood({ ...food, id: food.id === 'off-' ? '' : food.id });
    router.push(foodHref(id, { meal }));
  }
  const clear = () => { setQuery(''); setFilter('all'); };

  const rows = results.map((f) => {
    const from = f.brand || M.capitalise(SOURCE_NAMES[f.source] || '');
    return {
      key: f.id, label: f.name, detail: `${from} · ${perServingText(f)}`,
      right: <EstimateBadge confidence={f.confidence} />,
      onPress: () => router.push(foodHref(f.id, { meal }))
    };
  });

  let local;
  if (results.length) {
    local = (
      <Stack gap="sm">
        <Caption>{results.length === 1 ? '1 food' : `${results.length} foods`}</Caption>
        <Rows rows={rows} />
      </Stack>
    );
  } else if (q && canSearchOnline) {
    local = <Callout>{`Nothing in ${filter === 'all' ? 'your foods or the generic foods' : filterWord} matches “${q}”.`}</Callout>;
  } else if (q) {
    local = (
      <EmptyAnswer icon="magnifyingglass" title="Nothing matches" body={`We couldn't find “${q}”${filter === 'all' ? '' : ` in ${filterWord}`}. Try another word, or scan the barcode.`}>
        <Button variant="outline" label="Clear search" onPress={clear} />
      </EmptyAnswer>
    );
  } else {
    local = (
      <EmptyAnswer icon="magnifyingglass" title="Nothing here yet" body="Foods you scan or add from a label appear here.">
        <Button label="Scan a barcode" onPress={() => router.push(meal ? `/scanner?meal=${meal}` : '/scanner')} />
        <Button variant="outline" label="Show all foods" onPress={() => setFilter('all')} />
      </EmptyAnswer>
    );
  }

  return (
    <Screen title="Search foods" subtitle={meal ? `Adding to ${mealLabel(meal).toLowerCase()}` : 'Your foods, generic foods and Open Food Facts'}>
      <Stack>
        <SearchBox value={query} onChange={setQuery} autoFocus onSubmit={() => { if (!results.length) searchOnline(); }} />
        <ChoiceChips options={FILTERS} value={filter} onChange={setFilter} />
        {local}
      </Stack>

      {canSearchOnline ? (
        <Section title="Open Food Facts" caption="A free database of packaged foods. We search it only when you ask.">
          {!onlineHere || online.status === 'loading' ? (
            <Button variant={results.length ? 'outline' : 'primary'} icon="magnifyingglass" loading={onlineHere && online.status === 'loading'}
              label={`Search Open Food Facts for “${q}”`} onPress={searchOnline} />
          ) : null}
          {onlineHere && online.status === 'error' ? (
            <Stack gap="sm">
              <T size="callout" color="danger">{online.message}</T>
              <Button variant="outline" label="Try again" onPress={searchOnline} />
            </Stack>
          ) : null}
          {onlineHere && online.status === 'done' && online.foods.length ? (
            <Stack gap="sm">
              <Caption>{online.foods.length === 1 ? '1 product' : `${online.foods.length} products`}</Caption>
              <Rows rows={online.foods.map((f, i) => ({
                key: `${f.id}-${i}`, label: f.name, detail: `${f.brand || 'Open Food Facts'} · ${perServingText(f)}`,
                right: <EstimateBadge confidence={f.confidence} />,
                onPress: () => openOnline(f)
              }))} />
              <Micro>{`${ATTRIBUTION}. Opening a product saves it to your foods.`}</Micro>
            </Stack>
          ) : null}
          {onlineHere && online.status === 'done' && !online.foods.length ? (
            <Stack gap="xs">
              <Callout>{`Open Food Facts has nothing for “${q}”. Try a shorter word, or scan the barcode.`}</Callout>
              <LinkButton icon="barcode.viewfinder" label="Scan a barcode" onPress={() => router.push(meal ? `/scanner?meal=${meal}` : '/scanner')} />
              <LinkButton icon="plus" label="Add a food from its label" onPress={() => router.push(meal ? `/food/new?meal=${meal}` : '/food/new')} />
            </Stack>
          ) : null}
        </Section>
      ) : null}
    </Screen>
  );
}
