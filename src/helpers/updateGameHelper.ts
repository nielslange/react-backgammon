/**
 * Internal dependencies
 */
import {
	moveChecker,
	rollDice,
	setDice,
	setNotice,
	toggleCurrentPlayer,
} from '../data/actions';
import type { NoticeType, PlayerType, CheckerType } from '../types';

export const updateGame = (
	dispatch: any,
	newCheckers: CheckerType[],
	newDice: number[],
	notice: NoticeType,
	currentPlayer: PlayerType
) => {
	dispatch( moveChecker( { checkers: newCheckers } ) );
	dispatch( setNotice( notice ) );
	dispatch( setDice( newDice ) );

	if ( ! newDice.length ) {
		dispatch( toggleCurrentPlayer( currentPlayer ) );
		dispatch( rollDice() );
	}
};
