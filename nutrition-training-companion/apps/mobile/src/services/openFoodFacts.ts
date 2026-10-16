/* Open Food Facts (https://world.openfoodfacts.org): the product database
   behind barcode scans and online search (docs/03 §3.2). Data is ODbL: we
   show the attribution with every product. Only the barcode or the search
   words are sent; nothing about the person. OFF asks every app to send a
   User-Agent naming it and a contact. */
import Constants from 'expo-constants';

import type { Food, Nutrients } from '@/shared';

const BASE = 'https://world.openfoodfacts.org';
const CONTACT = (Constants.expoConfig?.extra as { supportEmail?: string } | undefined)?.supportEmail || 'support@example.com';
const USER_AGENT = `Companion/${Constants.expoConfig?.version || '1.0'} (iOS; ${CONTACT})`;
const FIELDS = ['code', 'product_name', 'product_name_en', 'brands', 'nutriments', 'serving_size', 'serving_quantity', 'ingredients_text', 'ingredients_text_en', 'nova_group', 'additives_tags', 'categories_tags', 'quantity'].join(',');
export const ATTRIBUTION = 'Product data from Open Food Facts (ODbL)';
const TIMEOUT_MS = 8000;

type OffProduct = {
  code?: string; product_name?: string; product_name_en?: string; brands?: string; quantity?: string;
  nutriments?: Record<string, number | string | undefined>; serving_size?: string; serving_quantity?: number | string;
  ingredients_text?: string; ingredients_text_en?: string; nova_group?: number; additives_tags?: string[]; categories_tags?: string[];
};

async function getJson(url: string) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: ctl.signal });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Open Food Facts answered ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

const num = (v: unknown): number | null => {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : typeof v === 'number' ? v : NaN;
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/* Per 100 g (or 100 ml). Energy: kcal if given, else kJ / 4.184. Sodium in mg,
   from sodium or salt (salt = sodium x 2.5). */
export function toNutrients(n: OffProduct['nutriments'] = {}): Nutrients {
  const kcal = num(n['energy-kcal_100g']) ?? (num(n['energy-kj_100g']) != null ? Math.round((num(n['energy-kj_100g']) as number) / 4.184) : null);
  const sodiumG = num(n.sodium_100g) ?? (num(n.salt_100g) != null ? (num(n.salt_100g) as number) / 2.5 : null);
  return {
    energyKcal: kcal, proteinG: num(n.proteins_100g), carbohydrateG: num(n.carbohydrates_100g), sugarsG: num(n.sugars_100g),
    fatG: num(n.fat_100g), saturatedFatG: num(n['saturated-fat_100g']), fiberG: num(n.fiber_100g),
    sodiumMg: sodiumG == null ? null : Math.round(sodiumG * 1000)
  };
}

const additiveName = (tag: string) => tag.replace(/^en:/, '').toUpperCase();

export function toFood(p: OffProduct, gtin14?: string): Food | null {
  const name = (p.product_name_en || p.product_name || '').trim();
  if (!name) return null;
  const nutrients = toNutrients(p.nutriments);
  const known = Object.values(nutrients).filter((v) => v != null).length;
  const servingG = num(p.serving_quantity);
  const isBeverage = (p.categories_tags || []).some((c) => /beverages|drinks/.test(c));
  const code = (p.code || gtin14 || '').replace(/\D/g, '');
  return {
    id: `off-${code}`,
    gtin: code ? code.padStart(14, '0') : null,
    name,
    brand: (p.brands || '').split(',')[0].trim() || null,
    source: 'open_food_facts',
    attribution: ATTRIBUTION,
    serving: servingG && servingG > 0 && servingG < 2000
      ? { grams: servingG, label: p.serving_size ? String(p.serving_size) : `${servingG} ${isBeverage ? 'ml' : 'g'}` }
      : { grams: 100, label: isBeverage ? '100 ml' : '100 g' },
    nutrients,
    ingredients: (p.ingredients_text_en || p.ingredients_text || '').trim() || null,
    nova: typeof p.nova_group === 'number' ? p.nova_group : null,
    additives: (p.additives_tags || []).map(additiveName),
    isBeverage,
    /* Products with most of the panel missing are estimates, and say so. */
    confidence: known >= 6 ? 'high' : known >= 3 ? 'medium' : 'low'
  };
}

export type LookupResult = { status: 'found'; food: Food } | { status: 'not_found' } | { status: 'offline'; message: string };

/* Look up a barcode (GTIN-8/12/13/14). */
export async function lookupBarcode(gtin14: string): Promise<LookupResult> {
  const code = gtin14.replace(/^0+(?=\d{8,})/, '');
  try {
    const json = await getJson(`${BASE}/api/v2/product/${encodeURIComponent(code)}.json?fields=${FIELDS}`);
    if (!json || json.status === 0 || !json.product) return { status: 'not_found' };
    const food = toFood(json.product, gtin14);
    return food ? { status: 'found', food } : { status: 'not_found' };
  } catch (e) {
    return { status: 'offline', message: e instanceof Error && e.name !== 'AbortError' ? e.message : "We couldn't reach Open Food Facts. Check your connection and try again." };
  }
}

/* Search by name. Open Food Facts limits searches to about 10 a minute per
   app, so the app only searches when the person asks (never per keystroke). */
export async function search(query: string): Promise<{ foods: Food[]; error?: string }> {
  const q = query.trim();
  if (q.length < 2) return { foods: [] };
  try {
    const json = await getJson(`${BASE}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=20&fields=${FIELDS}`);
    const products: OffProduct[] = (json && json.products) || [];
    return { foods: products.map((p) => toFood(p)).filter((f): f is Food => !!f && f.nutrients.energyKcal != null) };
  } catch {
    return { foods: [], error: "We couldn't reach Open Food Facts. Check your connection and try again." };
  }
}
