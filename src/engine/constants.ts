import { PlayerType } from '../types/PlayerType';
import type { Player } from './types';

/** Bar lane per player. */
export const BAR: Record< Player, number > = {
	[ PlayerType.PLAYER_ONE ]: 0,
	[ PlayerType.PLAYER_TWO ]: 25,
};

/** Off (borne-off) lane per player. */
export const OFF: Record< Player, number > = {
	[ PlayerType.PLAYER_ONE ]: 25,
	[ PlayerType.PLAYER_TWO ]: 0,
};

/** Home-board points per player. */
export const HOME: Record< Player, number[] > = {
	[ PlayerType.PLAYER_ONE ]: [ 1, 2, 3, 4, 5, 6 ],
	[ PlayerType.PLAYER_TWO ]: [ 19, 20, 21, 22, 23, 24 ],
};

export const opponent = ( player: Player ): Player =>
	player === PlayerType.PLAYER_ONE
		? PlayerType.PLAYER_TWO
		: PlayerType.PLAYER_ONE;

export const isOnBoard = ( lane: number ): boolean => lane >= 1 && lane <= 24;
