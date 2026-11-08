# Repository Guidelines

## Project Structure & Module Organization
- Frontend is Vite + React + TypeScript. Entry is `src/main.tsx`, global styles live in `src/index.scss`.
- UI is split into `src/components` (board, dice, players, notices) with shared exports in `src/components/index.ts`.
- All rules live in `src/engine`: pure TypeScript with no React, Redux, DOM or Node imports (`types.ts`, `RulesEngine.ts`, `game.ts` state machine, `backgammon/` rules). Randomness is injected, never generated there.
- Game state uses Redux Toolkit slices in `src/data` (`gameSlice.ts` wraps the engine, `sessionSlice.ts` seats and match score, `uiSlice.ts`, `createStore.ts` factory, `store.ts` app store, `selectors.ts`) plus JSON fixtures in `src/data/checkers-*.json`.
- Dice and turn hand-off come from the listener middleware in `src/runtime` (`turnDriver.ts`, `rng.ts`); click handling lives in `src/ui/moveInput.ts`. `src/helpers` holds only presentation helpers.
- Types live in `src/types`; SVG assets in `src/icons`; tests in `src/tests` (engine, data, runtime, ui).
- Built assets output to `dist/`; public HTML shell is `index.html`.

## Build, Test, and Development Commands
- Install deps: `pnpm install` (pnpm lockfile committed). Use `nvm use` (Node 22.14.0, required by Vite 8 and pnpm 10+) first.
- Local dev server with HMR: `pnpm dev`.
- Production build: `pnpm build` (type-check via `tsc`, then Vite build).
- Preview build locally: `pnpm preview`.
- Unit/integration tests: `pnpm test` (Vitest, jsdom, coverage via v8 reporter). Watch mode: `pnpm test:watch`.
- Lint and format: `pnpm lint` (ESLint) and `pnpm format` (Prettier, WordPress config).

## Coding Style & Naming Conventions
- Prettier (`@wordpress/prettier-config`, 80-char print width) controls formatting; use tabs, single quotes, and Trailing commas as emitted.
- ESLint extends `eslint:recommended`, `@typescript-eslint`, and React Hooks; fix warnings before PRs.
- Components, React files: `PascalCase` filenames and exports (e.g., `GameState.tsx`); helpers and selectors: `camelCase`; Redux action/type constants: uppercase snake where applicable.
- Keep components functional; prefer typed props and typed selectors/actions from `src/types`.
- Co-locate small styles in `index.scss`; avoid inline global overrides unless necessary for board layout.

## Testing Guidelines
- Tests live in `src/tests` with `.test.ts` naming: `engine/` (rules, state machine, `fast-check` properties), `data/` (slices, selectors), `runtime/` (turn driver with fake timers and a scripted RNG), `ui/` (click flows). Add new tests alongside the code they cover.
- Use Vitest globals (`describe/it/expect`) with jsdom environment; build positions with `pos()` and `stateWith()` from `src/tests/engine/fixtures.ts` or the JSON boards in `src/data`.
- Rule changes go into the engine with a test first; the UI and the bot in `tools/` consume `legalSteps`/`legalTurns` and must not re-implement rules. Include a failing test before fixing regressions.

## Commit & Pull Request Guidelines
- Commit messages should be concise, present tense, and scoped (e.g., `Add pip count helper`, `Fix dice roll validation`). Avoid WIP in shared branches.
- PRs should include: brief summary of changes, key commands run (tests/lint), and visual notes or screenshots if UI changes affect the board, dice, or notices.
- Link related issues/tasks when available; highlight any state shape changes in `src/types` or `src/data/store.ts` so reviewers can focus migrations.
