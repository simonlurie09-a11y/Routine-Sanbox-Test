/* Companion prototype — Food tab and every food flow (builder C).
   Food log, search, food detail with the health rating, the barcode scanner
   (simulated with sample barcodes), typed barcodes, the not-found answer,
   label photos (simulated with sample photos) and the label check, quick add
   and editing a logged entry. Also defines C.flows.openAddFood(meal?). */
(function () {
  'use strict';

  const C = window.Companion;
  const React = window.React;
  const { useState, useEffect, useRef } = React;
  const { html, T, Card, Button, Input, Screen, PlainScreen, Section, Sections, Facts, Rows, Badge, Caption, Callout,
          H2, CardTitle, LinkButton, IconButton, BellButton, Glyph, EmptyAnswer, Actions, NutritionCard,
          HealthRatingList, ChoiceChips, Stepper, useScreen } = C.ui;
  const M = C.domain, D = C.data, A = C.actions, S = C.selectors;

  /* ------------------------------------------------------------ meals */
  const MEALS = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snack' }
  ];
  const isMeal = (m) => MEALS.some((x) => x.value === m);
  const mealLabel = (m) => (MEALS.find((x) => x.value === m) || MEALS[3]).label;
  /* "to lunch", "as a snack" */
  const mealTarget = (m) => (m === 'snack' ? 'as a snack' : `to ${mealLabel(m).toLowerCase()}`);
  function defaultMeal() {
    const h = new Date().getHours();
    if (h < 11) return 'breakfast';
    if (h < 15) return 'lunch';
    if (h < 17) return 'snack';
    if (h < 21) return 'dinner';
    return 'snack';
  }

  /* ---------------------------------------------------------- amounts */
  const SOURCE_NAMES = {
    open_food_facts: 'Open Food Facts',
    usda_fdc: 'USDA FoodData Central',
    ingredient_scan: 'your label photo',
    user_custom: 'your own entry'
  };
  const unitOf = (food) => (food && food.isBeverage ? 'ml' : 'g');
  const num = (v) => M.fmt.num(v, 1);
  const kcalOf = (nu) => (nu.energyKcal == null ? null : Math.round(nu.energyKcal));

  /* Serving words we can count ("1 bar", "2 bars"). */
  const SINGULAR_NOUNS = { bar: 'bars', can: 'cans', pot: 'pots', slice: 'slices', bowl: 'bowls', handful: 'handfuls',
    bottle: 'bottles', fillet: 'fillets', glass: 'glasses', cup: 'cups', tbsp: 'tbsp' };
  const PLURAL_NOUNS = { eggs: 'egg' };

  /* What a food's serving label says: '1 bar (40 g)' -> count 1, 'bar', chip "Per bar, 40 g". */
  function servingInfo(food) {
    const sv = food && food.serving;
    if (!sv || !sv.grams) return null;
    const base = { grams: sv.grams, label: sv.label, countable: false, chip: `Per ${sv.label}`, qty: sv.label };
    const m = String(sv.label).match(/^(\d+(?:\.\d+)?)\s+(.+?)\s*\((.+)\)$/);
    if (!m) return base;
    const count = Number(m[1]);
    const noun = m[2];
    const qty = m[3];
    if (count === 1 && SINGULAR_NOUNS[noun]) {
      return { ...base, countable: true, count, one: noun, many: SINGULAR_NOUNS[noun], chip: `Per ${noun}, ${qty}`, qty, noun };
    }
    if (count > 1 && PLURAL_NOUNS[noun]) {
      return { ...base, countable: true, count, one: PLURAL_NOUNS[noun], many: noun, chip: `Per ${count} ${noun}, ${qty}`, qty, noun };
    }
    return { ...base, chip: `Per ${count} ${noun}, ${qty}`, qty, noun };
  }

  /* "1 bar", "1.5 bars", "120 g", "330 ml" */
  function amountPhrase(food, grams, mode) {
    const info = servingInfo(food);
    if (mode !== 'grams' && info && info.countable) {
      const n = M.round((grams / info.grams) * info.count, 1);
      return `${num(n)} ${n === 1 ? info.one : info.many}`;
    }
    return `${num(grams)} ${unitOf(food)}`;
  }

  /* "Example Foods, 40 g bar" (the mockup's subtitle) */
  function detailSubtitle(food) {
    const info = servingInfo(food);
    let serving = null;
    if (info) serving = info.countable && info.count === 1 && !['tbsp', 'cup', 'handful'].includes(info.one) ? `${info.qty} ${info.one}` : info.label;
    return [food.brand, serving].filter(Boolean).join(', ');
  }

  /* "bar", "2 eggs", "120 g": the serving without its weight, for list rows. */
  function shortServing(food) {
    const info = servingInfo(food);
    if (!info) return `100 ${unitOf(food)}`;
    if (info.countable) return info.count === 1 ? info.one : `${info.count} ${info.many}`;
    return info.qty;
  }

  const entryAmount = (e) => `${num(e.grams)} ${e.isBeverage ? 'ml' : 'g'}`;
  const isQuickEntry = (e, s) => !M.findFood(e.foodId, s.customFoods);
  function entryDetail(e, s) {
    const kcal = e.nutrients.energyKcal == null ? 'Calories not listed' : M.fmt.kcal(e.nutrients.energyKcal);
    return isQuickEntry(e, s) ? kcal : `${entryAmount(e)} · ${kcal}`;
  }
  const estimateBadge = (confidence) => (confidence && confidence !== 'high'
    ? html`<${Badge} palette="estimateConfidence" status=${confidence} label="Estimate" />` : null);

  /* ---------------------------------------------------------- barcodes */
  /* Shown digits: a 14-digit GTIN padded from EAN-13 loses its leading zero. */
  const showGtin = (g) => String(g || '').replace(/^0(?=\d{13}$)/, '');

  /* A typed number, a linear barcode, or a pack QR code (GS1 Digital Link). */
  function lookup(input, customFoods) {
    const scan = M.parseScan(input);
    if (!scan.ok) return { status: 'invalid', error: scan.error };
    return { ...M.lookupBarcode(scan.gtin14, customFoods), gtin14: scan.gtin14, kind: scan.kind };
  }
  const isQr = (kind) => kind === 'gs1_digital_link' || kind === 'gs1_element_string';
  function openLookupResult(res, meal) {
    if (res.status === 'found') A.push('food-detail', { foodId: res.food.id, via: isQr(res.kind) ? 'qr' : 'barcode', meal });
    else A.push('barcode-not-found', { gtin: res.gtin14, meal, qr: isQr(res.kind) || undefined });
  }
  const viaFallback = (path) => path.some((p) => /no nutrition data/.test(p));
  /* Where a lookup would land, in a few words (for the sample list). */
  function lookupNote(res) {
    if (isQr(res.kind)) return res.status === 'found' ? 'QR code on the pack, read as a barcode' : 'QR code, in neither database';
    if (res.status !== 'found') return 'In neither database';
    if (res.path[0] === 'your foods') return 'In your scanned foods';
    if (viaFallback(res.path)) return 'Falls back to FoodData Central';
    return 'In Open Food Facts';
  }
  function sampleBarcodes(customFoods) {
    const p = (id) => D.PRODUCTS.find((x) => x.id === id);
    return [
      { key: 'oat', label: p('p-oat-bar').name, gtin: p('p-oat-bar').gtin },
      { key: 'drink', label: p('p-orange-drink').name, gtin: p('p-orange-drink').gtin },
      { key: 'peanuts', label: p('p-peanuts').name, gtin: p('p-peanuts').gtin },
      { key: 'qr', label: `${p('p-yogurt').name}, QR code`, gtin: QR_SAMPLE(p('p-yogurt').gtin), shown: `id.gs1.org/01/${p('p-yogurt').gtin.padStart(14, '0')}` },
      { key: 'unknown', label: 'An unknown product', gtin: D.UNKNOWN_GTIN }
    ].map((b) => ({ ...b, note: lookupNote(lookup(b.gtin, customFoods)) }));
  }
  /* What a pack's QR code holds under GS1 Digital Link: the GTIN, plus batch and expiry. */
  const QR_SAMPLE = (gtin) => `https://id.gs1.org/01/${gtin.padStart(14, '0')}/10/L2604?17=270131`;

  /* Where the numbers on a food come from, in one sentence. */
  function sourceSentence(food, params, s) {
    if ((params.via === 'barcode' || params.via === 'qr') && food.gtin) {
      const res = lookup(food.gtin, s.customFoods);
      const qr = params.via === 'qr' ? "We read the barcode number from the pack's QR code. " : '';
      if (res.status === 'found') {
        if (res.path[0] === 'your foods') return `${qr}Found in your scanned foods.`;
        if (viaFallback(res.path)) return `${qr}Open Food Facts had no nutrition data for this product, so these values come from USDA FoodData Central.`;
        return `${qr}Found in Open Food Facts.`;
      }
    }
    if (food.source === 'ingredient_scan') return `${food.attribution || 'Estimated from your label photo'}.`;
    return `From ${SOURCE_NAMES[food.source] || 'our food database'}.`;
  }

  /* Nutrient rows for a set of already-scaled nutrients. */
  function NutrientFacts({ nu, title = 'Nutrition' }) {
    const val = (v) => (v == null ? 'Not listed' : M.fmt.g(v));
    const salt = nu.saltG != null ? nu.saltG : nu.sodiumMg != null ? M.saltFromSodium(nu.sodiumMg) : null;
    return html`<${Card}>
      <div className="row row--between">
        <${CardTitle}>${title}<//>
        <${T} size="headline" font="semiBold" className="tabular">${nu.energyKcal == null ? 'Not listed' : M.fmt.kcal(nu.energyKcal)}<//>
      </div>
      <${Facts} rows=${[
        ['Protein', val(nu.proteinG)], ['Carbohydrate', val(nu.carbohydrateG)], ['of which sugars', val(nu.sugarsG)],
        ['Fat', val(nu.fatG)], ['of which saturates', val(nu.saturatedFatG)], ['Fibre', val(nu.fiberG)],
        ['Salt', salt == null ? 'Not listed' : `${M.fmt.num(salt, 2)} g`]
      ]} />
    <//>`;
  }

  /* "Close" for screens pushed inside a modal (the modal root has its own). */
  const modalClose = (ctx) => (ctx.inModal && !ctx.isRoot ? html`<${LinkButton} label="Close" onPress=${A.dismiss} />` : undefined);
  const closeOrPop = (ctx) => (ctx.inModal ? A.dismiss() : A.pop());

  /* Focus the first input inside a wrapper once (search, typed barcode). */
  function useAutofocus() {
    const ref = useRef(null);
    useEffect(() => {
      const el = ref.current && ref.current.querySelector('input');
      if (el) {
        try { el.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
      }
    }, []);
    return ref;
  }

  const visuallyHidden = (text) => html`<span className="visually-hidden">${text}</span>`;

  /* Dark tiles on camera covers (surfaceTile1 on surfaceBlack). */
  const DARK_TILE = {
    display: 'flex', alignItems: 'center', gap: 'var(--spacing-base)', width: '100%', minHeight: '44px',
    padding: 'var(--spacing-base) var(--spacing-lg)', background: 'var(--surfaceTile1)', border: 'none',
    borderRadius: 'var(--radius-lg)', textAlign: 'left', cursor: 'pointer', font: 'inherit'
  };

  /* ------------------------------------------------------ add-food sheet */
  C.flows = C.flows || {};
  C.flows.openAddFood = function openAddFood(meal) {
    const m = isMeal(meal) ? meal : undefined;
    A.sheet({
      title: m ? `Add to ${mealLabel(m).toLowerCase()}` : 'Add food',
      options: [
        { label: 'Scan a barcode', onPress: () => A.present('scanner', { meal: m }, 'cover') },
        { label: 'Photograph a label', onPress: () => A.present('label-capture', { meal: m }, 'cover') },
        {
          label: 'Search foods',
          onPress: () => {
            const nav = C.getState().nav;
            if (nav.tab === 'food' && !nav.modals.length) A.push('food-search', { meal: m });
            else A.openIn('food', 'food-search', { meal: m });
          }
        },
        { label: 'Quick add calories', onPress: () => A.present('quick-add', { meal: m }, 'sheet') }
      ]
    });
  };
  const openAddFood = (meal) => C.flows.openAddFood(meal);

  /* ============================================================ Food tab */
  function MealSection({ meal, entries, s }) {
    const list = entries.filter((e) => e.meal === meal.value).sort((a, b) => a.at - b.at);
    const kcal = list.reduce((sum, e) => sum + (e.nutrients.energyKcal || 0), 0);
    return html`<${Section} title=${meal.label}
      action=${list.length ? html`<${T} size="callout" color="inkMuted80" className="tabular">${M.fmt.kcal(kcal)}<//>` : null}>
      ${list.length
        ? html`<${Rows} rows=${list.map((e) => ({
            key: e.id, label: e.name, detail: entryDetail(e, s), right: estimateBadge(e.confidence),
            onPress: () => A.push('log-entry', { id: e.id })
          }))} />`
        : html`<${Caption}>Nothing logged yet.<//>`}
      <${LinkButton} icon="plus" label=${`Add to ${meal.label.toLowerCase()}`} align="flex-start" onPress=${() => openAddFood(meal.value)} />
    <//>`;
  }

  function FoodHome() {
    const s = C.useApp();
    const entries = S.todayEntries(s);
    const totals = S.todayTotals(s);
    const t = s.targets || {};
    const estimates = entries.filter((e) => e.confidence && e.confidence !== 'high').length;
    const ofTarget = (v, target, unit) => (target ? `${M.fmt.int(v)} of ${M.fmt.int(target)} ${unit}` : `${M.fmt.int(v)} ${unit}`);
    const right = html`<div className="row" style=${{ gap: 'var(--spacing-base)' }}>
      <${IconButton} name="plus" label="Add food" onPress=${() => openAddFood()} />
      <${BellButton} />
    </div>`;
    const custom = s.customFoods || [];

    return html`<${Screen} title="Food" subtitle=${M.fmt.weekdayLong(Date.now())} right=${right}>
      <${Sections}>
        <div className="stack">
          <button type="button" className="ads-field__box ads-field__box--pill" aria-label="Search foods"
            onClick=${() => A.push('food-search', {})}
            style=${{ width: '100%', minHeight: '44px', paddingBlock: 'var(--spacing-md)', cursor: 'pointer', font: 'inherit' }}>
            <${Glyph} name="magnifyingglass" size=${18} color="inkMuted48" />
            <${T} size="body" color="inkMuted48">Search foods<//>
          </button>

          <${Card}>
            <div className="row row--between">
              <${CardTitle}>Eaten today<//>
              <${T} size="caption" color="inkMuted48">${entries.length === 1 ? '1 entry' : `${entries.length} entries`}<//>
            </div>
            <${Facts} rows=${[
              ['Calories', ofTarget(totals.energyKcal, t.energyKcal, 'kcal')],
              ['Protein', ofTarget(totals.proteinG, t.proteinG, 'g')],
              ['Carbs', ofTarget(totals.carbohydrateG, t.carbohydrateG, 'g')],
              ['Fat', ofTarget(totals.fatG, t.fatG, 'g')]
            ]} />
            ${estimates ? html`<${Caption}>${estimates} of today's ${entries.length} entries ${estimates === 1 ? 'is an estimate' : 'are estimates'}, marked below.<//>` : null}
          <//>
        </div>

        ${MEALS.map((meal) => html`<${MealSection} key=${meal.value} meal=${meal} entries=${entries} s=${s} />`)}

        <${Section} title="Your scanned foods" caption="Foods you saved from a label photo.">
          ${custom.length
            ? html`<${Rows} rows=${custom.map((f) => {
                const per = M.nutrientsFor(f, f.serving ? f.serving.grams : 100);
                const day = f.createdAt ? M.fmt.relativeDay(f.createdAt) : null;
                const when = day ? `Scanned ${day === 'Today' || day === 'Yesterday' ? day.toLowerCase() : day} · ` : '';
                return {
                  key: f.id, label: f.name,
                  detail: `${when}${per.energyKcal == null ? 'Calories not listed' : M.fmt.kcal(per.energyKcal)} per ${shortServing(f)}`,
                  right: estimateBadge(f.confidence),
                  onPress: () => A.push('food-detail', { foodId: f.id })
                };
              })} />`
            : html`<${Caption}>Foods you photograph appear here.<//>`}
          <${LinkButton} icon="plus" label="Photograph a label" align="flex-start" onPress=${() => A.present('label-capture', {}, 'cover')} />
        <//>
      <//>
    <//>`;
  }

  /* ========================================================= Food search */
  const FILTERS = [
    { value: 'all', label: 'All' },
    { value: 'packaged', label: 'Packaged' },
    { value: 'generic', label: 'Generic' },
    { value: 'yours', label: 'Your foods' }
  ];
  function kindOf(food, s) {
    if ((s.customFoods || []).some((f) => f.id === food.id)) return 'yours';
    if (D.PRODUCTS.some((p) => p.id === food.id)) return 'packaged';
    return 'generic';
  }

  function FoodSearch({ params }) {
    const s = C.useApp();
    const [query, setQuery] = useState(params.query || '');
    const [filter, setFilter] = useState(params.filter || 'all');
    const box = useAutofocus();
    const meal = isMeal(params.meal) ? params.meal : undefined;
    const results = M.searchFoods(query, s.customFoods).filter((f) => filter === 'all' || kindOf(f, s) === filter);
    const q = query.trim();
    const filterWord = FILTERS.find((f) => f.value === filter).label.toLowerCase();

    const rows = results.map((f) => {
      const grams = f.serving ? f.serving.grams : 100;
      const nu = M.nutrientsFor(f, grams);
      const from = f.brand || M.capitalise(SOURCE_NAMES[f.source] || '');
      return {
        key: f.id, label: f.name,
        detail: `${from} · ${nu.energyKcal == null ? 'Calories not listed' : M.fmt.kcal(nu.energyKcal)} per ${shortServing(f)}`,
        right: estimateBadge(f.confidence),
        onPress: () => A.push('food-detail', { foodId: f.id, meal })
      };
    });

    let empty = null;
    if (!results.length) {
      empty = q
        ? html`<${EmptyAnswer} icon="magnifyingglass" title="Nothing matches"
            body=${`We couldn't find "${q}"${filter === 'all' ? '' : ` in ${filterWord}`}. Try a shorter word, or scan the barcode.`}>
            <${Button} variant="outline" fullWidth=${true} label="Clear search" onPress=${() => { setQuery(''); setFilter('all'); }} />
          <//>`
        : html`<${EmptyAnswer} icon="magnifyingglass" title="Nothing here yet" body="Foods you save from a label photo appear here.">
            <${Button} variant="outline" fullWidth=${true} label="Show all foods" onPress=${() => setFilter('all')} />
          <//>`;
    }

    return html`<${Screen} title="Search foods" subtitle=${meal ? `Adding to ${mealLabel(meal).toLowerCase()}` : 'Packaged, generic and your own foods'}>
      <div className="stack">
        <div ref=${box}>
          <${Input} pill=${true} leftIcon="magnifyingglass" label=${visuallyHidden('Search foods')} placeholder="Food or brand"
            value=${query} onChange=${(e) => setQuery(e.target.value)} autoComplete="off" />
        </div>
        <${ChoiceChips} label="Filter foods" options=${FILTERS} value=${filter} onChange=${setFilter} />
        ${results.length
          ? html`<div className="stack-sm">
              <${Caption}>${results.length === 1 ? '1 food' : `${results.length} foods`}<//>
              <${Rows} rows=${rows} />
            </div>`
          : empty}
      </div>
    <//>`;
  }

  /* ========================================================= Food detail */
  function initialAmount(food, startGrams) {
    const info = servingInfo(food);
    if (info) {
      const n = startGrams / info.grams;
      if (Math.abs(n * 2 - Math.round(n * 2)) < 1e-9 && n >= 0.5) return { mode: 'serving', servings: n, grams: 100 };
    }
    return { mode: 'grams', servings: 1, grams: startGrams || 100 };
  }

  function FoodDetail({ params }) {
    const s = C.useApp();
    const ctx = useScreen();
    const food = M.findFood(params.foodId, s.customFoods);
    const entry = params.entryId ? s.foodLog.find((e) => e.id === params.entryId) : null;
    const info = food ? servingInfo(food) : null;
    const startGrams = entry ? entry.grams : params.grams || (info ? info.grams : 100);
    const [amount, setAmount] = useState(() => (food ? initialAmount(food, startGrams) : { mode: 'grams', servings: 1, grams: 100 }));
    const [meal, setMeal] = useState(entry ? entry.meal : isMeal(params.meal) ? params.meal : defaultMeal());

    if (!food) {
      return html`<${Screen} title="Food" right=${modalClose(ctx)}>
        <${EmptyAnswer} icon="magnifyingglass" title="We couldn't find this food" body="It may have been removed from your foods." />
      <//>`;
    }

    const unit = unitOf(food);
    const grams = amount.mode === 'serving' && info ? amount.servings * info.grams : amount.grams;
    const kcal = kcalOf(M.nutrientsFor(food, grams));
    const phrase = amountPhrase(food, grams, amount.mode);
    const isEstimate = food.confidence && food.confidence !== 'high';
    const range = food.ranges && food.ranges.energyKcal;

    const basis = [
      info ? { value: 'serving', label: info.chip } : null,
      { value: 'grams', label: `Per 100 ${unit}` }
    ].filter(Boolean);
    const setBasis = (v) => setAmount((a) => (v === 'serving' ? { ...a, mode: 'serving', servings: 1 } : { ...a, mode: 'grams', grams: 100 }));

    const stepper = amount.mode === 'serving' && info
      ? html`<${Stepper} label="Amount" value=${amount.servings} min=${0.5} max=${20} step=${0.5}
          format=${(v) => (info.countable ? amountPhrase(food, v * info.grams, 'serving') : `${num(v * info.grams)} ${unit}`)}
          onChange=${(v) => setAmount((a) => ({ ...a, servings: v }))} />`
      : html`<${Stepper} label="Amount" value=${amount.grams} min=${10} max=${2000} step=${10}
          format=${(v) => `${num(v)} ${unit}`} onChange=${(v) => setAmount((a) => ({ ...a, grams: v }))} />`;

    function log() {
      if (entry) {
        A.updateLogEntry(entry.id, { grams, meal });
        A.toast('Entry updated', 'success');
        A.pop();
        return;
      }
      A.logFood({ food, grams, meal });
      A.toast(`Logged ${phrase} ${mealTarget(meal)}`, 'success');
      if (ctx.inModal) A.openIn('food', 'food');
      else if (ctx.tab === 'food') A.popToRoot();
      else A.pop();
    }
    const cta = entry ? 'Save changes' : kcal == null ? `Log ${phrase}` : `Log ${phrase}, ${M.fmt.int(kcal)} kcal`;

    return html`<${Screen} title=${food.name} subtitle=${detailSubtitle(food)} right=${modalClose(ctx)}>
      <${Sections}>
        <div className="stack">
          <div className="photo" role="img" aria-label="Product photo placeholder">
            <${Glyph} name=${food.source === 'ingredient_scan' ? 'text.viewfinder' : 'photo'} size=${44} color="inkMuted48" />
          </div>
          <${ChoiceChips} label="Amount basis" options=${basis} value=${amount.mode} onChange=${setBasis} />
          <div className="row row--between">
            <${T} size="callout" font="semiBold">Amount<//>
            ${stepper}
          </div>
          <${NutritionCard} food=${food} grams=${grams} />
          <div className="stack-xs">
            ${isEstimate ? html`<div className="row"><${Badge} palette="estimateConfidence" status=${food.confidence} /></div>` : null}
            <${Caption}>${sourceSentence(food, params, s)}${isEstimate && range
              ? ` Calories per 100 ${unit} are likely between ${M.fmt.int(range.low)} and ${M.fmt.int(range.high)} kcal.` : ''}<//>
          </div>
        </div>

        <${Section} title="How healthy is it?" caption=${`Each line compares this food with a published reference, per 100 ${unit}.`}>
          <${HealthRatingList} food=${food} confidence=${food.source === 'ingredient_scan' ? food.confidence : undefined} />
        <//>

        <section className="stack" aria-label="Log this food">
          <${ChoiceChips} label="Meal" options=${MEALS} value=${meal} onChange=${setMeal} />
          <${Button} fullWidth=${true} label=${cta} onPress=${log} />
        </section>
      <//>
    <//>`;
  }

  /* ============================================================ Scanner */
  function Scanner({ params }) {
    const s = C.useApp();
    const ctx = useScreen();
    const meal = isMeal(params.meal) ? params.meal : undefined;
    const samples = sampleBarcodes(s.customFoods);
    const scan = (gtin) => openLookupResult(lookup(gtin, s.customFoods), meal);

    return html`<div className=${'screen' + (ctx.inModal ? ' screen--in-modal' : '')} style=${{ background: 'var(--surfaceBlack)' }}>
      <div className="row row--between gutter" style=${{ minHeight: '44px' }}>
        <button type="button" className="round-ctrl" aria-label="Close" onClick=${() => closeOrPop(ctx)}>
          <${Glyph} name="xmark" size=${18} color="onDark" />
        </button>
        <${T} size="body" font="semiBold" color="onDark" as="h1">Scan a barcode<//>
        <span style=${{ width: '36px' }} aria-hidden="true"></span>
      </div>

      <div className="gutter stack" style=${{ flex: 1, minHeight: 0, overflowY: 'auto', paddingTop: 'var(--spacing-xl)', paddingBottom: 'var(--spacing-lg)' }}>
        <div className="viewfinder" aria-hidden="true"><span className="tl"></span><span className="tr"></span><span className="bl"></span><span className="br"></span></div>
        <${T} size="callout" color="bodyMuted" align="center" as="p">Hold the barcode or the pack's QR code inside the frame. We'll find it automatically.<//>
        <section className="stack-sm" aria-label="Sample barcodes">
          <div className="stack-xxs">
            <${T} size="headline" font="semiBold" color="onDark" as="h2">Sample barcodes<//>
            <${T} size="caption" color="bodyMuted" as="p">In the app this uses your camera. Here, pick a sample barcode.<//>
          </div>
          ${samples.map((b) => html`<button key=${b.key} type="button" style=${DARK_TILE} onClick=${() => scan(b.gtin)}>
            <div className="grow stack-xxs">
              <${T} size="body" color="bodyOnDark">${b.label}<//>
              <${T} size="caption" color="bodyMuted" className="tabular">${b.shown || showGtin(b.gtin)} · ${b.note}<//>
            </div>
            <${Glyph} name="chevron.right" size=${18} color="bodyMuted" />
          </button>`)}
        </section>
      </div>

      <div className="stack-xs gutter" style=${{ alignItems: 'center', paddingTop: 'var(--spacing-sm)', paddingBottom: 'calc(var(--spacing-lg) + var(--safe-bottom))' }}>
        <${LinkButton} label="Type the number instead" color="primaryOnDark" onPress=${() => A.present('barcode-entry', { meal }, 'sheet')} />
        <${LinkButton} label="Photograph the label instead" color="primaryOnDark"
          onPress=${() => (ctx.inModal ? A.replace('label-capture', { meal }) : A.present('label-capture', { meal }, 'cover'))} />
      </div>
    </div>`;
  }

  /* ====================================================== Barcode entry */
  function BarcodeEntry({ params }) {
    const s = C.useApp();
    const ctx = useScreen();
    const [value, setValue] = useState(params.value || '');
    const [tried, setTried] = useState(!!params.value);
    const box = useAutofocus();
    const meal = isMeal(params.meal) ? params.meal : undefined;
    const norm = M.parseScan(value);
    let error = null;
    if (tried) error = norm.ok ? null : norm.error;
    const samples = sampleBarcodes(s.customFoods);

    function submit() {
      setTried(true);
      const res = lookup(value, s.customFoods);
      if (res.status === 'invalid') return;
      openLookupResult(res, meal);
    }

    return html`<${PlainScreen} title="Type the barcode" subtitle="Usually the 13 digits under the bars."
      topLeft=${ctx.inModal ? html`<${LinkButton} label="Cancel" onPress=${A.dismiss} />` : html`<${IconButton} name="chevron.left" label="Back" onPress=${A.pop} />`}
      footer=${html`<${Button} fullWidth=${true} label="Look up barcode" onPress=${submit} />`}>
      <div ref=${box}>
        <${Input} label="Barcode" inputMode="numeric" autoComplete="off" placeholder="13 digits" value=${value} error=${error}
          onChange=${(e) => setValue(e.target.value)} />
      </div>
      <div className="stack-xs">
        <${T} size="callout" font="semiBold" as="h2">Sample barcodes<//>
        <ul className="stack-xxs">
          ${samples.filter((b) => b.key !== 'qr').map((b) => html`<li key=${b.key}>
            <${T} size="caption" color="inkMuted80" className="tabular">${b.shown || showGtin(b.gtin)}<//>
            <${T} size="caption" color="inkMuted48"> · ${b.label}<//>
          </li>`)}
        </ul>
        <${Caption}>To see the check-digit message, change the last digit of one.<//>
      </div>
    <//>`;
  }

  /* =================================================== Barcode not found */
  function BarcodeNotFound({ params }) {
    const ctx = useScreen();
    const gtin = params.gtin || D.UNKNOWN_GTIN;
    const meal = isMeal(params.meal) ? params.meal : undefined;
    function photograph() {
      if (ctx.inModal && ctx.modalStyle === 'cover') A.replace('label-capture', { gtin, meal });
      else {
        A.dismissAll();
        A.present('label-capture', { gtin, meal }, 'cover');
      }
    }
    return html`<${PlainScreen}
      topLeft=${ctx.isRoot ? (ctx.inModal ? html`<${LinkButton} label="Close" onPress=${A.dismiss} />` : null) : html`<${IconButton} name="chevron.left" label="Back" onPress=${A.pop} />`}
      topRight=${ctx.inModal && !ctx.isRoot ? html`<${LinkButton} label="Close" onPress=${A.dismiss} />` : null}>
      <${EmptyAnswer} icon="magnifyingglass" title="Not in our food databases"
        body="We checked Open Food Facts and USDA FoodData Central. Photograph the ingredient list and we'll estimate it.">
        <${Button} fullWidth=${true} label="Photograph the label" onPress=${photograph} />
        <${Button} fullWidth=${true} variant="outline" label="Search instead" onPress=${() => A.openIn('food', 'food-search', { meal })} />
        <${T} size="caption" color="inkMuted48" align="center" as="p" className="tabular">${params.qr ? `Barcode ${showGtin(gtin)}, read from the QR code` : `Barcode ${showGtin(gtin)}`}<//>
      <//>
    <//>`;
  }

  /* ====================================================== Label capture */
  const shorten = (text, max) => (text.length > max ? `${text.slice(0, max).replace(/[\s,]+\S*$/, '')}…` : text);

  function LabelCapture({ params }) {
    const ctx = useScreen();
    const close = html`<button type="button" className="round-ctrl" aria-label="Close" onClick=${() => closeOrPop(ctx)}>
      <${Glyph} name="xmark" size=${18} color="onDark" />
    </button>`;
    return html`<${PlainScreen} dark=${true} title="Photograph the label" subtitle="In the app this opens your camera. Here, pick a sample photo." topLeft=${close}>
      ${D.LABEL_SAMPLES.map((sm) => html`<button key=${sm.id} type="button" style=${{ ...DARK_TILE, alignItems: 'flex-start', padding: 'var(--spacing-lg)' }}
        onClick=${() => A.push('label-review', { sampleId: sm.id, gtin: params.gtin, meal: params.meal })}>
        <div className="grow stack-sm">
          <div className="row row--between">
            <div className="stack-xxs">
              <${T} size="headline" font="semiBold" color="onDark">${sm.title}<//>
              <${T} size="caption" color="bodyMuted">${sm.description}<//>
            </div>
            <${Glyph} name="text.viewfinder" size=${24} color="bodyMuted" />
          </div>
          <div className="stack-xxs">
            <${T} size="caption" color="bodyOnDark" as="p">Ingredients: ${shorten(sm.ingredientsText, 96)}<//>
            ${sm.panelText
              ? sm.panelText.split('\n').slice(0, 3).map((line) => html`<${T} key=${line} size="caption" color="bodyMuted" as="p" className="tabular">${line}<//>`)
              : html`<${T} size="caption" color="bodyMuted" as="p">No nutrition panel in this photo.<//>`}
          </div>
        </div>
      </button>`)}
    <//>`;
  }

  /* ======================================================= Label review */
  const NUTRIENT_ROWS = [
    { key: 'energyKcal', label: 'Calories', field: 'Calories (kcal)', unit: 'kcal' },
    { key: 'proteinG', label: 'Protein', field: 'Protein (g)', unit: 'g' },
    { key: 'carbohydrateG', label: 'Carbohydrate', field: 'Carbohydrate (g)', unit: 'g' },
    { key: 'sugarsG', label: 'of which sugars', field: 'Sugars (g)', unit: 'g' },
    { key: 'fatG', label: 'Fat', field: 'Fat (g)', unit: 'g' },
    { key: 'saturatedFatG', label: 'of which saturates', field: 'Saturates (g)', unit: 'g' },
    { key: 'fiberG', label: 'Fibre', field: 'Fibre (g)', unit: 'g' },
    { key: 'sodiumMg', label: 'Salt', field: 'Salt (g)', unit: 'g', salt: true }
  ];
  /* Ingredients that mark industrial processing (docs/07 §7.4). */
  const INDUSTRIAL = ['en:maltodextrin', 'en:glucose-syrup', 'en:emulsifier', 'en:flavouring'];

  const shown = (row, v) => (row.salt ? M.saltFromSodium(v) : v);
  function valueText(row, v) {
    if (v == null) return 'Not listed';
    if (row.salt) return `${M.fmt.num(M.saltFromSodium(v), 2)} g`;
    return row.unit === 'kcal' ? M.fmt.kcal(v) : M.fmt.g(v);
  }
  function rangeText(row, r) {
    const lo = shown(row, r.low);
    const hi = shown(row, r.high);
    if (row.unit === 'kcal') return lo === hi ? M.fmt.kcal(lo) : `${M.fmt.int(lo)}–${M.fmt.int(hi)} kcal`;
    const dp = row.salt ? 2 : 1;
    return lo === hi ? `${M.fmt.num(lo, dp)} g` : `${M.fmt.num(lo, dp)}–${M.fmt.num(hi, dp)} g`;
  }
  const escapeRe = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parseNumber = (text) => {
    const t = String(text == null ? '' : text).trim();
    if (!t) return null;
    const n = Number(t.replace(',', '.'));
    return Number.isFinite(n) && n >= 0 ? n : NaN;
  };

  function LabelReview({ params }) {
    const ctx = useScreen();
    const sample = D.LABEL_SAMPLES.find((x) => x.id === params.sampleId) || D.LABEL_SAMPLES[1];
    const [edits, setEdits] = useState({});
    const [texts, setTexts] = useState({});
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(sample.title);
    const [savedId, setSavedId] = useState(null);

    const a = M.assessLabel(sample, edits);
    const est = a.method === 'panel' ? null : M.estimateFromIngredients(a.ingredients);
    const userNu = edits.nutrients || {};

    function setIngredient(idx, value) {
      const raws = a.ingredients.map((i) => i.raw);
      raws[idx] = value;
      setEdits((e) => ({ ...e, ingredientsText: raws.join(', ') }));
    }
    function applySuggestion(ing, idx) {
      const re = new RegExp(escapeRe(ing.name), 'i');
      setIngredient(idx, re.test(ing.raw) && ing.name ? ing.raw.replace(re, ing.suggestion) : ing.suggestion);
    }
    function setNutrientText(row, text) {
      setTexts((t) => ({ ...t, [row.key]: text }));
      const n = parseNumber(text);
      setEdits((e) => {
        const nutrients = { ...(e.nutrients || {}) };
        if (n == null || Number.isNaN(n)) delete nutrients[row.key];
        else nutrients[row.key] = row.salt ? (n * 1000) / 2.5 : n;
        return { ...e, nutrients };
      });
    }

    /* Ingredients in label order: recognised ones grouped as rows, doubtful ones as fields. */
    const blocks = [];
    let run = [];
    a.ingredients.forEach((ing, idx) => {
      if (ing.canonicalId) {
        run.push(ing);
        return;
      }
      if (run.length) blocks.push({ type: 'rows', items: run });
      run = [];
      blocks.push({ type: 'field', ing, idx });
    });
    if (run.length) blocks.push({ type: 'rows', items: run });

    const factRows = NUTRIENT_ROWS.map((row) => {
      const v = a.nutrients[row.key];
      const r = a.ranges && a.ranges[row.key];
      const mine = userNu[row.key] != null;
      if (a.method === 'panel' || mine || !r) return { row, text: valueText(row, v), badge: null };
      return { row, text: rangeText(row, r), badge: a.fieldsNeedingReview.includes(row.key) ? 'check' : 'estimate' };
    });

    let heading;
    let caption;
    if (a.method === 'panel') {
      heading = 'From the nutrition panel, per 100 g';
      caption = 'Read from the panel in your photo, checked against basic nutrition maths.';
    } else {
      heading = 'Estimated, per 100 g';
      if (a.method === 'user') caption = est && est.per100 ? `Your values, with ranges from ${est.neighbours} similar products for the rest.` : 'Your values, checked against basic nutrition maths.';
      else caption = est && est.per100 ? `From ${est.neighbours} similar products, checked against basic nutrition maths.` : "We couldn't estimate these. Enter the values from the pack.";
    }

    const canSave = a.nutrients.energyKcal != null;
    function save() {
      const nutrients = {};
      M.NUTRIENT_KEYS.forEach((k) => { nutrients[k] = a.nutrients[k] == null ? null : a.nutrients[k]; });
      const markers = a.ingredients.filter((i) => INDUSTRIAL.includes(i.canonicalId)).map((i) => i.name);
      const id = A.saveCustomFood({
        id: savedId || undefined,
        name: name.trim() || sample.title,
        brand: 'Your label scan',
        source: 'ingredient_scan',
        attribution: a.method === 'panel' ? 'Read from your label photo' : 'Estimated from your label photo',
        serving: { grams: 30, label: '30 g' },
        nutrients,
        ranges: a.method === 'ingredients' ? a.ranges : null,
        confidence: a.confidence,
        ingredients: a.ingredients.map((i) => i.raw).join(', '),
        nova: markers.length ? 4 : 3,
        additives: markers,
        gtin: params.gtin || undefined
      });
      setSavedId(id);
      A.toast('Food saved to your foods', 'success');
      A.push('food-detail', { foodId: id, meal: params.meal });
    }
    function panelPhoto() {
      const other = D.LABEL_SAMPLES.find((x) => x.hasPanel);
      A.toast(`Simulated here. The ${other.title.toLowerCase()} sample photo has a panel.`);
    }

    return html`<${Screen} title="Check the label" subtitle="We read this from your photo. Fix anything that looks wrong.">
      <${Sections}>
        <${Card}>
          <div className="row"><${Badge} palette="estimateConfidence" status=${a.confidence} /></div>
          <ul className="stack-xs">
            ${a.reasons.length
              ? a.reasons.map((r, i) => html`<li key=${r.code + i}><${Callout}>${r.message}<//></li>`)
              : html`<li><${Callout}>The panel and ingredients read clearly, and the numbers add up.<//></li>`}
          </ul>
          ${sample.hasPanel ? null : html`<${Button} variant="outline" fullWidth=${true} label="Photograph the nutrition panel" onPress=${panelPhoto} />`}
        <//>

        <${Section} title="Ingredients">
          ${blocks.map((b) => (b.type === 'rows'
            ? html`<${Rows} key=${`rows-${b.items[0].position}`} rows=${b.items.map((ing) => ({
                key: `ing-${ing.position}`, label: `${ing.position}. ${M.capitalise(ing.raw)}`
              }))} />`
            : html`<div key=${`field-${b.idx}`} className="stack-xs">
                <${Input} value=${b.ing.raw} onChange=${(e) => setIngredient(b.idx, e.target.value)} autoComplete="off"
                  label=${html`<span className="row row--between"><span>Ingredient ${b.ing.position}</span><${Badge} palette="estimateConfidence" status="check" /></span>`}
                  hint=${b.ing.suggestion ? `Did you mean ${b.ing.suggestion}?` : "We couldn't match this word. Check it against the pack."} />
                ${b.ing.suggestion ? html`<${LinkButton} size="caption" align="flex-start" label=${`Use ${b.ing.suggestion}`} onPress=${() => applySuggestion(b.ing, b.idx)} />` : null}
              </div>`))}
        <//>

        <${Section} title=${heading} caption=${caption}>
          <${Card}>
            <ul className="facts">
              ${factRows.map((f) => html`<li key=${f.row.key}>
                <${T} size="callout" color="inkMuted80" className="grow">${f.row.label}<//>
                <div className="row">
                  <${T} size="callout" className="tabular">${f.text}<//>
                  ${f.badge ? html`<${Badge} palette="estimateConfidence" status=${f.badge} />` : null}
                </div>
              </li>`)}
            </ul>
          <//>
          <${LinkButton} align="flex-start" icon=${editing ? undefined : 'pencil'} label=${editing ? 'Hide values' : 'Edit values'} onPress=${() => setEditing(!editing)} />
          ${editing ? html`<div className="stack-sm">
              <${Caption}>Type what the pack says, per 100 g. Leave a field empty to keep our value.<//>
              <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 'var(--spacing-md)' }}>
                ${NUTRIENT_ROWS.map((row) => {
                  const text = texts[row.key] != null ? texts[row.key] : '';
                  const n = parseNumber(text);
                  const current = a.nutrients[row.key];
                  return html`<${Input} key=${row.key} label=${row.field} inputMode="decimal" autoComplete="off" value=${text}
                    placeholder=${current == null ? '' : M.fmt.num(shown(row, current), row.salt ? 2 : 1)}
                    error=${Number.isNaN(n) ? 'Use a number' : null} onChange=${(e) => setNutrientText(row, e.target.value)} />`;
                })}
              </div>
            </div>` : null}
        <//>

        <${Input} label="Name" value=${name} onChange=${(e) => setName(e.target.value)} autoComplete="off" />

        <${Actions}>
          ${canSave ? null : html`<${Caption}>Enter at least the calories to save this food.<//>`}
          <${Button} fullWidth=${true} label="Save food" disabled=${!canSave} onPress=${save} />
          <${Button} fullWidth=${true} variant="ghost" label="Discard" onPress=${() => closeOrPop(ctx)} />
        <//>
      <//>
    <//>`;
  }

  /* ========================================================= Quick add */
  function QuickAdd({ params }) {
    const ctx = useScreen();
    const [vals, setVals] = useState({ kcal: params.kcal != null ? String(params.kcal) : '', protein: '', carbs: '', fat: '' });
    const [meal, setMeal] = useState(isMeal(params.meal) ? params.meal : defaultMeal());
    const set = (k) => (e) => {
      const v = e.target.value;
      setVals((x) => ({ ...x, [k]: v }));
    };

    const kcal = parseNumber(vals.kcal);
    const kcalOk = kcal != null && kcal > 0 && kcal <= 5000;
    const kcalError = vals.kcal.trim() && !kcalOk ? 'Enter a number from 1 to 5,000.' : null;
    const macroError = (k) => {
      const n = parseNumber(vals[k]);
      return Number.isNaN(n) || (n != null && n > 500) ? 'Use 0 to 500' : null;
    };
    const ok = kcalOk && ['protein', 'carbs', 'fat'].every((k) => !macroError(k));

    function log() {
      const v = (k) => {
        const n = parseNumber(vals[k]);
        return n == null || Number.isNaN(n) ? null : n;
      };
      const food = {
        id: C.uid('quick'),
        name: 'Quick add',
        source: 'user_custom',
        nutrients: { energyKcal: kcal, proteinG: v('protein'), carbohydrateG: v('carbs'), sugarsG: null, fatG: v('fat'), saturatedFatG: null, fiberG: null, sodiumMg: null }
      };
      A.logFood({ food, grams: 100, meal });
      A.toast(`Logged quick add ${mealTarget(meal)}`, 'success');
      closeOrPop(ctx);
    }

    return html`<${PlainScreen} title="Quick add" subtitle="For when you know the calories but not the food."
      topLeft=${ctx.inModal ? html`<${LinkButton} label="Cancel" onPress=${A.dismiss} />` : html`<${IconButton} name="chevron.left" label="Back" onPress=${A.pop} />`}
      footer=${html`<${Button} fullWidth=${true} label=${ok ? `Log ${M.fmt.kcal(kcal)}` : 'Log calories'} disabled=${!ok} onPress=${log} />`}>
      <${Input} label="Calories (kcal)" inputMode="decimal" autoComplete="off" value=${vals.kcal} error=${kcalError} onChange=${set('kcal')} />
      <div className="stack-sm">
        <${Caption}>Protein, carbs and fat are optional.<//>
        <div style=${{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 'var(--spacing-sm)' }}>
          <${Input} label="Protein (g)" inputMode="decimal" autoComplete="off" value=${vals.protein} error=${macroError('protein')} onChange=${set('protein')} />
          <${Input} label="Carbs (g)" inputMode="decimal" autoComplete="off" value=${vals.carbs} error=${macroError('carbs')} onChange=${set('carbs')} />
          <${Input} label="Fat (g)" inputMode="decimal" autoComplete="off" value=${vals.fat} error=${macroError('fat')} onChange=${set('fat')} />
        </div>
      </div>
      <div className="stack-sm">
        <${T} size="callout" font="semiBold" as="h2">Meal<//>
        <${ChoiceChips} label="Meal" options=${MEALS} value=${meal} onChange=${setMeal} />
      </div>
    <//>`;
  }

  /* ========================================================= Log entry */
  function findEntry(s, params) {
    if (params.id) return s.foodLog.find((e) => e.id === params.id) || null;
    /* Demo only (smoke test): pick one of today's entries by position. */
    if (params.demoIndex != null) return S.todayEntries(s)[params.demoIndex] || null;
    return null;
  }

  function LogEntry({ params }) {
    const s = C.useApp();
    const entry = findEntry(s, params);
    const [grams, setGrams] = useState(entry ? entry.grams : 100);
    const [meal, setMeal] = useState(entry ? entry.meal : 'snack');
    const [kcalText, setKcalText] = useState(entry && entry.nutrients.energyKcal != null ? String(Math.round(entry.nutrients.energyKcal)) : '');

    if (!entry) {
      return html`<${Screen} title="Entry">
        <${EmptyAnswer} icon="info.circle" title="This entry isn't in your log" body="It may have been deleted." />
      <//>`;
    }

    const quick = isQuickEntry(entry, s);
    const unit = entry.isBeverage ? 'ml' : 'g';
    const scale = entry.grams ? grams / entry.grams : 1;
    const kcalNew = parseNumber(kcalText);
    const kcalOk = kcalNew != null && kcalNew > 0 && kcalNew <= 5000;
    const preview = {};
    Object.keys(entry.nutrients).forEach((k) => {
      preview[k] = entry.nutrients[k] == null ? null : quick ? entry.nutrients[k] : entry.nutrients[k] * scale;
    });
    if (quick && kcalOk) preview.energyKcal = kcalNew;

    const changed = meal !== entry.meal || (quick ? kcalOk && Math.round(kcalNew) !== Math.round(entry.nutrients.energyKcal || 0) : grams !== entry.grams);
    const canSave = changed && (!quick || kcalOk);

    function save() {
      if (quick) A.updateLogEntry(entry.id, { meal, nutrients: { ...entry.nutrients, energyKcal: kcalNew } });
      else A.updateLogEntry(entry.id, { grams, meal, nutrients: preview });
      A.toast('Entry updated', 'success');
      A.pop();
    }
    function remove() {
      const id = entry.id;
      A.alert({
        title: 'Delete this entry?',
        message: `${entry.name} comes off today's log and totals. You can log it again at any time.`,
        buttons: [
          { label: 'Cancel', style: 'cancel' },
          { label: 'Delete', style: 'destructive', onPress: () => { A.deleteLogEntry(id); A.pop(); A.toast('Entry deleted'); } }
        ]
      });
    }

    return html`<${Screen} title=${entry.name} subtitle=${`${mealLabel(entry.meal)} · ${M.fmt.time(entry.at)}`}>
      <${Sections}>
        <div className="stack">
          <${NutrientFacts} nu=${preview} title=${quick ? 'Nutrition' : `Nutrition, ${num(grams)} ${unit}`} />
          ${entry.confidence && entry.confidence !== 'high'
            ? html`<div className="stack-xs">
                <div className="row"><${Badge} palette="estimateConfidence" status=${entry.confidence} /></div>
                <${Caption}>This entry uses estimated values, so treat the numbers as a guide.<//>
              </div>`
            : null}
          ${quick ? null : html`<${LinkButton} align="flex-start" label="See nutrition and rating"
            onPress=${() => A.push('food-detail', { foodId: entry.foodId, entryId: entry.id })} />`}
        </div>

        <section className="stack" aria-label="Change this entry">
          ${quick
            ? html`<${Input} label="Calories (kcal)" inputMode="decimal" autoComplete="off" value=${kcalText}
                error=${kcalText.trim() && !kcalOk ? 'Enter a number from 1 to 5,000.' : null} onChange=${(e) => setKcalText(e.target.value)} />`
            : html`<div className="row row--between">
                <${T} size="callout" font="semiBold">Amount<//>
                <${Stepper} label="Amount" value=${grams} min=${10} max=${2000} step=${10} format=${(v) => `${num(v)} ${unit}`} onChange=${setGrams} />
              </div>`}
          <div className="stack-sm">
            <${T} size="callout" font="semiBold" as="h2">Meal<//>
            <${ChoiceChips} label="Meal" options=${MEALS} value=${meal} onChange=${setMeal} />
          </div>
        </section>

        <${Actions}>
          <${Button} fullWidth=${true} label="Save changes" disabled=${!canSave} onPress=${save} />
          <${Button} fullWidth=${true} variant="danger" label="Delete entry" onPress=${remove} />
        <//>
      <//>
    <//>`;
  }

  /* ========================================================== register */
  const wrongDigit = (g) => g.slice(0, -1) + String((Number(g.slice(-1)) + 1) % 10);

  C.registerScreen('food', FoodHome, { title: 'Food', tab: 'food', presentation: 'tab' });
  C.registerScreen('food-search', FoodSearch, {
    title: 'Search foods', tab: 'food', presentation: 'push',
    demoParams: { meal: 'lunch' },
    demoParamsList: [{ meal: 'lunch' }, { query: 'oat', filter: 'packaged' }, { query: 'zzz' }]
  });
  C.registerScreen('food-detail', FoodDetail, {
    title: 'Food detail', tab: 'food', presentation: 'push',
    demoParams: { foodId: 'p-oat-bar' },
    demoParamsList: [
      { foodId: 'p-oat-bar', meal: 'snack' },
      { foodId: 'p-orange-drink', via: 'barcode' },
      { foodId: 'p-peanuts', via: 'barcode' },
      { foodId: 'c-granola-scan' },
      { foodId: 'g-banana', meal: 'breakfast' },
      { foodId: 'g-eggs', grams: 240 }
    ]
  });
  C.registerScreen('scanner', Scanner, { title: 'Scan a barcode', tab: 'food', presentation: 'cover', demoParams: {} });
  C.registerScreen('barcode-entry', BarcodeEntry, {
    title: 'Type the barcode', tab: 'food', presentation: 'sheet',
    demoParams: {},
    demoParamsList: [{}, { value: wrongDigit(D.PRODUCTS[0].gtin) }]
  });
  C.registerScreen('barcode-not-found', BarcodeNotFound, {
    title: 'Barcode not found', tab: 'food', presentation: 'push', demoParams: { gtin: D.UNKNOWN_GTIN }
  });
  C.registerScreen('label-capture', LabelCapture, { title: 'Photograph the label', tab: 'food', presentation: 'cover', demoParams: {} });
  C.registerScreen('label-review', LabelReview, {
    title: 'Check the label', tab: 'food', presentation: 'push',
    demoParams: { sampleId: 'label-granola' },
    demoParamsList: [{ sampleId: 'label-granola' }, { sampleId: 'label-crackers' }]
  });
  C.registerScreen('quick-add', QuickAdd, {
    title: 'Quick add', tab: 'food', presentation: 'sheet',
    demoParams: { meal: 'snack' },
    demoParamsList: [{ meal: 'snack' }, { meal: 'lunch', kcal: 300 }]
  });
  C.registerScreen('log-entry', LogEntry, {
    title: 'Log entry', tab: 'food', presentation: 'push',
    demoParams: { demoIndex: 0 },
    demoParamsList: [{ demoIndex: 0 }, { demoIndex: 8 }]
  });
})();
