/**
 * Shared builders for engine tests.
 */
import type { Checker, GameState, Player } from '../../engine/types';
import { DEFAULT_OPTIONS } from '../../engine/types';
import { PlayerType } from '../../types/PlayerType';

export const P1 = PlayerType.PLAYER_ONE;
export const P2 = PlayerType.PLAYER_TWO;

/**
 * Build a checker array from `{ player, lane, count }` specs. Ids run
 * 1..n in spec order so tests can refer to them deterministically.
 */
export const pos = (
	specs: Array< { player: Player; lane: number; count: number } >
): Checker[] => {
	const checkers: Checker[] = [];
	let id = 1;
	for ( const { player, lane, count } of specs ) {
		for ( let i = 0; i < count; i++ ) {
			checkers.push( { id: id++, player, lane } );
		}
	}
	return checkers;
};

/**
 * A backgammon game state in the `moving` phase with sensible defaults,
 * overridable field by field.
 */
export const stateWith = ( partial: Partial< GameState > ): GameState => ( {
	variant: 'backgammon',
	options: DEFAULT_OPTIONS,
	checkers: [],
	player: P1,
	firstMover: P1,
	phase: 'moving',
	roll: null,
	dice: [],
	turnSteps: [],
	rerolls: 0,
	waiting: { [ P1 ]: 0, [ P2 ]: 0 },
	cube: { value: 1, owner: null, offered: false },
	result: null,
	lastEvent: null,
	...partial,
} );
