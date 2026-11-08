/**
 * Engine types. Everything here is JSON-serialisable: no classes, no
 * functions, no `undefined` inside arrays.
 *
 * Lane conventions (unchanged from the original app):
 *   1–24  board points
 *   0     PLAYER_ONE's bar and PLAYER_TWO's off tray
 *   25    PLAYER_TWO's bar and PLAYER_ONE's off tray
 * PLAYER_ONE moves 24 → 1, PLAYER_TWO moves 1 → 24.
 */
import { PlayerType } from '../types/PlayerType';

export type Player = PlayerType;

export type Checker = { id: number; player: Player; lane: number };

export type Roll = [ number, number ];

export type Step = {
	checkerId: number;
	from: number;
	to: number;
	die: number;
	hit: boolean;
};

export type Turn = Step[];

export type Phase = 'idle' | 'opening' | 'awaiting-roll' | 'moving' | 'over';

export type ResultKind =
	| 'single'
	| 'gammon'
	| 'backgammon'
	| 'draw'
	| 'resign'
	| 'drop';

export type GameResult = {
	winner: Player | null;
	points: number;
	kind: ResultKind;
};

export type CubeState = {
	value: number;
	owner: Player | null;
	offered: boolean;
};

export type VariantId = 'backgammon' | 'triktrak';

export type GameEvent =
	| 'hit'
	| 'hand-off'
	| 'forfeit'
	| 'reroll'
	| 'game-over'
	| 'undo'
	| 'final-turn';

export type VariantOptions = {
	/** Backgammon: doubling cube in play. */
	cube: boolean;
	/** Triktrak: maximum re-rolls per turn, null = unlimited. */
	rerollLimit: number | null;
	/** Triktrak: re-roll only when the whole sequence was played. */
	rerollOnlyIfCompleted: boolean;
	/** Triktrak: checkers may only enter on doubles. */
	enterOnlyOnDoubles: boolean;
	/** Triktrak: maximum checkers on one point, null = unlimited. */
	maxCheckersPerPoint: number | null;
	/** Triktrak: the second player gets a final turn to equalise. */
	finalTurnForSecondPlayer: boolean;
};

export const DEFAULT_OPTIONS: VariantOptions = {
	cube: true,
	rerollLimit: null,
	rerollOnlyIfCompleted: true,
	enterOnlyOnDoubles: false,
	maxCheckersPerPoint: null,
	finalTurnForSecondPlayer: true,
};

export type GameState = {
	variant: VariantId;
	options: VariantOptions;
	checkers: Checker[];
	/** Player to act. */
	player: Player | null;
	/** Who won the opening roll (Triktrak final-turn rule). */
	firstMover: Player | null;
	phase: Phase;
	/** Physical roll of the current turn. */
	roll: Roll | null;
	/** Dice still to play, in play order. */
	dice: number[];
	/** Steps played this turn, for undo. */
	turnSteps: Step[];
	/** Triktrak: re-rolls taken this turn. */
	rerolls: number;
	cube: CubeState;
	result: GameResult | null;
	/** What the last transition did, for notices and sounds. */
	lastEvent: GameEvent | null;
};
