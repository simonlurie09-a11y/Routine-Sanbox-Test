import { toFood, toNutrients } from '@/services/openFoodFacts';

describe('Open Food Facts mapping', () => {
  it('reads per-100 g values, with kcal from kJ when kcal is missing and sodium from salt', () => {
    const n = toNutrients({ 'energy-kj_100g': 1674, proteins_100g: 6.1, carbohydrates_100g: 64, sugars_100g: 28, fat_100g: 13, 'saturated-fat_100g': 5.8, fiber_100g: 4.2, salt_100g: 0.6 });
    expect(n.energyKcal).toBe(400);
    expect(n.proteinG).toBe(6.1);
    expect(n.sodiumMg).toBe(240);
  });
  it('prefers sodium when given, and ignores negative or junk values', () => {
    const n = toNutrients({ 'energy-kcal_100g': '97', sodium_100g: 0.04, salt_100g: 9, fat_100g: -1, fiber_100g: 'n/a' as unknown as number });
    expect(n.energyKcal).toBe(97);
    expect(n.sodiumMg).toBe(40);
    expect(n.fatG).toBeNull();
    expect(n.fiberG).toBeNull();
  });
  it('builds a food with attribution, serving and confidence', () => {
    const f = toFood({ code: '5012345678900', product_name: 'Oat bar', brands: 'Brand A, Brand B', serving_quantity: 40, serving_size: '1 bar (40 g)',
      nutriments: { 'energy-kcal_100g': 412, proteins_100g: 6, carbohydrates_100g: 64, sugars_100g: 28, fat_100g: 13, 'saturated-fat_100g': 5.8, fiber_100g: 4, sodium_100g: 0.24 },
      nova_group: 4, additives_tags: ['en:e471'] });
    expect(f).not.toBeNull();
    expect(f!.id).toBe('off-5012345678900');
    expect(f!.gtin).toBe('05012345678900');
    expect(f!.brand).toBe('Brand A');
    expect(f!.serving).toEqual({ grams: 40, label: '1 bar (40 g)' });
    expect(f!.attribution).toMatch(/Open Food Facts \(ODbL\)/);
    expect(f!.confidence).toBe('high');
    expect(f!.additives).toEqual(['E471']);
  });
  it('marks sparse products as low confidence and drinks per 100 ml', () => {
    const f = toFood({ code: '12345670', product_name: 'Cola', categories_tags: ['en:beverages'], nutriments: { 'energy-kcal_100g': 42 } });
    expect(f!.confidence).toBe('low');
    expect(f!.isBeverage).toBe(true);
    expect(f!.serving.label).toBe('100 ml');
  });
  it('returns null without a name', () => {
    expect(toFood({ code: '1', nutriments: {} })).toBeNull();
  });
});
