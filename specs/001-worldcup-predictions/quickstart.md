# Quickstart: World Cup Prediction Website

## Prerequisites

- Node 20+
- npm
- Java 21 only if we later stand up the planned backend contract target

## Frontend Development

```bash
cd frontend
npm install
npm run dev
```

Open the local Vite URL and verify that:
- the prediction workspace renders with group and knockout sections
- score inputs accept numeric values and update standings live
- the export preview is visible when all predictions are complete
- personalization (title, creator name, theme) reflects in the preview

## Build Validation

```bash
cd frontend
npm run build
```

## Full Validation (TypeScript + Unit Tests + Build)

```bash
cd frontend
npm run validate
```

This runs `tsc -b`, `vitest run`, and `vite build` in sequence. All three must pass before shipping.

## Test Commands

```bash
cd frontend
npm run test          # Unit + integration tests (Vitest)
npm run test:watch    # Watch mode
npm run test:e2e      # Playwright end-to-end tests
npm run test:a11y     # Accessibility regression tests (Playwright)
```

## Storybook

```bash
cd frontend
npm run storybook
```

Use Storybook to verify:
- `Molecules/MatchScoreCard` — live prediction, knockout tie, and unpredicted states
- `Organisms/ExportPreviewCard` — all theme variants, empty state, and long titles
- `Organisms/SettingsPanel` — default, personalized, and theme-selected states

## QA Checklist

1. **MVP Flow**: Enter scores for all group matches → verify standings update → enter knockout scores → select advancing team on ties → champion is displayed.
2. **Export**: Complete all predictions → open export preview → download PNG.
3. **Personalization**: Change card title, creator name, and theme → verify preview updates → refresh page → confirm draft restores.
4. **Accessibility**: Tab through score inputs in order → use Arrow keys to navigate advancement buttons → verify all inputs have accessible labels.
5. **Responsive**: Check workspace layout at 375px, 768px, and 1280px viewport widths.

## Design Asset Context

- Newest Stitch design inventory: `frontend/.stitch/designs/latest-inventory.json`
- Localized CDN-backed Stitch HTML: `frontend/.stitch/designs/localized/`
- Cached Google/Tailwind assets manifest: `frontend/.stitch/designs/google-cdn-assets/manifest.json`

## Future Backend Contract Target

```bash
cd backend
./mvnw spring-boot:run
```

Once a backend exists, the OpenAPI document in `specs/001-worldcup-predictions/contracts/worldcup-predictions.openapi.yaml` becomes the reference contract.
