# Design assets

The app's UI uses the **Apple Design System**. The design decisions and screen specs are in [../docs/08-ui-design.md](../docs/08-ui-design.md).

| Path | What it is |
|---|---|
| `apple-design-system/tokens.json` | The system's tokens, the source of truth for every colour, size, radius and weight |
| `apple-design-system/bundle.css`, `bundle.js` | The system's web component bundle (`window.AppleDS`), used by the mockups |
| `app-palettes.json` | This app's `StatusBadge` palettes (health rating, readiness, evidence, connections, …) |
| `generated/theme.ts` | React Native theme generated from `tokens.json` (default theme: Readable) |
| `generated/tokens.css` | CSS variables and type-style classes generated from `tokens.json` |
| `mockups/` | The key screens, built from the real bundle components |
| `screens/*.png` | Rendered screens and `overview.png` |
| `scripts/build-tokens.mjs`, `scripts/render-mockups.mjs` | Regenerate the theme and the screenshots |

## Provenance

The `apple-design-system/` files were copied on 2026-10-12 from the design system artifact <https://claude.ai/artifact/BrNgeRewcYg8S2Gqw6B8Cs> (version `1791754616-cf06`). The artifact is synced from `rukkiecodes/claude-apple-design-system@a7dc950`, which is MIT-licensed. Its components are hand-written from that repository's `references/components.md`.

SHA-256 at copy time:

```
ec9efb03b94adf4abc0087f442c9f6909572f874c4205714304af0f4249d9010  tokens.json
f43477b412696f06d1a52c30c5da86ff5fe3424bf470c6cca1602285a4d6e8fe  bundle.css
19636335817b51cc3a32da938c9f36539ee9847d4cad8e76c1309564db92269a  bundle.js
```

Change tokens in the design system, not here. Then copy `tokens.json` back and regenerate.

## Regenerate

```bash
# from nutrition-training-companion/
node design/scripts/build-tokens.mjs            # writes generated/tokens.css and generated/theme.ts

# view the mockups in a browser (they load React 18.3.1 and htm 3.1.1 from jsDelivr)
python3 -m http.server 8000                     # then open http://localhost:8000/design/mockups/
                                                # or .../design/mockups/?screen=today

# re-render screens/*.png (needs puppeteer-core, react@18.3.1, react-dom@18.3.1, htm@3.1.1)
CHROME_BIN=/path/to/chrome NODE_PATH=/path/to/node_modules node design/scripts/render-mockups.mjs
```

Icons in the mockups are stand-ins drawn in the bundle's style. The app renders real SF Symbols on iOS and a mapped Material Symbols set on Android.
