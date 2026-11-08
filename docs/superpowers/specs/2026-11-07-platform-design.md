# React Backgammon platform design

Date: 2026-11-07
Status: draft for review

## 1. Goals

Turn the single-board backgammon app into a small game platform:

1. Play **Backgammon** and **Dutch Triktrak** on the same board, selected at game start.
2. Play **against an in-app AI** with a selectable difficulty.
3. Play **online against a friend** by creating a room and sharing a link.
4. **Host** on Vercel with Supabase as the backend.
5. Replace the Bootstrap debug layout with a **designed, responsive UI**.

Non-goals for this iteration: user accounts with passwords, rankings, chat, spectators, tournaments, a neural-network evaluator (kept possible, not built), French Trictrac.

## 2. Decisions already taken

Agreed with the owner on 2026-11-07:

- Tric Trac means the **Dutch Triktrak** rules listed in section 5.3.
- Stack agreed on 2026-11-08: **Next.js 16** (App Router, Server Actions) on **Vercel**, **Supabase** (Postgres, anonymous Auth, Realtime, RLS), **Tailwind 4**. SiteGround is not used for this game.
- Server-side game logic for online play (dice, move validation) runs in **Server Actions** on Vercel, not in Supabase Edge Functions. The engine is imported there as plain TypeScript.
- AI target is a **two-ply heuristic engine** with three levels. The evaluator is an interface so a neural network can be added later.
- Build order: engine → UI shell (including the Next.js migration) → Triktrak → AI → online (Triktrak moved ahead of the AI and online play on 2026-11-08). The AI and online play each cover both variants when they arrive.

## 3. Architecture

```text
┌──────────────────── browser (Next.js client components) ────────────────────┐
│  components/ (React, variant-agnostic)                                      │
│       │ dispatch / select                                                   │
│  data/ (Redux store: game | session | ui | net)                             │
│       │ listener middleware                                                 │
│  runtime/turnDriver.ts ──► ai/worker.ts (Web Worker) ─► ai/bot.ts ─► engine │
│       └─► net/ (calls Server Actions, subscribes to Supabase Realtime)      │
│  engine/ (pure rules, no React/Redux/DOM)                                   │
└───────────────┬──────────────────────────────────────────────▲──────────────┘
                │ Server Actions (Next.js on Vercel)             │ Realtime
                ▼                                                │
   src/app/actions/*.ts ─► src/server/*.ts ─► engine ─► Supabase Postgres
                      (same TypeScript, no bundle)        (rooms, games, moves)
```

Rules of the architecture:

- `src/engine` is pure TypeScript with no imports from React, Redux, the DOM or Node. Same input, same output. Randomness is always injected.
- Everything that decides *what is legal* lives in the engine. Redux reducers call the engine; components never compute rules.
- The AI worker and the Server Actions import the engine unchanged. There is exactly one copy of the rules.
- `src/app` holds only Next.js routes, layouts and Server Actions. The Redux store, the worker and the board render only inside `'use client'` components. Server-only code (`src/server`, `src/lib/supabase/server.ts`) never imports client modules.
- Side effects (random dice, timers, network) live in the turn driver and the net layer, never in reducers or the engine.

## 4. Engine

### 4.1 Types

```ts
// src/engine/types.ts
export type Player = PlayerType;                       // existing enum, PLAYER_ONE moves 24→1, PLAYER_TWO 1→24
export type Checker = { id: number; player: Player; lane: number };
//   lane conventions are kept: 1–24 board points, 0 = P1 bar and P2 off, 25 = P2 bar and P1 off
export type Roll = [ number, number ];
export type Step = { checkerId: number; from: number; to: number; die: number; hit: boolean };
export type Turn = Step[];
export type Phase = 'idle' | 'opening' | 'awaiting-roll' | 'moving' | 'over';
export type ResultKind = 'single' | 'gammon' | 'backgammon' | 'draw' | 'resign' | 'drop';
export type GameResult = { winner: Player | null; points: number; kind: ResultKind };
export type CubeState = { value: number; owner: Player | null; offered: boolean };
export type VariantId = 'backgammon' | 'triktrak';

export type GameState = {
    variant: VariantId;
    options: VariantOptions;      // see 4.4
    checkers: Checker[];
    player: Player | null;        // player to act
    firstMover: Player | null;    // who won the opening roll (Triktrak final-turn rule)
    phase: Phase;
    roll: Roll | null;            // physical roll of the current turn
    dice: number[];               // dice still to play, in play order
    turnSteps: Step[];            // steps played this turn, for undo
    rerolls: number;              // Triktrak: re-rolls taken this turn
    cube: CubeState;
    result: GameResult | null;
    lastEvent: GameEvent | null;  // what the last transition did, for notices and sounds
};
export type GameEvent = 'hit' | 'hand-off' | 'forfeit' | 'reroll' | 'game-over' | 'undo';
```

`GameState` is JSON-serialisable. It is the snapshot stored online and the message passed to the AI worker.

### 4.2 The RulesEngine interface

```ts
// src/engine/RulesEngine.ts
export interface RulesEngine {
    readonly id: VariantId;
    readonly supportsCube: boolean;
    readonly orderedDice: boolean;                  // true: dice[0] must be played next
    initialCheckers(): Checker[];
    expandRoll( roll: Roll, options: VariantOptions ): number[];
    legalSteps( state: GameState ): Step[];         // every step playable right now, all constraints applied
    legalTurns( state: GameState ): Turn[];         // every complete turn from here (AI, validation)
    applyStep( state: GameState, step: Step ): GameState;   // move + consume die; no turn-end decisions
    afterStep( state: GameState ): GameState;       // continue | end turn | re-roll | game over
    onRoll( state: GameState, roll: Roll ): GameState;      // set dice; forfeit if nothing is playable
    result( state: GameState ): GameResult | null;
    pipCount( state: GameState, player: Player ): number;
}
```

`legalSteps` is derived from `legalTurns`: a step is legal if it starts a turn of maximal dice usage. This single definition replaces today's `validateDiceUse`, `resolveMove` max-dice check and the bot's `enumerate`. The larger-die rule falls out of the same filter.

### 4.3 Shared game functions

`src/engine/game.ts` wraps an engine with the state machine every variant shares:

| Function | Effect |
|---|---|
| `createGame(variant, options)` | phase `opening`, checkers from `initialCheckers()` |
| `openingRoll(state, p1Die, p2Die)` | tie → stay in `opening`; else player = higher, `firstMover` set, dice = `expandRoll` of both dice, phase `moving` (Backgammon) |
| `roll(state, roll)` | only in `awaiting-roll`; delegates to `onRoll` |
| `play(state, step)` | only in `moving` and step ∈ `legalSteps`; `applyStep` then `afterStep` |
| `undoStep(state)` | pops `turnSteps`, restores dice; only within the current turn |
| `resign(state, player)` | result for the opponent, points = cube value |
| `offerDouble / acceptDouble / dropDouble` | existing reducer logic moved here, guarded by `supportsCube` |
| `snapshot / restore` | identity on `GameState`, documented as the online wire format |

Every function throws `EngineError` with a `code` (`WRONG_PHASE`, `NOT_YOUR_TURN`, `ILLEGAL_STEP`, `NOTHING_TO_UNDO`, `CUBE_NOT_ALLOWED`, `INVALID_POSITION`) on an illegal call. The Redux layer stores the code as `game.lastError` and derives the notice from it; the Server Action returns it as `{ ok: false, code }`.

### 4.4 Variant options

```ts
export type VariantOptions = {
    // Backgammon
    cube: boolean;                // default true
    // Triktrak
    rerollLimit: number | null;   // default null = unlimited
    rerollOnlyIfCompleted: boolean; // default true
    enterOnlyOnDoubles: boolean;  // default false
    maxCheckersPerPoint: number | null;  // default null
    finalTurnForSecondPlayer: boolean; // default true
};
```

### 4.5 Backgammon engine

`src/engine/backgammon/` receives the current logic, moved not rewritten:

| Today | Engine |
|---|---|
| `getTargetLane`, `tryMove`, `applyMove` (helpers and bot) | `movement.ts` |
| `findPlayableDiceSequence`, `validateDiceUse`, `canUseDie` | `turns.ts` (`legalTurns`, `legalSteps`) |
| `wouldClearOffChecker`, `hasCheckersOutsideHomeBoard` | `bearOff.ts` |
| `hasPlayerWon`, `getWinType` | `result.ts` |
| `calculatePipCount` | `pips.ts` |
| `handOffTurn`, `checkAndHandleNoValidMoves`, `updateGame` | `afterStep` / `onRoll` in `index.ts`, no dispatch |

Behaviour is unchanged. The existing integration tests are ported to call the engine and must stay green.

### 4.6 Triktrak engine (Dutch rules)

`src/engine/triktrak/` implements, as agreed on 2026-09-29:

- All 15 checkers start off the board. They are modelled on the bar lanes (P1 lane 0, P2 lane 25), so entering reuses the bar-entry movement by die value into the opponent's home board.
- `expandRoll`: doubles `n,n` play as `[n, n, 7−n, 7−n]`; the roll 1+2 ("tric trac") plays as `[1, 1, 2, 2, 5, 5, 6, 6]`; any other roll plays `[high, low]`.
- `orderedDice = true`: the next die is always `dice[0]`.
- Highest die first or the turn passes: if `dice[0]` of a normal roll has no legal step, the whole turn is forfeited.
- A blocked step in a fixed sequence (doubles, tric trac) forfeits the remaining steps of that sequence.
- Re-roll after doubles or tric trac: `afterStep` returns to `awaiting-roll` for the **same** player when the sequence is finished (`rerollOnlyIfCompleted`) and `rerollLimit` is not reached.
- Bear-off and blocking rules as in Backgammon; `maxCheckersPerPoint` limits a point when set; `enterOnlyOnDoubles` restricts entry when set.
- `finalTurnForSecondPlayer`: when the first mover bears off the last checker, the second player gets one more turn; if they also finish, the result is a `draw` with 0 points.
- No cube, no gammons: every win is 1 point.

Assumptions carried from September and now confirmed: entry by die value into the opponent's home board; both finishing on the final turn is a draw; tric trac ignores highest-die-first because its order is fixed.

## 5. Application state and turn driver

### 5.1 Redux state shape (breaking change in `src/types/StateType.ts`)

```ts
type Seat =
    | { kind: 'human'; name: string }
    | { kind: 'ai'; name: string; level: 'easy' | 'medium' | 'hard' }
    | { kind: 'remote'; name: string };

type RootState = {
    game: { state: GameState; lastError: EngineErrorCode | null };   // engine state; a rejected action sets lastError and leaves state untouched
    session: {
        players: Record< Player, Seat >;
        matchTarget: number;
        scores: Record< Player, number >;
        crawfordPlayed: boolean;
        gameNumber: number;
    };
    ui: {
        mode: 'beginner' | 'advanced';
        selectedDie: number | null;
        preview: { checkerId: number; options: Step[] } | null;
        notice: NoticeType;
        theme: 'light' | 'dark' | 'system';
    };
    net: null | {
        roomCode: string;
        role: 'host' | 'guest';
        status: 'waiting' | 'playing' | 'finished' | 'disconnected';
        opponentOnline: boolean;
        version: number;
    };
};
```

Actions: `NEW_GAME`, `OPENING_ROLL`, `ROLL`, `PLAY_STEP`, `UNDO_STEP`, `RESIGN`, `OFFER_DOUBLE`, `ACCEPT_DOUBLE`, `DROP_DOUBLE`, `LOAD_SNAPSHOT`, `REMATCH`, plus UI actions. The reducer for `game` is `(state, action) => engine.game.fn(state, …)` with errors mapped to notices. `crawfordPlayed` is set when a game ends with a player on match point minus one, fixing the open bug.

### 5.2 Turn driver

`src/runtime/turnDriver.ts` is a Redux Toolkit listener middleware. It is the only place that produces dice or asks the AI:

- phase `opening` and no remote seat → dispatch `OPENING_ROLL` with injected RNG (re-dispatch on tie).
- phase `awaiting-roll` and the seat to act is local (human or AI) → after a short delay dispatch `ROLL`.
- phase `moving` and the seat is `ai` → send `GameState` and level to the worker, receive a `Turn`, dispatch `PLAY_STEP` per step with an animation delay.
- any seat `remote` → do nothing; `src/net` dispatches what the server sends.

The RNG is `src/runtime/rng.ts` with a seedable implementation for tests.

## 6. AI

```
src/ai/
  types.ts         Evaluator = (state: GameState, perspective: Player) => number
  shots.ts         hit-probability table for distances 1–24 (direct and combination shots, /36)
  features/backgammon.ts   pip race, blots × shot probability, points made, longest prime,
                           home-board points, anchors, checkers on bar, checkers borne off
  features/triktrak.ts     race, blocking points, entry progress
  search.ts        onePly(state, evaluator) and twoPly(state, evaluator)
  levels.ts        easy = random legal turn; medium = one ply; hard = two ply with top-N pruning
  bot.ts           chooseTurn(state, level, rng): Turn  — always a member of legalTurns
  cube.ts          hard only: double when estimated win probability > 0.68, take when > 0.25
  worker.ts        Web Worker entry; request { state, level, seed } → response Turn
```

Two-ply = for each candidate turn, apply it, then average over the 21 distinct opponent rolls (weighted 1/36 or 2/36) the opponent's best one-ply reply. Cost control: deduplicate candidate turns by resulting position, prune to the best 8 after one ply, and keep the evaluation allocation-free. The worker keeps the UI responsive.

Difficulty is a property of the search depth and a noise setting: medium picks uniformly among the top 3 with probability 0.2; hard never does. The Red bot in `tools/backgammon-mcp` is removed once the in-app AI exists.

## 7. Online play

### 7.1 Room flow

1. Host picks variant, options and match length, clicks **Create room**. Gets a 6-character code (alphabet without 0/O/1/I) and a link `/room/CODE`.
2. Guest opens the link, enters a display name, joins. The server assigns host = Blue, guest = Red, and performs the opening roll.
3. Each turn: the server rolls (`roll` move) when the player to act asks for it; each step is submitted and validated server-side; both clients receive moves through Realtime and apply them with the engine.
4. Undo is allowed for own steps within the turn. Resign, cube and rematch are moves too.
5. Reconnect: the client loads the snapshot and replays moves after its last known `version`. Presence shows whether the opponent is online.

Routes are Next.js App Router pages: `/` (start), `/game`, `/room/[code]`.

### 7.2 Supabase schema

```sql
create table rooms (
    id uuid primary key default gen_random_uuid(),
    code text unique not null,
    variant text not null,
    options jsonb not null,
    match_target int not null default 1,
    host uuid not null references auth.users,
    guest uuid references auth.users,
    status text not null default 'waiting',   -- waiting | playing | finished | abandoned
    created_at timestamptz default now()
);
create table games (
    id uuid primary key default gen_random_uuid(),
    room_id uuid not null references rooms,
    number int not null,
    snapshot jsonb not null,                   -- GameState
    version int not null default 0,
    scores jsonb not null default '{"PLAYER_ONE":0,"PLAYER_TWO":0}',
    updated_at timestamptz default now()
);
create table moves (
    id bigserial primary key,
    game_id uuid not null references games,
    seq int not null,
    actor uuid,                                -- null = server (rolls)
    kind text not null,                        -- opening | roll | step | undo | resign | double | accept | drop | rematch
    payload jsonb not null,
    created_at timestamptz default now(),
    unique (game_id, seq)
);
```

Auth: Supabase anonymous sign-in, session kept in cookies through `@supabase/ssr` so both the browser and the Server Actions see the same user. Row-level security: a user may `select` rooms, games and moves of rooms where they are host or guest; nobody may `insert` or `update` from the client. All writes go through Server Actions with the service-role client.

### 7.3 Server Actions

All writes go through Next.js Server Actions running on Vercel. An action reads the user's anonymous session from cookies (`@supabase/ssr`) and writes with the service-role client, so the client needs no write policies. The logic lives in `src/server/*.ts` with the Supabase client injected, and the actions in `src/app/actions/*.ts` are thin wrappers.

| Action | Does |
|---|---|
| `createRoom` | inserts room, returns code |
| `joinRoom` | sets guest, creates game 1, performs opening roll, status `playing` |
| `submitMove` | loads snapshot, checks it is the actor's turn, validates with the engine (`roll` is generated server-side, `step` must be in `legalSteps`), appends the move, stores the new snapshot and `version + 1` |
| `rematch` | creates the next game, carries scores, applies Crawford |

The actions import `src/engine` directly; there is no separate bundle. A move is persisted by the Postgres function `apply_move`, which inserts the move row and updates the game's snapshot and version in one transaction and fails on a stale version. The `moves` table is part of the `supabase_realtime` publication so clients receive inserts.

### 7.4 Client

```text
src/lib/supabase/server.ts    createServerClient (cookies) and createServiceClient (SUPABASE_SERVICE_ROLE_KEY); server only
src/lib/supabase/browser.ts   createBrowserClient from NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
src/net/transport.ts          interface Transport { createRoom, joinRoom, submit(move), subscribe(gameId, onMove), presence }
src/net/supabaseTransport.ts  writes through the Server Actions; Realtime and presence through the browser client
src/net/sync.ts               applies incoming moves in seq order, detects gaps, reloads snapshot
src/net/netSlice.ts           the `net` part of the store
```

The `Transport` interface keeps the door open for Cloudflare Durable Objects without touching the rest of the app.

## 8. UI

### 8.1 Screens

- **Start**: variant cards (Backgammon, Triktrak), opponent (Local, AI with difficulty, Online), names, match length, cube on/off; secondary: "Join with code".
- **Room lobby**: code, copy link, waiting indicator, cancel.
- **Game**: board centred, opponent card above, own card below (name, colour, pips, cube, online dot), dice tray in the player's half, action bar (undo, offer double, resign, menu), toasts for notices.
- **Game over** dialog: result, points, match score, rematch / new game / back to start.

### 8.2 Board

`BoardSvg` renders an SVG with `viewBox="0 0 1000 720"`. `src/ui/boardGeometry.ts` computes point polygons, checker centres, bar and off trays in viewBox units. Checkers are `<g transform>` elements keyed by checker id; moving a checker is a CSS transition on `transform` (180 ms ease-out), a hit sends the checker to the bar with the same transition. Dice are SVG with drawn pips and a 400 ms roll animation. `prefers-reduced-motion` disables all motion. Stacks beyond 5 show a count, as today.

Interaction keeps the two modes and adds drag and drop with pointer events; legal targets light up on pick-up; the die to be used shows on hover. Points carry `aria-label`s ("Point 13, five blue checkers") and the action bar is keyboard operable.

### 8.3 Visual system

`src/styles/globals.css` defines the design tokens in a Tailwind 4 `@theme` block: colour (felt green or walnut board, cream and slate checkers, amber highlight), radii, shadows, a type scale and spacing. Light and dark themes via `data-theme` and `prefers-color-scheme`. Bootstrap, react-bootstrap and SCSS are removed; buttons, dialog, switch and toast are small own components styled with Tailwind utilities.

Responsive: the SVG scales to the container width; cards stack on narrow screens; the layout works at 390 px with a 16 px gutter and no horizontal scroll. A vertical board for phones is a follow-up.

### 8.4 Removed

The debug headings, the "Toggle current player" button, the dead Roll button, the Scoreboard stub.

## 9. Hosting and deployment

- App and Server Actions: Next.js 16 on Vercel, connected to the GitHub repository. Production deploys from `trunk`, preview deployments per PR.
- Backend: Supabase project (free tier). `supabase db push` for migrations in `supabase/migrations/`. Local development with `supabase start`.
- Secrets: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public), `SUPABASE_SERVICE_ROLE_KEY` (server only), set in Vercel and in `.env.local`.
- CI: GitHub Actions runs lint, type-check, test and build on every PR. Deployment itself is Vercel's git integration.
- SiteGround is not used for this game.

## 10. Testing

- Engine: ported integration tests plus property tests with `fast-check`: for random positions and rolls, every `legalSteps` entry starts a maximal turn; `legalTurns` never includes an illegal step; Triktrak sequences honour order and forfeits.
- AI: `chooseTurn` returns a member of `legalTurns` for many random states; results are deterministic for a seed; two-ply finishes a doubles position under 1.5 s in Node.
- Store and turn driver: fake timers, seeded RNG, AI stubbed.
- Server logic: Vitest tests of `src/server/*` with a mocked Supabase client; one integration run against `supabase start` in CI (optional job).
- UI: Vitest + Testing Library for the start screen, board interaction (click and drag), dialog; Playwright smoke test that plays one turn against the easy AI.

## 11. Phases

| Phase | Delivers | User-visible |
|---|---|---|
| 1 Engine | `src/engine` with Backgammon, new state shape, turn driver, bot uses engine | none, behaviour identical |
| 2 UI | Next.js 16 and Tailwind 4 migration, start screen, SVG board, cards, dice, cube and match UI, responsive | new look, local two-player |
| 3 Triktrak | second engine, variant picker wired, per-variant refusal messages | second game, two players on one device |
| 4 AI | levels easy/medium/hard for both variants, worker, cube policy (backgammon) | play solo |
| 5 Online | Supabase schema, Server Actions, transport, lobby, reconnect, Vercel and Supabase deployment, both variants | rooms and links |
| 6 Follow-ups | neural evaluator, vertical phone board, move history and replay | optional |

## 12. Risks

- Two-ply search on doubles may exceed the time budget; mitigations are listed in section 6 and a hard cap of 2 s falls back to one ply.
- Supabase Realtime delivery is at-least-once and unordered; `sync.ts` must apply by `seq` and ignore duplicates.
- Anonymous auth sessions are lost when the browser clears storage; the room code plus a stored player token in the room row allow rejoining.
- The state-shape change touches every test; Phase 1 budgets time to port them rather than keep adapters.
- Next.js 16 may reject TypeScript 6 at build time; the fallback is TypeScript 5.9.
- The store, the worker and the board are client-only; rendering them outside `'use client'` components causes hydration errors.
