/**
 * Internal dependencies
 */
import type { CheckerType, NoticeType } from '../types';
import { ActionTypes, PlayerType } from '../types';

/**
 * This function simulates the rolling of two dice. If the two dice have the same value,
 * it returns an array with four instances of the die's value.
 * If the two dice have different values, it returns an array with the first and second die's values.
 * The function also returns an object with the type of action (SET_DICE) and the dice values.
 *
 * @returns {Object} An object containing the type of action and the dice values.
 */
export const rollDice = () => {
	const dieOne = Math.floor( Math.random() * 6 ) + 1;
	const dieTwo = Math.floor( Math.random() * 6 ) + 1;
	const isDouble = dieOne === dieTwo;
	const dice = isDouble ? [ dieOne, dieOne, dieOne, dieOne ] : [ dieOne, dieTwo ]; // prettier-ignore

	return { type: ActionTypes.SET_DICE, dice };
};

/**
 * This function flips the order of the dice if there are exactly two dice.
 * If there are not exactly two dice, it returns the dice as they are.
 * The function also returns an object with the type of action (SET_DICE) and the dice values.
 *
 * @param {number[]} dice - An array of dice values.
 * @returns {Object} An object containing the type of action and the dice values.
 */
export const flipDice = ( dice: number[] ) => {
	return dice.length === 2
		? { type: ActionTypes.SET_DICE, dice: [ dice[ 1 ], dice[ 0 ] ] }
		: { type: ActionTypes.SET_DICE, dice };
};

/**
 * This function shifts the dice to the left by removing the first die.
 * If there are four dice, it returns an array with the last three dice.
 * If there are three dice, it returns an array with the last two dice.
 * If there are two dice, it returns an array with the last die.
 * If there are less than two dice, it returns an empty array.
 * The function also returns an object with the type of action (SET_DICE) and the dice values.
 *
 * @param {number[]} dice - An array of dice values.
 * @returns {Object} An object containing the type of action and the dice values.
 */
export const shiftDice = ( dice: number[] ) => {
	switch ( dice.length ) {
		case 4: return { type: ActionTypes.SET_DICE, dice: [ dice[ 1 ], dice[ 2 ], dice[ 3 ] ], }; // prettier-ignore
		case 3: return { type: ActionTypes.SET_DICE, dice: [ dice[ 1 ], dice[ 2 ] ], }; // prettier-ignore
		case 2: return { type: ActionTypes.SET_DICE, dice: [ dice[ 1 ] ] }; // prettier-ignore
		default: return { type: ActionTypes.SET_DICE, dice: [] }; // prettier-ignore
	}
};

/**
 * This function sets the dice to the provided values.
 * The function returns an object with the type of action (SET_DICE) and the dice values.
 *
 * @param {number[]} dice - An array of dice values.
 * @returns {Object} An object containing the type of action and the dice values.
 */
export const setDice = ( dice: number[] ) => {
	return { type: ActionTypes.SET_DICE, dice };
};

/**
 * This function sets the notice to the provided value.
 * The function returns an object with the type of action (SET_NOTICE) and the notice value.
 *
 * @param {NoticeType} notice - The notice value.
 * @returns {Object} An object containing the type of action and the notice value.
 */
export const setNotice = ( notice: NoticeType ) => {
	return { type: ActionTypes.SET_NOTICE, notice };
};

/**
 * This function toggles the current player between PlayerType.PLAYER_ONE and PlayerType.PLAYER_TWO.
 * The function returns an object with the type of action (TOGGLE_CURRENT_PLAYER) and the player value.
 *
 * @param {PlayerType|null} currentPlayer - The current player value.
 * @returns {Object} An object containing the type of action and the player value.
 */
export const toggleCurrentPlayer = ( currentPlayer: PlayerType | null ) => {
	let player;

	if ( currentPlayer === null ) {
		player = PlayerType.PLAYER_ONE;
	} else {
		player =
			currentPlayer === PlayerType.PLAYER_ONE
				? PlayerType.PLAYER_TWO
				: PlayerType.PLAYER_ONE;
	}

	return { type: ActionTypes.TOGGLE_CURRENT_PLAYER, player };
};

/**
 * This function moves a checker to a new position.
 * The function returns an object with the type of action (MOVE_CHECKER) and the checkers value.
 *
 * @param {Object} param0 - An object containing the checkers value.
 * @param {CheckerType[]} param0.checkers - An array of checker values.
 * @returns {Object} An object containing the type of action and the checkers value.
 */
export const moveChecker = ( { checkers }: { checkers: CheckerType[] } ) => {
	return { type: ActionTypes.MOVE_CHECKER, checkers };
};

/**
 * Marks the game over and awards points to the winner.
 * Points are 1 (single), 2 (gammon), or 3 (backgammon), multiplied by the
 * doubling cube value if/when implemented (passed in by the caller).
 */
export const setGameOver = ( winner: PlayerType, points: number = 1 ) => {
	return { type: ActionTypes.SET_GAME_OVER, winner, points };
};

/**
 * This function restarts the game.
 * The function returns an object with the type of action (RESTART_GAME).
 *
 * @returns {Object} An object containing the type of action.
 */
export const restartGame = () => {
	return { type: ActionTypes.RESTART_GAME };
};

/**
 * This function surrenders the game.
 * The function returns an object with the type of action (SURRENDER_GAME).
 *
 * @returns {Object} An object containing the type of action.
 */
export const surrenderGame = () => {
	return { type: ActionTypes.SURRENDER_GAME };
};

/**
 * This function updates the pip count for both players.
 * The function returns an object with the type of action (UPDATE_PIP_COUNT) and the pip count values.
 *
 * @param {Object} pipCount - An object containing the pip counts for both players.
 * @param {number} pipCount.PLAYER_ONE - The pip count for player one.
 * @param {number} pipCount.PLAYER_TWO - The pip count for player two.
 * @returns {Object} An object containing the type of action and the pip count values.
 */
export const updatePipCount = ( pipCount: {
	[ PlayerType.PLAYER_ONE ]: number;
	[ PlayerType.PLAYER_TWO ]: number;
} ) => {
	return { type: ActionTypes.UPDATE_PIP_COUNT, pipCount };
};

/**
 * This function undoes the last move made in the game.
 * The function returns an object with the type of action (UNDO_MOVE).
 *
 * @returns {Object} An object containing the type of action.
 */
export const undoMove = () => {
	return { type: ActionTypes.UNDO_MOVE };
};

/**
 * Roll a single opening die for a specific player. When both players have
 * rolled, the reducer either re-rolls (tie) or sets the higher roller as
 * current player and stores both dice for their first turn.
 */
export const rollOpeningDie = ( player: PlayerType, value?: number ) => {
	const die = value ?? Math.floor( Math.random() * 6 ) + 1;
	return { type: ActionTypes.ROLL_OPENING_DIE, player, die };
};

/**
 * Offer the doubling cube to the opponent. Only legal when the player owns
 * the cube (or it's centered) and has not yet rolled this turn.
 */
export const offerDouble = () => {
	return { type: ActionTypes.OFFER_DOUBLING_CUBE };
};

/**
 * Accept an offered double: cube doubles, ownership transfers to the
 * accepting player.
 */
export const acceptDouble = () => {
	return { type: ActionTypes.ACCEPT_DOUBLE };
};

/**
 * Drop an offered double: opponent loses the current stake (pre-double).
 */
export const dropDouble = () => {
	return { type: ActionTypes.DROP_DOUBLE };
};

/**
 * Set the match target (first to N points wins the match).
 */
export const setMatchTarget = ( target: number ) => {
	return { type: ActionTypes.SET_MATCH_TARGET, target };
};
