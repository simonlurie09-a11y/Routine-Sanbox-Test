// Apple Design System — generated from design/apple-design-system/tokens.json by
// design/scripts/build-tokens.mjs. Do not edit by hand.
//
// Fonts: the system face (SF Pro on iOS, the platform sans on Android), so no
// fontFamily is set. Weights are 400 / 600 / 700 only; 500 is banned.
// Radii: pair every radius with `borderCurve: 'continuous'` on iOS.
// Shadows: none on UI. `heroShadow` is for product imagery only.

export const themeIds = ["light","readable"] as const;
export type ThemeId = (typeof themeIds)[number];
export const defaultTheme: ThemeId = "readable";

export const colors = {
  "light": {
    "primary": "#0066cc",
    "primaryFocus": "#0071e3",
    "primaryOnDark": "#2997ff",
    "ink": "#1d1d1f",
    "body": "#1d1d1f",
    "bodyOnDark": "#ffffff",
    "bodyMuted": "#cccccc",
    "inkMuted80": "#333333",
    "inkMuted48": "#7a7a7a",
    "dividerSoft": "#f0f0f0",
    "hairline": "#e0e0e0",
    "canvas": "#ffffff",
    "canvasParchment": "#f5f5f7",
    "surfacePearl": "#fafafc",
    "surfaceTile1": "#272729",
    "surfaceTile2": "#2a2a2c",
    "surfaceTile3": "#252527",
    "surfaceBlack": "#000000",
    "chipTranslucent": "#d2d2d7",
    "onPrimary": "#ffffff",
    "onDark": "#ffffff",
    "onDark60": "rgba(255, 255, 255, 0.6)",
    "scrim": "rgba(0, 0, 0, 0.45)",
    "danger": "#ff3b30",
    "success": "#34c759",
    "warning": "#ff9500"
  },
  "readable": {
    "primary": "#0066cc",
    "primaryFocus": "#0071e3",
    "primaryOnDark": "#2997ff",
    "ink": "#1d1d1f",
    "body": "#1d1d1f",
    "bodyOnDark": "#ffffff",
    "bodyMuted": "#cccccc",
    "inkMuted80": "#333333",
    "inkMuted48": "#6f6f6f",
    "dividerSoft": "#f0f0f0",
    "hairline": "#e0e0e0",
    "canvas": "#ffffff",
    "canvasParchment": "#f5f5f7",
    "surfacePearl": "#fafafc",
    "surfaceTile1": "#272729",
    "surfaceTile2": "#2a2a2c",
    "surfaceTile3": "#252527",
    "surfaceBlack": "#000000",
    "chipTranslucent": "#d2d2d7",
    "onPrimary": "#ffffff",
    "onDark": "#ffffff",
    "onDark60": "rgba(255, 255, 255, 0.6)",
    "scrim": "rgba(0, 0, 0, 0.45)",
    "danger": "#e00c00",
    "success": "#218039",
    "warning": "#a35f00"
  }
} as const;
export type ColorToken = keyof (typeof colors)['light'];

export const spacing = {
  "xxs": 2,
  "xs": 4,
  "sm": 8,
  "md": 12,
  "base": 16,
  "lg": 20,
  "xl": 24,
  "xxl": 32,
  "xxxl": 48,
  "huge": 64
} as const;
export type SpacingToken = keyof typeof spacing;

export const radius = {
  "sm": 6,
  "md": 10,
  "lg": 14,
  "xl": 20,
  "pill": 999
} as const;
export type RadiusToken = keyof typeof radius;

export const typography = {
  "heroDisplay": {
    "fontSize": 80,
    "fontWeight": "700"
  },
  "title1": {
    "fontSize": 56,
    "fontWeight": "700"
  },
  "title2": {
    "fontSize": 40,
    "fontWeight": "700"
  },
  "title3": {
    "fontSize": 28,
    "fontWeight": "700"
  },
  "headline": {
    "fontSize": 20,
    "fontWeight": "700"
  },
  "body": {
    "fontSize": 17,
    "fontWeight": "400",
    "lineHeight": 25
  },
  "callout": {
    "fontSize": 15,
    "fontWeight": "400"
  },
  "caption": {
    "fontSize": 13,
    "fontWeight": "400"
  },
  "micro": {
    "fontSize": 11,
    "fontWeight": "400"
  },
  "title3-semiBold": {
    "fontSize": 28,
    "fontWeight": "600"
  },
  "headline-semiBold": {
    "fontSize": 20,
    "fontWeight": "600"
  },
  "body-semiBold": {
    "fontSize": 17,
    "fontWeight": "600"
  },
  "callout-semiBold": {
    "fontSize": 15,
    "fontWeight": "600"
  }
} as const;
export type TextStyleToken = keyof typeof typography;

/** From shadow-hero: rgba(0, 0, 0, 0.22) 3px 5px 30px 0. Product imagery only. */
export const heroShadow = {
  "shadowColor": "#000000",
  "shadowOpacity": 0.22,
  "shadowRadius": 15,
  "shadowOffset": {
    "width": 3,
    "height": 5
  }
} as const;
