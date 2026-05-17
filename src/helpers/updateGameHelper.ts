/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import {
	moveChecker,
	rollDice,
	setDice,
	setNotice,
	toggleCurrentPlayer,
	updatePipCount,
} from '../data/actions';
import { calculatePipCount } from '../data/selectors';
import type { NoticeType, PlayerType, CheckerType } from '../types';
import { PlayerType as PlayerTypeEnum } from '../types';

export const updateGame = (
	dispatch: Dispatch,
	newCheckers: CheckerType[],
	newDice: number[],
	notice: NoticeType,
	currentPlayer: PlayerType
) => {
	dispatch( moveChecker( { checkers: newCheckers } ) );
	dispatch( setNotice( notice ) );
	dispatch( setDice( newDice ) );

	const pipCount = {
		[ PlayerTypeEnum.PLAYER_ONE ]: calculatePipCount( {
			checkers: newCheckers as any,
			player: PlayerTypeEnum.PLAYER_ONE,
		} ),
		[ PlayerTypeEnum.PLAYER_TWO ]: calculatePipCount( {
			checkers: newCheckers as any,
			player: PlayerTypeEnum.PLAYER_TWO,
		} ),
	};
	dispatch( updatePipCount( pipCount ) );

	// When the turn ends (all dice used), hand off and auto-roll for the opponent.
	if ( ! newDice.length ) {
		dispatch( toggleCurrentPlayer( currentPlayer ) );
		dispatch( rollDice() );
	}
};
