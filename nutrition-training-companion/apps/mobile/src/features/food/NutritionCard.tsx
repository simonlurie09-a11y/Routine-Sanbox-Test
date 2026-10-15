/* The nutrition facts card (ported from prototype/src/30-ui.js NutritionCard
   and 60-food.js NutrientFacts). A nutrition label is reference data, so it's a
   list of numbers in a Card, not gauges (docs/08 §8.9). */
import { domain as M, type Food, type Nutrients } from '@/shared';
import { Card, CardTitle, Facts, Row, T } from '@/ui';

type Scaled = Partial<Nutrients> & { saltG?: number | null };

/* Rows for a set of already-scaled nutrients. */
export function NutrientFacts({ nu, title = 'Nutrition', missingKcal = 'Not listed' }: { nu: Scaled; title?: string; missingKcal?: string }) {
  const val = (v: number | null | undefined) => (v == null ? 'Not listed' : (M.fmt.g(v) as string));
  const salt = nu.saltG != null ? nu.saltG : nu.sodiumMg != null ? (M.saltFromSodium(nu.sodiumMg) as number) : null;
  return (
    <Card>
      <Row between style={{ alignItems: 'flex-start' }}>
        <CardTitle>{title}</CardTitle>
        <T size="headline" weight="semiBold" tabular>{nu.energyKcal == null ? missingKcal : (M.fmt.kcal(nu.energyKcal) as string)}</T>
      </Row>
      <Facts rows={[
        ['Protein', val(nu.proteinG)],
        ['Carbohydrate', val(nu.carbohydrateG)],
        ['of which sugars', val(nu.sugarsG)],
        ['Fat', val(nu.fatG)],
        ['of which saturates', val(nu.saturatedFatG)],
        ['Fibre', val(nu.fiberG)],
        ['Salt', salt == null ? 'Not listed' : `${M.fmt.num(salt, 2)} g`]
      ]} />
    </Card>
  );
}

/* A food's nutrition for an amount in grams (or ml). */
export function NutritionCard({ food, grams, title = 'Nutrition' }: { food: Food; grams: number; title?: string }) {
  const nu = M.nutrientsFor(food, grams) as Scaled;
  return <NutrientFacts nu={nu} title={title} missingKcal="—" />;
}
