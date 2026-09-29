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
 * Upper bound on consecutive automatic hand-offs. Two players being unable
 * to move back-to-back is practically impossible in backgammon, but the
 * guard keeps the recursion finite no matter what the board looks like.
 */
const MAX_CONSECUTIVE_FORFEITS = 4;

/**
 * End the current player's turn: toggle the player, auto-roll for the
 * opponent, and forfeit the opponent's turn too if the new roll is
 * unplayable.
 */
export const handOffTurn = ( {
	dispatch,
	checkers,
	currentPlayer,
	depth = 0,
}: {
	dispatch: Dispatch;
	checkers: CheckerType[];
	currentPlayer: PlayerType;
	depth?: number;
} ): void => {
	const nextPlayer =
		currentPlayer === PlayerType.PLAYER_ONE
			? PlayerType.PLAYER_TWO
			: PlayerType.PLAYER_ONE;

	dispatch( toggleCurrentPlayer( currentPlayer ) );

	const roll = rollDice();
	dispatch( roll );

	if ( depth >= MAX_CONSECUTIVE_FORFEITS ) return;

	checkAndHandleNoValidMoves( {
		dispatch,
		checkers,
		dice: roll.dice,
		currentPlayer: nextPlayer,
		depth: depth + 1,
	} );
};

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
	depth = 0,
}: {
	dispatch: Dispatch;
	checkers: CheckerType[];
	dice: number[];
	currentPlayer: PlayerType;
	depth?: number;
} ): boolean => {
	if ( dice.length === 0 ) return false;

	const sequence = findPlayableDiceSequence( checkers, currentPlayer, dice );
	if ( sequence.length > 0 ) return false;

	dispatch(
		setNotice(
			createNotice( NoticeStatusType.INFO, MessageType.NO_VALID_MOVES )
		)
	);
	handOffTurn( { dispatch, checkers, currentPlayer, depth } );
	return true;
};
