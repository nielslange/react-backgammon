/**
 * Internal dependencies
 */
import { initialState } from './state';
import { ActionTypes } from '../types';

export const reducer = ( state = initialState, action: any ) => {
	switch ( action.type ) {
		case ActionTypes.SET_DICE:
			return { ...state, dice: [ ...action.dice ] };

		case ActionTypes.SET_NOTICE:
			return {
				...state,
				notice: {
					message: action.notice.message,
					status: action.notice.status,
				},
			};

		case ActionTypes.TOGGLE_CURRENT_PLAYER:
			return { ...state, currentPlayer: action.player };

		case ActionTypes.MOVE_CHECKER:
			return { ...state, checkers: action.checkers };

		case ActionTypes.SET_GAME_OVER:
			return { ...state, gameOver: true };

		// case ActionTypes.SURRENDER_GAME:
		// 	return { ...state, surrender: true };

		case ActionTypes.RESTART_GAME:
			return { ...state };

		default:
			return state;
	}
};
