/* The app's theme: every colour, size, radius and weight comes from the Apple
   Design System tokens (design/generated/theme.ts, copied by
   scripts/sync-shared.mjs). Never write a hex value or a font size inline. */
import { Platform, type TextStyle } from 'react-native';

import { colors as allColors, defaultTheme, radius, spacing, typography, type ColorToken } from './tokens.generated';
import { palettes } from './palettes.generated';

export const colors = allColors[defaultTheme];
export { radius, spacing, typography, palettes };
export type { ColorToken };

/* iOS continuous corners, as the design system asks for every radius. */
export const curve = Platform.OS === 'ios' ? ({ borderCurve: 'continuous' } as const) : {};

export type TextSize = 'title2' | 'title3' | 'headline' | 'body' | 'callout' | 'caption' | 'micro';
export type TextWeight = 'regular' | 'semiBold' | 'bold';

const WEIGHT: Record<TextWeight, TextStyle['fontWeight']> = { regular: '400', semiBold: '600', bold: '700' };

/* Line heights the tokens leave out, set for readability on a phone. */
const LINE: Record<TextSize, number> = { title2: 46, title3: 34, headline: 26, body: 25, callout: 21, caption: 18, micro: 15 };

export function textStyle(size: TextSize, weight?: TextWeight): TextStyle {
  const base = typography[size] as { fontSize: number; fontWeight: string };
  return {
    fontSize: base.fontSize,
    lineHeight: LINE[size],
    fontWeight: weight ? WEIGHT[weight] : (base.fontWeight as TextStyle['fontWeight'])
  };
}

/* Side gutter for every screen. */
export const GUTTER = spacing.xl;
