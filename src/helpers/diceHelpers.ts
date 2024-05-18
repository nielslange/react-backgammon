/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import { setDice } from '../data/actions';

/**
 * Swaps the order of the dice array.
 *
 * If the dice array has 2 elements, it swaps their positions.
 * If the dice array has any other number of elements, it returns a copy of the original array.
 *
 * @param dispatch - The dispatch function from Redux.
 * @param dice - The array of dice numbers.
 * @returns The updated array of dice numbers.
 */
export const swapDice = ( dispatch: Dispatch, dice: number[] ) => {
	if ( dice.length === 2 ) {
		return dispatch( setDice( [ dice[ 1 ], dice[ 0 ] ] ) );
	}

	return dispatch( setDice( [ ...dice ] ) );
};
/**
 * Remove the first element from the dice array.
 *
 * @param dispatch - The dispatch function from the Redux store.
 * @param dice - The array of dice numbers.
 */

export const shiftDice = ( dispatch: Dispatch, dice: number[] ) => {
	switch ( dice.length ) {
		case 4:
			return dispatch( setDice( [ dice[ 1 ], dice[ 2 ], dice[ 3 ] ] ) );
		case 3:
			return dispatch( setDice( [ dice[ 1 ], dice[ 2 ] ] ) );
		case 2:
			return dispatch( setDice( [ dice[ 1 ] ] ) );
		default:
			return dispatch( setDice( [] ) );
	}
};
