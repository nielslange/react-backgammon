# Backgammon Platform Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single-board backgammon app into a platform with a pure rules engine, a designed responsive UI, an in-app AI with three levels, online rooms on Supabase, and the Dutch Triktrak variant.

**Architecture:** All rules move into `src/engine`, a pure TypeScript module consumed by the Redux store, the AI worker and the Next.js Server Actions. Side effects (dice, timers, network) live in a listener-middleware turn driver and a `net` layer. The UI is rebuilt as an SVG board styled with Tailwind 4 design tokens.

**Tech Stack:** Next.js 16.2 (App Router, Server Actions) on Vercel from Task 12 on (Phase 1 still runs on the existing Vite setup), React 19, Redux Toolkit 2 (`createSlice`, `createListenerMiddleware`), TypeScript 6 (5.9 fallback), Tailwind 4, Vitest 5, Testing Library, `fast-check`, Playwright, Supabase (Postgres, anonymous Auth, Realtime, RLS) through `@supabase/ssr` and `@supabase/supabase-js`.

**Spec:** `docs/superpowers/specs/2026-11-07-platform-design.md`

**How this plan is organised:** Phase 1 is written step by step and is executed first. Phases 2 to 5 are written at task level (files, interfaces, tests, verification) and are expanded into step-level plans when their phase starts, because their exact signatures depend on the Phase 1 code as merged. Each phase ends in working software.

## Global Constraints

- Node 22.14.0 (`.nvmrc`); run `source ~/.nvm/nvm.sh && nvm use` before any `pnpm` command.
- TypeScript stays on 6.x (typescript-eslint 8 does not support 7).
- Prettier config `@wordpress/prettier-config`: tabs, single quotes, 80 columns. Format only files you create or fully rewrite.
- `pnpm lint` runs with `--max-warnings 0`; `pnpm test` must stay green at every commit.
- `src/engine` imports nothing from React, Redux, the DOM or Node.
- Lane conventions are unchanged: points 1–24, lane 0 = P1 bar and P2 off, lane 25 = P2 bar and P1 off. P1 (Blue) moves 24→1, P2 (Red) moves 1→24.
- Commit messages: concise, present tense, scoped (`Add engine movement helpers`).
- Every `GameState` must stay JSON-serialisable (no class instances, no functions, no `undefined` in arrays).
- `src/app` is reserved for Next.js routes, layouts and Server Actions; runtime helpers live in `src/runtime`. From Task 12 on, the Redux store, the AI worker and the board render only inside `'use client'` components, and server-only code (`src/server`, `src/lib/supabase/server.ts`) never imports client modules.
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public), `SUPABASE_SERVICE_ROLE_KEY` (server only).

## Review Focus

1. A step that is legal in isolation but leaves the second die unplayable when another ordering would play both: `legalSteps` must exclude it. Test added to Task 3.
2. Undo after a hit must return the hit checker from the bar to the point it was hit on, not to an arbitrary lane. Test added to Task 5.
3. A roll that cannot be played at all must pass the turn without changing the board and must not loop when the opponent also cannot move. Test added to Task 4.
4. The reducer must never throw into React: an illegal `playStep` leaves `game.state` identical and sets `lastError`. Test added to Task 7.
5. Loading a snapshot with both colours on one point must be rejected with `INVALID_POSITION` and must not replace the current game. Test added to Task 7.

---

## Phase 1: Engine extraction

Outcome: the app plays exactly as today, but every rule lives in `src/engine`, the store is split into `game | session | ui | net`, dice come from the turn driver, and the Red bot uses the engine. Old helpers and selectors are deleted.

### File structure (Phase 1)

| File | Responsibility |
|---|---|
| `src/engine/types.ts` | all engine types from spec 4.1 |
| `src/engine/constants.ts` | `BAR`, `OFF`, `HOME`, `opponent()`, `isOnBoard()` |
| `src/engine/errors.ts` | `EngineError`, `EngineErrorCode` |
| `src/engine/RulesEngine.ts` | the interface from spec 4.2 |
| `src/engine/backgammon/movement.ts` | target lane, blocking, bar, moving one checker |
| `src/engine/backgammon/bearOff.ts` | home-board and bear-off rules |
| `src/engine/backgammon/turns.ts` | `legalTurns`, `legalSteps` |
| `src/engine/backgammon/result.ts` | winner and win kind |
| `src/engine/backgammon/pips.ts` | pip count |
| `src/engine/backgammon/index.ts` | the `backgammon` RulesEngine object |
| `src/engine/game.ts` | the shared state machine (spec 4.3) |
| `src/engine/index.ts` | `getEngine(variant)` and re-exports |
| `src/tests/engine/fixtures.ts` | `pos()` position builder, `stateWith()` |
| `src/tests/engine/*.test.ts` | engine tests |
| `src/data/gameSlice.ts` | `game` slice wrapping the engine |
| `src/data/sessionSlice.ts` | seats, scores, match target, Crawford |
| `src/data/uiSlice.ts` | mode, selected die, preview, hint, theme |
| `src/data/selectors.ts` | rewritten: `selectNotice`, `selectLegalSteps`, `selectPipCounts`, `selectSeatToAct` |
| `src/data/store.ts` | combined store, `RootState`, `AppDispatch`, listener middleware |
| `src/runtime/rng.ts` | `Rng`, `seeded`, `rollDie`, `rollDice` |
| `src/runtime/turnDriver.ts` | listener middleware for opening roll and auto roll |
| `src/ui/moveInput.ts` | click/preview handlers on top of `legalSteps` |
| `src/types/StateType.ts` | replaced by `RootState` re-export |
| deleted | `src/helpers/*` except `playerNameHelper.ts` and `createNoticeHelper.ts`; `src/data/reducer.ts`, `src/data/actions.ts`, `src/data/state.ts`; `src/types/ActionTypes.ts`; old tests under `src/tests/integration`, `src/tests/helpers`, `src/tests/data` |

### Task 1: Engine types, constants, errors and movement

**Files:**
- Create: `src/engine/types.ts`, `src/engine/constants.ts`, `src/engine/errors.ts`, `src/engine/RulesEngine.ts`, `src/engine/backgammon/movement.ts`
- Create: `src/tests/engine/fixtures.ts`, `src/tests/engine/movement.test.ts`

**Interfaces:**
- Produces `types.ts`: exactly the types in spec 4.1 and 4.4, including `GameEvent` and `lastEvent`.
- Produces `constants.ts`:
  - `BAR: Record<Player, number>` = `{ PLAYER_ONE: 0, PLAYER_TWO: 25 }`
  - `OFF: Record<Player, number>` = `{ PLAYER_ONE: 25, PLAYER_TWO: 0 }`
  - `HOME: Record<Player, number[]>` = `{ PLAYER_ONE: [1,2,3,4,5,6], PLAYER_TWO: [19,20,21,22,23,24] }`
  - `opponent(p: Player): Player`, `isOnBoard(lane: number): boolean` (1–24)
- Produces `errors.ts`: `type EngineErrorCode = 'WRONG_PHASE' | 'NOT_YOUR_TURN' | 'ILLEGAL_STEP' | 'NOTHING_TO_UNDO' | 'CUBE_NOT_ALLOWED' | 'INVALID_POSITION'`; `class EngineError extends Error { readonly code: EngineErrorCode }`.
- Produces `movement.ts`:
  - `targetLane(player: Player, lane: number, die: number): number` (today's `getTargetLane`, moved)
  - `countOn(checkers: Checker[], lane: number, player: Player): number`
  - `hasBarChecker(checkers: Checker[], player: Player): boolean`
  - `isBlocked(checkers: Checker[], player: Player, lane: number): boolean` (two or more opponent checkers; off lanes never blocked)
  - `moveOne(checkers: Checker[], player: Player, checkerId: number | null, from: number, to: number): { checkers: Checker[]; hit: boolean }` moves `checkerId` if it stands on `from`, else the first checker of `player` on `from`; a single opponent checker on `to` goes to `BAR[opponent]`.
- Produces `fixtures.ts`: `pos(specs: Array<{ player: Player; lane: number; count: number }>): Checker[]` with ids 1..n in spec order, and `stateWith(partial: Partial<GameState>): GameState` returning a `moving` backgammon state with default fields.

- [ ] **Step 1: Write the failing tests**

```ts
// src/tests/engine/movement.test.ts
describe( 'targetLane', () => {
    it( 'P1 enters from the bar at 25 - die', () => expect( targetLane( P1, 0, 5 ) ).toBe( 20 ) );
    it( 'P2 enters from the bar at die', () => expect( targetLane( P2, 25, 5 ) ).toBe( 5 ) );
    it( 'P1 bears off to 25 from home with overshoot', () => expect( targetLane( P1, 2, 5 ) ).toBe( 25 ) );
    it( 'P2 bears off to 0', () => expect( targetLane( P2, 22, 3 ) ).toBe( 0 ) );
    it( 'P1 moves down the board', () => expect( targetLane( P1, 13, 4 ) ).toBe( 9 ) );
} );
describe( 'isBlocked', () => {
    it( 'two opponent checkers block', () =>
        expect( isBlocked( pos( [ { player: P2, lane: 5, count: 2 } ] ), P1, 5 ) ).toBe( true ) );
    it( 'one opponent checker does not block', () =>
        expect( isBlocked( pos( [ { player: P2, lane: 5, count: 1 } ] ), P1, 5 ) ).toBe( false ) );
    it( 'the off lane is never blocked', () =>
        expect( isBlocked( pos( [ { player: P2, lane: 0, count: 3 } ] ), P2, 0 ) ).toBe( false ) );
} );
describe( 'moveOne', () => {
    it( 'hits a blot and sends it to the opponent bar', () => {
        const checkers = pos( [ { player: P1, lane: 8, count: 1 }, { player: P2, lane: 5, count: 1 } ] );
        const { checkers: next, hit } = moveOne( checkers, P1, 1, 8, 5 );
        expect( hit ).toBe( true );
        expect( next.find( ( c ) => c.id === 2 )?.lane ).toBe( 25 );
        expect( next.find( ( c ) => c.id === 1 )?.lane ).toBe( 5 );
    } );
    it( 'moves another checker from the point when the id is not there', () => {
        const checkers = pos( [ { player: P1, lane: 8, count: 2 } ] );
        const { checkers: next } = moveOne( checkers, P1, 99, 8, 5 );
        expect( next.filter( ( c ) => c.lane === 5 ) ).toHaveLength( 1 );
    } );
    it( 'does not mutate its input', () => { /* deep-equal snapshot before and after */ } );
} );
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run src/tests/engine/movement.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Create `types.ts`, `constants.ts`, `errors.ts`, `RulesEngine.ts` from spec 4.1, 4.2, 4.4**

`VariantOptions` defaults live in `types.ts` as `export const DEFAULT_OPTIONS: VariantOptions` with the values from spec 4.4.

- [ ] **Step 4: Implement `movement.ts` and `fixtures.ts` with the signatures above**

`targetLane` is a move of today's `getTargetLane` from `src/data/selectors.ts`; keep its branches.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm vitest run src/tests/engine/movement.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/engine src/tests/engine
git commit -m "Add engine types and movement helpers"
```

### Task 2: Bear-off, pips and result

**Files:**
- Create: `src/engine/backgammon/bearOff.ts`, `src/engine/backgammon/pips.ts`, `src/engine/backgammon/result.ts`
- Create: `src/tests/engine/bearOff.test.ts`, `src/tests/engine/pips.test.ts`, `src/tests/engine/result.test.ts`

**Interfaces:**
- Produces `bearOff.ts`: `allInHome(checkers, player): boolean` (bar counts as outside, off counts as inside); `canBearOffFrom(checkers, player, lane, die): boolean` (exact roll, or overshoot only when no checker stands on a higher point of the home board).
- Produces `pips.ts`: `pipCount(checkers, player): number`.
- Produces `result.ts`: `winner(checkers): Player | null`; `winKind(checkers, winner): 'single' | 'gammon' | 'backgammon'`; `gameResult(checkers, cubeValue: number): GameResult | null` with points 1/2/3 × cube.

- [ ] **Step 1: Port the assertions of `src/tests/integration/bear-off.test.ts`, `src/tests/data/pipCount.test.ts` and `src/tests/integration/scoring.test.ts` into the three new test files, calling the new functions with `pos()` positions**

Keep the P2 overshoot cases: from lane 21 with a 6, overshoot is legal only when lanes 19–20 are empty.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm vitest run src/tests/engine/bearOff.test.ts src/tests/engine/pips.test.ts src/tests/engine/result.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement the three files by moving `wouldClearOffChecker`, `hasCheckersOutsideHomeBoard`, `hasCheckersOnHigherPoints`, `calculatePipCount`, `hasPlayerWon`, `getWinType` out of `src/data/selectors.ts`**

- [ ] **Step 4: Run the tests to verify they pass**

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git commit -am "Add engine bear-off, pip count and result"
```

### Task 3: Legal turns and legal steps

**Files:**
- Create: `src/engine/backgammon/turns.ts`
- Create: `src/tests/engine/turns.test.ts`

**Interfaces:**
- Produces `stepsForDie(checkers: Checker[], player: Player, die: number): Step[]` — one `Step` per distinct `from` lane the player may move with `die` (bar first when a bar checker exists; bear-off via `canBearOffFrom`; `checkerId` = highest id of the player's checkers on `from`; `hit` computed).
- Produces `legalTurns(checkers: Checker[], player: Player, dice: number[], ordered: boolean): Turn[]` — every complete turn; when `ordered` is true only `dice[0]` may be played next. Turns that play fewer dice than the maximum are removed. For two distinct dice where only one can ever be played, only turns with the larger die remain. Deduplicate by the sequence of `(from, to)` pairs.
- Produces `legalSteps(checkers, player, dice, ordered): Step[]` — the distinct first steps of `legalTurns`.

- [ ] **Step 1: Write the failing tests by porting `dice-use-rules.test.ts`, `doubles.test.ts`, `backgammon-rules.test.ts` and `no-valid-moves.test.ts` to `legalTurns` / `legalSteps`, and add these**

```ts
it( 'excludes a step that strands the other die when another ordering plays both', () => {
    // P1 has one checker on 7; dice 6 and 1. Playing the 6 first lands on 1 and the 1 is then unplayable.
    // Playing 1 then 6 is legal (7→6→off requires all in home, so build the position accordingly).
    const steps = legalSteps( checkers, P1, [ 6, 1 ], false );
    expect( steps.some( ( s ) => s.die === 6 ) ).toBe( false );
} );
it( 'keeps only the larger die when exactly one die is playable', () => { /* … */ } );
it( 'returns [] when nothing is playable', () => { /* P1 on bar, lanes 19–24 each hold 2 P2 checkers */ } );
it( 'ordered dice allow only dice[0]', () => {
    const steps = legalSteps( checkers, P1, [ 3, 5 ], true );
    expect( steps.every( ( s ) => s.die === 3 ) ).toBe( true );
} );
it( 'plays all four dice of a double when possible', () => {
    expect( legalTurns( startPosition, P1, [ 2, 2, 2, 2 ], false ).every( ( t ) => t.length === 4 ) ).toBe( true );
} );
```

- [ ] **Step 2: Run to verify they fail**

Run: `pnpm vitest run src/tests/engine/turns.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement `turns.ts`**

Depth-first enumeration: for each distinct die index allowed (all indices if unordered, index 0 if ordered), for each `stepsForDie` result, recurse with the die removed and the step applied via `moveOne`. Collect complete turns, then apply the maximal-length filter, the larger-die filter, and dedupe.

- [ ] **Step 4: Run to verify they pass**

Expected: PASS. Also run `pnpm vitest run src/tests/engine` to confirm Tasks 1–2 still pass.

- [ ] **Step 5: Commit**

```bash
git commit -am "Add engine legal turns and steps"
```

### Task 4: The backgammon RulesEngine object

**Files:**
- Create: `src/engine/backgammon/index.ts`, `src/engine/index.ts`
- Create: `src/tests/engine/backgammon.test.ts`

**Interfaces:**
- Produces `export const backgammon: RulesEngine` with `id: 'backgammon'`, `supportsCube: true`, `orderedDice: false`, and:
  - `expandRoll([a, b])` → `[a, a, a, a]` when equal, else `[max, min]`.
  - `legalSteps(state)` / `legalTurns(state)` delegate to Task 3 with `state.checkers`, `state.player`, `state.dice`.
  - `applyStep(state, step)`: throws `ILLEGAL_STEP` unless a legal step with the same `from` and `die` exists; moves via `moveOne`; removes one die of that value; appends to `turnSteps`; sets `lastEvent: 'hit'` when hit.
  - `afterStep(state)`: result → `phase: 'over'`, `lastEvent: 'game-over'`; dice empty or no legal step → `player = opponent`, `phase: 'awaiting-roll'`, `roll: null`, `dice: []`, `turnSteps: []`, `lastEvent: 'hand-off'` (or `'forfeit'` when dice remained); otherwise unchanged.
  - `onRoll(state, roll)`: sets `roll` and `dice`, `phase: 'moving'`; if `legalSteps` is empty → hand off to the opponent with `lastEvent: 'forfeit'` and `phase: 'awaiting-roll'`.
  - `result(state)` → `gameResult(state.checkers, state.cube.value)`; `pipCount` → Task 2.
- Produces `src/engine/index.ts`: `getEngine(variant: VariantId): RulesEngine` (throws for unknown) and re-exports of `types`, `errors`, `constants`, `game`.

- [ ] **Step 1: Write the failing tests**

```ts
it( 'expandRoll turns doubles into four dice and orders others high-low', () => {
    expect( backgammon.expandRoll( [ 3, 3 ], DEFAULT_OPTIONS ) ).toEqual( [ 3, 3, 3, 3 ] );
    expect( backgammon.expandRoll( [ 2, 5 ], DEFAULT_OPTIONS ) ).toEqual( [ 5, 2 ] );
} );
it( 'onRoll forfeits the turn when nothing is playable without touching the board', () => {
    const s = backgammon.onRoll( stateWith( { checkers: blockedBar, player: P1, phase: 'awaiting-roll' } ), [ 6, 6 ] );
    expect( s.player ).toBe( P2 );
    expect( s.phase ).toBe( 'awaiting-roll' );
    expect( s.lastEvent ).toBe( 'forfeit' );
    expect( s.checkers ).toEqual( blockedBar );
} );
it( 'afterStep hands off when all dice are used', () => { /* dice [] → opponent, awaiting-roll */ } );
it( 'afterStep forfeits remaining unplayable dice', () => { /* lastEvent forfeit */ } );
it( 'afterStep ends the game when the last checker bears off', () => { /* phase over, result.points */ } );
it( 'applyStep rejects a step that is not legal', () => {
    expect( () => backgammon.applyStep( state, { checkerId: 1, from: 24, to: 10, die: 14, hit: false } ) )
        .toThrow( EngineError );
} );
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Implement `backgammon/index.ts` and `engine/index.ts`**

- [ ] **Step 4: Run `pnpm vitest run src/tests/engine` to verify everything passes**

- [ ] **Step 5: Commit**

```bash
git commit -am "Add backgammon rules engine"
```

### Task 5: The shared game state machine

**Files:**
- Create: `src/engine/game.ts`
- Create: `src/tests/engine/game.test.ts`

**Interfaces:**
- Produces, all pure and throwing `EngineError`:
  - `createGame(variant: VariantId, options?: Partial<VariantOptions>): GameState` — phase `opening`, `player: null`, `firstMover: null`, cube `{ value: 1, owner: null, offered: false }`.
  - `openingRoll(state, p1Die: number, p2Die: number): GameState` — tie: unchanged; else `player` and `firstMover` = higher, `roll: [p1Die, p2Die]`, `dice = engine.expandRoll([high, low])`, `phase: 'moving'`; throws `WRONG_PHASE` outside `opening`.
  - `roll(state, roll: Roll): GameState` — `WRONG_PHASE` unless `awaiting-roll`; delegates to `engine.onRoll`.
  - `play(state, step: Step): GameState` — `WRONG_PHASE` unless `moving`; `engine.afterStep(engine.applyStep(state, step))`.
  - `undoStep(state): GameState` — `NOTHING_TO_UNDO` when `turnSteps` is empty; reverses the last step: mover back to `from`, if `hit` the opponent checker on `BAR[opponent]` back to `to`, die restored (unshift when `orderedDice`, push otherwise), `lastEvent: 'undo'`.
  - `resign(state, player: Player): GameState` — `phase: 'over'`, result `{ winner: opponent, points: cube.value, kind: 'resign' }`.
  - `offerDouble(state, player)`, `acceptDouble(state)`, `dropDouble(state)` — moved from the reducer; `CUBE_NOT_ALLOWED` when `!engine.supportsCube`, when not `awaiting-roll`, or when `player` neither owns the cube nor is the cube centred; drop ends the game with `kind: 'drop'` and `points: cube.value`.
  - `snapshot(state): GameState` and `restore(json: unknown): GameState` — `restore` validates shape and `INVALID_POSITION` when a point 1–24 holds both colours or a player has more or fewer than 15 checkers.

- [ ] **Step 1: Write the failing tests by porting `opening-roll.test.ts`, `turn-flow.test.ts`, `doubling-cube.test.ts`, `game-flow.test.ts`, and `loadGame.test.ts`, plus**

```ts
it( 'undo after a hit returns the hit checker to the point it was hit on', () => {
    const before = stateWith( { checkers: pos( [ { player: P1, lane: 8, count: 1 }, { player: P2, lane: 5, count: 1 } ] ), player: P1, dice: [ 3, 1 ] } );
    const step = backgammon.legalSteps( before ).find( ( s ) => s.from === 8 && s.die === 3 )!;
    const after = undoStep( play( before, step ) );
    expect( after.checkers ).toEqual( before.checkers );
    expect( after.dice ).toEqual( [ 1, 3 ] );   // order does not matter for backgammon; compare sorted
} );
it( 'undo is impossible once the turn has been handed off', () => { /* play the last die → NOTHING_TO_UNDO */ } );
it( 'a win by the mover ends the game before the opponent rolls', () => { /* phase over */ } );
```

- [ ] **Step 2: Run to verify they fail**

- [ ] **Step 3: Implement `game.ts`**

`restore` reuses the LOAD_GAME validation from `src/data/reducer.ts`.

- [ ] **Step 4: Run `pnpm vitest run src/tests/engine` → PASS**

- [ ] **Step 5: Commit**

```bash
git commit -am "Add engine game state machine"
```

### Task 6: Property tests

**Files:**
- Modify: `package.json` (add `fast-check` devDependency)
- Create: `src/tests/engine/properties.test.ts`

- [ ] **Step 1: `pnpm add -D fast-check`**

- [ ] **Step 2: Write the properties**

Arbitrary: a random legal position (15 checkers each, no mixed points, generated by distributing counts over lanes 0–25 per player with the player's bar/off semantics) and a random roll.

```ts
it( 'every legal step starts a maximal turn', () => fc.assert( fc.property( position, roll, player, ( checkers, r, p ) => {
    const dice = backgammon.expandRoll( r, DEFAULT_OPTIONS );
    const turns = legalTurns( checkers, p, dice, false );
    const max = Math.max( 0, ...turns.map( ( t ) => t.length ) );
    for ( const step of legalSteps( checkers, p, dice, false ) ) {
        expect( turns.some( ( t ) => t[ 0 ].from === step.from && t[ 0 ].die === step.die && t.length === max ) ).toBe( true );
    }
} ) ) );
it( 'playing a legal step never throws and preserves 15 checkers per player', () => { /* … */ } );
it( 'pip count decreases by exactly the die on a non-bearing-off step', () => { /* … */ } );
```

- [ ] **Step 3: Run `pnpm vitest run src/tests/engine/properties.test.ts` → PASS (fix engine bugs found, each with a regression test)**

- [ ] **Step 4: Commit**

```bash
git commit -am "Add engine property tests"
```

### Task 7: Redux slices, store and selectors

**Files:**
- Create: `src/data/gameSlice.ts`, `src/data/sessionSlice.ts`, `src/data/uiSlice.ts`
- Rewrite: `src/data/store.ts`, `src/data/selectors.ts`
- Replace: `src/types/StateType.ts` (re-export `RootState` from the store), delete `src/types/ActionTypes.ts`, `src/data/actions.ts`, `src/data/reducer.ts`, `src/data/state.ts`
- Create: `src/tests/data/gameSlice.test.ts`, `src/tests/data/sessionSlice.test.ts`, `src/tests/data/selectors.test.ts` (replace the old one)

**Interfaces:**
- `gameSlice` state `{ state: GameState; lastError: EngineErrorCode | null }`, initial `createGame('backgammon')`. Reducers (RTK `createSlice`, payloads as given): `newGame({ variant, options? })`, `openingRoll({ p1, p2 })`, `roll({ roll })`, `playStep({ step })`, `undoStep()`, `resign({ player })`, `offerDouble({ player })`, `acceptDouble()`, `dropDouble()`, `loadSnapshot({ snapshot })`. Each wraps the matching `game.ts` call in `try/catch`; on `EngineError` the state is unchanged and `lastError = error.code`; on success `lastError = null`.
- `sessionSlice` state as spec 5.1 `session`; reducers `configureSession({ players, matchTarget })`, `gameEnded({ winner, points })` (adds points; sets `crawfordPlayed = true` when the game that just ended was a Crawford game, i.e. before it a player stood at `matchTarget − 1`), `nextGame()` (increments `gameNumber`). The three functions of `src/helpers/matchHelper.ts` (`isCrawfordPending`, `isMatchOver`, `isCubeAllowed`) move into this file as exported selectors; `src/tests/integration/match-play.test.ts` is ported to `sessionSlice.test.ts`.
- `uiSlice` state `{ mode, selectedDie, preview, hint: MessageType | null, theme }`; reducers `setMode`, `selectDie`, `setPreview`, `setHint`, `setTheme`.
- `store.ts`: `configureStore` with the three slices plus `net: () => null` placeholder, listener middleware prepended; exports `store`, `RootState`, `AppDispatch`, `listenerMiddleware`; keeps the dev-only `window.__backgammonStore` hook.
- `selectors.ts`: `selectGame(root): GameState`, `selectLegalSteps(root): Step[]` (memoised, `[]` unless phase `moving`), `selectPipCounts(root): Record<Player, number>`, `selectSeatToAct(root): Seat | null`, `selectNotice(root): NoticeType` (derived from `lastError`, `lastEvent`, `result`, `ui.hint` using `MessageType`).

- [ ] **Step 1: Write failing tests**

```ts
it( 'an illegal step leaves the game untouched and records the error', () => {
    const store = makeStore();
    store.dispatch( newGame( { variant: 'backgammon' } ) );
    store.dispatch( openingRoll( { p1: 6, p2: 1 } ) );
    const before = store.getState().game.state;
    store.dispatch( playStep( { step: { checkerId: 1, from: 24, to: 10, die: 14, hit: false } } ) );
    expect( store.getState().game.state ).toBe( before );
    expect( store.getState().game.lastError ).toBe( 'ILLEGAL_STEP' );
} );
it( 'loading a snapshot with mixed points is rejected and the current game stays', () => { /* INVALID_POSITION */ } );
it( 'gameEnded sets crawfordPlayed when a player had match point minus one', () => { /* matchTarget 5, scores 4–2 */ } );
it( 'selectNotice maps lastError to MessageType', () => { /* ILLEGAL_STEP → NO_MOVE_FOR_CHECKER */ } );
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement the slices, store and selectors; delete the old reducer, actions, state and action types**

`MessageType` gains `TURN_FORFEITED`, `ROLL_AGAIN`, `GAME_DRAWN`, `CUBE_NOT_ALLOWED`, `INVALID_SNAPSHOT`; unused members (`FINISHED_CHECKER`, `MUST_USE_LARGER_DIE`, `DIE_NOT_PLAYABLE`, `SELECT_DIE_FIRST` stays) are removed as the old helpers go.

- [ ] **Step 4: Run `pnpm vitest run src/tests/data src/tests/engine` → PASS. Type-check with `pnpm tsc --noEmit` will fail until Task 9 removes the old components' imports; that is expected at this commit.**

- [ ] **Step 5: Commit**

```bash
git commit -am "Replace reducer with engine-backed slices"
```

### Task 8: RNG and turn driver

**Files:**
- Create: `src/runtime/rng.ts`, `src/runtime/turnDriver.ts`
- Modify: `src/data/store.ts` (start the driver)
- Create: `src/tests/app/turnDriver.test.ts`

**Interfaces:**
- `rng.ts`: `type Rng = () => number`; `seeded(seed: number): Rng` (mulberry32); `rollDie(rng): number`; `rollDice(rng): Roll`.
- `turnDriver.ts`: `createTurnDriver({ rng, delays }: { rng: Rng; delays: { roll: number; aiStep: number } }): ListenerMiddlewareInstance` and `startTurnDriver(listener, { rng, delays })`. Listeners:
  1. predicate: `game.state.phase === 'opening'` and neither seat is `remote` → dispatch `openingRoll({ p1: rollDie(rng), p2: rollDie(rng) })`; repeats while the phase stays `opening` (tie).
  2. predicate: phase changed to `awaiting-roll` and the seat to act is `human` or `ai` → after `delays.roll` ms dispatch `roll({ roll: rollDice(rng) })`.
  3. predicate: phase changed to `over` → dispatch `gameEnded({ winner: result.winner, points: result.points })`.
  AI listeners are added in Phase 4.

- [ ] **Step 1: Write failing tests with `vi.useFakeTimers()` and `seeded(1)`**

```ts
it( 'performs the opening roll until the tie is broken', () => { /* seeded rng chosen so the first pair ties */ } );
it( 'auto-rolls for the next player after a hand-off', () => {
    // play a full turn via legalSteps, advance timers by delays.roll, expect dice.length > 0 and player switched
} );
it( 'does not roll for a remote seat', () => { /* seat remote → dice stay [] */ } );
it( 'reports the result to the session when the game ends', () => { /* scores updated */ } );
```

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `rng.ts` and `turnDriver.ts`; wire into `store.ts` with `delays: { roll: 400, aiStep: 350 }` and `Math.random`**

- [ ] **Step 4: Run → PASS**

- [ ] **Step 5: Commit**

```bash
git commit -am "Add turn driver with injectable dice"
```

### Task 9: Move the UI onto the engine

**Files:**
- Create: `src/ui/moveInput.ts`, `src/tests/ui/moveInput.test.ts`
- Modify: `src/components/Checker.tsx`, `Lane.tsx`, `Dice.tsx`, `Players.tsx`, `GameState.tsx`, `PipCount.tsx`, `Notice.tsx`, `Game.tsx`
- Delete: `src/helpers/handleClickHelper.ts`, `moveSelectionHelper.ts`, `updateGameHelper.ts`, `validateMoveHelper.ts`, `noValidMovesHelper.ts`, `checkForWinHelper.ts`, `startGameHelper.ts`, `matchHelper.ts` (its three functions move to `sessionSlice.ts`), `src/components/Scoreboard.tsx`, old tests in `src/tests/integration`, `src/tests/helpers`

**Interfaces:**
- `moveInput.ts`:
  - `optionsForChecker(root: RootState, checkerId: number): Step[]` — legal steps whose `from` equals that checker's lane (one per die).
  - `onCheckerClick(dispatch, root, checkerId)` — beginner mode: preview logic of today's `handleCheckerSelection` (preview, confirm by second click when one option, confirm by clicking a checker on a target); advanced mode: today's `handleDirectMove` using `ui.selectedDie` or the only playable die. Dispatches `playStep` or `setPreview`/`setHint`.
  - `onTargetClick(dispatch, root, lane)` — confirms the preview onto `lane`, choosing the smaller die when two steps land there.
  - `playableDice(root): number[]` — distinct dice present in `selectLegalSteps`.
- Components: `Players.tsx` shows the current player and a single **Start game** button that dispatches `newGame` (the driver does the rest); the toggle button is removed. `Dice.tsx` drops the Roll button. `GameState.tsx` keeps Restart (dispatch `newGame`), Resign (`resign({ player: game.state.player })`), Undo (`undoStep`, disabled when `turnSteps` is empty). `Notice.tsx` uses `selectNotice`.

- [ ] **Step 1: Port `moveSelectionHelper.test.ts` and `handleClickHelper.test.ts` to `moveInput.test.ts` against a real store; add a test that the preview confirms onto an opponent blot by clicking it**

- [ ] **Step 2: Run → FAIL**

- [ ] **Step 3: Implement `moveInput.ts`; update the components; delete the old helpers, components and tests**

- [ ] **Step 4: Verify**

Run: `pnpm tsc --noEmit && pnpm lint && pnpm test` → all green.
Run: `pnpm dev`, open the app, play a full game to the end in beginner mode and one turn in advanced mode; hit a blot and undo; confirm the opponent auto-rolls; confirm "turn passes" appears when a roll is unplayable (use `window.__backgammonStore.dispatch(loadSnapshot(...))` with a blocked-bar position).

- [ ] **Step 5: Commit**

```bash
git commit -am "Drive the UI from the engine and remove legacy helpers"
```

### Task 10: Bot on the engine

**Files:**
- Modify: `tools/backgammon-mcp/lib.mts`

- [ ] **Step 1: Replace `tryMove`, `applyMove`, `enumerate` with `legalTurns` from `../../src/engine/backgammon/turns.ts` and `moveOne` from `movement.ts`; keep `scoreNormal` and `chooseTurn`**

- [ ] **Step 2: Verify: `pnpm dev`, then in `tools/backgammon-mcp` run `node_modules/.bin/tsx cli.mts --midgame --watch`; the bot must complete three turns without a rejected move**

- [ ] **Step 3: Commit**

```bash
git commit -am "Use the engine in the Red bot"
```

### Task 11: Phase gate

- [ ] **Step 1: Update `AGENTS.md` project structure (engine, runtime, ui folders; slices) and `README.md` action list**
- [ ] **Step 2: `pnpm lint && pnpm test && pnpm build` → green; coverage of `src/engine` ≥ 90 % lines (`pnpm vitest run --coverage`)**
- [ ] **Step 3: Commit `Document the engine architecture`; open a PR `Extract rules engine` against `trunk`**

---

## Phase 2: UI redesign

Outcome: the app runs on Next.js 16 with Tailwind 4; start screen, SVG board, player cards, dice tray, cube and match UI, responsive at 390 px. Bootstrap, Vite and SCSS removed. Local two-player play only.

### File structure (Phase 2)

| File | Responsibility |
|---|---|
| `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `tsconfig.json` | Next.js 16 project configuration |
| `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/game/page.tsx`, `src/app/room/[code]/page.tsx` | App Router routes; each page renders one `'use client'` screen component |
| `src/app/providers.tsx` | `'use client'` Redux `Provider` and theme attribute |
| `src/styles/globals.css` | `@import "tailwindcss"`, `@theme` tokens (colour, type scale, spacing, radii, shadows), dark variant via `[data-theme="dark"]` and `prefers-color-scheme`, reduced-motion rules |
| `src/ui/boardGeometry.ts` | pure geometry in viewBox units |
| `src/components/AppShell.tsx` | header, theme toggle, page frame |
| `src/components/StartScreen.tsx` | variant, opponent, names, match length, cube |
| `src/components/board/BoardSvg.tsx`, `Point.tsx`, `CheckerGlyph.tsx`, `BarTray.tsx`, `OffTray.tsx` | rendering only |
| `src/components/board/useBoardInteraction.ts` | click modes and drag |
| `src/components/DiceTray.tsx`, `Die.tsx` | dice with roll animation |
| `src/components/PlayerCard.tsx`, `Cube.tsx`, `ActionBar.tsx`, `GameOverDialog.tsx`, `Toast.tsx` | game chrome |
| `src/components/primitives/Button.tsx`, `Dialog.tsx`, `Switch.tsx`, `Select.tsx` | own primitives |
| `src/tests/ui/boardGeometry.test.ts`, `src/tests/components/*.test.tsx` | tests (add `@testing-library/react`, `@testing-library/user-event`) |
| `e2e/smoke.spec.ts`, `playwright.config.ts` | Playwright smoke test against `next dev` (root `@playwright/test` devDependency) |

### Task 12: Migrate to Next.js 16 and Tailwind 4
Files: `package.json` (add `next@16.2.11`, `eslint-config-next@16.2.11`, `tailwindcss@^4`, `@tailwindcss/postcss@^4`; remove `vite`, `sass`, `bootstrap`, `react-bootstrap`; keep `@vitejs/plugin-react` for Vitest), the four config files, `src/app/layout.tsx`, `src/app/page.tsx` (renders the existing `Game` component through `providers.tsx`), `src/styles/globals.css` with the `@theme` tokens. Delete `index.html`, `vite.config.ts`, `src/main.tsx`, `src/index.scss`. Scripts: `dev: next dev`, `build: next build`, `start: next start`, `lint: eslint .`, `test: vitest run` (Vitest keeps `vitest.config.ts` with `@vitejs/plugin-react` and jsdom). The dev store hook is guarded by `process.env.NODE_ENV === 'development'` and `typeof window !== 'undefined'`. Verify: `pnpm dev` serves the current game at `/`, `pnpm build` passes, `pnpm test` and `pnpm lint` green, `grep -rE "bootstrap|\.scss" src` empty. If `next build` rejects TypeScript 6, pin `typescript@~5.9` and matching `typescript-eslint`, and record it in `AGENTS.md`. Commit `Migrate to Next.js and Tailwind`.

### Task 13: Primitives, app shell and routes
Files: `src/components/primitives/*`, `AppShell.tsx`, `src/app/game/page.tsx`, `src/app/room/[code]/page.tsx`. Interfaces: pages are server components that render a `'use client'` screen component; navigation uses `useRouter().push('/game')` from `next/navigation`. Test: each primitive renders with the right `aria` attributes and activates by keyboard; `AppShell` renders the start screen at `/`. Commit `Add UI primitives and app shell`.

### Task 14: Start screen
Files: `StartScreen.tsx`. Interfaces: dispatches `configureSession({ players, matchTarget })` then `newGame({ variant, options: { cube } })` and navigates to `/game`; seat kinds `human` and `ai` (AI disabled with "coming soon" until Phase 4) and `online` (disabled until Phase 5). Test: choosing Backgammon, local, names "Niels"/"Guest", match 5 produces that session and a game in phase `opening`. Commit `Add start screen`.

### Task 15: Board geometry
Files: `boardGeometry.ts`. Interfaces: `VIEWBOX = { w: 1000, h: 720 }`; `pointPolygon(lane: 1..24): string`; `checkerCenter(lane: number, player: Player, index: number, total: number): { x: number; y: number }` with stack compression beyond 5; `barCenter(player, index)`, `offSlot(player, index)`; `laneAt(x, y): number | null` for drop targets. Tests: lanes 1–12 bottom, 13–24 top, 6 and 7 adjacent to the bar, `laneAt(checkerCenter(l))` round-trips for all lanes. Commit `Add board geometry`.

### Task 16: SVG board rendering
Files: `BoardSvg.tsx`, `Point.tsx`, `CheckerGlyph.tsx`, `BarTray.tsx`, `OffTray.tsx`. Interfaces: `BoardSvg({ checkers, highlights: number[], selected: number | null, onCheckerClick, onLaneClick, onDrop })`; checkers keyed by id with `transform` transitions (180 ms); `aria-label` per point. Tests: renders 30 checkers for the start position; a point with 6 checkers shows a count; highlights add `data-target`. Commit `Render the board as SVG`.

### Task 17: Board interaction
Files: `useBoardInteraction.ts`, wiring in `Game.tsx`. Interfaces: uses `moveInput.ts` for click modes; pointer-event drag: on pointer-down on an own checker with options, highlight targets; on pointer-up over a target lane (`laneAt`) dispatch `playStep`; otherwise snap back. Tests: click flow in both modes (ported from Task 9 tests through the DOM), drag from 13 to 9 with dice 4 plays the step, drag to an illegal lane does nothing. Commit `Add click and drag interaction`.

### Task 18: Dice tray and player cards
Files: `DiceTray.tsx`, `Die.tsx`, `PlayerCard.tsx`, `Cube.tsx`. Interfaces: `Die({ value, playable, selected, onSelect })` SVG pips; tray shows the roll animation when `game.state.roll` changes (400 ms, none under reduced motion); `PlayerCard({ player })` shows name, colour, pip count, score, cube ownership, "to move" state. Tests: tray renders four dice for a double; the unplayable die has `aria-disabled`; `PlayerCard` marks the player to act. Commit `Add dice tray and player cards`.

### Task 19: Action bar, cube and match flow, game-over dialog, toasts
Files: `ActionBar.tsx`, `GameOverDialog.tsx`, `Toast.tsx`, `sessionSlice.ts` (match over detection), `turnDriver.ts` (open the next game after rematch). Interfaces: ActionBar buttons Undo, Double (visible when `supportsCube`, enabled when `offerDouble` would be legal and `isCubeAllowed`), Resign, Menu; the cube offer shows a dialog to the opponent with Take / Drop; `GameOverDialog` shows result, points, score, "Next game" (until `matchTarget`), "New match", "Start screen". Toast replaces the Bootstrap alert and auto-hides info after 3 s. In cube games the turn driver must not auto-roll for a human seat: it waits for the player's Roll or Double choice (a Roll button in the action bar), because `offerDouble` is only legal in `awaiting-roll`; without a cube, or for AI seats, it keeps auto-rolling. `offerDouble` is also guarded by `selectCubeAllowed` (Crawford) in a listener so remote and bot dispatches are covered. Tests: a double offered at 1 becomes 2 owned by the taker; Crawford game hides Double; match ends at `matchTarget`; a human in a cube game sees a Roll button and no auto-roll. Commit `Add action bar, cube and match flow`.

### Task 20: Responsive pass and smoke test
Files: `globals.css`, component classes, `e2e/smoke.spec.ts`, `playwright.config.ts` (web server `pnpm dev`). Verify at 390×844 and 1400×900: no horizontal scroll, 16 px gutter, board width = viewport minus gutters, cards stacked. Smoke test: start a local game, make one move by click, one by drag, see the opponent's dice. Run `pnpm e2e`. Commit `Make the layout responsive and add a smoke test`.

### Task 21: Phase gate
Remove `src/components/Board.tsx`, `Lane.tsx`, `Checker.tsx`, `Dice.tsx`, `Players.tsx`, `GameState.tsx`, `PipCount.tsx`, `Notice.tsx` if any survived; update `AGENTS.md`; `pnpm lint && pnpm test && pnpm e2e && pnpm build`; PR `Redesign the UI`.

---

## Phase 3: Dutch Triktrak

Outcome: Triktrak selectable on the start screen and playable by two players on one device. The computer opponent (Phase 4) and online rooms (Phase 5) support both variants when they arrive.

### File structure (Phase 3)

| File | Responsibility |
|---|---|
| `src/engine/triktrak/index.ts` | the `triktrak` RulesEngine |
| `src/engine/triktrak/rolls.ts` | `expandRoll`, `isTricTrac`, `isDouble` |
| `src/engine/triktrak/entry.ts` | entering from off, `maxCheckersPerPoint`, `enterOnlyOnDoubles` |
| `src/engine/RulesEngine.ts`, `src/engine/backgammon/index.ts` | `explainRefusal` added to the interface |
| `src/tests/engine/triktrak.test.ts` | rule tests |

### Task 22: Rolls and ordered turns
`expandRoll([n, n]) → [n, n, 7−n, 7−n]`; `[1, 2]` or `[2, 1] → [1, 1, 2, 2, 5, 5, 6, 6]`; others `[high, low]`; `orderedDice: true` so Task 3's `legalTurns(…, ordered = true)` is reused. Tests: all three cases; `legalSteps` only offers `dice[0]`. Commit `Add Triktrak rolls`.

### Task 23: Entry from off and options
`initialCheckers()`: 15 per player on `BAR[player]`. Entry uses `targetLane` from the bar lane. `maxCheckersPerPoint` rejects a landing that would exceed it; `enterOnlyOnDoubles` blocks entry unless the roll is a double. Tests: start position pips = 15 × 25 per player; with `maxCheckersPerPoint: 2` a third checker cannot land; with `enterOnlyOnDoubles` a 5-3 cannot enter. Commit `Add Triktrak entry rules`.

### Task 24: Forfeits and re-rolls
`onRoll`: if `dice[0]` of a normal roll is unplayable → whole turn forfeited (`lastEvent: 'forfeit'`). `afterStep`: a blocked next die of a double or tric trac forfeits the remaining dice; when the sequence came from a double or tric trac and `rerolls < rerollLimit` (null = unlimited) and (`!rerollOnlyIfCompleted` or all dice were played) → same player, `phase: 'awaiting-roll'`, `rerolls + 1`, `lastEvent: 'reroll'`; else hand off with `rerolls: 0`. Tests: high die blocked → turn passes, low die not played; double with third step blocked → two steps played, no re-roll under `rerollOnlyIfCompleted`; completed double → re-roll; `rerollLimit: 1` stops the second re-roll. Commit `Add Triktrak forfeits and re-rolls`.

### Task 25: Final turn and draw
When the first mover bears off the last checker and `finalTurnForSecondPlayer` is true, the game continues with the second player for exactly one roll (`phase: 'awaiting-roll'`, `lastEvent: 'hand-off'`); if they also bear off everything the result is `{ winner: null, points: 0, kind: 'draw' }`, else the first mover wins 1 point. A win by the second mover ends the game at once. `supportsCube: false`, no gammons. Tests for all four outcomes. Commit `Add Triktrak final turn and draw`.

### Task 26: Wire into the app
`getEngine('triktrak')`; StartScreen variant card enabled with the options from spec 4.4 as advanced settings, and Computer/Online stay disabled for both variants until their phases; `selectNotice` shows `ROLL_AGAIN`, `TURN_FORFEITED`, `GAME_DRAWN`; `DiceTray` shows up to eight dice for a tric trac and marks the next die in ordered play; `BoardSvg` renders unentered checkers in the bar trays with a label "15 to enter". Add `explainRefusal(state, checkerId): MessageType | null` to `RulesEngine` (backgammon moves today's `rejectionFor` from `src/ui/moveInput.ts` into its engine), so refusals are explained per variant (Phase 1 review, deferred minor). Tests: a scripted two-player Triktrak game reaches `over`; refusal messages for a blocked highest die and a non-entered checker; property test from Task 6 parameterised over both engines; contrast test still green. Commit `Add Triktrak to the app`.

### Task 27: Phase gate
README rules section for Triktrak; e2e: start a Triktrak game and play the opening roll; `pnpm lint && pnpm test && pnpm e2e && pnpm build`; PR `Add Dutch Triktrak`.

---

## Phase 4: AI

Outcome: Easy, Medium and Hard opponents selectable on the start screen, computed in a Web Worker; Hard also decides the cube. The Red bot in `tools/` is removed. Both variants are supported.

### File structure (Phase 4)

| File | Responsibility |
|---|---|
| `src/ai/types.ts` | `Evaluator`, `Level = 'easy' \| 'medium' \| 'hard'`, `LevelConfig` |
| `src/ai/shots.ts` | `hitProbability(distance: number, blockedLanes: Set<number>): number` |
| `src/ai/features/backgammon.ts` | `evaluateBackgammon: Evaluator` |
| `src/ai/features/triktrak.ts` | `evaluateTriktrak: Evaluator` |
| `src/ai/search.ts` | `onePly`, `twoPly` |
| `src/ai/levels.ts` | `LEVELS: Record<Level, LevelConfig>` |
| `src/ai/bot.ts` | `chooseTurn(state, level, rng): Turn`, `decideCube(state, player): 'double' \| 'roll'`, `answerDouble(state, player): 'take' \| 'drop'` |
| `src/ai/worker.ts` | worker entry |
| `src/ai/client.ts` | `requestTurn(state, level, seed): Promise<Turn>` wrapper around the worker |
| `src/tests/ai/*.test.ts` | tests |

### Task 28: Shot table
`hitProbability(d, blocked)` = number of the 36 rolls that hit a blot at distance `d` given blocked intermediate lanes, / 36. Tests: distance 6 unblocked = 17/36; distance 12 unblocked = 3/36; distance 7 with lane 1 and 6 blocked... (table from standard backgammon references). Commit `Add shot probability table`.

### Task 29: Backgammon evaluator
`evaluateBackgammon(state, perspective)` = weighted sum: pip lead, −(blot × shot probability × 8), +points made (home 4, outer 3, other 1), +longest prime², +anchors in opponent home, −checkers on bar × 10, +checkers off × 2. Weights are constants in the file. Tests: hitting a blot scores higher than not; making the 5-point beats a blot on it; a closed board beats an open one. Commit `Add backgammon evaluator`.

### Task 30: Search
Triktrak note (Phase 3): a tric trac from a busy position has about 60,000 distinct final positions (`orderedLegalTurns` takes ~1 s), so the AI must not evaluate every turn there; search die by die with a beam over `orderedLegalSteps`. `onePly(state, evaluator): Array<{ turn: Turn; score: number }>` sorted descending over `legalTurns` deduplicated by resulting checker layout. `twoPly(state, evaluator, { topN: 8 })`: for the top N one-ply turns, average over the 21 rolls (weights 1/36 or 2/36) of the opponent's best one-ply score, negated. Before searching, make `legalTurns` cheap on doubles (Phase 1 review: a 15-blot 1-1 position yields 35,370 orderings): enumerate identical dice in non-increasing `from` order or dedupe by resulting position per depth, and let `applyStep`/`afterStep` reuse one `legalSteps` result. Tests: both return members of `legalTurns`; two-ply on a double from the start position finishes under 1.5 s in Node; a "safe vs. hit" test position where two-ply prefers safety when the return shot is high. Commit `Add one- and two-ply search`.

### Task 31: Levels, bot, determinism
`LEVELS`: easy `{ ply: 0 }`, medium `{ ply: 1, topK: 3, noise: 0.2 }`, hard `{ ply: 2, topN: 8 }`. `chooseTurn` uses `rng` for easy and for the medium noise. `decideCube`: hard only, maps the two-ply score through a logistic to a win probability; double ≥ 0.68, take ≥ 0.25. Tests: 500 random states per level return legal turns; same seed → same turn; easy differs from hard on a known position. Commit `Add AI levels and bot`.

### Task 32: Worker and driver integration
`worker.ts` receives `{ id, state, level, seed }` and posts `{ id, turn }`; `client.ts` wraps it in a promise; `turnDriver.ts` gains the AI listener (phase `moving` and seat `ai` → `requestTurn`, then `playStep` per step every `delays.aiStep` ms; `awaiting-roll` and seat `ai` with cube allowed → `decideCube` first; cube offered to an AI seat → `answerDouble`). Next.js bundles `new Worker(new URL('../ai/worker.ts', import.meta.url), { type: 'module' })` from a `'use client'` module; `client.ts` creates the worker lazily on first request so it never runs during server rendering. Tests: driver test with a fake `requestTurn`; StartScreen enables AI with a difficulty select. Verify by playing against each level in the browser. Commit `Play against the AI in a worker`.

### Task 33: Triktrak evaluator, remove the Red bot, phase gate
`evaluateTriktrak` = pip lead + 3 per made point in the opponent's path − 2 per remaining unentered checker; `bot.ts` picks the evaluator by `state.variant`; the cube policy is skipped when `supportsCube` is false. Tests: a Triktrak game vs. Easy reaches `over` in a scripted run; `chooseTurn` returns a member of `legalTurns` for random Triktrak states including an eight-die tric trac. Then delete `tools/backgammon-mcp`, the `backgammon` entry in `.mcp.json`, and the dev `window.__backgammonStore` hook if nothing else uses it (keep it while the e2e test uses it). Update `AGENTS.md`, `README.md`. PR `Add AI opponents`.

---

## Phase 5: Online play

Outcome: create a room, share `/room/CODE`, play with server-rolled dice and server-validated moves through Server Actions, reconnect, rematch. Vercel and Supabase deployment.

### File structure (Phase 5)

| File | Responsibility |
|---|---|
| `supabase/config.toml`, `supabase/migrations/0001_rooms.sql` | schema from spec 7.2, RLS policies, `apply_move` function, Realtime publication |
| `src/lib/supabase/server.ts` | `createServerClient` (`@supabase/ssr`, cookies) for the user's session; `createServiceClient()` with `SUPABASE_SERVICE_ROLE_KEY`; server only |
| `src/lib/supabase/browser.ts` | `createBrowserClient` for anonymous sign-in and Realtime |
| `src/server/rooms.ts`, `src/server/moves.ts`, `src/server/codes.ts` | room, move and code logic with the Supabase client injected |
| `src/app/actions/rooms.ts`, `src/app/actions/moves.ts` | Server Actions `createRoom`, `joinRoom`, `rematch`, `submitMove`: read the user, call `src/server`, return `{ ok: true, … } \| { ok: false, code }` |
| `src/tests/server/*.test.ts` | Vitest tests with a mocked service client |
| `src/net/transport.ts`, `supabaseTransport.ts`, `sync.ts`, `netSlice.ts`, `useRoom.ts` | client |
| `src/components/RoomLobby.tsx`, `JoinRoom.tsx` | UI |
| `.github/workflows/ci.yml` | lint, type-check, test, build on PRs |
| `.env.example` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |

### Task 34: Supabase project, schema and RLS
`supabase init`, migration with the three tables, `enable row level security`, policies: `select` on rooms/games/moves where `auth.uid() in (host, guest)`; no client write policies; `alter publication supabase_realtime add table moves`; Postgres function `apply_move(p_game_id uuid, p_seq int, p_actor uuid, p_kind text, p_payload jsonb, p_snapshot jsonb)` that inserts the move and updates `games.snapshot` and `games.version` in one transaction and raises `stale_version` when `games.version <> p_seq - 1`. Enable anonymous sign-in in `config.toml`. Test: with `supabase start`, an anonymous user can read their room and cannot insert into `moves`; `apply_move` with a stale seq raises (`supabase/tests/rls.sql`, run via `supabase test db`). Commit `Add Supabase schema and policies`.

### Task 35: Supabase clients and anonymous sign-in
`src/lib/supabase/server.ts` and `browser.ts` using `@supabase/ssr`; `useRoom.ts` calls `supabase.auth.signInAnonymously()` when no session exists, so the Server Actions see `auth.uid()` through the `@supabase/ssr` cookies. Test: a hook test that `useRoom` signs in once when no session exists and not when one does. Commit `Add Supabase clients`.

### Task 36: createRoom and joinRoom
Interfaces in `src/server/rooms.ts`: `createRoom(db, userId, { variant, options, matchTarget }): Promise<{ code }>`; `joinRoom(db, userId, { code, name }): Promise<{ roomId, gameId, seat }>`; join performs the opening roll with `crypto.getRandomValues` until no tie, inserts move `opening`, stores the snapshot, sets status `playing`. `src/server/codes.ts`: `generateCode(): string` over alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, length 6. Vitest with a mocked service client: code format; second join rejected with code `ROOM_FULL`; host joining own room rejected with `OWN_ROOM`. The Server Actions in `src/app/actions/rooms.ts` wrap these. Commit `Add room creation and joining`.

### Task 37: submitMove
Interface in `src/server/moves.ts`: `submitMove(db, userId, { gameId, kind, payload, version }): Promise<{ version }>`; rejects with `STALE_VERSION` on a stale version, with the `EngineError.code` on illegal moves, with `NOT_YOUR_TURN` when the user is not the actor. Kinds: `roll` (server generates the roll, ignores client payload), `step`, `undo`, `resign`, `double`, `accept`, `drop`. Runs `src/engine/game.ts` directly, then calls `apply_move` via `db.rpc`. Vitest: illegal step → `ILLEGAL_STEP`; roll by the wrong player → `NOT_YOUR_TURN`; stale version → `STALE_VERSION`; a full scripted game reaches `phase: 'over'`. The Server Action in `src/app/actions/moves.ts` wraps it. Commit `Validate moves on the server`.

### Task 38: Transport and sync on the client
`transport.ts`: `interface Transport { createRoom(opts): Promise<{ code }>; joinRoom(code, name): Promise<JoinResult>; submit(gameId, move): Promise<{ version }>; subscribe(gameId, onMove: (m: MoveRow) => void): () => void; presence(roomId, me): { onChange(cb): () => void } }`. `supabaseTransport.ts` calls the Server Actions for writes and uses the browser client for Realtime `postgres_changes` on `moves` and a presence channel. `sync.ts`: `applyIncoming(move)` applies by `seq`; on a gap, fetches `games.snapshot` and dispatches `loadSnapshot`. `netSlice.ts` as spec 5.1. Tests: a fake transport delivering moves out of order yields the same final state as in order; a gap triggers one snapshot reload. Commit `Add network transport and sync`.

### Task 39: Driver integration and lobby UI
`turnDriver.ts`: for a local seat in an online game, `awaiting-roll` → `transport.submit(roll)` instead of local dice; `playStep` by the local human → optimistic apply then `submit(step)`, rollback via `loadSnapshot` on `{ ok: false }`. `RoomLobby.tsx` shows the code and copy-link; `JoinRoom.tsx` is rendered by `src/app/room/[code]/page.tsx`; StartScreen enables **Online**. Presence dot in `PlayerCard`. Tests: component tests for lobby and join; driver test with fake transport. Manual verify with two browsers against `supabase start`. Commit `Play online through rooms`.

### Task 40: Reconnect and rematch
On load of `/room/[code]` with an existing anonymous session, fetch the room, the current game and moves after the stored version, resume. `rematch(db, userId, { roomId })` in `src/server/rooms.ts` creates the next game with carried scores and Crawford; Server Action `rematch`. Tests: reload mid-game restores the identical `GameState`; rematch increments `number` and keeps scores. Commit `Add reconnect and rematch`.

### Task 41: Deployment
Connect the GitHub repository to a Vercel project: production from `trunk`, preview per PR; set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` in Vercel. Create the Supabase project and run `npx supabase db push`. `ci.yml`: lint, `tsc --noEmit`, test, build on PRs. README section "Deploy". Verify: a push to `trunk` deploys and a room can be created on the live URL. Commit `Add CI and deployment notes`.

### Task 42: Phase gate
`submitMove` tests for a Triktrak roll and re-roll (same player rolls again, server-side); e2e: two Playwright contexts play one full turn each through a room against `next dev` and `supabase start`, once per variant. PR `Add online play`.

---

## Self-review notes

- Spec coverage: 4.1–4.6 → Tasks 1–6, 22–25; 5 → Tasks 7–8, 19; 6 → Tasks 28–32; 7 → Tasks 34–40; 8 → Tasks 12–20, 26; 9 → Task 41; 10 → spread across tasks, e2e in 20, 27 and 42; 11 → the phase order of this document.
- Names used across tasks: `legalTurns(checkers, player, dice, ordered)`, `legalSteps(...)`, `moveOne`, `targetLane`, `createGame`, `openingRoll`, `roll`, `play`, `undoStep`, `resign`, `loadSnapshot`, `selectLegalSteps`, `requestTurn`, `Transport`, `createRoom`, `joinRoom`, `submitMove`, `rematch`. Later phases must not rename these without updating this file.
- Phase order change on 2026-11-08: Triktrak moved from Phase 5 to Phase 3, AI to Phase 4, online play to Phase 5; tasks renumbered (Triktrak 22–27, AI 28–33, online 34–42). Triktrak AI and online coverage moved into the AI and online phases.
- Stack change on 2026-11-08: Next.js 16 on Vercel with Server Actions replaced Vite plus Supabase Edge Functions; Tailwind 4 replaced SCSS; SiteGround was dropped. Tasks 12, 13, 32 and 34 to 42 (current numbering) were rewritten accordingly.
- Deliberately open for the implementer: exact evaluator weights beyond the listed ones, animation easing, the SQL body of `apply_move` beyond its signature and failure condition.
