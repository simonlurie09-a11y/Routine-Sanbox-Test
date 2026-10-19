#!/usr/bin/env node
// Generates design/generated/tokens.css (web mockups) and design/generated/theme.ts
// (React Native) from design/apple-design-system/tokens.json.
//
//   node design/scripts/build-tokens.mjs
//
// tokens.json is the source of truth; never edit the generated files by hand.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const designDir = join(here, '..');
const tokens = JSON.parse(readFileSync(join(designDir, 'apple-design-system/tokens.json'), 'utf8'));

// The app ships the Readable theme by default (docs/08-ui-design.md §8.2).
const DEFAULT_THEME = 'readable';

const themes = tokens.color.themes.map((t) => t.id);
const firstTheme = themes[0];
if (!themes.includes(DEFAULT_THEME)) {
  throw new Error(`tokens.json has no "${DEFAULT_THEME}" theme`);
}

const colorFor = (token, theme) =>
  typeof token.value === 'string' ? token.value : token.value[theme] ?? token.value[firstTheme];

const px = (v) => (typeof v === 'number' ? v : Number(String(v).replace(/px$/, '')));
const stripPrefix = (name, prefix) => (name.startsWith(prefix) ? name.slice(prefix.length) : name);

// ---------------------------------------------------------------- tokens.css
const css = [];
css.push(`/* ${tokens.name} — generated from tokens.json by design/scripts/build-tokens.mjs */`);
css.push(`:root, [data-theme="${firstTheme}"] {`);
for (const t of tokens.color.tokens) css.push(`  --${t.name}: ${colorFor(t, firstTheme)};`);
for (const t of tokens.shadow?.tokens ?? []) css.push(`  --${t.name}: ${t.value};`);
css.push('}');
for (const theme of themes.slice(1)) {
  css.push(`[data-theme="${theme}"] {`);
  for (const t of tokens.color.tokens) {
    if (typeof t.value !== 'string' && t.value[theme]) css.push(`  --${t.name}: ${t.value[theme]};`);
  }
  css.push('}');
}
css.push(':root {');
for (const t of tokens.spacing.tokens) css.push(`  --${t.name}: ${t.value};`);
for (const t of tokens.radius.tokens) css.push(`  --${t.name}: ${t.value};`);
for (const [key, stack] of Object.entries(tokens.type.families)) css.push(`  --font-${key}: ${stack};`);
css.push('}');
for (const group of tokens.type.groups) {
  for (const s of group.styles) {
    const family = s.family ?? group.family;
    const decl = [`font-family: var(--font-${family})`, `font-size: ${s.fontSize}`, `font-weight: ${s.fontWeight}`];
    if (s.lineHeight != null) decl.push(`line-height: ${s.lineHeight}`);
    css.push(`.${s.name} { ${decl.join('; ')}; }`);
  }
}
writeFileSync(join(designDir, 'generated/tokens.css'), css.join('\n') + '\n');

// ------------------------------------------------------------------ theme.ts
const colorsByTheme = Object.fromEntries(
  themes.map((theme) => [theme, Object.fromEntries(tokens.color.tokens.map((t) => [t.name, colorFor(t, theme)]))])
);
const spacing = Object.fromEntries(tokens.spacing.tokens.map((t) => [stripPrefix(t.name, 'spacing-'), px(t.value)]));
const radius = Object.fromEntries(tokens.radius.tokens.map((t) => [stripPrefix(t.name, 'radius-'), px(t.value)]));
const typography = {};
for (const group of tokens.type.groups) {
  for (const s of group.styles) {
    const size = px(s.fontSize);
    const style = { fontSize: size, fontWeight: String(s.fontWeight) };
    // React Native wants an absolute line height.
    if (s.lineHeight != null) style.lineHeight = Math.round(size * Number(s.lineHeight));
    typography[s.name] = style;
  }
}
const heroShadow = (tokens.shadow?.tokens ?? []).find((t) => t.name === 'shadow-hero');
// "rgba(0, 0, 0, 0.22) 3px 5px 30px 0" → React Native shadow props (radius ≈ blur / 2).
const shadowMatch = heroShadow?.value.match(
  /rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/
);
if (heroShadow && !shadowMatch) throw new Error(`cannot parse shadow-hero: ${heroShadow.value}`);
const hex = (n) => Number(n).toString(16).padStart(2, '0');
const rnShadow = shadowMatch
  ? {
      shadowColor: `#${hex(shadowMatch[1])}${hex(shadowMatch[2])}${hex(shadowMatch[3])}`,
      shadowOpacity: Number(shadowMatch[4] ?? 1),
      shadowRadius: Number(shadowMatch[7]) / 2,
      shadowOffset: { width: Number(shadowMatch[5]), height: Number(shadowMatch[6]) },
    }
  : null;

const ts = `// ${tokens.name} — generated from design/apple-design-system/tokens.json by
// design/scripts/build-tokens.mjs. Do not edit by hand.
//
// Fonts: the system face (SF Pro on iOS, the platform sans on Android), so no
// fontFamily is set. Weights are 400 / 600 / 700 only; 500 is banned.
// Radii: pair every radius with \`borderCurve: 'continuous'\` on iOS.
// Shadows: none on UI. \`heroShadow\` is for product imagery only.

export const themeIds = ${JSON.stringify(themes)} as const;
export type ThemeId = (typeof themeIds)[number];
export const defaultTheme: ThemeId = ${JSON.stringify(DEFAULT_THEME)};

export const colors = ${JSON.stringify(colorsByTheme, null, 2)} as const;
export type ColorToken = keyof (typeof colors)['${firstTheme}'];

export const spacing = ${JSON.stringify(spacing, null, 2)} as const;
export type SpacingToken = keyof typeof spacing;

export const radius = ${JSON.stringify(radius, null, 2)} as const;
export type RadiusToken = keyof typeof radius;

export const typography = ${JSON.stringify(typography, null, 2)} as const;
export type TextStyleToken = keyof typeof typography;

/** From shadow-hero: ${heroShadow ? heroShadow.value : 'none'}. Product imagery only. */
export const heroShadow = ${JSON.stringify(rnShadow, null, 2)} as const;
`;
writeFileSync(join(designDir, 'generated/theme.ts'), ts);

console.log(`tokens.css and theme.ts written (${tokens.color.tokens.length} colours, ${themes.length} themes, default ${DEFAULT_THEME})`);
