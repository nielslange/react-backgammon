/**
 * Bear-off eligibility and the exact / overshoot rule.
 */
import { PlayerType } from '../../types/PlayerType';
import { BAR, HOME, OFF } from '../constants';
import type { Checker, Player } from '../types';

/**
 * All of the player's checkers are in the home board or already off. A
 * checker on the bar counts as outside.
 */
export const allInHome = ( checkers: Checker[], player: Player ): boolean =>
	checkers.every(
		( c ) =>
			c.player !== player ||
			c.lane === OFF[ player ] ||
			( c.lane !== BAR[ player ] && HOME[ player ].includes( c.lane ) )
	);

/**
 * Whether a checker on `lane` may bear off with `die`: the roll is exact,
 * or it overshoots and no checker of the player stands on a higher point
 * of the home board. Does not check `allInHome`.
 */
export const canBearOffFrom = (
	checkers: Checker[],
	player: Player,
	lane: number,
	die: number
): boolean => {
	if ( ! HOME[ player ].includes( lane ) ) return false;

	// Distance from the lane to the off tray, 1..6.
	const distance =
		player === PlayerType.PLAYER_ONE ? lane : 25 - lane;
	if ( die === distance ) return true;
	if ( die < distance ) return false;

	// Overshoot: legal only when no checker sits further from the tray.
	const isHigher = ( other: number ) =>
		player === PlayerType.PLAYER_ONE ? other > lane : other < lane;
	return ! checkers.some(
		( c ) =>
			c.player === player &&
			HOME[ player ].includes( c.lane ) &&
			isHigher( c.lane )
	);
};
