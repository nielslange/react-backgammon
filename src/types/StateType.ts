/**
 * Internal dependencies
 */
import { CheckerType, NoticeType, PlayerType } from '../types';

export type StateType = {
	checkers: CheckerType[];
	currentPlayer: PlayerType;
	dice: number[];
	notice: NoticeType;
	scores: {
		[ PlayerType.PLAYER_BLUE ]: number;
		[ PlayerType.PLAYER_RED ]: number;
	};
};
