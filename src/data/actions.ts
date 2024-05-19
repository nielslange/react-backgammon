/**
 * Internal dependencies
 */
import type { CheckerType, NoticeType } from '../types';
import { ActionTypes, PlayerType } from '../types';

/**
 * Roll the dice.
 *
 * If the two dice have the same value, it also includes bonus values in the result.
 *
 * @returns An action object with the type "ROLL_DICE" and the rolled dice.
 */
export const rollDice = () => {
	const dieOne = Math.floor( Math.random() * 6 ) + 1;
	const dieTwo = Math.floor( Math.random() * 6 ) + 1;
	// const dieOne = 2;
	// const dieTwo = 2;
	const isDouble = dieOne === dieTwo;
	const dice = isDouble
		? [ dieOne, dieTwo, dieOne, dieTwo ]
		: [ dieOne, dieTwo ];

	return { type: ActionTypes.SET_DICE, dice };
};

/**
 * Flips the order of the dice array.
 * If the dice array has 2 elements, it swaps the elements.
 * If the dice array has any other number of elements, it returns the array as is.
 *
 * @param dice - The array of dice numbers.
 * @returns An object with the flipped dice array.
 */
export const flipDice = ( dice: number[] ) => {
	if ( dice.length === 2 ) {
		return { type: ActionTypes.SET_DICE, dice: [ dice[ 1 ], dice[ 0 ] ] };
	}

	return { type: ActionTypes.SET_DICE, dice };
};

/**
 * Remove the first element from the dice array.
 *
 * @param dispatch - The dispatch function from the Redux store.
 * @param dice - The array of dice numbers.
 */
export const shiftDice = ( dice: number[] ) => {
	switch ( dice.length ) {
		case 4:
			return {
				type: ActionTypes.SET_DICE,
				dice: [ dice[ 1 ], dice[ 2 ], dice[ 3 ] ],
			};
		case 3:
			return {
				type: ActionTypes.SET_DICE,
				dice: [ dice[ 1 ], dice[ 2 ] ],
			};
		case 2:
			return { type: ActionTypes.SET_DICE, dice: [ dice[ 1 ] ] };
		default:
			return { type: ActionTypes.SET_DICE, dice: [] };
	}
};

/**
 * Sets the dice values.
 *
 * @param dice - An array of numbers representing the dice values.
 * @returns An action object with the type "SET_DICE" and the dice values.
 */
export const setDice = ( dice: number[] ) => {
	return { type: ActionTypes.SET_DICE, dice };
};

/**
 * Sets the notice for the application.
 * @param notice - The notice to be set.
 * @returns An action object with the type "SET_NOTICE" and the notice.
 */
export const setNotice = ( notice: NoticeType ) => {
	return { type: ActionTypes.SET_NOTICE, notice };
};

/**
 * Toggles the current player between blue and red.
 *
 * @param currentPlayer - The current player.
 * @returns An action object with the type "TOGGLE_CURRENT_PLAYER" and the new player.
 */
export const toggleCurrentPlayer = ( currentPlayer: PlayerType ) => {
	const player =
		currentPlayer === PlayerType.PLAYER_BLUE
			? PlayerType.PLAYER_RED
			: PlayerType.PLAYER_BLUE;

	return { type: ActionTypes.TOGGLE_CURRENT_PLAYER, player };
};

/**
 * Moves a checker on the game board.
 *
 * @param checkers - An array of checker objects.
 * @returns An action object with the type "MOVE_CHECKER" and the updated checkers array.
 */
export const moveChecker = ( { checkers }: { checkers: CheckerType[] } ) => {
	console.log( checkers );
	return { type: ActionTypes.MOVE_CHECKER, checkers };
};
