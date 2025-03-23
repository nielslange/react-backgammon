/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import { rollDice, setNotice, toggleCurrentPlayer } from '../data/actions';
import {
	getTargetLane,
	hasWaitingChecker,
	isTargetOccupiedByOtherPlayer,
} from '../data/selectors';
import { createNotice } from './createNoticeHelper';
import { MessageType, NoticeStatusType, PlayerType } from '../types';

/**
 * Checks if the current player has any valid moves available with the current dice.
 * If not, automatically passes the turn to the other player.
 *
 * @param {Object} params - The parameters object.
 * @param {Dispatch} params.dispatch - The dispatch function.
 * @param {Array} params.checkers - The current checkers on the board.
 * @param {Array} params.dice - The current dice values.
 * @param {PlayerType} params.currentPlayer - The current player.
 *
 * @returns {boolean} True if the player has no valid moves and the turn was passed, false otherwise.
 */
export const checkAndHandleNoValidMoves = ( {
	dispatch,
	checkers,
	dice,
	currentPlayer,
}: {
	dispatch: Dispatch;
	checkers: any[];
	dice: number[];
	currentPlayer: PlayerType;
} ): boolean => {
	// If no dice have been rolled, there are no moves to evaluate
	if ( dice.length === 0 ) {
		return false;
	}

	// Check if player has checkers on the bar
	const hasWaiting = hasWaitingChecker( { checkers, currentPlayer } );

	// Check for any valid moves
	const hasValidMoves = checkers.some( ( checker ) => {
		// Skip checkers that don't belong to the current player
		if ( checker.player !== currentPlayer ) {
			return false;
		}

		// Skip checkers that are already borne off
		if (
			( currentPlayer === PlayerType.PLAYER_ONE &&
				checker.lane === 25 ) ||
			( currentPlayer === PlayerType.PLAYER_TWO && checker.lane === 0 )
		) {
			return false;
		}

		// If player has checkers on the bar, must move those first
		if (
			hasWaiting &&
			( ( currentPlayer === PlayerType.PLAYER_ONE &&
				checker.lane !== 0 ) ||
				( currentPlayer === PlayerType.PLAYER_TWO &&
					checker.lane !== 25 ) )
		) {
			return false;
		}

		// Check if any of the dice values allow a valid move
		return dice.some( ( dieValue ) => {
			const targetLane = getTargetLane( {
				currentPlayer,
				lane: checker.lane,
				die: dieValue,
			} );

			// Check if the target is blocked by opponent
			const isBlocked = isTargetOccupiedByOtherPlayer( {
				checkers,
				currentPlayer,
				die: dieValue,
				lane: checker.lane,
			} );

			// If target is valid (on board and not blocked), it's a valid move
			return (
				! isBlocked &&
				( ( currentPlayer === PlayerType.PLAYER_ONE &&
					targetLane <= 24 ) ||
					( currentPlayer === PlayerType.PLAYER_TWO &&
						targetLane >= 1 ) )
			);
		} );
	} );

	// If no valid moves, pass the turn
	if ( ! hasValidMoves ) {
		dispatch(
			setNotice(
				createNotice(
					NoticeStatusType.INFO,
					MessageType.NO_VALID_MOVES
				)
			)
		);

		dispatch( toggleCurrentPlayer( currentPlayer ) );
		dispatch( rollDice() );
		return true;
	}

	return false;
};
