import { initialState } from './state';
import TYPES from './action-types';
const { ROLL_DICE, SWAP_DICE, SET_DICE, SET_MESSAGE, TOGGLE_CURRENT_PLAYER, MOVE_CHECKER } = TYPES;

const reducer = ( state = initialState, action: any ) => {
	switch ( action.type ) {
		case ROLL_DICE:
			return { ...state, dice: [ ...action.dice ] };

		case SWAP_DICE:
			return { ...state, dice: [ ...action.dice ] };

		case SET_DICE:
			return { ...state, dice: [ ...action.dice ] };

		case SET_MESSAGE:
			return { ...state, message: action.message };

		case TOGGLE_CURRENT_PLAYER:
			return { ...state, currentPlayer: action.player };

		case MOVE_CHECKER:
			return { ...state, checkers: action.checkers };

		default:
			return state;
	}
};

export default reducer;
