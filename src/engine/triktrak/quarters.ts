/**
 * Triktrak quarter gates. Seen from each player, the first quarter is where
 * checkers enter (the opponent's home board), the fourth is the own home
 * board.
 *  - Checkers in the first quarter may not move at all while any checker
 *    of that player is still out of the game (on the bar).
 *  - No checker may move into the home board until the first quarter is
 *    empty and every checker is in the game.
 */
import { countOn } from '../backgammon/movement';
import { BAR, isOnBoard } from '../constants';
import type { Checker, Player } from '../types';
import { PlayerType } from '../../types/PlayerType';

/** 1 = entry quarter … 4 = home board, for board lanes 1–24. */
export const quarterOf = ( player: Player, lane: number ): number => {
	const steps = player === PlayerType.PLAYER_ONE ? 24 - lane : lane - 1; // 0 at the entry edge
	return Math.floor( steps / 6 ) + 1;
};

export type GateRefusal = 'all-in-first' | 'first-quarter-not-empty' | null;

/** Why moving from `from` to the board lane `to` is not allowed yet, if it isn't. */
export const quarterGate = ( checkers: Checker[], player: Player, from: number, to: number ): GateRefusal => {
	if ( ! isOnBoard( to ) ) return null;
	const anyOut = countOn( checkers, BAR[ player ], player ) > 0;
	const fromQuarter = isOnBoard( from ) ? quarterOf( player, from ) : 1;
	const toQuarter = quarterOf( player, to );
	if ( anyOut && isOnBoard( from ) && fromQuarter === 1 ) return 'all-in-first';
	if ( toQuarter === 4 && fromQuarter !== 4 ) {
		const firstOccupied = checkers.some(
			( c ) => c.player === player && isOnBoard( c.lane ) && quarterOf( player, c.lane ) === 1
		);
		if ( anyOut ) return 'all-in-first';
		if ( firstOccupied ) return 'first-quarter-not-empty';
	}
	return null;
};
