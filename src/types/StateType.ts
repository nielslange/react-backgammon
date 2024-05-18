import { MessageType, NoticeType, PlayerType } from '../types';

export type StateType = {
	checkers: any;
	currentPlayer: PlayerType;
	dice: number[];
	notice: {
		message: MessageType;
		type: NoticeType;
	};
	scores: {
		[ PlayerType.PLAYER_BLUE ]: number;
		[ PlayerType.PLAYER_RED ]: number;
	};
};
