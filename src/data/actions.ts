import { Player } from '../data/state';
import TYPES from './action-types';
const { ROLL_DICE, SWAP_DICE, SET_DICE, SET_MESSAGE, TOGGLE_CURRENT_PLAYER, MOVE_CHECKER } = TYPES;

export const rollDice = () => {
	const dieOne = Math.floor( Math.random() * 6 ) + 1;
	const dieTwo = Math.floor( Math.random() * 6 ) + 1;
	// const dieOne: number = 1;
	// const dieTwo: number = 3;
	const bonusOne = dieOne === dieTwo ? dieOne : 0;
	const bonusTwo = dieOne === dieTwo ? dieOne : 0;
	const dice = dieOne === dieTwo ? [ dieOne, dieTwo, bonusOne, bonusTwo ] : [ dieOne, dieTwo ];

	return { type: ROLL_DICE, dice };
};

export const swapDice = ( dice: number[] ) => {
	return { type: SWAP_DICE, dice };
};

export const setDice = ( dice: number[] ) => {
	return { type: SET_DICE, dice };
};

export const setMessage = ( message: string[] ) => {
	return { type: SET_MESSAGE, message };
};

export const toggleCurrentPlayer = ( { currentPlayer }: { currentPlayer: Player } ) => {
	const player = currentPlayer === 'PLAYER_BLUE' ? 'PLAYER_RED' : 'PLAYER_BLUE';

	return { type: TOGGLE_CURRENT_PLAYER, player };
};

export const moveChecker = ( { checkers }: { checkers: any } ) => {
	return { type: MOVE_CHECKER, checkers };
};
