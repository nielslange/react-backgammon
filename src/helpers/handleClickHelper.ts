/**
 * External dependencies
 */
import { Dispatch } from 'redux';

/**
 * Internal dependencies
 */
import { setNotice } from '../data/actions';
import {
	hasDiceBeenRolled,
	isCurrentPlayer,
	hasWaitingChecker,
	isCheckerClearedOff,
	isTargetOccupiedByOtherPlayer,
	willHitOpponent,
	getTargetLane,
	getHitCheckerId,
	hasCheckersOutsideHomeBoard,
	wouldClearOffChecker,
} from '../data/selectors';
import { MessageType, NoticeStatusType, PlayerType } from '../types';
import type { CheckerType } from '../types';
import { checkForWin } from './checkForWinHelper';
import { createNotice } from './createNoticeHelper';
import { updateGame } from './updateGameHelper';
import {
	findPlayableDiceSequence,
	validateDiceUse,
} from './validateMoveHelper';

export type MoveRequest = {
	/** Id of the checker being moved. */
	id: number;
	/** Owner of the clicked checker. */
	player: PlayerType;
	dice: number[];
	currentPlayer: PlayerType;
	checkers: CheckerType[];
	/** The die the player wants to play. */
	die: number;
	/** Lane the checker currently stands on. */
	lane: number;
	gameOver?: boolean;
};

export type ResolvedMove =
	| { ok: false; message: MessageType }
	| {
			ok: true;
			message: MessageType;
			newCheckers: CheckerType[];
			newDice: number[];
			targetLane: number;
	  };

/**
 * Validates a move against the rules without touching the store, and
 * returns either the rejection message or the resulting position.
 */
export const resolveMove = ( {
	id,
	player,
	dice,
	currentPlayer,
	checkers,
	die,
	lane,
	gameOver = false,
}: MoveRequest ): ResolvedMove => {
	const reject = ( message: MessageType ): ResolvedMove => ( {
		ok: false,
		message,
	} );

	if ( gameOver ) return reject( MessageType.GAME_OVER );
	if ( ! hasDiceBeenRolled( dice ) )
		return reject( MessageType.ROLL_DICE_FIRST );
	if ( ! isCurrentPlayer( { player, currentPlayer } ) ) {
		return reject( MessageType.NOT_YOUR_CHECKER );
	}
	if ( ! dice.includes( die ) ) return reject( MessageType.DIE_NOT_PLAYABLE );
	if ( ! validateDiceUse( { dice, checkers, currentPlayer, die } ) ) {
		return reject( MessageType.MUST_USE_LARGER_DIE );
	}
	if ( isCheckerClearedOff( { lane, currentPlayer } ) ) {
		return reject( MessageType.FINISHED_CHECKER );
	}

	const onBar = hasWaitingChecker( { checkers, currentPlayer } );
	if ( onBar && lane !== 0 && lane !== 25 ) {
		return reject( MessageType.WAITING_CHECKER );
	}

	const playerObject = { checkers, currentPlayer, lane, die };
	if ( isTargetOccupiedByOtherPlayer( playerObject ) ) {
		return reject( MessageType.TARGET_OCCUPIED_BY_OPPONENT );
	}

	const targetLane = getTargetLane( { currentPlayer, lane, die } );
	const isBearingOff =
		( currentPlayer === PlayerType.PLAYER_ONE && targetLane === 25 ) ||
		( currentPlayer === PlayerType.PLAYER_TWO && targetLane === 0 );

	if ( isBearingOff ) {
		// Bearing off is only allowed when ALL checkers are in the home
		// board, and the source must satisfy the exact / overshoot rules.
		if (
			hasCheckersOutsideHomeBoard( { checkers, currentPlayer } ) ||
			! wouldClearOffChecker( { die, lane, currentPlayer, checkers } )
		) {
			return reject( MessageType.NOT_ALL_CHECKERS_IN_END_ZONE );
		}
	}

	const newCheckers: CheckerType[] = checkers.map( ( c ) => ( { ...c } ) );
	const indexOfChecker = ( checkerId: number ) => {
		const index = newCheckers.findIndex( ( c ) => c.id === checkerId );
		if ( index === -1 ) {
			throw new Error( `Checker ${ checkerId } not found` );
		}
		return index;
	};

	const hits = willHitOpponent( playerObject );
	if ( hits ) {
		const hitCheckerId = getHitCheckerId( { checkers, lane: targetLane } );
		if ( hitCheckerId === undefined ) {
			throw new Error( 'No checker found on target lane' );
		}
		newCheckers[ indexOfChecker( hitCheckerId ) ].lane =
			currentPlayer === PlayerType.PLAYER_ONE ? 25 : 0;
	}
	newCheckers[ indexOfChecker( id ) ].lane = targetLane;

	// Consume the chosen die (first occurrence of its value).
	const newDice = [ ...dice ];
	newDice.splice( newDice.indexOf( die ), 1 );

	// A move is only legal if it still allows the maximum number of dice
	// to be played this turn. `validateDiceUse` guards the die choice;
	// this guards the checker choice for that die.
	const maxBefore = findPlayableDiceSequence(
		checkers,
		currentPlayer,
		dice
	).length;
	const maxAfter = findPlayableDiceSequence(
		newCheckers,
		currentPlayer,
		newDice
	).length;
	if ( maxAfter + 1 < maxBefore ) {
		return reject( MessageType.MUST_PLAY_MAX_DICE );
	}

	const message = onBar
		? hits
			? MessageType.MOVE_WAITING_CHECKER_AND_HIT
			: MessageType.MOVE_CHECKER_TO_BOARD
		: hits
			? MessageType.MOVE_CHECKER_AND_HIT
			: MessageType.MOVE_CHECKER;

	return { ok: true, message, newCheckers, newDice, targetLane };
};

/**
 * Apply a resolved move to the store: rejections become an error notice,
 * legal moves update the board, dice, pip counts, turn and win state.
 */
export const commitMove = (
	dispatch: Dispatch,
	resolved: ResolvedMove,
	currentPlayer: PlayerType,
	cubeValue: number = 1
) => {
	if ( ! resolved.ok ) {
		return dispatch(
			setNotice(
				createNotice( NoticeStatusType.ERROR, resolved.message )
			)
		);
	}
	const notice = createNotice( NoticeStatusType.SUCCESS, resolved.message );
	updateGame(
		dispatch,
		resolved.newCheckers,
		resolved.newDice,
		notice,
		currentPlayer
	);
	checkForWin( dispatch, resolved.newCheckers, currentPlayer, cubeValue );
};

/**
 * Handles a click on a checker: resolves the move for the clicked lane and
 * commits it immediately.
 *
 * @param event - The click event object (used to find the clicked lane).
 * @param params - See `MoveRequest`, plus `dispatch` and `cubeValue`.
 */
export const handleClick = (
	event: any,
	{
		id,
		player,
		dice,
		currentPlayer,
		checkers,
		die,
		dispatch,
		gameOver = false,
		cubeValue = 1,
	}: any
) => {
	const lane = parseInt( event.target.closest( '.lane' ).dataset.lane );
	const resolved = resolveMove( {
		id,
		player,
		dice,
		currentPlayer,
		checkers,
		die,
		lane,
		gameOver,
	} );
	return commitMove( dispatch, resolved, currentPlayer, cubeValue );
};
