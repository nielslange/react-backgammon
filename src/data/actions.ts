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
	// const dieOne = Math.floor( Math.random() * 6 ) + 1;
	// const dieTwo = Math.floor( Math.random() * 6 ) + 1;
	const dieOne = 2;
	const dieTwo = 2;
	const isDouble = dieOne === dieTwo;
	const dice = isDouble
		? [ dieOne, dieTwo, dieOne, dieTwo ]
		: [ dieOne, dieTwo ];

	return { type: ActionTypes.ROLL_DICE, dice };
};

/**
 * Flips the dice.
 *
 * @param dice - An array of numbers representing the dice.
 * @returns An action object with the type "FLIP_DICE" and the dice values.
 */
export const flipDice = ( dice: number[] ) => {
	return { type: ActionTypes.FLIP_DICE, dice };
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
