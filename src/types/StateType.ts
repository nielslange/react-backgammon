/**
 * Internal dependencies
 */
import { CheckerType, NoticeType, PlayerType } from '../types';

export type StateType = {
	checkers: CheckerType[];
	currentPlayer: PlayerType;
	dice: number[];
	gameOver: boolean;
	notice: NoticeType;
	scores: {
		[ PlayerType.PLAYER_ONE ]: number;
		[ PlayerType.PLAYER_TWO ]: number;
	};
};
