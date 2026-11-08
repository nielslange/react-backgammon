# Repository Guidelines

## Project Structure & Module Organization
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4. Routes live in `src/app` (`/` start screen, `/game`, `/room/[code]`); `src/app/providers.tsx` creates one Redux store per tab. Global styles and design tokens (`@theme`, light/dark) are in `src/styles/globals.css`.
- UI lives in `src/components`: `StartScreen`, `Game` (layout), `board/BoardSvg` (presentational SVG board) with `board/useBoardInteraction` (click and drag), `DiceTray`, `Die`, `PlayerCard`, `ActionBar`, `CubeDialog`, `GameOverDialog`, `Toast`, `AppShell`, and `primitives/` (Button, Switch, Segmented, Dialog). Board geometry is pure in `src/ui/boardGeometry.ts`.
- All rules live in `src/engine`: pure TypeScript with no React, Redux, DOM or Node imports (`types.ts`, `RulesEngine.ts`, `game.ts` state machine, `backgammon/` rules). Randomness is injected, never generated there.
- Game state uses Redux Toolkit slices in `src/data` (`gameSlice.ts` wraps the engine, `sessionSlice.ts` seats and match score, `uiSlice.ts`, `createStore.ts` factory, `store.ts` app store, `selectors.ts`) plus JSON fixtures in `src/data/checkers-*.json`.
- Dice and turn hand-off come from the listener middleware in `src/runtime` (`turnDriver.ts`, `rng.ts`). A human who may double rolls by hand (`requestRoll` in `src/data/intents.ts`); otherwise the driver rolls automatically. Click and drop handling lives in `src/ui/moveInput.ts`.
- The computer player lives in `src/ai`: `shots.ts` (hit chances), `features/` (one evaluator per variant), `search.ts` (one- and two-ply, canonical doubles, a beam for the tric trac), `bot.ts` (levels and cube decisions), and `worker.ts`/`client.ts` (runs it in a Web Worker; `local.ts` runs it in-process for tests).
- Online play: `supabase/` (migrations with RLS and the `apply_move` function, pgTAP tests in `supabase/tests`), `src/server` (room and move logic on a `Db` port: `supabaseDb.ts` in the app, an in-memory Db in tests), `src/app/actions` (thin Server Actions returning `{ ok, value } | { ok: false, code }`), `src/lib/supabase` (browser and server clients), and `src/net` (`protocol.ts` shared move log, `sync.ts`, `transport.ts`/`supabaseTransport.ts`, `onlineDriver.ts`, `onlineGame.ts`, `useRoom.ts`). The `net` slice is null offline.
- Types live in `src/types`; tests in `src/tests` (engine, data, runtime, ui, components, ai, styles, server, net) and Playwright specs in `e2e/`.

## Build, Test, and Development Commands
- Install deps: `pnpm install` (pnpm lockfile committed). Use `nvm use` (Node 22.14.0) first. node_modules is managed by pnpm 12; if the Node-bundled pnpm complains about the store, run `npx -y pnpm@12.8.1 <command>`.
- Local dev server: `pnpm dev` (http://localhost:5173). Restart it and delete `.next/` after changing dependencies.
- Production build: `pnpm build` (Next.js, includes the type-check); `pnpm start` serves it. `pnpm typecheck` runs `tsc` alone.
- Unit and component tests: `pnpm test` (Vitest, jsdom, Testing Library). Watch mode: `pnpm test:watch`. Browser smoke tests: `pnpm e2e` (Playwright, desktop and phone; reuses a running dev server).
- Lint and format: `pnpm lint` (ESLint) and `pnpm format` (Prettier, WordPress config).
- Online locally: Docker (OrbStack), `npx supabase start`, keys from `npx supabase status -o env` into `.env.local` (see `.env.example`), `npx supabase test db`. Tests needing the stack skip themselves without it; restart `pnpm dev` after creating `.env.local`.

## Coding Style & Naming Conventions
- Prettier (`@wordpress/prettier-config`, 80-char print width) controls formatting; use tabs, single quotes, and Trailing commas as emitted.
- ESLint extends `eslint:recommended`, `@typescript-eslint`, and React Hooks; fix warnings before PRs.
- Components, React files: `PascalCase` filenames and exports (e.g., `GameState.tsx`); helpers and selectors: `camelCase`; Redux action/type constants: uppercase snake where applicable.
- Keep components functional; prefer typed props and typed selectors/actions from `src/types`.
- Style with Tailwind utilities on the design tokens from `globals.css` (`bg-surface`, `text-muted`, `rounded-card`, `shadow-raised`, …); avoid hard-coded colours outside the board SVG.

## Testing Guidelines
- Tests live in `src/tests` with `.test.ts` naming: `engine/` (rules, state machine, `fast-check` properties), `data/` (slices, selectors), `runtime/` (turn driver with fake timers and a scripted RNG), `ui/` (click flows). Add new tests alongside the code they cover.
- Use Vitest globals (`describe/it/expect`) with jsdom environment; build positions with `pos()` and `stateWith()` from `src/tests/engine/fixtures.ts` or the JSON boards in `src/data`.
- Rule changes go into the engine with a test first; the UI and the computer player in `src/ai` consume `legalSteps`/`legalTurns` and must not re-implement rules. Include a failing test before fixing regressions.

## Commit & Pull Request Guidelines
- Commit messages should be concise, present tense, and scoped (e.g., `Add pip count helper`, `Fix dice roll validation`). Avoid WIP in shared branches.
- PRs should include: brief summary of changes, key commands run (tests/lint), and visual notes or screenshots if UI changes affect the board, dice, or notices.
- Link related issues/tasks when available; highlight any state shape changes in `src/types` or `src/data/store.ts` so reviewers can focus migrations.
