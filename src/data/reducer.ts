import { initialState } from './state';
import TYPES from './action-types';
const { ROLL_DICE, SWAP_DICE, SHIFT_DICE, TOGGLE_CURRENT_PLAYER, MOVE_PIECE } =
	TYPES;

const reducer = ( state = initialState, action: any ) => {
	switch ( action.type ) {
		case ROLL_DICE:
			return { ...state, dice: [ ...action.dice ] };

		case SWAP_DICE:
			return { ...state, dice: [ ...action.dice ] };

		case SHIFT_DICE:
			return { ...state, dice: [ ...action.dice ] };

		case TOGGLE_CURRENT_PLAYER:
			return { ...state, currentPlayer: action.player };

		case MOVE_PIECE:
			return state;

		default:
			return state;
	}
};

export default reducer;
