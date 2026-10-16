/* "How healthy is it?" (docs/07 §7.4), ported from prototype/src/30-ui.js
   HealthRatingList: one grouped row per dimension with its word badge and one
   plain sentence giving the number and the reference. No overall score. Each
   row whose claim has studies in the evidence library links to it. */
import { router } from 'expo-router';
import { View } from 'react-native';

import { data as D, domain as M, type Claim, type Food } from '@/shared';
import { colors, curve, radius, spacing } from '@/theme';
import { Badge, Caption, LinkButton, Micro, Row, Stack, T } from '@/ui';

/* The evidence-library claim that explains why a rating line is shown. */
const RATING_CLAIMS: Record<string, string> = {
  sugarsG: 'nutrition.free_sugars_and_health',
  saltG: 'nutrition.sodium_reduction_blood_pressure',
  saturatedFatG: 'nutrition.saturated_fat_replacement_cvd',
  fiberG: 'nutrition.fibre_intake_target',
  processing: 'nutrition.ultra_processed_food_associations'
};
function studiedClaim(key: string | undefined): Claim | null {
  if (!key) return null;
  const c = ((D.CLAIMS || []) as Claim[]).find((x) => x.key === key);
  return c && ((c.sources || []).length + (c.contradicting || []).length + (c.context || []).length) ? c : null;
}

type Dimension = { key: string; label: string; palette: string; status: string; explanation: string };

export function HealthRatingList({ food, confidence }: { food: Food; confidence?: string | null }) {
  const rating = M.healthRating(food) as { dimensions: Dimension[] };
  const dims = rating.dimensions.filter((d) => d.key !== 'fatG' || d.status !== 'low');
  return (
    <Stack>
      <View accessibilityRole="list" style={{ backgroundColor: colors.surfacePearl, borderRadius: radius.lg, ...curve, overflow: 'hidden' }}>
        {dims.map((d, i) => {
          const claim = studiedClaim(RATING_CLAIMS[d.key]);
          return (
            <View key={d.key} style={{ paddingTop: spacing.base, paddingBottom: claim ? spacing.xs : spacing.base, paddingHorizontal: spacing.lg, gap: spacing.xs, borderTopWidth: i ? 1 : 0, borderTopColor: colors.dividerSoft }}>
              <Row between>
                <T size="body" style={{ flexShrink: 1 }}>{d.label}</T>
                <Badge palette={d.palette} status={d.status} />
              </Row>
              <Caption color="inkMuted80">{d.explanation}</Caption>
              {claim ? (
                <LinkButton size="caption" label={`Why ${d.label.toLowerCase()} is on this list`}
                  onPress={() => router.push(`/evidence/${encodeURIComponent(claim.key)}`)} />
              ) : null}
            </View>
          );
        })}
      </View>
      {confidence && confidence !== 'high' ? <Caption>These levels use estimated values, so treat them as a guide.</Caption> : null}
      <Micro>{food.attribution ? `${food.attribution}. ` : ''}Levels use the UK front-of-pack guidance and EU Regulation 1924/2006.</Micro>
    </Stack>
  );
}
