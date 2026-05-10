# Repository Guidelines

## Project Structure & Module Organization
- Frontend is Vite + React + TypeScript. Entry is `src/main.tsx`, global styles live in `src/index.scss`.
- UI is split into `src/components` (board, dice, players, notices) with shared exports in `src/components/index.ts`.
- Game state uses Redux Toolkit-esque patterns in `src/data` (`actions.ts`, `reducer.ts`, `selectors.ts`, `store.ts`) plus JSON fixtures in `src/data/checkers-*.json`.
- Game logic utilities sit in `src/helpers` (click handling, move validation, win checks).
- Types live in `src/types`; SVG assets in `src/icons`; tests in `src/tests` (integration, helpers, data).
- Built assets output to `dist/`; public HTML shell is `index.html`.

## Build, Test, and Development Commands
- Install deps: `pnpm install` (pnpm lockfile committed). Use `nvm use` (Node 20.12.2) first.
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
- Tests live in `src/tests` with `.test.ts` naming; integration suites cover game flow, rules, and dice behavior. Add new tests alongside the code they cover.
- Use Vitest globals (`describe/it/expect`) with jsdom environment; prefer deterministic fixtures using the JSON boards in `src/data`.
- Aim to extend coverage (v8 reporter) for new reducers, helpers, and components; include a failing test before fixing regressions when possible.

## Commit & Pull Request Guidelines
- Commit messages should be concise, present tense, and scoped (e.g., `Add pip count helper`, `Fix dice roll validation`). Avoid WIP in shared branches.
- PRs should include: brief summary of changes, key commands run (tests/lint), and visual notes or screenshots if UI changes affect the board, dice, or notices.
- Link related issues/tasks when available; highlight any state shape changes in `src/types` or `src/data/store.ts` so reviewers can focus migrations.
