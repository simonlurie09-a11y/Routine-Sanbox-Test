/* Checking a typed nutrition panel (per 100 g or 100 ml), with the physical
   checks the prototype's label review applies (M.validateNutrients): nothing
   over 100 g, saturates within fat, sugars within carbohydrate, the macros
   within 100 g together, and energy roughly matching 4/4/9 (a warning only:
   panels round, and alcohol and polyols add energy). */
import { domain as M, type Nutrients } from '@/shared';
import { parseNumber } from './helpers';

export type PanelKey = 'energyKcal' | 'proteinG' | 'fatG' | 'saturatedFatG' | 'carbohydrateG' | 'sugarsG' | 'fiberG' | 'saltG';
/* Laid out in pairs: each "of which" sits beside its parent. */
export const PANEL_FIELDS: { key: PanelKey; label: string }[] = [
  { key: 'energyKcal', label: 'Energy (kcal)' },
  { key: 'proteinG', label: 'Protein (g)' },
  { key: 'fatG', label: 'Fat (g)' },
  { key: 'saturatedFatG', label: 'Saturates (g)' },
  { key: 'carbohydrateG', label: 'Carbohydrate (g)' },
  { key: 'sugarsG', label: 'Sugars (g)' },
  { key: 'fiberG', label: 'Fibre (g)' },
  { key: 'saltG', label: 'Salt (g)' }
];

export type PanelCheck = {
  values: Record<PanelKey, number | null>;
  errors: Partial<Record<PanelKey, string>>;
  general: string | null;
  warning: string | null;
  /* Energy is the one value a food needs; said only once the person tries to save. */
  missingEnergy: boolean;
  ok: boolean;
};

const MAX_KCAL = 900; /* pure fat */
const ENERGY_TOLERANCE = 0.15;
const ENERGY_SLACK_KCAL = 10;

export function checkPanel(texts: Partial<Record<PanelKey, string>>): PanelCheck {
  const values = {} as Record<PanelKey, number | null>;
  const errors: Partial<Record<PanelKey, string>> = {};
  PANEL_FIELDS.forEach(({ key }) => {
    const n = parseNumber(texts[key]);
    if (n != null && Number.isNaN(n)) {
      errors[key] = 'Use a number';
      values[key] = null;
      return;
    }
    values[key] = n;
    if (n == null) return;
    if (key === 'energyKcal' ? n > MAX_KCAL : n > 100) errors[key] = key === 'energyKcal' ? `Can't be over ${MAX_KCAL} kcal` : "Can't be over 100 g";
  });
  const v = values;
  if (!errors.saturatedFatG && v.saturatedFatG != null && v.fatG != null && v.saturatedFatG > v.fatG) errors.saturatedFatG = "Can't be more than fat";
  if (!errors.sugarsG && v.sugarsG != null && v.carbohydrateG != null && v.sugarsG > v.carbohydrateG) errors.sugarsG = "Can't be more than carbohydrate";

  const mass = (v.proteinG || 0) + (v.carbohydrateG || 0) + (v.fatG || 0) + (v.fiberG || 0);
  const general = mass > 100.5
    ? "Fat, carbohydrate, fibre and protein add up to more than 100 g, which a label can't show. Check the numbers against the pack."
    : null;

  let warning: string | null = null;
  const fieldsOk = !Object.keys(errors).length && !general;
  if (fieldsOk && v.energyKcal != null && v.proteinG != null && v.carbohydrateG != null && v.fatG != null) {
    const res = M.validateNutrients({ ...v, sodiumMg: null }) as { energyGap: number | null };
    const fromMacros = 4 * v.proteinG + 4 * v.carbohydrateG + 9 * v.fatG + 2 * (v.fiberG || 0);
    if (res.energyGap != null && res.energyGap > ENERGY_TOLERANCE && Math.abs(fromMacros - v.energyKcal) > ENERGY_SLACK_KCAL) {
      warning = `The energy doesn't match the fat, carbohydrate and protein: they differ by ${Math.round(res.energyGap * 100)}%. Check the numbers against the pack. You can still save it.`;
    }
  }
  const missingEnergy = v.energyKcal == null && !errors.energyKcal;
  return { values, errors, general, warning, missingEnergy, ok: fieldsOk && !missingEnergy };
}

/* Salt on the label -> sodium in mg (salt = sodium x 2.5). */
export function panelNutrients(values: Record<PanelKey, number | null>): Nutrients {
  return {
    energyKcal: values.energyKcal, proteinG: values.proteinG, carbohydrateG: values.carbohydrateG, sugarsG: values.sugarsG,
    fatG: values.fatG, saturatedFatG: values.saturatedFatG, fiberG: values.fiberG,
    sodiumMg: values.saltG == null ? null : Math.round((values.saltG / 2.5) * 1000)
  };
}
