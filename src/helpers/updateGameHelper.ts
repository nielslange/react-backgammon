/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import {
	moveChecker,
	setDice,
	setNotice,
	updatePipCount,
} from '../data/actions';
import { calculatePipCount, hasPlayerWon } from '../data/selectors';
import { createNotice } from './createNoticeHelper';
import { handOffTurn } from './noValidMovesHelper';
import { findPlayableDiceSequence } from './validateMoveHelper';
import type { NoticeType, PlayerType, CheckerType } from '../types';
import {
	MessageType,
	NoticeStatusType,
	PlayerType as PlayerTypeEnum,
} from '../types';

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

	// The winning move ends the game — the opponent does not get another roll.
	if ( hasPlayerWon( { checkers: newCheckers, currentPlayer } ) ) {
		return;
	}

	// When the turn ends (all dice used), hand off and auto-roll for the opponent.
	if ( ! newDice.length ) {
		handOffTurn( { dispatch, checkers: newCheckers, currentPlayer } );
		return;
	}

	// Dice remain but none of them can be played: the turn is over as well.
	const playable = findPlayableDiceSequence(
		newCheckers,
		currentPlayer,
		newDice
	);
	if ( playable.length === 0 ) {
		dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.INFO,
					MessageType.REMAINING_DICE_UNPLAYABLE
				)
			)
		);
		dispatch( setDice( [] ) );
		handOffTurn( { dispatch, checkers: newCheckers, currentPlayer } );
	}
};
