/* The History tab: the split timeline, nutrition-target changes and what we
   chose not to change (docs/07 §7.3, docs/08 "History"). Ported from History
   in prototype/src/80-history.js. Builder E. */
import { useState } from 'react';

import { FILTERS, getLastFilter, rememberFilter, type Filter } from '@/features/history/helpers';
import { NotChangedList, NutritionList, SplitTimeline } from '@/features/history/components';
import { useApp } from '@/store';
import { ChoiceChips, Stack, TabScreen } from '@/ui';

export default function History() {
  const s = useApp();
  const [filter, setFilterState] = useState<Filter>(getLastFilter);
  const setFilter = (v: Filter) => {
    rememberFilter(v);
    setFilterState(v);
  };
  return (
    <TabScreen title="History">
      <Stack>
        <ChoiceChips options={FILTERS} value={filter} onChange={setFilter} />
        {filter === 'split' ? <SplitTimeline s={s} /> : null}
        {filter === 'nutrition' ? <NutritionList s={s} /> : null}
        {filter === 'not_changed' ? <NotChangedList s={s} /> : null}
      </Stack>
    </TabScreen>
  );
}
