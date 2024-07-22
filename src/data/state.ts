/**
 * Internal dependencies
 */
import { MessageType, NoticeStatusType, StateType } from '../types';
import checkers from './checkers-ending.json';

const otherStatePart = {
	currentPlayer: 'PLAYER_ONE',
	dice: [],
	gameOver: false,
	notice: {
		message: MessageType.WELCOME,
		status: NoticeStatusType.INFO,
	},
	scores: {
		PLAYER_ONE: 0,
		PLAYER_TWO: 0,
	},
};

export const initialState: StateType = {
	checkers,
	...otherStatePart,
} as StateType;
