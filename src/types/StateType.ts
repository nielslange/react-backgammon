/**
 * Internal dependencies
 */
import {
	CheckerType,
	MessageType,
	NoticeStatusType,
	PlayerType,
} from '../types';

export type StateType = {
	checkers: CheckerType;
	currentPlayer: PlayerType;
	dice: number[];
	notice: {
		message: MessageType;
		type: NoticeStatusType;
	};
	scores: {
		[ PlayerType.PLAYER_BLUE ]: number;
		[ PlayerType.PLAYER_RED ]: number;
	};
};
