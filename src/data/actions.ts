/**
 * Internal dependencies
 */
import type { NoticeType } from '../types';
import { ActionTypes, PlayerType } from '../types';

export const rollDice = () => {
	const dieOne = Math.floor( Math.random() * 6 ) + 1;
	const dieTwo = Math.floor( Math.random() * 6 ) + 1;
	const bonusOne = dieOne === dieTwo ? dieOne : 0;
	const bonusTwo = dieOne === dieTwo ? dieOne : 0;
	const dice =
		dieOne === dieTwo
			? [ dieOne, dieTwo, bonusOne, bonusTwo ]
			: [ dieOne, dieTwo ];

	return { type: ActionTypes.ROLL_DICE, dice };
};

export const flipDice = ( dice: number[] ) => {
	return { type: ActionTypes.FLIP_DICE, dice };
};

export const setDice = ( dice: number[] ) => {
	return { type: ActionTypes.SET_DICE, dice };
};

export const setNotice = ( notice: { message: string; type: NoticeType } ) => {
	return { type: ActionTypes.SET_NOTICE, notice };
};

export const toggleCurrentPlayer = ( currentPlayer: PlayerType ) => {
	const player =
		currentPlayer === PlayerType.PLAYER_BLUE
			? PlayerType.PLAYER_RED
			: PlayerType.PLAYER_BLUE;

	return { type: ActionTypes.TOGGLE_CURRENT_PLAYER, player };
};

export const moveChecker = ( { checkers }: { checkers: any } ) => {
	return { type: ActionTypes.MOVE_CHECKER, checkers };
};
