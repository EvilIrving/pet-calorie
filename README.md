# react-cat

**English** · [简体中文](README.zh.md)

Mobile-first web app for pet calorie estimation and weight-loss planning. Supports cats and dogs: daily feeding grams from RER/MER and AAFCO macro reverse-calculation, plus fixed-rate (0.5–1%/week) diet plans and weight trend tracking.

> **Disclaimer**: For home feeding estimates and weight logging only—not a substitute for veterinary care. For pets with BCS ≥ 7/9, existing conditions, young/gestating/lactating animals, or cases requiring strict calorie restriction, follow your veterinarian’s guidance.

## Features

| Module | Capabilities |
|--------|----------------|
| **Pet profile** | Species, name, weight, target weight, life stage, neuter status, activity; persisted in IndexedDB |
| **Calorie calculator** | Dry / wet food; direct kcal/kg or label macro reverse-calc; daily grams; save as favorite foods |
| **Diet plan** | Weekly goal card, overall progress, MER / calorie-deficit ranges; daily dry/wet grams; weight timeline & smooth line chart |
| **Weight log** | Calendar date picker, dual-column wheel for weight; one entry per day (overwrite); edit / delete history |

Mobile-first UX: custom stepper / wheel pickers, segment controls, touch targets ≥ 44pt, light haptics on key actions. See [`docs/SPEC.md`](docs/SPEC.md) (Chinese) for full product spec.

## Tech stack

| Area | Choice |
|------|--------|
| Framework | React 19 + Vite 8 + TypeScript |
| Package manager | pnpm |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Persistence | Dexie.js (IndexedDB) |
| Data fetching | TanStack Query v5 |
| Charts | Recharts (`type="natural"` smooth curves) |
| Icons | @fluentui/react-icons |
| Quality | Biome (lint/format), Vitest (unit tests in `src/lib/`) |

Nutrition coefficients, life factors, and weight-loss rates must **not** be hard-coded in components—read from `src/config/nutrition.ts`. Business logic lives in `src/lib/` (e.g. `calculator.ts`, `feeding.ts`, `weightLog.ts`).

## Quick start

```bash
pnpm install
pnpm dev      # local dev (default http://localhost:5173)
pnpm build    # tsc + production build
pnpm preview  # preview dist/
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Vite dev server |
| `pnpm build` | `tsc -b` typecheck + `vite build` |
| `pnpm preview` | Preview `dist/` |
| `pnpm test` | Run Vitest once |
| `pnpm test:watch` | Vitest watch mode |
| `pnpm lint` | Biome check |
| `pnpm lint:fix` | Biome check with auto-fix |
| `pnpm format` | Biome format |

## Project layout

```
react-cat/
├── docs/
│   ├── SPEC.md              # Product, UX, calculation rules (source of truth)
│   └── demo-stepper.html    # Stepper / wheel picker reference
├── public/
├── src/
│   ├── config/              # Nutrition config (nutrition.ts)
│   ├── db/                  # Dexie schema & DB access
│   ├── stores/              # Zustand global state
│   ├── lib/                 # Pure logic + Vitest tests
│   ├── components/          # Reusable UI (Stepper, WheelPicker, …)
│   └── pages/               # Page containers (CalcTab, DietTab, …)
├── AGENTS.md                # Component & coding conventions
└── CLAUDE.md                # Same as AGENTS.md (Claude)
```

## Calculation summary

Full formulas, references, and product rules: [`docs/SPEC.md`](docs/SPEC.md).

- **RER**: `70 × weightKg^0.75` (cats and dogs)
- **MER**: `RER × life factor × activity` (maintenance; uses current weight for daily feeding)
- **Macro reverse-calc**: AAFCO modified Atwater; `NFE = 100 - protein - fat - fiber - moisture - ash`
- **Weight loss**: fixed 0.5–1%/week target weight band; calorie target = `MER - ((referenceWeight - weeklyTargetWeight) × 7700 / 7)`

## Deployment

Live app: **[https://evilirving.github.io/pet-calorie/](https://evilirving.github.io/pet-calorie/)**

Pushes to `main` trigger the [GitHub Actions workflow](.github/workflows/deploy-pages.yml), which builds with `pnpm build` and publishes `dist` to GitHub Pages. In the repo **Settings → Pages**, set **Source** to **GitHub Actions** (one-time setup if not already enabled).

## Contributing

1. **Spec first**: Update `docs/SPEC.md` before code when changing UI, interaction, calculations, or data models.
2. **Conventions**: Function components + hooks, strict TypeScript, Tailwind utilities, project `<Stepper>` / `<WheelPicker>` for numbers—see [`AGENTS.md`](AGENTS.md).
3. **Verify** before submitting:

```bash
pnpm exec tsc -b
pnpm lint
pnpm test
```

## Related docs

- [`docs/SPEC.md`](docs/SPEC.md) — Information architecture, UX, calculations, tech choices
- [`AGENTS.md`](AGENTS.md) — Component guidelines and repo constraints
- [`LICENSE`](LICENSE) — MIT License
