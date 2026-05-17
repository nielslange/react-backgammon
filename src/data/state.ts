/**
 * Internal dependencies
 */
import { MessageType, NoticeStatusType, StateType, PlayerType } from '../types';
import checkers from './checkers-start.json';

export const initialState: StateType = {
	checkers,
	currentPlayer: null,
	dice: [],
	gameOver: false,
	notice: {
		message: MessageType.WELCOME,
		status: NoticeStatusType.INFO,
	},
	scores: {
		[ PlayerType.PLAYER_ONE ]: 0,
		[ PlayerType.PLAYER_TWO ]: 0,
	},
	pipCount: {
		[ PlayerType.PLAYER_ONE ]: 167,
		[ PlayerType.PLAYER_TWO ]: 167,
	},
	moveHistory: [],
	cube: {
		value: 1,
		owner: null,
		offered: false,
	},
	openingRoll: {
		[ PlayerType.PLAYER_ONE ]: null,
		[ PlayerType.PLAYER_TWO ]: null,
	},
	matchTarget: 1,
	crawfordPlayed: false,
} as StateType;
