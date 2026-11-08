import type {
	Checker,
	GameResult,
	GameState,
	Player,
	Roll,
	Step,
	Turn,
	VariantId,
	VariantOptions,
} from './types';

/**
 * One implementation per variant. Everything is pure: same input, same
 * output; randomness is injected by the caller.
 */
export interface RulesEngine {
	readonly id: VariantId;
	readonly supportsCube: boolean;
	/** true: `dice[0]` must be played next. */
	readonly orderedDice: boolean;
	initialCheckers(): Checker[];
	/** The dice to play for a physical roll, in play order. */
	expandRoll( roll: Roll, options: VariantOptions ): number[];
	/** Every step playable right now, all constraints applied. */
	legalSteps( state: GameState ): Step[];
	/** Every complete turn from here (AI, validation). */
	legalTurns( state: GameState ): Turn[];
	/** Move and consume the die; no turn-end decisions. */
	applyStep( state: GameState, step: Step ): GameState;
	/** Continue, end the turn, re-roll, or end the game. */
	afterStep( state: GameState ): GameState;
	/** Set the dice; forfeit when nothing is playable. */
	onRoll( state: GameState, roll: Roll ): GameState;
	result( state: GameState ): GameResult | null;
	pipCount( state: GameState, player: Player ): number;
}
