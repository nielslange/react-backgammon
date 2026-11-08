/**
 * Who has won and how much it is worth.
 */
import { PlayerType } from '../../types/PlayerType';
import { BAR, HOME, OFF, opponent } from '../constants';
import type { Checker, GameResult, Player } from '../types';

const POINTS = { single: 1, gammon: 2, backgammon: 3 } as const;

const allOff = ( checkers: Checker[], player: Player ): boolean => {
	const own = checkers.filter( ( c ) => c.player === player );
	return own.length > 0 && own.every( ( c ) => c.lane === OFF[ player ] );
};

/** The player with all checkers borne off, if any. */
export const winner = ( checkers: Checker[] ): Player | null => {
	if ( allOff( checkers, PlayerType.PLAYER_ONE ) ) return PlayerType.PLAYER_ONE;
	if ( allOff( checkers, PlayerType.PLAYER_TWO ) ) return PlayerType.PLAYER_TWO;
	return null;
};

/**
 *  - single:     the loser has borne off at least one checker
 *  - gammon:     the loser has borne off none
 *  - backgammon: the loser has borne off none and still has a checker on
 *                the bar or in the winner's home board
 */
export const winKind = (
	checkers: Checker[],
	winningPlayer: Player
): 'single' | 'gammon' | 'backgammon' => {
	const loser = opponent( winningPlayer );
	const loserCheckers = checkers.filter( ( c ) => c.player === loser );
	if ( loserCheckers.some( ( c ) => c.lane === OFF[ loser ] ) ) {
		return 'single';
	}
	const inDanger = loserCheckers.some(
		( c ) =>
			c.lane === BAR[ loser ] || HOME[ winningPlayer ].includes( c.lane )
	);
	return inDanger ? 'backgammon' : 'gammon';
};

export const gameResult = (
	checkers: Checker[],
	cubeValue: number
): GameResult | null => {
	const w = winner( checkers );
	if ( w === null ) return null;
	const kind = winKind( checkers, w );
	return { winner: w, points: POINTS[ kind ] * cubeValue, kind };
};
