import { PlayerType } from '../../types/PlayerType';
import { BAR, OFF } from '../constants';
import type { Checker, Player } from '../types';

/**
 * Total distance the player's checkers still have to travel. A checker
 * on the bar needs 25, a borne-off checker 0.
 */
export const pipCount = ( checkers: Checker[], player: Player ): number =>
	checkers.reduce( ( total, c ) => {
		if ( c.player !== player ) return total;
		if ( c.lane === OFF[ player ] ) return total;
		if ( c.lane === BAR[ player ] ) return total + 25;
		return (
			total +
			( player === PlayerType.PLAYER_ONE ? c.lane : 25 - c.lane )
		);
	}, 0 );
