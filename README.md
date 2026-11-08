# 🎲 React Backgammon

Backgammon in the browser, built with Next.js 16, React 19, Redux Toolkit and Tailwind 4. Dutch Triktrak, a computer opponent and online rooms are on the way (see `docs/superpowers/plans/`).

## Run it locally

```sh
nvm use                 # Node 22.14.0
pnpm install
pnpm dev                # http://localhost:5173
```

`pnpm test` runs the unit and component tests, `pnpm e2e` the browser smoke tests, `pnpm build` a production build.

## Basic rules

- The objective of the game is to move all of your pieces off the board before your opponent does.
- The game is played on a board with 24 triangular points, or "points," arranged in four quadrants.
- Each player starts with 15 pieces, or "checkers," of their own color, on the board in specific starting positions.
- Players take turns rolling two dice and moving their pieces according to the numbers rolled. The numbers on the dice must be used together, and a piece can only be moved to an open point.
- A player can move a piece to a point occupied by one of their own pieces, called a "blot," which can then be hit by an opponent's piece. If a player's blot is hit, the piece is placed on the bar and must re-enter the board on the opponent's home board before continuing to move.
- If a player rolls doubles, they can move four times the number rolled for each piece.
- A player can "bear off," or remove, their pieces from the board once they have moved all of their pieces to their home board.
- If a player cannot make a legal move, they forfeit their turn.
- The game can be played with a doubling cube, which allows a player to increase the stakes of the game by offering to double the current stakes.
- The first player to bear off all of their pieces wins the game, and the value of the stakes is awarded to the winner.

## Additional rules

- **Compulsory use of both dice**: If both dice can be played in some order, the player must play both. If only one of the two can be played, it must be the higher.
- **Bar precedence**: A player with a checker on the bar must re-enter it before making any other move. Re-entry uses the opponent's home board (die N → opponent's N-point).
- **Stacking**: A player can stack any number of their own checkers on a single point — there is no maximum.
- **Bearing off** is allowed only when all 15 of the player's checkers are in their home board (no checker on the bar). Exact rolls bear off from point N; overshoot rolls bear off from the highest occupied point only when no checker exists on a higher point.
- **Hit during bear-off** sends the checker to the bar; the player must re-enter and bring it back into the home board before resuming bear-off.
- **Win values**: 1 point for a single, 2 for a gammon (loser borne off zero), 3 for a backgammon (loser borne off zero AND has a checker on the bar OR in the winner's home board), all multiplied by the doubling cube's value.
- **Doubling cube**: Either player may offer to double when they own the cube or it's centered. The opponent accepts (cube doubles, ownership transfers) or drops (forfeits the current pre-double stake).
- **Match play**: Games accumulate to a target score (default 1; configurable to e.g. 5, 7, 11). The Crawford rule suppresses doubling in the game directly after either player first reaches `target − 1`; doubling resumes thereafter.
- **No legal moves**: If no playable dice sequence exists, the turn is forfeited.

## Dutch Triktrak

Pick **Triktrak** on the start screen. It is played on the same board with these rules:

- **Start:** all fifteen checkers of each player start off the board and enter by die value into the opponent's home board, like a checker coming off the bar.
- **Entering:** while any checker is still off the board (not yet entered, or hit), checkers in your first quarter cannot move, and a hit checker must enter before any checker on the board moves. In practice, all fifteen checkers come in first.
- **Quarter gates:** a checker may only move into your home board (the fourth quarter) once your first quarter is empty and all checkers are on the board.
- **Dice order:** the dice are played in a fixed order. A normal roll plays the lower die first. A double n-n plays n, n, 7−n, 7−n. The roll 1-2, the "tric trac", plays 1, 1, 2, 2, 5, 5, 6, 6.
- **Blocked dice:** if the lower die of a normal roll cannot be played, the whole turn passes. A blocked die in a fixed sequence forfeits the rest of it.
- **Bonus rolls:** a double or a tric trac played in full earns another roll.
- **End of the game:** when the player who started bears off the last checker, the other player gets one final roll. If they also finish, the game is a draw. There is no doubling cube and no gammon; a win is worth one point.
- **Options** on the start screen: bonus rolls per turn, a limit of checkers per point, bonus roll only when all dice were played, enter only on doubles (a tric trac counts as a double), and the final turn for the second player.

- **Home board:** checkers in your home board cannot move within it; they can only bear off, and only with the exact number. A lone checker on field 1 leaves with any roll containing a 1; a lone checker on field 3 with 3/3, 3/4, 3/5 or 3/6; a lone checker on field 6 only with 6-6.

## Initial position

![initial-position](https://user-images.githubusercontent.com/3323310/131032082-7167a1de-bf4d-4b20-a94e-88b677642aa5.png)

## Architecture

- **Engine** (`src/engine`): every rule, as pure TypeScript. `RulesEngine` is the per-variant interface (`backgammon` today); `game.ts` is the shared state machine (opening roll, roll, play, undo, resign, doubling cube, snapshot). A `GameState` is plain JSON and is the format for saving and for online play.
- **Store** (`src/data`): Redux Toolkit slices. `game` holds the engine state and the last error code, `session` the seats, match target and score, `ui` the input mode, die selection and move preview. Reducers call the engine and never decide rules themselves.
- **Turn driver** (`src/runtime/turnDriver.ts`): listener middleware that performs the opening roll, rolls for the player to act after a short pause, and reports a finished game to the session. Dice come from an injectable RNG.
- **Input** (`src/ui/moveInput.ts`, `src/components/board/useBoardInteraction.ts`): turns clicks and drags into `playStep` dispatches using the engine's legal steps, in beginner mode (checker, then highlighted point) or advanced mode (die, then checker).
- **UI** (`src/app`, `src/components`): start screen, SVG board, dice tray, player cards, action bar with Roll and Double, cube and game-over dialogs. Design tokens and light/dark themes live in `src/styles/globals.css`.

### Game actions

`newGame`, `openingRoll`, `roll`, `playStep`, `undoStep`, `resign`, `offerDouble`, `acceptDouble`, `dropDouble`, `loadSnapshot` on the `game` slice; `configureSession`, `gameEnded`, `nextGame` on the `session` slice; `setMode`, `selectDie`, `setPreview`, `setHint`, `setTheme` on the `ui` slice.

In development the store is exposed as `window.__backgammonStore` so tools can load positions with `game/loadSnapshot`.
