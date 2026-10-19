/* Food area helpers (builder C), ported from prototype/src/60-food.js:
   meals, serving words ("1 bar", "1.5 bars"), amounts, sources, and the
   barcode digits shown to people. No React here. */
import { domain as M, type Food } from '@/shared';
import type { LogEntry, Meal } from '@/store';

/* ------------------------------------------------------------- meals */
export const MEALS: { value: Meal; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' }
];
export const isMeal = (m: unknown): m is Meal => MEALS.some((x) => x.value === m);
export const mealLabel = (m: string) => (MEALS.find((x) => x.value === m) || MEALS[3]).label;
/* "to lunch", "as a snack" */
export const mealTarget = (m: Meal) => (m === 'snack' ? 'as a snack' : `to ${mealLabel(m).toLowerCase()}`);
export function defaultMeal(): Meal {
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 15) return 'lunch';
  if (h < 17) return 'snack';
  if (h < 21) return 'dinner';
  return 'snack';
}

/* ------------------------------------------------------------ params */
/* Route params are strings (or arrays when repeated). */
export const str = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v) || undefined;
/* '/food/search' + { meal: 'lunch' } -> '/food/search?meal=lunch' (empty values left out). */
export function href(path: string, params: Record<string, string | number | null | undefined>) {
  const q = Object.entries(params)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `${path}?${q}` : path;
}
export const foodHref = (id: string, params: Record<string, string | number | null | undefined> = {}) =>
  href(`/food/${encodeURIComponent(id)}`, params);

/* ----------------------------------------------------------- sources */
export const SOURCE_NAMES: Record<string, string> = {
  open_food_facts: 'Open Food Facts',
  usda_fdc: 'USDA FoodData Central',
  user: 'your own entry',
  quick_add: 'quick add'
};
/* Quick adds are saved as foods so their entries can be edited, but they
   aren't foods anyone looks for: lists and search leave them out. */
export const isQuickFood = (f: Food | null | undefined) => !!f && f.source === 'quick_add';
export const listedFoods = (customFoods: Food[]) => customFoods.filter((f) => !isQuickFood(f));

/* ----------------------------------------------------------- amounts */
export const unitOf = (food: Pick<Food, 'isBeverage'> | null | undefined) => (food && food.isBeverage ? 'ml' : 'g');
export const num = (v: number) => M.fmt.num(v, 1) as string;
export const kcalText = (v: number | null | undefined, missing = 'Calories not listed') => (v == null ? missing : (M.fmt.kcal(v) as string));

/* Serving words we can count ("1 bar", "2 bars"). */
const SINGULAR_NOUNS: Record<string, string> = {
  bar: 'bars', can: 'cans', pot: 'pots', slice: 'slices', bowl: 'bowls', handful: 'handfuls',
  bottle: 'bottles', fillet: 'fillets', glass: 'glasses', cup: 'cups', tbsp: 'tbsp'
};
const PLURAL_NOUNS: Record<string, string> = { eggs: 'egg' };

export type ServingInfo = {
  grams: number; label: string; countable: boolean; chip: string; qty: string;
  count?: number; one?: string; many?: string; noun?: string;
};
/* What a food's serving label says: '1 bar (40 g)' -> count 1, 'bar', chip "Per bar, 40 g". */
export function servingInfo(food: Food | null | undefined): ServingInfo | null {
  const sv = food && food.serving;
  if (!sv || !sv.grams) return null;
  const base: ServingInfo = { grams: sv.grams, label: sv.label, countable: false, chip: `Per ${sv.label}`, qty: sv.label };
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
/* A serving of exactly 100 g says nothing the "Per 100 g" chip doesn't. */
export const isPlain100 = (info: ServingInfo | null, unit: string) => !!info && info.grams === 100 && info.label.replace(/\s+/g, ' ').trim() === `100 ${unit}`;

/* "1 bar", "1.5 bars", "120 g", "330 ml" */
export function amountPhrase(food: Food, grams: number, mode: 'serving' | 'grams') {
  const info = servingInfo(food);
  if (mode !== 'grams' && info && info.countable && info.count) {
    const n = M.round((grams / info.grams) * info.count, 1) as number;
    return `${num(n)} ${n === 1 ? info.one : info.many}`;
  }
  return `${num(grams)} ${unitOf(food)}`;
}

/* "Example Foods, 40 g bar" */
export function detailSubtitle(food: Food) {
  const info = servingInfo(food);
  let serving: string | null = null;
  if (info) serving = info.countable && info.count === 1 && info.one && !['tbsp', 'cup', 'handful'].includes(info.one) ? `${info.qty} ${info.one}` : info.label;
  return [food.brand, serving].filter(Boolean).join(', ');
}

/* "bar", "2 eggs", "120 g": the serving without its weight, for list rows. */
export function shortServing(food: Food) {
  const info = servingInfo(food);
  if (!info) return `100 ${unitOf(food)}`;
  if (info.countable) return info.count === 1 ? info.one : `${info.count} ${info.many}`;
  return info.qty;
}

/* "165 kcal per bar" */
export function perServingText(food: Food) {
  const per = M.nutrientsFor(food, food.serving ? food.serving.grams : 100);
  return `${kcalText(per.energyKcal)} per ${shortServing(food)}`;
}

export const entryAmount = (e: LogEntry) => `${num(e.grams)} ${e.isBeverage ? 'ml' : 'g'}`;

/* A typed number: null when empty, NaN when it isn't a number. Accepts a decimal comma. */
export function parseNumber(text: string | null | undefined): number | null {
  const t = String(text == null ? '' : text).trim();
  if (!t) return null;
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

/* ---------------------------------------------------------- barcodes */
/* Shown digits: a 14-digit GTIN padded from EAN-13 loses its leading zero. */
export const showGtin = (g: string | null | undefined) => String(g || '').replace(/^0(?=\d{13}$)/, '');
export const isQrKind = (kind: string | undefined) => kind === 'gs1_digital_link' || kind === 'gs1_element_string';
export const offProductUrl = (gtin: string) => `https://world.openfoodfacts.org/product/${showGtin(gtin)}`;

/* Where the numbers on a food come from, in one sentence. */
export function sourceSentence(food: Food, via: string | undefined) {
  const qr = via === 'qr' ? "We read the barcode number from the pack's QR code. " : '';
  if (food.source === 'open_food_facts') {
    const found = via === 'barcode' || via === 'qr' ? 'Found in Open Food Facts.' : 'From Open Food Facts.';
    const partial = food.confidence && food.confidence !== 'high' ? " It has only part of this product's nutrition panel, so check it against the pack." : '';
    return `${qr}${found}${partial}`;
  }
  if (food.source === 'user') return `${qr}You entered these values from the label.`;
  if (food.source === 'quick_add') return 'Your quick add.';
  return `${qr}From ${SOURCE_NAMES[food.source] || 'our food database'}.`;
}
