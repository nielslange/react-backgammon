/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import { rollDice, setNotice, toggleCurrentPlayer } from '../data/actions';
import { createNotice } from './createNoticeHelper';
import { findPlayableDiceSequence } from './validateMoveHelper';
import { MessageType, NoticeStatusType, PlayerType } from '../types';
import type { CheckerType } from '../types';

/**
 * If the current player has no playable dice sequence, forfeit the turn:
 * show a notice, toggle the player, and auto-roll for the opponent.
 *
 * @returns true if the turn was passed.
 */
export const checkAndHandleNoValidMoves = ( {
	dispatch,
	checkers,
	dice,
	currentPlayer,
}: {
	dispatch: Dispatch;
	checkers: CheckerType[];
	dice: number[];
	currentPlayer: PlayerType;
} ): boolean => {
	if ( dice.length === 0 ) return false;

	const sequence = findPlayableDiceSequence( checkers, currentPlayer, dice );
	if ( sequence.length > 0 ) return false;

	dispatch(
		setNotice(
			createNotice( NoticeStatusType.INFO, MessageType.NO_VALID_MOVES )
		)
	);
	dispatch( toggleCurrentPlayer( currentPlayer ) );
	dispatch( rollDice() );
	return true;
};
