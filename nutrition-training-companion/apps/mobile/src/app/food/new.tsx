/* Add a food from its label. Version 1 has no label-photo reading, so the
   person types the pack's nutrition panel (per 100 g, or per 100 ml for a
   drink). Coming from a barcode Open Food Facts doesn't know, the barcode is
   filled in (?gtin=), so the next scan finds this food. Saved to your foods,
   then its detail opens. */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { foodHref, isMeal, parseNumber, showGtin, str } from '@/features/food/helpers';
import { checkPanel, PANEL_FIELDS, panelNutrients, type PanelKey } from '@/features/food/label';
import { domain as M, type Food } from '@/shared';
import { A } from '@/store';
import { Button, Caption, FormPage, Grid2, Icon, Input, overlay, Row, Section, Stack, Switch, T } from '@/ui';

export default function NewFood() {
  const p = useLocalSearchParams<{ gtin?: string; meal?: string }>();
  const meal = isMeal(str(p.meal)) ? str(p.meal) : undefined;
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState(showGtin(str(p.gtin)));
  const [drink, setDrink] = useState(false);
  const [servingSize, setServingSize] = useState('');
  const [servingName, setServingName] = useState('');
  const [panel, setPanel] = useState<Partial<Record<PanelKey, string>>>({});
  const [ingredients, setIngredients] = useState('');
  const [tried, setTried] = useState(false);

  const unit = drink ? 'ml' : 'g';
  const check = checkPanel(panel);
  const gtin = barcode.trim() ? (M.normalizeGtin(barcode) as { ok: boolean; gtin14?: string; error?: string }) : null;
  const size = parseNumber(servingSize);
  const sizeError = size != null && (Number.isNaN(size) || size < 1 || size > 2000) ? 'Use 1 to 2,000' : null;
  const nameError = tried && !name.trim() ? 'Enter the name on the pack.' : null;
  const barcodeError = tried && gtin && !gtin.ok ? gtin.error || null : null;
  const ok = !!name.trim() && check.ok && !sizeError && (!gtin || gtin.ok);

  function save() {
    setTried(true);
    if (!ok) return;
    const label = servingName.trim();
    const serving = size != null && !Number.isNaN(size)
      ? { grams: size, label: label ? `${label} (${M.fmt.num(size, 1)} ${unit})` : `${M.fmt.num(size, 1)} ${unit}` }
      : { grams: 100, label: `100 ${unit}` };
    const food: Food = {
      id: '',
      name: name.trim(),
      brand: brand.trim() || null,
      gtin: gtin && gtin.ok ? gtin.gtin14 : null,
      source: 'user',
      confidence: 'high',
      attribution: 'Entered from the label',
      serving,
      nutrients: panelNutrients(check.values),
      ingredients: ingredients.trim() || null,
      nova: null,
      additives: [],
      isBeverage: drink
    };
    const id = A.saveCustomFood(food);
    overlay.toast('Saved to your foods', 'success');
    router.replace(foodHref(id, { meal }));
  }

  const field = (key: PanelKey, label: string) => (
    <Input key={key} label={label} keyboardType="decimal-pad" autoComplete="off" value={panel[key] || ''}
      onChangeText={(t) => setPanel((x) => ({ ...x, [key]: t }))}
      error={check.errors[key] || (key === 'energyKcal' && tried && check.missingEnergy ? 'Enter the energy' : null)} />
  );

  return (
    <FormPage title="New food" subtitle="Type what the pack says. We'll keep it in your foods, so it works offline."
      footer={(
        <>
          {tried && !ok ? <Caption>Check the boxes marked in red.</Caption> : null}
          <Button label="Save food" onPress={save} />
        </>
      )}>
      <Input label="Name" value={name} onChangeText={setName} placeholder="Seeded rye crackers" autoCapitalize="sentences" error={nameError} />
      <Input label="Brand (optional)" value={brand} onChangeText={setBrand} autoCapitalize="words" />
      <Input label="Barcode (optional)" value={barcode} onChangeText={setBarcode} keyboardType="number-pad" autoComplete="off"
        placeholder="The digits under the bars" error={barcodeError}
        hint={str(p.gtin) ? 'From your scan. The next scan of this barcode finds this food.' : null} />

      <Row between gap="base">
        <Stack gap="xxs" style={{ flex: 1 }}>
          <T size="body">This is a drink</T>
          <Caption>Drinks are measured in ml, and the panel is per 100 ml.</Caption>
        </Stack>
        <Switch on={drink} onChange={setDrink} label="This is a drink" />
      </Row>

      <Stack gap="sm">
        <Grid2>{[
          <Input key="size" label={`Serving size (${unit})`} keyboardType="decimal-pad" autoComplete="off" value={servingSize}
            onChangeText={setServingSize} placeholder={drink ? '330' : '40'} error={sizeError} />,
          <Input key="name" label="Serving name" value={servingName} onChangeText={setServingName} placeholder={drink ? '1 can' : '1 bar'} />
        ]}</Grid2>
        <Caption>{`Optional. For a ${drink ? '330 ml can, type 330 and “1 can”' : '40 g bar, type 40 and “1 bar”'}. Leave both empty to log by ${drink ? 'volume' : 'weight'}.`}</Caption>
      </Stack>

      <Section title={`Nutrition per 100 ${unit}`} caption="As printed on the pack. Leave a box empty if the label doesn't list it.">
        <Grid2>{PANEL_FIELDS.map((f) => field(f.key, f.label))}</Grid2>
        <Caption>If the label gives energy only in kJ, divide it by 4.184.</Caption>
        {check.general ? <T size="callout" color="danger">{check.general}</T> : null}
        {check.warning ? (
          <Row gap="sm" style={{ alignItems: 'flex-start' }}>
            <Icon name="exclamationmark.triangle" size={18} color="warning" />
            <T size="callout" color="warning" style={{ flex: 1 }}>{check.warning}</T>
          </Row>
        ) : null}
      </Section>

      <Input label="Ingredients (optional)" value={ingredients} onChangeText={setIngredients} multiline
        placeholder="As listed on the pack" textAlignVertical="top" />
    </FormPage>
  );
}
